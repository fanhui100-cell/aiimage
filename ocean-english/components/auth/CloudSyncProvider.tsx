'use client'

import { useEffect, useRef } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { useLexiStore, type WordEntry } from '@/store/lexiStore'
import {
  syncWordStates,
  syncRemoveWordState,
  syncWrongAnswers,
  syncStudyProgress,
  syncQuizSession,
} from '@/lib/sync/learning-sync'
import { hydrateWordStatesFromCloud } from '@/lib/sync/learning-hydration'
import { useScanHistoryStore } from '@/store/useScanHistoryStore'
import { useScanStore } from '@/store/scanStore'
import {
  syncScanDocument,
  syncDeleteScanDocument,
  syncClearScanHistory,
  syncScanQuizDraft,
  syncScanStudyNote,
} from '@/lib/sync/scan-sync'
import { createChatSession, syncChatMessages } from '@/lib/sync/chat-sync'
import type { User } from '@supabase/supabase-js'

/** Debounce helper — calls fn after `ms` ms of no further calls */
function debounce<T extends unknown[]>(fn: (...args: T) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: T) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

export function CloudSyncProvider({ children }: { children: React.ReactNode }) {
  const userRef = useRef<User | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    const supabase = createClient()

    // Track current auth user; 登录后从云端恢复词状态机
    supabase.auth.getUser().then(({ data }) => {
      userRef.current = data.user ?? null
      if (data.user) void hydrateWordStatesFromCloud()
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const wasLoggedOut = !userRef.current
      userRef.current = session?.user ?? null
      if (session?.user && wasLoggedOut && event === 'SIGNED_IN') {
        void hydrateWordStatesFromCloud()
      }
    })

    // ── lexiStore：词状态机 diff → 1.5s 防抖批量 upsert ────────────────────
    const getLexi = useLexiStore.getState
    let prevWords = getLexi().words
    let prevWrongAnswers = getLexi().wrongAnswers
    let prevQuizHistory = getLexi().quizHistory
    let prevChatMessages = getLexi().chatMessages
    let prevStreakData = getLexi().streakData
    let prevXp = getLexi().xp
    let prevUserLevel = getLexi().profile.userLevel ?? null

    // 防抖窗口内累积变更词条，flush 时一次性上传
    const pendingWords = new Map<string, WordEntry>()
    const flushWordStates = debounce(() => {
      const batch = [...pendingWords.values()]
      pendingWords.clear()
      syncWordStates(batch)
    }, 1500)

    const debouncedSyncWrongAnswers = debounce(syncWrongAnswers, 1500)
    const debouncedSyncStudyProgress = debounce(syncStudyProgress, 2000)

    const unsubscribeLexi = useLexiStore.subscribe((state) => {
      if (!userRef.current) return // Not logged in — skip

      // ── words：找出新增/变更/删除词条（引用比较，store 始终整表替换）──────
      if (state.words !== prevWords) {
        const prevById = new Map(prevWords.map(w => [w.id, w]))
        const currIds = new Set(state.words.map(w => w.id))
        for (const w of state.words) {
          if (prevById.get(w.id) !== w) pendingWords.set(w.id, w)
        }
        // 删除（B7-3 移出学习）→ 云端立即删，避免水合复活
        for (const w of prevWords) {
          if (!currIds.has(w.id)) {
            pendingWords.delete(w.id)
            syncRemoveWordState(w.id)
          }
        }
        prevWords = state.words
        if (pendingWords.size > 0) flushWordStates()
      }

      if (state.wrongAnswers !== prevWrongAnswers) {
        prevWrongAnswers = state.wrongAnswers
        // Sync only the newest entry (last added)
        const newest = state.wrongAnswers[0]
        if (newest) debouncedSyncWrongAnswers([newest])
      }

      if (state.quizHistory !== prevQuizHistory) {
        const newest = state.quizHistory[0]
        if (newest && newest !== prevQuizHistory[0]) {
          syncQuizSession(newest)
        }
        prevQuizHistory = state.quizHistory
      }

      const userLevel = state.profile.userLevel ?? null
      if (state.streakData !== prevStreakData || state.xp !== prevXp || userLevel !== prevUserLevel) {
        prevStreakData = state.streakData
        prevXp = state.xp
        prevUserLevel = userLevel
        const totalWordsLearned = state.words.filter(
          w => w.state === 'learning' || w.state === 'review' || w.state === 'weak' || w.state === 'mastered',
        ).length
        debouncedSyncStudyProgress({
          totalWordsLearned,
          streakData: state.streakData,
          xp: state.xp,
          userLevel,
        })
      }

      if (state.chatMessages !== prevChatMessages) {
        const prevIds = new Set(prevChatMessages.map(m => m.id))
        const newMessages = state.chatMessages.filter(m => !prevIds.has(m.id))
        if (newMessages.length > 0 && chatSessionIdRef.current) {
          syncChatMessages(chatSessionIdRef.current, newMessages)
        }
        prevChatMessages = state.chatMessages
      }
    })

    // ── Scan history store subscriptions ─────────────────────────────────
    const getScanHistoryState = useScanHistoryStore.getState
    let prevScanDocuments = getScanHistoryState().scanDocuments

    const unsubscribeScanHistory = useScanHistoryStore.subscribe((state) => {
      if (!userRef.current) return

      if (state.scanDocuments !== prevScanDocuments) {
        const prevIds = new Set(prevScanDocuments.map(d => d.id))
        const currIds = new Set(state.scanDocuments.map(d => d.id))

        // Added documents → sync to cloud
        state.scanDocuments
          .filter(d => !prevIds.has(d.id))
          .forEach(d => syncScanDocument(d))

        // Cleared (all gone at once) → use clear-all endpoint
        if (state.scanDocuments.length === 0 && prevScanDocuments.length > 1) {
          syncClearScanHistory()
        } else {
          // Individual deletes
          prevScanDocuments
            .filter(d => !currIds.has(d.id))
            .forEach(d => syncDeleteScanDocument(d.id))
        }

        prevScanDocuments = state.scanDocuments
      }
    })

    // ── Scan store subscriptions (quiz drafts + study notes) ──────────────
    const getScanState = useScanStore.getState
    let prevDrafts = getScanState().scanQuizDrafts
    let prevNotes = getScanState().scanStudyNotes

    const unsubscribeScanStore = useScanStore.subscribe((state) => {
      if (!userRef.current) return

      if (state.scanQuizDrafts !== prevDrafts) {
        const prevIds = new Set(prevDrafts.map(d => d.id))
        state.scanQuizDrafts
          .filter(d => !prevIds.has(d.id))
          .forEach(d => syncScanQuizDraft(d))
        prevDrafts = state.scanQuizDrafts
      }

      if (state.scanStudyNotes !== prevNotes) {
        const prevIds = new Set(prevNotes.map(n => n.id))
        state.scanStudyNotes
          .filter(n => !prevIds.has(n.id))
          .forEach(n => syncScanStudyNote(n))
        prevNotes = state.scanStudyNotes
      }
    })

    // ── Chat session ──────────────────────────────────────────────────────
    const chatSessionIdRef = { current: null as string | null }

    // Create a chat session when user is logged in
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        createChatSession().then(id => { chatSessionIdRef.current = id })
      }
    })

    return () => {
      subscription.unsubscribe()
      unsubscribeLexi()
      unsubscribeScanHistory()
      unsubscribeScanStore()
    }
  }, [])

  return <>{children}</>
}
