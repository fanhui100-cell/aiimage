import type { LexiGraphNodeState } from '@/types/lexigraph'

export interface StoreSlices {
  savedWords: string[]
  reviewWordIds: string[]
  weakWordIds: string[]
  litWords: string[]
}

export function resolveNodeState(wordSlug: string, slices: StoreSlices): LexiGraphNodeState {
  const s = wordSlug.toLowerCase()
  if (slices.litWords.includes(s)) return 'mastered'
  if (slices.weakWordIds.includes(s)) return 'weak'
  if (slices.reviewWordIds.includes(s)) return 'review'
  if (slices.savedWords.includes(s)) return 'learning'
  return 'unknown'
}
