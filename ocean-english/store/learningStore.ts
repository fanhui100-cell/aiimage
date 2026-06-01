'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { LearningLevel } from '@/types/learning'
import type { QuizSession } from '@/types/quiz'
import type { DailyTask, StudyProgress, ChatMessage } from '@/types/study'

export interface WrongAnswer {
  id: string
  wordId: string
  word: string
  question: string
  userAnswer: string
  correctAnswer: string
  explanation: string
  timestamp: number
}

export interface ReviewWord {
  wordId: string
  word: string
  nextReviewAt: number
  interval: number
  ease: number
  repetitions: number
}

interface LearningStore {
  // User profile
  userLevel: LearningLevel | null
  setUserLevel: (level: LearningLevel) => void

  // Saved words
  savedWords: string[]
  saveWord: (wordId: string) => void
  unsaveWord: (wordId: string) => void
  isWordSaved: (wordId: string) => boolean

  // Review queue (spaced repetition)
  reviewWords: ReviewWord[]
  addToReview: (wordId: string, word: string) => void
  removeFromReview: (wordId: string) => void
  updateReview: (wordId: string, correct: boolean) => void
  getDueWords: () => ReviewWord[]

  // Wrong answers
  wrongAnswers: WrongAnswer[]
  addWrongAnswer: (entry: Omit<WrongAnswer, 'id'>) => void
  removeWrongAnswer: (id: string) => void
  clearWrongAnswers: () => void

  // Quiz history
  quizHistory: QuizSession[]
  addQuizSession: (session: QuizSession) => void

  // Study progress
  studyProgress: StudyProgress
  incrementXp: (amount: number) => void
  incrementWordsLearned: () => void
  markStudyToday: () => void

  // Daily tasks
  dailyTasks: DailyTask[]
  completeTaskUnit: (taskId: string, count?: number) => void
  resetDailyTasks: () => void
  autoResetDailyTasksIfNewDay: () => void

  // Chat history
  chatMessages: ChatMessage[]
  addChatMessage: (message: ChatMessage) => void
  clearChat: () => void

  // Store management
  resetStore: () => void
}

const DEFAULT_TASKS: DailyTask[] = [
  {
    id: 'vocab-5',
    type: 'vocabulary',
    title: 'Learn 5 New Words',
    titleZh: '学习 5 个新单词',
    description: 'Look up 5 new words in the dictionary.',
    descriptionZh: '在词典中查阅 5 个新单词。',
    targetCount: 5,
    completedCount: 0,
    xp: 50,
  },
  {
    id: 'review-10',
    type: 'review',
    title: 'Review 10 Words',
    titleZh: '复习 10 个单词',
    description: 'Complete your daily spaced repetition review.',
    descriptionZh: '完成今日间隔复习。',
    targetCount: 10,
    completedCount: 0,
    xp: 40,
  },
  {
    id: 'quiz-5',
    type: 'quiz',
    title: 'Answer 5 Quiz Questions',
    titleZh: '完成 5 道练习题',
    description: 'Test yourself with 5 vocabulary questions.',
    descriptionZh: '完成 5 道词汇练习题。',
    targetCount: 5,
    completedCount: 0,
    xp: 60,
  },
]

const DEFAULT_PROGRESS: StudyProgress = {
  totalWordsLearned: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalXp: 0,
  lastStudyDate: '',
  levelProgress: {},
}

const INITIAL_STATE = {
  userLevel: null as LearningLevel | null,
  savedWords: [] as string[],
  reviewWords: [] as ReviewWord[],
  wrongAnswers: [] as WrongAnswer[],
  quizHistory: [] as QuizSession[],
  studyProgress: DEFAULT_PROGRESS,
  dailyTasks: DEFAULT_TASKS,
  chatMessages: [] as ChatMessage[],
}

