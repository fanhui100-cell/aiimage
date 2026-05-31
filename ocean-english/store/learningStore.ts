'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LearningLevel } from '@/types/learning'
import type { QuizSession } from '@/types/quiz'
import type { DailyTask, StudyProgress, ChatMessage } from '@/types/study'

interface WrongAnswer {
  wordId: string
  word: string
  question: string
  userAnswer: string
  correctAnswer: string
  explanation: string
  timestamp: number
}

interface ReviewWord {
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
  addWrongAnswer: (entry: WrongAnswer) => void
  removeWrongAnswer: (wordId: string, questionId?: string) => void
  clearWrongAnswers: () => void

  // Quiz history
  quizHistory: QuizSession[]
  addQuizSession: (session: QuizSession) => void

  // Study progress
  studyProgress: StudyProgress
  incrementXp: (amount: number) => void
  markStudyToday: () => void

  // Daily tasks
  dailyTasks: DailyTask[]
  completeTaskUnit: (taskId: string, count?: number) => void
  resetDailyTasks: () => void

  // Chat history
  chatMessages: ChatMessage[]
  addChatMessage: (message: ChatMessage) => void
  clearChat: () => void
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

// SM-2 simplified spaced repetition
function calculateNextReview(review: ReviewWord, correct: boolean): ReviewWord {
  if (!correct) {
    return { ...review, interval: 1, repetitions: 0, nextReviewAt: Date.now() + 60 * 60 * 1000 }
  }
  const newReps = review.repetitions + 1
  const newEase = Math.max(1.3, review.ease + (correct ? 0.1 : -0.2))
  const newInterval = newReps === 1 ? 1 : newReps === 2 ? 6 : Math.round(review.interval * newEase)
  return {
    ...review,
    interval: newInterval,
    repetitions: newReps,
    ease: newEase,
    nextReviewAt: Date.now() + newInterval * 24 * 60 * 60 * 1000,
  }
}

export const useLearningStore = create<LearningStore>()(
  persist(
    (set, get) => ({
      userLevel: null,
      setUserLevel: level => set({ userLevel: level }),

      savedWords: [],
      saveWord: wordId =>
        set(s => ({ savedWords: s.savedWords.includes(wordId) ? s.savedWords : [...s.savedWords, wordId] })),
      unsaveWord: wordId => set(s => ({ savedWords: s.savedWords.filter(id => id !== wordId) })),
      isWordSaved: wordId => get().savedWords.includes(wordId),

      reviewWords: [],
      addToReview: (wordId, word) => {
        const existing = get().reviewWords.find(r => r.wordId === wordId)
        if (existing) return
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

      wrongAnswers: [],
      addWrongAnswer: entry =>
        set(s => {
          const exists = s.wrongAnswers.some(
            w => w.wordId === entry.wordId && w.question === entry.question,
          )
          if (exists) return s
          return { wrongAnswers: [entry, ...s.wrongAnswers].slice(0, 200) }
        }),
      removeWrongAnswer: wordId =>
        set(s => ({ wrongAnswers: s.wrongAnswers.filter(w => w.wordId !== wordId) })),
      clearWrongAnswers: () => set({ wrongAnswers: [] }),

      quizHistory: [],
      addQuizSession: session =>
        set(s => ({ quizHistory: [session, ...s.quizHistory].slice(0, 50) })),

      studyProgress: DEFAULT_PROGRESS,
      incrementXp: amount =>
        set(s => ({
          studyProgress: { ...s.studyProgress, totalXp: s.studyProgress.totalXp + amount },
        })),
      markStudyToday: () => {
        const today = new Date().toISOString().split('T')[0]
        const last = get().studyProgress.lastStudyDate
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        set(s => ({
          studyProgress: {
            ...s.studyProgress,
            lastStudyDate: today,
            currentStreak:
              last === yesterday || last === today ? s.studyProgress.currentStreak + (last === today ? 0 : 1) : 1,
            longestStreak: Math.max(
              s.studyProgress.longestStreak,
              last === yesterday ? s.studyProgress.currentStreak + 1 : 1,
            ),
          },
        }))
      },

      dailyTasks: DEFAULT_TASKS,
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

      chatMessages: [],
      addChatMessage: message =>
        set(s => ({ chatMessages: [...s.chatMessages, message].slice(-100) })),
      clearChat: () => set({ chatMessages: [] }),
    }),
    {
      name: 'lexiocean-learning',
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
