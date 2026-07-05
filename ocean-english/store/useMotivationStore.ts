'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { LexiStarReason } from '@/types/motivation'
import type { LexiStarLedgerEntry, DailyMissionProgress, AchievementLite } from '@/lib/motivation/motivation-types'
import { calculateLevel } from '@/lib/motivation/motivation-levels'
import { getDefaultAchievements, checkNewAchievements } from '@/lib/motivation/motivation-achievements'
import { emitCompanionEvent } from '@/lib/companion/companion-events'

// ── Anti-farming constants ────────────────────────────────────────────────────

const WINDOW_MS = 10 * 60 * 1000     // 10-minute per-word+action window
const DAILY_CAPS: Partial<Record<LexiStarReason, number>> = {
  pronunciation: 30,
  nodeOpen: 50,
}

// ── State shape ───────────────────────────────────────────────────────────────

interface MotivationStoreV2 {
  // Core counters
  lexiStar: number
  litNodeCount: number
  reviewActionCount: number
  pronunciationPlayCount: number
  quizActionCount: number
  graphSearchCount: number

  // Ledger (last 100 entries)
  ledger: LexiStarLedgerEntry[]

  // Daily missions
  dailyMissionProgress: DailyMissionProgress
  missionResetDate: string

  // Achievements
  achievements: AchievementLite[]

  // Companion
  lastCompanionMessage: string

  // Anti-farming
  wordActionTimestamps: Record<string, number>   // key: `${word}:${reason}`
  dailyCounts: Record<string, { count: number; date: string }>
  litWords: string[]       // all-time deduped (for achievements)
  reviewedWords: string[]  // never re-award review for same word

