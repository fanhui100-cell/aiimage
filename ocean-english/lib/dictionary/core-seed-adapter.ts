/**
 * CoreSeedAdapter — DictionaryClient backed by Phase 6B local seed data.
 *
 * Lookup order (managed by CompositeDictionaryClient in dictionary-client.ts):
 *   CoreSeedAdapter → MockDictionaryAdapter → null
 *
 * Uses data/dictionary/core-words-seed.ts as source of truth.
 * No network calls, no Supabase required — works offline and in all environments.
 */

import { CORE_WORDS_SEED, SEED_SOURCE_NOTE } from '@/data/dictionary/core-words-seed'
import type { SeedWordEntry } from '@/data/dictionary/core-words-seed'
import type {
  DictionaryWord,
  DictionaryClient,
  DictionaryDefinition,
  DictionaryExample,
  DictionaryEtymology,
  DictionaryMnemonic,
  DictionaryCollocation,
  WordLevel,
  CefrLevel,
  ExamTag,
  WordSearchOptions,
} from './dictionary-types'

// ── CEFR → WordLevel mapping ───────────────────────────────────────────────

function cefrToLevel(cefr: string | null): WordLevel {
  switch (cefr) {
    case 'A1': return 'beginner'
    case 'A2': return 'elementary'
    case 'B1': return 'intermediate'
    case 'B2': return 'advanced'
    case 'C1': case 'C2': return 'exam-prep'
    default: return 'intermediate'
  }
}

// ── SeedWordEntry → DictionaryWord ─────────────────────────────────────────

function seedToDictionaryWord(entry: SeedWordEntry): DictionaryWord {
  const now = new Date().toISOString()

  const definitions: DictionaryDefinition[] = [
    {
      partOfSpeech: entry.pos,
      definitionEn: entry.def,
      definitionZh: entry.defZh,
      orderIndex: 0,
      sourceType: 'original',
    },
  ]

  const examples: DictionaryExample[] = [
    {
      sentenceEn: entry.ex,
      sentenceZh: entry.exZh,
      orderIndex: 0,
      sourceType: 'original',
    },
  ]

  const etymology: DictionaryEtymology | null = entry.etym
    ? { roots: entry.etym, explanationEn: entry.etym }
    : null

  const mnemonics: DictionaryMnemonic[] = []
  if (entry.mnem) {
    mnemonics.push({
      mnemonicEn: entry.mnem,
      mnemonicZh: entry.mnemZh ?? undefined,
      style: 'standard',
      isAiGenerated: false,
      isReviewed: true,
      orderIndex: 0,
    })
  }

  const collocations: DictionaryCollocation[] = (entry.collos ?? []).map((c, i) => ({
    phrase: c.phrase,
    exampleEn: c.ex,
    exampleZh: c.exZh,
    orderIndex: i,
  }))

  return {
    id: entry.id,
    word: entry.word,
    phoneticIpa: entry.ipa,
    partOfSpeech: entry.pos,
    cefrLevel: (entry.cefr as CefrLevel) ?? null,
    level: cefrToLevel(entry.cefr),
    difficulty: entry.difficulty,
    isCore: entry.core,
    isExamWord: entry.exam,
    examTags: (entry.examTags ?? []) as ExamTag[],
    tags: entry.tags ?? [],
    frequencyRank: null,
    sourceType: 'original',
    sourceNote: SEED_SOURCE_NOTE,
    definitions,
    examples,
    etymology,
    mnemonics,
    synonyms: entry.synonyms ?? [],
    antonyms: entry.antonyms ?? [],
    collocations,
    sceneUsages: [],
    pronunciations: [],
    createdAt: now,
    updatedAt: now,
  }
}

// ── Pre-build lookup index for O(1) access ─────────────────────────────────

const _index = new Map<string, DictionaryWord>()

function getIndex(): Map<string, DictionaryWord> {
  if (_index.size === 0) {
    for (const entry of CORE_WORDS_SEED) {
      _index.set(entry.id, seedToDictionaryWord(entry))
      // Also index by normalized word for fuzzy fallback
      const norm = entry.word.toLowerCase().replace(/\s+/g, '-')
      if (norm !== entry.id) _index.set(norm, seedToDictionaryWord(entry))
    }
  }
  return _index
}

// ── CoreSeedDictionaryClient ───────────────────────────────────────────────

class CoreSeedDictionaryClient implements DictionaryClient {
  readonly isLive = false

  async lookupWord(slug: string): Promise<DictionaryWord | null> {
    return getIndex().get(slug) ?? null
  }

  async searchWords(query: string, options?: WordSearchOptions): Promise<DictionaryWord[]> {
    const q = query.toLowerCase().trim()
    let results = Array.from(getIndex().values())
      // De-duplicate (index may have two entries per word)
      .filter((w, idx, arr) => arr.findIndex(x => x.id === w.id) === idx)

    if (q) {
      results = results.filter(w =>
        w.word.toLowerCase().includes(q) ||
        w.definitions.some(d => d.definitionEn.toLowerCase().includes(q)) ||
        w.definitions.some(d => (d.definitionZh ?? '').includes(q)),
      )
    }
    if (options?.level) results = results.filter(w => w.level === options.level)
    if (options?.difficulty) results = results.filter(w => w.difficulty === options.difficulty)
    if (options?.examTag) results = results.filter(w => w.examTags.includes(options.examTag!))

    const offset = options?.offset ?? 0
    const limit = options?.limit ?? results.length
    return results.slice(offset, offset + limit)
  }

  async getWordsByLevel(level: WordLevel, options?: WordSearchOptions): Promise<DictionaryWord[]> {
    return this.searchWords('', { ...options, level })
  }

  async getCoreWords(limit = 60): Promise<DictionaryWord[]> {
    const all = Array.from(getIndex().values())
      .filter((w, idx, arr) => arr.findIndex(x => x.id === w.id) === idx)
      .filter(w => w.isCore)
    return all.slice(0, limit)
  }
}

let _instance: CoreSeedDictionaryClient | null = null

export function getCoreSeedAdapter(): DictionaryClient {
  _instance ??= new CoreSeedDictionaryClient()
  return _instance
}
