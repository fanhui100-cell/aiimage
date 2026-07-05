// lib/lexiverse/lexiverse-learning-state.ts
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 · Derive PlanetLearningState from the existing learning stores.
//
// Order of precedence (highest priority wins):
//   recommended  — useMotivationStore.recommendedWordIds (if available)
//   weak         — learningStore.weakWordIds
//   review       — learningStore.reviewWords (any due now → review)
//   mastered     — useMotivationStore.litWords (proxy: word was lit)
//   learning     — learningStore.savedWords (saved but not yet lit)
//   unknown      — known to dictionary but not yet engaged
//   locked       — Stage-A locked-by-default (unsaved + unknown to user)
//
// This module ONLY reads, never writes. It's safe to call from a useMemo
// over [savedWords, litWords, ...] — pure + deterministic.
// ─────────────────────────────────────────────────────────────────────────

import type { LexiverseStoreSlices, PlanetLearningState } from './lexiverse-types'

/**
 * Decide a single word's learning state.
 *   wordId             — dictionary id (preferred for matching)
 *   normalizedWord     — fallback if savedWords stores normalized forms
 *   isKnownToDictionary— true if the planet is hydrated from dictionary
 */
export function resolveLearningState(opts: {
  wordId: string
  normalizedWord?: string
  slices: LexiverseStoreSlices
  isKnownToDictionary?: boolean
}): PlanetLearningState {
  const { wordId, normalizedWord, slices, isKnownToDictionary = true } = opts
  const matches = (set: string[] | undefined) => {
    if (!set) return false
    if (set.includes(wordId)) return true
    if (normalizedWord && set.includes(normalizedWord)) return true
    return false
  }

  if (matches(slices.recommendedWordIds)) return 'recommended'
  if (matches(slices.weakWordIds)) return 'weak'
  if (matches(slices.reviewWordIds)) return 'review'
  if (matches(slices.litWords)) return 'mastered'
  if (matches(slices.savedWords)) return 'learning'
  return isKnownToDictionary ? 'unknown' : 'locked'
}

/**
 * Returns the glowLevel 0..1 that PlanetNode should render. The renderer
 * may overlay breathing on top of this base level.
 */
export function glowLevelFor(state: PlanetLearningState): number {
  switch (state) {
    case 'mastered':    return 1.0
    case 'recommended': return 0.85
    case 'learning':    return 0.7
    case 'review':      return 0.62
    case 'weak':        return 0.55
    case 'unknown':     return 0.38
    case 'locked':      return 0.18
  }
}

/**
 * Visual ring overlay color for the planet (review/weak/recommended only).
 * Returns null for states that don't render a ring.
 */
export function ringColorFor(state: PlanetLearningState): string | null {
  switch (state) {
    case 'review':      return '#FFA85A'  // orange "overdue" ring
    case 'weak':        return '#FF8FA8'  // soft red/pink
    case 'recommended': return '#FFD66B'  // gold / teal highlight
    default:            return null
  }
}
