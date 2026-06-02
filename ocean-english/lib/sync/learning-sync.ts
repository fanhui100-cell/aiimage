/**
 * Cloud sync utility functions for core learning data.
 * All functions are fire-and-forget: they log warnings on failure but never throw.
 * Only called when the user is logged in (CloudSyncProvider checks auth before calling).
 */

import type { ReviewWord, WrongAnswer } from '@/store/learningStore'
import type { QuizSession } from '@/types/quiz'
import type { LearningLevel } from '@/types/learning'
import type { StudyProgress } from '@/types/study'

async function safePost(url: string, body: unknown): Promise<void> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      console.warn(`[sync] ${url} failed:`, data)
    }
  } catch (err) {
    console.warn(`[sync] ${url} network error:`, err)
  }
}

async function safePut(url: string, body: unknown): Promise<void> {
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      console.warn(`[sync] ${url} failed:`, data)
    }
  } catch (err) {
    console.warn(`[sync] ${url} network error:`, err)
  }
}

export function syncSavedWord(wordId: string, word: string): void {
  void safePost('/api/user/saved-words', { wordId, word })
}

export function syncRemoveSavedWord(wordId: string): void {
  void fetch(`/api/user/saved-words?wordId=${encodeURIComponent(wordId)}`, { method: 'DELETE' })
    .catch(err => console.warn('[sync] remove saved-word failed:', err))
}

export function syncRemoveReviewWord(wordId: string): void {
  void fetch(`/api/user/review-words?wordId=${encodeURIComponent(wordId)}`, { method: 'DELETE' })
    .catch(err => console.warn('[sync] remove review-word failed:', err))
}

export function syncReviewWords(reviewWords: ReviewWord[]): void {
  if (reviewWords.length === 0) return
  void safePut('/api/user/review-words', { reviewWords })
}

export function syncWrongAnswers(wrongAnswers: WrongAnswer[]): void {
  if (wrongAnswers.length === 0) return
  void safePost('/api/user/wrong-answers', { wrongAnswers })
}

export function syncQuizSession(session: QuizSession): void {
  void safePost('/api/user/quiz-history', { session })
}

export function syncStudyProgress(progress: StudyProgress, userLevel: LearningLevel | null): void {
  void safePut('/api/user/study-progress', {
    totalWordsLearned: progress.totalWordsLearned,
    currentStreak: progress.currentStreak,
    longestStreak: progress.longestStreak,
    totalXp: progress.totalXp,
    lastStudyDate: progress.lastStudyDate,
    levelProgress: progress.levelProgress,
  })
  if (userLevel) {
    void safePut('/api/user/preferences', { level: userLevel })
  }
}