  // ── Actions ────────────────────────────────────────────────────────────────
  lightUpWordNode: (slug: string) => void
  addLexiStar: (points: number, reason: LexiStarReason, wordId?: string) => void
  setCompanionMessage: (message: string) => void
  markReviewAction: (slug: string) => void
  recordPronunciationPlay: (wordId?: string) => void
  recordQuizStart: (wordId?: string) => void
  recordGraphSearch: (wordId?: string) => void
  resetDailyMissionsIfNewDay: () => void
  seedFromV1IfNeeded: () => void
  getSnapshot: () => import('@/types/motivation').MotivationSnapshot
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

// ── Initial state ─────────────────────────────────────────────────────────────

const INITIAL_V2: Omit<MotivationStoreV2,
  'lightUpWordNode' | 'addLexiStar' | 'setCompanionMessage' | 'markReviewAction' |
  'recordPronunciationPlay' | 'recordQuizStart' | 'recordGraphSearch' |
  'resetDailyMissionsIfNewDay' | 'seedFromV1IfNeeded' | 'getSnapshot'
> = {
  lexiStar: 0,
  litNodeCount: 0,
  reviewActionCount: 0,
  pronunciationPlayCount: 0,
  quizActionCount: 0,
  graphSearchCount: 0,
  ledger: [],
  dailyMissionProgress: { litCount: 0, reviewCount: 0, pronunciationCount: 0 },
  missionResetDate: '',
  achievements: getDefaultAchievements(),
  lastCompanionMessage: '',
  wordActionTimestamps: {},
  dailyCounts: {},
  litWords: [],
  reviewedWords: [],
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useMotivationStore = create<MotivationStoreV2>()(
  persist(
    (set, get) => ({
      ...INITIAL_V2,

      // ── Reset daily missions if new day ─────────────────────────────────────
      resetDailyMissionsIfNewDay: () => {
        const today = todayStr()
        if (get().missionResetDate === today) return
        set({
          missionResetDate: today,
          dailyMissionProgress: { litCount: 0, reviewCount: 0, pronunciationCount: 0 },
        })
      },

      // ── Light up a word node (deduped) ──────────────────────────────────────
      lightUpWordNode: (slug) => {
        get().resetDailyMissionsIfNewDay()
        const s = slug.toLowerCase()
        const st = get()
        if (st.litWords.includes(s)) return

        const newLitCount = st.litNodeCount + 1
        const newDailyLit = st.dailyMissionProgress.litCount + 1
        const newLedger: LexiStarLedgerEntry[] = [{
          id: `${Date.now()}-nodeOpen`,
          action: 'nodeOpen', reason: 'nodeOpen', points: 0, word: s,
          createdAt: new Date().toISOString(),
        }, ...st.ledger].slice(0, 100)

        set(prev => ({
          litWords: [...prev.litWords, s],
          litNodeCount: newLitCount,
          ledger: newLedger,
          dailyMissionProgress: { ...prev.dailyMissionProgress, litCount: newDailyLit },
        }))

        emitCompanionEvent('node_lit', { word: s })

        // Check achievements
        const counts = { litNodeCount: newLitCount, reviewActionCount: get().reviewActionCount, pronunciationPlayCount: get().pronunciationPlayCount, graphSearchCount: get().graphSearchCount }
        const newlyUnlocked = checkNewAchievements(counts, get().achievements.filter(a => a.unlocked).map(a => a.id))
        if (newlyUnlocked.length > 0) {
          set(prev => ({
            achievements: prev.achievements.map(a =>
              newlyUnlocked.includes(a.id) ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() } : a,
            ),
          }))
          newlyUnlocked.forEach(id => emitCompanionEvent('achievement_unlocked', { achievementId: id }))
        }
      },

      // ── Add LexiStar with anti-farming ──────────────────────────────────────
      addLexiStar: (points, reason, wordId) => {
        const now = Date.now()
        const today = todayStr()
        const st = get()

        // 1. Per-word+action 10-minute window
        const farmKey = wordId ? `${wordId.toLowerCase()}:${reason}` : `_global:${reason}`
        const lastTime = st.wordActionTimestamps[farmKey] ?? 0
        if (now - lastTime < WINDOW_MS) return

        // 2. Daily cap
        const cap = DAILY_CAPS[reason]
        if (cap !== undefined) {
          const dc = st.dailyCounts[reason]
          if (dc && dc.date === today && dc.count >= cap) return
        }

        // 3. Review: never re-award same word
        if (reason === 'review' && wordId && st.reviewedWords.includes(wordId.toLowerCase())) return

        // Update timestamps
        const newTimestamps = { ...st.wordActionTimestamps, [farmKey]: now }
        const prevDC = st.dailyCounts[reason]
        const newCount = prevDC?.date === today ? prevDC.count + 1 : 1
        const newDailyCounts = { ...st.dailyCounts, [reason]: { count: newCount, date: today } }

        // Ledger entry
        const entry: LexiStarLedgerEntry = {
          id: `${now}-${reason}`,
          action: reason, reason, points,
          word: wordId,
          createdAt: new Date().toISOString(),
        }

        const newLexiStar = st.lexiStar + points
        set(prev => ({
          lexiStar: newLexiStar,
          ledger: [entry, ...prev.ledger].slice(0, 100),
          wordActionTimestamps: newTimestamps,
          dailyCounts: newDailyCounts,
        }))

        // Post-award achievement check
        const updatedSt = get()
        const counts = {
          litNodeCount: updatedSt.litNodeCount,
          reviewActionCount: updatedSt.reviewActionCount,
          pronunciationPlayCount: updatedSt.pronunciationPlayCount,
          graphSearchCount: updatedSt.graphSearchCount,
        }
        const newlyUnlocked = checkNewAchievements(counts, updatedSt.achievements.filter(a => a.unlocked).map(a => a.id))
        if (newlyUnlocked.length > 0) {
          set(prev => ({
            achievements: prev.achievements.map(a =>
              newlyUnlocked.includes(a.id) ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() } : a,
            ),
          }))
          newlyUnlocked.forEach(id => emitCompanionEvent('achievement_unlocked', { achievementId: id }))
        }
      },

      setCompanionMessage: (message) => set({ lastCompanionMessage: message }),

      // ── Review action (deduped, never re-award) ─────────────────────────────
      markReviewAction: (slug) => {
        get().resetDailyMissionsIfNewDay()
        const s = slug.toLowerCase()
        const st = get()
        if (st.reviewedWords.includes(s)) return
        const newReviewCount = st.reviewActionCount + 1
        set(prev => ({
          reviewedWords: [...prev.reviewedWords, s],
          reviewActionCount: newReviewCount,
          dailyMissionProgress: {
            ...prev.dailyMissionProgress,
            reviewCount: prev.dailyMissionProgress.reviewCount + 1,
          },
        }))
        emitCompanionEvent('word_added_to_review', { word: s })
        // Achievement check
        const updatedSt = get()
        const newlyUnlocked = checkNewAchievements({
          litNodeCount: updatedSt.litNodeCount,
          reviewActionCount: newReviewCount,
          pronunciationPlayCount: updatedSt.pronunciationPlayCount,
          graphSearchCount: updatedSt.graphSearchCount,
        }, updatedSt.achievements.filter(a => a.unlocked).map(a => a.id))
        if (newlyUnlocked.length > 0) {
          set(prev => ({
            achievements: prev.achievements.map(a =>
              newlyUnlocked.includes(a.id) ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() } : a,
            ),
          }))
          newlyUnlocked.forEach(id => emitCompanionEvent('achievement_unlocked', { achievementId: id }))
        }
      },

      // ── Pronunciation play (30-second per-word cooldown for counters) ─────────
      recordPronunciationPlay: (wordId) => {
        get().resetDailyMissionsIfNewDay()
        const now = Date.now()
        const st = get()
        // 30-second cooldown prevents rapid-click inflation of daily mission counters
        const coolKey = `${wordId?.toLowerCase() ?? '_global'}:pplay`
        if (now - (st.wordActionTimestamps[coolKey] ?? 0) < 30_000) return
        const newCount = st.pronunciationPlayCount + 1
        set(prev => ({
          pronunciationPlayCount: newCount,
          wordActionTimestamps: { ...prev.wordActionTimestamps, [coolKey]: now },
          dailyMissionProgress: {
            ...prev.dailyMissionProgress,
            pronunciationCount: prev.dailyMissionProgress.pronunciationCount + 1,
          },
        }))
        emitCompanionEvent('pronunciation_played', { word: wordId })
        // Achievement check
        const updatedSt = get()
        const newlyUnlocked = checkNewAchievements({
          litNodeCount: updatedSt.litNodeCount,
          reviewActionCount: updatedSt.reviewActionCount,
          pronunciationPlayCount: newCount,
          graphSearchCount: updatedSt.graphSearchCount,
        }, updatedSt.achievements.filter(a => a.unlocked).map(a => a.id))
        if (newlyUnlocked.length > 0) {
          set(prev => ({
            achievements: prev.achievements.map(a =>
              newlyUnlocked.includes(a.id) ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() } : a,
            ),
          }))
        }
      },

      // ── Quiz start ──────────────────────────────────────────────────────────
      recordQuizStart: (wordId) => {
        set(prev => ({ quizActionCount: prev.quizActionCount + 1 }))
        emitCompanionEvent('quiz_started', { word: wordId })
      },

      // ── Graph search ────────────────────────────────────────────────────────
      recordGraphSearch: (wordId) => {
        const st = get()
        // Deduplicate: only count each unique word once
        if (wordId && st.litWords.includes(wordId.toLowerCase())) return
        const newCount = st.graphSearchCount + 1
        set({ graphSearchCount: newCount })
        emitCompanionEvent('word_opened', { word: wordId })
        // Achievement check
        const updatedSt = get()
        const newlyUnlocked = checkNewAchievements({
          litNodeCount: updatedSt.litNodeCount,
          reviewActionCount: updatedSt.reviewActionCount,
          pronunciationPlayCount: updatedSt.pronunciationPlayCount,
          graphSearchCount: newCount,
        }, updatedSt.achievements.filter(a => a.unlocked).map(a => a.id))
        if (newlyUnlocked.length > 0) {
          set(prev => ({
            achievements: prev.achievements.map(a =>
              newlyUnlocked.includes(a.id) ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() } : a,
            ),
          }))
        }
      },

