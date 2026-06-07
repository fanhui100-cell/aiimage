/**
 * Dictionary client factory.
 *
 * Phase 6H lookup chain (tried in order):
 *   1. SupabaseDictionaryClient  — Supabase dictionary_words (when configured + tables exist)
 *   2. ExpandedSeedAdapter       — Phase 6H 74 original words (always offline)
 *   3. CoreSeedAdapter           — Phase 6B 60 original words (always offline)
 *   4. MockDictionaryAdapter     — Phase 1 20 mock words (always offline)
 *   5. null                      — word not found
 *
 * All adapters fail gracefully. No adapter throws.
 *
 * Usage (server components and route handlers):
 *   const word = await getDictionaryClient().lookupWord(slug)
 *
 * Client components call /api/dictionary/word/[slug] instead.
 */

import { getMockDictionaryAdapter } from './mock-dictionary-adapter'
import { getCoreSeedAdapter } from './core-seed-adapter'
import { getExpandedSeedAdapter } from './expanded-seed-adapter'
import { getSupabaseDictionaryClient } from './supabase-dictionary-client'
import type { DictionaryClient, DictionaryWord, WordLevel, WordSearchOptions } from './dictionary-types'

export type { DictionaryClient, DictionaryWord, WordSearchOptions } from './dictionary-types'

const ADAPTER_TIMEOUT_MS = 2500

function withAdapterTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([
    promise.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ADAPTER_TIMEOUT_MS)),
  ])
}

// ── Composite client (tries adapters in order) ─────────────────────────────

class CompositeDictionaryClient implements DictionaryClient {
  readonly isLive = false

  constructor(private readonly adapters: DictionaryClient[]) {}

  async lookupWord(slug: string): Promise<DictionaryWord | null> {
    for (const adapter of this.adapters) {
      const result = await withAdapterTimeout(adapter.lookupWord(slug), null)
      if (result) return result
    }
    return null
  }

  async searchWords(query: string, options?: WordSearchOptions): Promise<DictionaryWord[]> {
    // Collect all matching words from every adapter without pagination so we
    // can deduplicate across adapters before applying the global offset/limit.
    const seen = new Set<string>()
    const merged: DictionaryWord[] = []
    for (const adapter of this.adapters) {
      const results = await withAdapterTimeout(
        adapter.searchWords(query, { ...options, offset: 0, limit: undefined }),
        [],
      )
      for (const w of results) {
        if (!seen.has(w.id)) {
          seen.add(w.id)
          merged.push(w)
        }
      }
    }
    const offset = options?.offset ?? 0
    const limit = options?.limit
    return limit !== undefined ? merged.slice(offset, offset + limit) : merged.slice(offset)
  }

  async getWordsByLevel(level: WordLevel, options?: WordSearchOptions): Promise<DictionaryWord[]> {
    return this.searchWords('', { ...options, level })
  }

  async getCoreWords(limit = 80): Promise<DictionaryWord[]> {
    const seen = new Set<string>()
    const merged: DictionaryWord[] = []
    for (const adapter of this.adapters) {
      const results = await withAdapterTimeout(adapter.getCoreWords(limit), [])
      for (const w of results) {
        if (!seen.has(w.id)) {
          seen.add(w.id)
          merged.push(w)
        }
      }
    }
    return merged.slice(0, limit)
  }
}

// ── Singleton composite client ─────────────────────────────────────────────

let _client: CompositeDictionaryClient | null = null

/**
 * Returns the active DictionaryClient.
 *
 * Phase 6H chain: SupabaseClient → ExpandedSeedAdapter → CoreSeedAdapter → MockDictionaryAdapter
 */
export function getDictionaryClient(): DictionaryClient {
  if (!_client) {
    _client = new CompositeDictionaryClient([
      getSupabaseDictionaryClient(),   // Phase 6H: DB (graceful fallback when unconfigured)
      getExpandedSeedAdapter(),         // Phase 6H: 74 expanded original words
      getCoreSeedAdapter(),             // Phase 6B: 60 core original words
      getMockDictionaryAdapter(),       // Phase 1:  20 mock words
    ])
  }
  return _client
}

/**
 * Server-side convenience: look up a word. Returns null if not found anywhere.
 */
export async function lookupWord(slug: string): Promise<DictionaryWord | null> {
  return getDictionaryClient().lookupWord(slug)
}

/**
 * Return every word across all adapters (deduped by id).
 * Used by Lexiverse to build galaxy planet lists.
 * Client-side usage: call via useLexiverseDictionary hook (module-cached).
 */
export async function getAllDictionaryWords(): Promise<DictionaryWord[]> {
  return getDictionaryClient().searchWords('', { limit: 9999 })
}
