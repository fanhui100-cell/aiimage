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
import { useLexiStore } from '@/store/lexiStore'
import { useMotivationStore } from '@/store/useMotivationStore'
import type { LexiverseStoreSlices } from '@/lib/lexiverse/lexiverse-types'

export function useLexiverseSlices(): LexiverseStoreSlices {
  // ── lexiStore（A4 缝合后的唯一学习状态源）────────────────────────────────
  const words = useLexiStore(s => s.words)

  // ── motivationStore ─────────────────────────────────────────────────────
  const litWords = useMotivationStore(s => s.litWords)
  // optional recommendations — only used if the store exposes them (it may
  // not in current Phase 7; safely default to empty)
  const recommendedWordIds = useMotivationStore(s => (s as unknown as { recommendedWords?: string[] }).recommendedWords ?? null) as string[] | null

  return useMemo<LexiverseStoreSlices>(() => ({
    savedWords: words.filter(w => w.saved).map(w => w.id),
    litWords: litWords ?? [],
    // 在 SRS 队列中 = 有下次复习时间
    reviewWordIds: words.filter(w => w.nextReviewAt != null).map(w => w.id),
    weakWordIds: words.filter(w => w.state === 'weak').map(w => w.id),
    recommendedWordIds: recommendedWordIds ?? [],
  }), [words, litWords, recommendedWordIds])
}
