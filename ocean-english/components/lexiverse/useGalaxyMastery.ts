'use client'
// components/lexiverse/useGalaxyMastery.ts
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 · Stage D — compute the live mastery ratio for every galaxy in
// the catalog without materialising 42 × 300 planets.
//
// We resolve each galaxy's filter against the dictionary to get its word
// id set, then count how many of those ids appear in slices.litWords.
// All 42 sets are computed in one pass; result is memoised on the input.
//
// Output drives:
//   · GalaxyNode outer-halo opacity (brighter galaxy = more learned)
//   · UniverseHUD aggregate stats
//   · Stage E SR-system targeting
// ─────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react'
import { GALAXIES } from '@/config/lexiverse-galaxies'
import { scoreWord } from '@/lib/lexiverse/lexiverse-word-filter'
import { useLexiverseDictionary } from '@/lib/lexiverse/useLexiverseDictionary'
import type { LexiverseStoreSlices } from '@/lib/lexiverse/lexiverse-types'

export interface GalaxyMasteryRow {
  galaxyId: string
  total: number
  mastered: number
  review: number
  ratio: number      // 0..1, drives outer-halo opacity in GalaxyNode
}

export function useGalaxyMastery(slices: LexiverseStoreSlices): Record<string, GalaxyMasteryRow> {
  const { words } = useLexiverseDictionary()

  return useMemo(() => {
    if (words.length === 0) return {}

    // Build a quick membership set per galaxy (word.id → present?)
    // Then count how many of those are in litWords / reviewWordIds.
    const litSet = new Set(slices.litWords)
    const revSet = new Set(slices.reviewWordIds)
    const out: Record<string, GalaxyMasteryRow> = {}

    for (const g of GALAXIES) {
      let total = 0, mastered = 0, review = 0
      for (const w of words) {
        const score = scoreWord(w, g.filter)
        if (score === null || score <= 0) continue
        total++
        if (litSet.has(w.id)) mastered++
        if (revSet.has(w.id)) review++
      }
      out[g.id] = {
        galaxyId: g.id,
        total,
        mastered,
        review,
        ratio: total > 0 ? mastered / total : 0,
      }
    }
    return out
  }, [words, slices.litWords, slices.reviewWordIds])
}
