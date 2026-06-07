'use client'
// lib/lexiverse/useLexiverseDictionary.ts
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 · Stage C — load all dictionary words once and cache module-level.
//
// Fetches from /api/lexiverse/words (server route, no client bundle issues).
// Cache survives re-mounts within the SPA session.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import type { FilterableWord } from './lexiverse-word-filter'

let CACHE: FilterableWord[] | null = null
let inFlight: Promise<FilterableWord[]> | null = null

async function loadDictionary(): Promise<FilterableWord[]> {
  if (CACHE) return CACHE
  if (inFlight) return inFlight
  inFlight = (async () => {
    const res = await fetch('/api/lexiverse/words')
    if (!res.ok) throw new Error(`Dictionary load failed: ${res.status}`)
    const json = (await res.json()) as { data: FilterableWord[] }
    CACHE = json.data ?? []
    return CACHE
  })()
  return inFlight
}

export interface UseLexiverseDictionaryState {
  words: FilterableWord[]
  loading: boolean
  error: Error | null
}

export function useLexiverseDictionary(): UseLexiverseDictionaryState {
  const [state, setState] = useState<UseLexiverseDictionaryState>(() => ({
    words: CACHE ?? [],
    loading: !CACHE,
    error: null,
  }))

  useEffect(() => {
    if (CACHE) return
    let alive = true
    loadDictionary()
      .then(w => { if (alive) setState({ words: w, loading: false, error: null }) })
      .catch(e => { if (alive) setState({ words: [], loading: false, error: e as Error }) })
    return () => { alive = false }
  }, [])

  return state
}