      // ── Seed from v1 if this is a fresh v2 store ────────────────────────────
      // migrate() in Zustand persist only fires when there IS existing v2 data
      // with a version mismatch. For a brand-new v2 store, we must seed manually.
      seedFromV1IfNeeded: () => {
        const st = get()
        if (st.lexiStar > 0 || st.litNodeCount > 0) return  // already has data
        try {
          const raw = localStorage.getItem('lexiocean-motivation-v1')
          if (!raw) return
          const v1 = JSON.parse(raw) as Record<string, unknown>
          const star = typeof v1.lexiStar === 'number' ? v1.lexiStar : 0
          if (star === 0) return  // v1 was also empty — nothing to migrate
          set({
            lexiStar: star,
            litNodeCount: typeof v1.litNodeCount === 'number' ? v1.litNodeCount : 0,
            reviewActionCount: typeof v1.reviewActionCount === 'number' ? v1.reviewActionCount : 0,
            litWords: Array.isArray(v1.litWords) ? (v1.litWords as string[]) : [],
            reviewedWords: Array.isArray(v1.reviewedWords) ? (v1.reviewedWords as string[]) : [],
            lastCompanionMessage: typeof v1.lastCompanionMessage === 'string' ? v1.lastCompanionMessage : '',
          })
        } catch {}
      },