// SM-2 simplified spaced repetition
function calculateNextReview(review: ReviewWord, correct: boolean): ReviewWord {
  if (!correct) {
    return {
      ...review,
      interval: 1,
      repetitions: 0,
      nextReviewAt: Date.now() + 60 * 60 * 1000, // retry in 1 hour
    }
  }
  const newReps = review.repetitions + 1
  const newEase = Math.max(1.3, review.ease + 0.1)
  const newInterval =
    newReps === 1 ? 1 : newReps === 2 ? 6 : Math.round(review.interval * newEase)
  return {
    ...review,
    interval: newInterval,
    repetitions: newReps,
    ease: newEase,
    nextReviewAt: Date.now() + newInterval * 24 * 60 * 60 * 1000,
  }
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function yesterdayStr(): string {
  return new Date(Date.now() - 86400000).toISOString().split('T')[0]
}

export const useLearningStore = create<LearningStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      // ── User profile ──────────────────────────────────────────────────────
      setUserLevel: level => set({ userLevel: level }),

      // ── Saved words ───────────────────────────────────────────────────────
      saveWord: wordId =>
        set(s => ({
          savedWords: s.savedWords.includes(wordId) ? s.savedWords : [...s.savedWords, wordId],
        })),
      unsaveWord: wordId =>
        set(s => ({ savedWords: s.savedWords.filter(id => id !== wordId) })),
      isWordSaved: wordId => get().savedWords.includes(wordId),

      // ── Review queue ──────────────────────────────────────────────────────
      addToReview: (wordId, word) => {
        if (get().reviewWords.some(r => r.wordId === wordId)) return
        set(s => ({
          reviewWords: [
            ...s.reviewWords,
            { wordId, word, nextReviewAt: Date.now(), interval: 1, ease: 2.5, repetitions: 0 },
          ],
        }))
      },
      removeFromReview: wordId =>
        set(s => ({ reviewWords: s.reviewWords.filter(r => r.wordId !== wordId) })),
      updateReview: (wordId, correct) =>
        set(s => ({
          reviewWords: s.reviewWords.map(r =>
            r.wordId === wordId ? calculateNextReview(r, correct) : r,
          ),
        })),
      getDueWords: () => {
        const now = Date.now()
        return get().reviewWords.filter(r => r.nextReviewAt <= now)
      },

      // ── Wrong answers ─────────────────────────────────────────────────────
      addWrongAnswer: entry => {
        const id = `${entry.wordId}-${entry.timestamp}`
        set(s => {
          // Deduplicate by wordId + question
          const exists = s.wrongAnswers.some(
            w => w.wordId === entry.wordId && w.question === entry.question,
          )
          if (exists) return s
          return { wrongAnswers: [{ ...entry, id }, ...s.wrongAnswers].slice(0, 200) }
        })
      },
      // Remove a single wrong-answer entry by its unique id
      removeWrongAnswer: (id: string) =>
        set(s => ({ wrongAnswers: s.wrongAnswers.filter(w => w.id !== id) })),
      clearWrongAnswers: () => set({ wrongAnswers: [] }),

      // ── Quiz history ──────────────────────────────────────────────────────
      addQuizSession: session =>
        set(s => ({ quizHistory: [session, ...s.quizHistory].slice(0, 50) })),

      // ── Study progress ────────────────────────────────────────────────────
      incrementXp: amount =>
        set(s => ({
          studyProgress: { ...s.studyProgress, totalXp: s.studyProgress.totalXp + amount },
        })),
      incrementWordsLearned: () =>
        set(s => ({
          studyProgress: {
            ...s.studyProgress,
            totalWordsLearned: s.studyProgress.totalWordsLearned + 1,
          },
        })),
      markStudyToday: () => {
        const today = todayStr()
        const last = get().studyProgress.lastStudyDate
        if (last === today) return // already marked today — no changes needed

        const yesterday = yesterdayStr()
        const newStreak =
          last === yesterday ? get().studyProgress.currentStreak + 1 : 1

        set(s => ({
          studyProgress: {
            ...s.studyProgress,
            lastStudyDate: today,
            currentStreak: newStreak,
            longestStreak: Math.max(s.studyProgress.longestStreak, newStreak),
          },
        }))
      },

      // ── Daily tasks ───────────────────────────────────────────────────────
      completeTaskUnit: (taskId, count = 1) =>
        set(s => ({
          dailyTasks: s.dailyTasks.map(t =>
            t.id === taskId
              ? { ...t, completedCount: Math.min(t.completedCount + count, t.targetCount) }
              : t,
          ),
        })),
      resetDailyTasks: () =>
        set({ dailyTasks: DEFAULT_TASKS.map(t => ({ ...t, completedCount: 0 })) }),
      // Call on page load: if the last study date is not today, reset tasks
      autoResetDailyTasksIfNewDay: () => {
        const last = get().studyProgress.lastStudyDate
        if (last && last !== todayStr()) {
          set({ dailyTasks: DEFAULT_TASKS.map(t => ({ ...t, completedCount: 0 })) })
        }
      },

      // ── Chat ──────────────────────────────────────────────────────────────
      addChatMessage: message =>
        set(s => ({ chatMessages: [...s.chatMessages, message].slice(-100) })),
      clearChat: () => set({ chatMessages: [] }),

      // ── Store management ──────────────────────────────────────────────────
      resetStore: () => set({ ...INITIAL_STATE }),
    }),
    {
      name: 'lexiocean-learning',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // On version mismatch: wipe and start fresh rather than crash on stale schema
      migrate: () => ({ ...INITIAL_STATE }),
      partialize: state => ({
        userLevel: state.userLevel,
        savedWords: state.savedWords,
        reviewWords: state.reviewWords,
        wrongAnswers: state.wrongAnswers,
        quizHistory: state.quizHistory,
        studyProgress: state.studyProgress,
        dailyTasks: state.dailyTasks,
        chatMessages: state.chatMessages,
      }),
    },
  ),
)
