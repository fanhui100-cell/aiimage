'use client'
// components/lexiverse/useCrossGalaxyEchoes.ts
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 · Stage D — when a word is freshly lit, every other galaxy that
// also contains that word receives a transient "echo" pulse.
//
// Output: a Set<string> of (galaxyId + wordId) keys that should pulse
// for the next 2.4 seconds. PlanetNode + GalaxyNode check membership to
// brighten their halos.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import { GALAXIES } from '@/config/lexiverse-galaxies'
import { findGalaxiesForWord } from '@/lib/lexiverse/lexiverse-word-filter'
import { useLexiverseDictionary } from '@/lib/lexiverse/useLexiverseDictionary'
import type { LexiverseStoreSlices } from '@/lib/lexiverse/lexiverse-types'

const TTL_MS = 2400

interface Echo { key: string; bornAt: number }

export interface EchoesAPI {
  /** is this (galaxyId, wordId) currently echoing? */
  has: (galaxyId: string, wordId: string) => boolean
  /** all currently echoing galaxy ids (for outer-halo brightening) */
  galaxyIds: Set<string>
}

export function useCrossGalaxyEchoes(slices: LexiverseStoreSlices): EchoesAPI {
  const { words } = useLexiverseDictionary()
  const prevLit = useRef<Set<string>>(new Set())
  const [echoes, setEchoes] = useState<Echo[]>([])

  // detect new additions in litWords
  useEffect(() => {
    if (words.length === 0) return
    const lit = slices.litWords
    const added: string[] = []
    for (const id of lit) if (!prevLit.current.has(id)) added.push(id)
    prevLit.current = new Set(lit)
    if (added.length === 0) return

    const now = performance.now()
    const additions: Echo[] = []
    const wordsById = new Map(words.map(w => [w.id, w]))
    for (const id of added) {
      const w = wordsById.get(id)
      if (!w) continue
      const galaxiesContaining = findGalaxiesForWord(w, GALAXIES)
      for (const gid of galaxiesContaining) {
        additions.push({ key: `${gid}::${id}`, bornAt: now })
      }
    }
    if (additions.length > 0) {
      setEchoes(prev => {
        const now2 = performance.now()
        return [...prev.filter(e => now2 - e.bornAt < TTL_MS), ...additions]
      })
    }
  }, [slices.litWords, words])

  // expire old echoes
  useEffect(() => {
    if (echoes.length === 0) return
    const t = setTimeout(() => {
      const now = performance.now()
      setEchoes(prev => prev.filter(e => now - e.bornAt < TTL_MS))
    }, 600)
    return () => clearTimeout(t)
  }, [echoes])

  // derive lookups
  const keySet = new Set(echoes.map(e => e.key))
  const galaxyIds = new Set(echoes.map(e => e.key.split('::')[0]))

  return {
    has: (galaxyId, wordId) => keySet.has(`${galaxyId}::${wordId}`),
    galaxyIds,
  }
}