      // ── Snapshot ─────────────────────────────────────────────────────────────
      getSnapshot: () => {
        const st = get()
        const { level, progress, nextLevelTarget } = calculateLevel(st.lexiStar)
        return {
          lexiStar: st.lexiStar,
          litNodeCount: st.litNodeCount,
          reviewActionCount: st.reviewActionCount,
          pronunciationPlayCount: st.pronunciationPlayCount,
          quizActionCount: st.quizActionCount,
          graphSearchCount: st.graphSearchCount,
          currentLevel: level,
          levelProgress: progress,
          nextLevelTarget,
          lastCompanionMessage: st.lastCompanionMessage,
        }
      },
    }),
    {
      name: 'lexiocean-motivation-v2',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (_state, version) => {
        // version 0 = first load; try to seed basic stats from v1 store
        if (version === 0) {
          try {
            const raw = localStorage.getItem('lexiocean-motivation-v1')
            if (raw) {
              const v1 = JSON.parse(raw) as Record<string, unknown>
              return {
                ...INITIAL_V2,
                lexiStar: typeof v1.lexiStar === 'number' ? v1.lexiStar : 0,
                litNodeCount: typeof v1.litNodeCount === 'number' ? v1.litNodeCount : 0,
                reviewActionCount: typeof v1.reviewActionCount === 'number' ? v1.reviewActionCount : 0,
                litWords: Array.isArray(v1.litWords) ? (v1.litWords as string[]) : [],
                reviewedWords: Array.isArray(v1.reviewedWords) ? (v1.reviewedWords as string[]) : [],
                lastCompanionMessage: typeof v1.lastCompanionMessage === 'string' ? v1.lastCompanionMessage : '',
              }
            }
          } catch {}
        }
        return { ...INITIAL_V2 }
      },
      partialize: (st) => ({
        lexiStar: st.lexiStar,
        litNodeCount: st.litNodeCount,
        reviewActionCount: st.reviewActionCount,
        pronunciationPlayCount: st.pronunciationPlayCount,
        quizActionCount: st.quizActionCount,
        graphSearchCount: st.graphSearchCount,
        ledger: st.ledger,
        dailyMissionProgress: st.dailyMissionProgress,
        missionResetDate: st.missionResetDate,
        achievements: st.achievements,
        lastCompanionMessage: st.lastCompanionMessage,
        wordActionTimestamps: st.wordActionTimestamps,
        dailyCounts: st.dailyCounts,
        litWords: st.litWords,
        reviewedWords: st.reviewedWords,
      }),
    },
  ),
)
