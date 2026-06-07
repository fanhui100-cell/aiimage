'use client'
// components/lexiverse/useLexiverseSlices.ts
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 · Stage C — read the existing learning / motivation stores and
// expose them as the uniform LexiverseStoreSlices contract.
//
// This hook is the SINGLE place /lexiverse couples to the rest of the
// app's state. Every planet learning-state derivation flows through it.
// Future store changes (e.g. a separate recommendedWords slice) are
// absorbed here without touching components.
// ─────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react'
import { useLearningStore } from '@/store/learningStore'
import { useMotivationStore } from '@/store/useMotivationStore'
import type { LexiverseStoreSlices } from '@/lib/lexiverse/lexiverse-types'

export function useLexiverseSlices(): LexiverseStoreSlices {
  // ── learningStore ───────────────────────────────────────────────────────
  const savedWords  = useLearningStore(s => s.savedWords)
  const reviewWords = useLearningStore(s => s.reviewWords)

  // ── motivationStore ─────────────────────────────────────────────────────
  const litWords = useMotivationStore(s => s.litWords)
  // optional recommendations — only used if the store exposes them (it may
  // not in current Phase 7; safely default to empty)
  const recommendedWordIds = useMotivationStore(s => (s as unknown as { recommendedWords?: string[] }).recommendedWords ?? null) as string[] | null

  // ── weak word ids (derive from reviewWords history) ─────────────────────
  // The current schema doesn't ship a `weakWordIds` field; we approximate
  // it as words whose review interval has been reset more than once.
  const weakWordIds = useMemo(() => {
    if (!reviewWords) return []
    return reviewWords
      .filter(r => (r as unknown as { wrongCount?: number }).wrongCount && (r as unknown as { wrongCount: number }).wrongCount >= 2)
      .map(r => r.wordId)
  }, [reviewWords])

  return useMemo<LexiverseStoreSlices>(() => ({
    savedWords: savedWords ?? [],
    litWords: litWords ?? [],
    reviewWordIds: (reviewWords ?? []).map(r => r.wordId),
    weakWordIds,
    recommendedWordIds: recommendedWordIds ?? [],
  }), [savedWords, litWords, reviewWords, weakWordIds, recommendedWordIds])
}
