'use client'

import { useEffect, useRef } from 'react'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { useLearningStore } from '@/store/learningStore'
import {
  syncSavedWord,
  syncRemoveSavedWord,
  syncReviewWords,
  syncRemoveReviewWord,
  syncWrongAnswers,
  syncStudyProgress,
  syncQuizSession,
} from '@/lib/sync/learning-sync'
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

    // Track current auth user
    supabase.auth.getUser().then(({ data }) => {
      userRef.current = data.user ?? null
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      userRef.current = session?.user ?? null
    })

    // Debounced sync functions (fire after 1.5s quiet period)
    const debouncedSyncReviewWords = debounce(syncReviewWords, 1500)
    const debouncedSyncWrongAnswers = debounce(syncWrongAnswers, 1500)
    const debouncedSyncStudyProgress = debounce(syncStudyProgress, 2000)

    // Track previous state to detect changes
    const getState = useLearningStore.getState
    let prevSavedWords = getState().savedWords
    let prevReviewWords = getState().reviewWords
    let prevWrongAnswers = getState().wrongAnswers
    let prevQuizHistory = getState().quizHistory
    let prevStudyProgress = getState().studyProgress
    let prevUserLevel = getState().userLevel

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

    // ── Chat sync ─────────────────────────────────────────────────────────
    const chatSessionIdRef = { current: null as string | null }
    let prevChatMessages = getState().chatMessages

    // Create a chat session when user is logged in
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        createChatSession().then(id => { chatSessionIdRef.current = id })
      }
    })

    const unsubscribeStore = useLearningStore.subscribe((state) => {
      if (!userRef.current) return // Not logged in — skip

      // ── savedWords: diff for additions and removals ───────────────────────
      if (state.savedWords !== prevSavedWords) {
        const prevSet = new Set(prevSavedWords)
        const currSet = new Set(state.savedWords)
        // Added
        state.savedWords
          .filter(id => !prevSet.has(id))
          .forEach(wordId => {
            // Look up word text from reviewWords (added together in the typical flow)
            const word = state.reviewWords.find(r => r.wordId === wordId)?.word ?? wordId
            syncSavedWord(wordId, word)
          })
        // Removed
        prevSavedWords
          .filter(id => !currSet.has(id))
          .forEach(wordId => syncRemoveSavedWord(wordId))
        prevSavedWords = state.savedWords
      }

      // ── reviewWords: detect deletions then upsert survivors ───────────────
      if (state.reviewWords !== prevReviewWords) {
        const currWordIds = new Set(state.reviewWords.map(r => r.wordId))
        // Deleted words → remove from cloud
        prevReviewWords
          .filter(r => !currWordIds.has(r.wordId))
          .forEach(r => syncRemoveReviewWord(r.wordId))
        // Upsert surviving / updated words
        prevReviewWords = state.reviewWords
        debouncedSyncReviewWords(state.reviewWords)
      }

      if (state.wrongAnswers !== prevWrongAnswers) {
        prevWrongAnswers = state.wrongAnswers
        // Sync only the newest entry (last added)
        const newest = state.wrongAnswers[0]
        if (newest) debouncedSyncWrongAnswers([newest])
      }

      if (state.quizHistory !== prevQuizHistory) {
        // Sync only the newest session
        const newest = state.quizHistory[0]
        if (newest && newest !== prevQuizHistory[0]) {
          syncQuizSession(newest)
        }
        prevQuizHistory = state.quizHistory
      }

      if (state.studyProgress !== prevStudyProgress || state.userLevel !== prevUserLevel) {
        prevStudyProgress = state.studyProgress
        prevUserLevel = state.userLevel
        debouncedSyncStudyProgress(state.studyProgress, state.userLevel)
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

    return () => {
      subscription.unsubscribe()
      unsubscribeStore()
      unsubscribeScanHistory()
      unsubscribeScanStore()
    }
  }, [])

  return <>{children}</>
}
