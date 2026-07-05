'use client'
// components/lexiverse/useRecentlyMasteredIds.ts
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 · Stage C — diff the live store slices against a snapshot and
// emit the planet ids whose learning-state just flipped to mastered.
// BurstPool listens for additions and spawns the celebration.
//
// Auto-expires entries after 4 seconds to keep the array small.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import type { BuiltGalaxy, LexiverseStoreSlices, LexiversePlanet } from '@/lib/lexiverse/lexiverse-types'
import { resolveLearningState } from '@/lib/lexiverse/lexiverse-learning-state'

interface Entry { id: string; bornAt: number }
const TTL_MS = 4000

export function useRecentlyMasteredIds(galaxy: BuiltGalaxy | null, slices: LexiverseStoreSlices): string[] {
  const prevStates = useRef<Map<string, string>>(new Map())
  const [entries, setEntries] = useState<Entry[]>([])

  useEffect(() => {
    if (!galaxy) { prevStates.current.clear(); return }
    const additions: Entry[] = []
    const now = performance.now()
    for (const p of galaxy.planets as LexiversePlanet[]) {
      const state = resolveLearningState({ wordId: p.wordId, normalizedWord: p.normalizedWord, slices })
      const prev = prevStates.current.get(p.id)
      if (prev !== state && state === 'mastered' && prev !== undefined) {
        additions.push({ id: p.id, bornAt: now })
      }
      prevStates.current.set(p.id, state)
    }
    if (additions.length === 0) return
    setEntries(prev => [...prev.filter(e => now - e.bornAt < TTL_MS), ...additions])
  }, [galaxy, slices])

  // expiry sweeper
  useEffect(() => {
    if (entries.length === 0) return
    const t = setTimeout(() => {
      const now = performance.now()
      setEntries(prev => prev.filter(e => now - e.bornAt < TTL_MS))
    }, 500)
    return () => clearTimeout(t)
  }, [entries])

  return entries.map(e => e.id)
}
