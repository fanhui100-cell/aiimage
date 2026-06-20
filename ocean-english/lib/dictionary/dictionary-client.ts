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
const ALL_DICTIONARY_WORDS_PAGE_SIZE = 1000
const ALL_DICTIONARY_WORDS_MAX_WORDS = 50000
const ALL_DICTIONARY_WORDS_TIMEOUT_MS = 60_000

function withAdapterTimeout<T>(
  promise: Promise<T>,
  fallback: T,
  timeoutMs = ADAPTER_TIMEOUT_MS,
): Promise<T> {
  return Promise.race([
    promise.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
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
    // 真词修复：旧实现给每个 adapter 传 limit: undefined，而 Supabase 端
    // `?? 20` 把它折叠成 20 —— 1.4 万导入词永远不可见。
    // 现在：live adapter（Supabase）DB 端过滤+分页直接透传，有结果即用；
    // 无结果/未配置才回退 seed 链合并去重（保离线可用）。
    const live = this.adapters.find(a => a.isLive)
    if (live) {
      const results = await withAdapterTimeout(
        live.searchWords(query, options),
        [],
        options?.adapterTimeoutMs,
      )
      if (results.length) return results
    }
    const seen = new Set<string>()
    const merged: DictionaryWord[] = []
    for (const adapter of this.adapters) {
      if (adapter.isLive) continue
      const results = await withAdapterTimeout(
        adapter.searchWords(query, { ...options, offset: 0, limit: undefined }),
        [],
        options?.adapterTimeoutMs,
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

export function createDictionaryClientFromAdapters(adapters: DictionaryClient[]): DictionaryClient {
  return new CompositeDictionaryClient(adapters)
}

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
 * Collect every word from a DictionaryClient by paging through searchWords.
 * Supabase/PostgREST can cap a single range, so Lexiverse cannot rely on one
 * oversized limit when building the full galaxy.
 */
export async function collectAllDictionaryWordsFromClient(
  client: DictionaryClient,
  pageSize = ALL_DICTIONARY_WORDS_PAGE_SIZE,
  maxWords = ALL_DICTIONARY_WORDS_MAX_WORDS,
  adapterTimeoutMs = ALL_DICTIONARY_WORDS_TIMEOUT_MS,
): Promise<DictionaryWord[]> {
  const safePageSize = Math.max(1, Math.floor(pageSize))
  const safeMaxWords = Math.max(safePageSize, Math.floor(maxWords))
  const seen = new Set<string>()
  const words: DictionaryWord[] = []

  for (let offset = 0; offset < safeMaxWords; offset += safePageSize) {
    const batch = await client.searchWords('', {
      offset,
      limit: safePageSize,
      adapterTimeoutMs,
    })
    if (!batch.length) break

    let added = 0
    for (const word of batch) {
      if (!seen.has(word.id)) {
        seen.add(word.id)
        words.push(word)
        added += 1
      }
    }

    if (batch.length < safePageSize || added === 0 || words.length >= safeMaxWords) break
  }

  return words.slice(0, safeMaxWords)
}

/**
 * Return every word across all adapters (deduped by id).
 * Used by Lexiverse to build galaxy planet lists.
 * Client-side usage: call via useLexiverseDictionary hook (module-cached).
 */
export async function getAllDictionaryWords(): Promise<DictionaryWord[]> {
  return collectAllDictionaryWordsFromClient(getDictionaryClient())
}
