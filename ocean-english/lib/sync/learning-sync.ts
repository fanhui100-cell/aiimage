/**
 * Cloud sync utility functions for core learning data.
 * All functions are fire-and-forget: they log warnings on failure but never throw.
 * Only called when the user is logged in (CloudSyncProvider checks auth before calling).
 *
 * A7：词状态机（lexiStore.words）整体经 /api/user/word-states 同步，
 * 取代旧的 saved-words / review-words 两条链路（端点暂留，A8 清理）。
 */

import type { WordEntry, WrongAnswer, StreakData } from '@/store/lexiStore'
import type { QuizSession } from '@/types/quiz'
import type { LearningLevel } from '@/types/learning'

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

/** 批量上传变更词条（CloudSyncProvider 1.5s 防抖后调用） */
export function syncWordStates(entries: WordEntry[]): void {
  if (entries.length === 0) return
  void safePost('/api/user/word-states', {
    wordStates: entries.map(w => ({
      wordId: w.id,
      word: w.word,
      state: w.state,
      streak: w.streak,
      ease: w.ease,
      interval: w.interval,
      nextReviewAt: w.nextReviewAt ?? null,
      saved: !!w.saved,
      source: w.source ?? 'lookup',
    })),
  })
}

/** 移出学习：云端同步删除（B7-3，防止登录水合时复活） */
export function syncRemoveWordState(wordId: string): void {
  void fetch(`/api/user/word-states?wordId=${encodeURIComponent(wordId)}`, { method: 'DELETE' })
    .catch(err => console.warn('[sync] remove word-state failed:', err))
}

export function syncWrongAnswers(wrongAnswers: WrongAnswer[]): void {
  if (wrongAnswers.length === 0) return
  void safePost('/api/user/wrong-answers', { wrongAnswers })
}

export function syncQuizSession(session: QuizSession): void {
  void safePost('/api/user/quiz-history', { session })
}

/** 进度同步：从 lexiStore 的 streakData/xp/词表派生，沿用 study-progress 端点 */
export function syncStudyProgress(args: {
  totalWordsLearned: number
  streakData: StreakData
  xp: number
  userLevel: LearningLevel | null
}): void {
  void safePut('/api/user/study-progress', {
    totalWordsLearned: args.totalWordsLearned,
    currentStreak: args.streakData.current,
    longestStreak: args.streakData.longest,
    totalXp: args.xp,
    lastStudyDate: args.streakData.lastStudyDate,
    levelProgress: {},
  })
  if (args.userLevel) {
    void safePut('/api/user/preferences', { level: args.userLevel })
  }
}
