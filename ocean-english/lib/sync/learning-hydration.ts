/**
 * lib/sync/learning-hydration.ts — 登录后从云端恢复词状态机（A7）
 *
 * 合并策略（spec A7-1-④）：
 * - 按词比较：云端 updated_at 比本地「最后变动时间」新者胜
 *   （本地无 updated_at，用 max(lastReviewedAt, addedAt) 近似）
 * - nextReviewAt 取更早者：宁可多复习不漏复习
 * - 云端有、本地无的词 → 建 stub 词条，内容由 hydrateMissingEntries 补拉
 */

import { useLexiStore, type WordEntry, type WordState } from '@/store/lexiStore'

interface CloudWordState {
  wordId: string
  word: string
  state: string
  streak: number
  ease: number
  interval: number
  nextReviewAt: number | null
  saved: boolean
  source: string
  updatedAt: number
}

const VALID_STATES = new Set<WordState>(['locked', 'unknown', 'recommended', 'learning', 'review', 'weak', 'mastered'])

function localUpdatedAt(w: WordEntry): number {
  return Math.max(w.lastReviewedAt ?? 0, w.addedAt ?? 0)
}

function minDefined(a?: number | null, b?: number | null): number | undefined {
  if (a != null && b != null) return Math.min(a, b)
  return a ?? b ?? undefined
}

export async function hydrateWordStatesFromCloud(): Promise<void> {
  try {
    const res = await fetch('/api/user/word-states')
    if (!res.ok) return
    const { data } = await res.json() as { data?: CloudWordState[] }
    if (!Array.isArray(data) || data.length === 0) return

    const store = useLexiStore.getState()
    const byId = new Map(store.words.map(w => [w.id, w]))

    for (const cloud of data) {
      if (!cloud.wordId || !VALID_STATES.has(cloud.state as WordState)) continue
      const local = byId.get(cloud.wordId)
      if (!local) {
        // 云端有、本地无：建 stub（内容字段后台补拉）
        byId.set(cloud.wordId, {
          id: cloud.wordId,
          word: cloud.word || cloud.wordId,
          zh: '', phon: '', pos: '', galaxy: 'cognition',
          state: cloud.state as WordState,
          streak: cloud.streak ?? 0,
          ease: cloud.ease ?? 2.5,
          interval: cloud.interval ?? 0,
          nextReviewAt: cloud.nextReviewAt ?? undefined,
          addedAt: cloud.updatedAt || Date.now(),
          source: (cloud.source as WordEntry['source']) ?? 'lookup',
          saved: cloud.saved,
        })
        continue
      }
      const merged: WordEntry = cloud.updatedAt > localUpdatedAt(local)
        ? {
            ...local,
            state: cloud.state as WordState,
            streak: cloud.streak ?? local.streak,
            ease: cloud.ease ?? local.ease,
            interval: cloud.interval ?? local.interval,
            saved: cloud.saved,
          }
        : { ...local }
      merged.nextReviewAt = minDefined(local.nextReviewAt, cloud.nextReviewAt)
      byId.set(cloud.wordId, merged)
    }

    useLexiStore.setState({ words: [...byId.values()] })
    // stub 词条补内容（断网等失败下次启动重试）
    void useLexiStore.getState().hydrateMissingEntries()
  } catch {
    // 网络失败：保持本地数据，不阻塞
  }
}
