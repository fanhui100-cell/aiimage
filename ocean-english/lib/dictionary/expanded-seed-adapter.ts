/**
 * ExpandedSeedAdapter — DictionaryClient backed by Phase 6H expanded seed.
 *
 * Source:
 *   - data/dictionary/import/core-words-expanded.ts (74 original words)
 *   - data/dictionary/import/core-words-150-batch-1.ts (150 original words)
 *   - data/dictionary/import/core-words-500-batch-2.ts (120 original words)
 * No network calls. Works offline. Sits between SupabaseDictionaryClient and
 * CoreSeedAdapter in the CompositeDictionaryClient chain.
 */

import { EXPANDED_WORDS_SEED } from '@/data/dictionary/import/core-words-expanded'
import { CORE_WORDS_150_BATCH_1 } from '@/data/dictionary/import/core-words-150-batch-1'
import { CORE_WORDS_500_BATCH_2 } from '@/data/dictionary/import/core-words-500-batch-2'
import { GRAPH_READY_ENRICHMENT_BATCH_1 } from '@/data/dictionary/import/graph-ready-enrichment-batch-1'
import { toDbSourceType } from '@/lib/dictionary/dictionary-import-types'
import type {
  DictionaryImportCollocation,
  DictionaryImportMnemonic,
  DictionaryImportWord,
} from '@/lib/dictionary/dictionary-import-types'
import type {
  DictionaryWord,
  DictionaryClient,
  DictionaryDefinition,
  DictionaryExample,
  DictionaryCollocation,
  DictionarySceneUsage,
  WordLevel,
  CefrLevel,
  ExamTag,
  WordSearchOptions,
} from './dictionary-types'

const ALL_EXPANDED_SEED_WORDS: DictionaryImportWord[] = [
  ...EXPANDED_WORDS_SEED,
  ...CORE_WORDS_150_BATCH_1,
  ...CORE_WORDS_500_BATCH_2,
]

const ENRICHMENT_BY_WORD = new Map(
  GRAPH_READY_ENRICHMENT_BATCH_1.map((entry) => [entry.normalizedWord, entry]),
)

function mergeStrings(base: string[] | undefined, extra: string[] | undefined): string[] | undefined {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of [...(base ?? []), ...(extra ?? [])]) {
    const normalized = value.trim().toLowerCase()
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    result.push(value.trim())
  }
  return result.length > 0 ? result : undefined
}

function mergeCollocations(
  base: DictionaryImportCollocation[] | undefined,
  extra: DictionaryImportCollocation[] | undefined,
): DictionaryImportCollocation[] | undefined {
  const seen = new Set<string>()
  const result: DictionaryImportCollocation[] = []
  for (const value of [...(base ?? []), ...(extra ?? [])]) {
    const key = value.phrase.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(value)
  }
  return result.length > 0 ? result : undefined
}

function mergeMnemonics(
  base: DictionaryImportMnemonic[] | undefined,
  extra: DictionaryImportMnemonic[] | undefined,
): DictionaryImportMnemonic[] | undefined {
  const seen = new Set<string>()
  const result: DictionaryImportMnemonic[] = []
  for (const value of [...(base ?? []), ...(extra ?? [])]) {
    const key = value.mnemonic.trim().toLowerCase()
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(value)
  }
  return result.length > 0 ? result : undefined
}

function applyGraphEnrichment(entry: DictionaryImportWord): DictionaryImportWord {
  const enrichment = ENRICHMENT_BY_WORD.get(entry.normalizedWord)
  if (!enrichment) return entry

  return {
    ...entry,
    synonyms: mergeStrings(entry.synonyms, enrichment.synonyms),
    antonyms: mergeStrings(entry.antonyms, enrichment.antonyms),
    collocations: mergeCollocations(entry.collocations, enrichment.collocations),
    relatedWords: mergeStrings(entry.relatedWords, enrichment.relatedWords),
    themeTags: mergeStrings(entry.themeTags, enrichment.themeTags),
    domainTags: mergeStrings(entry.domainTags, enrichment.domainTags),
    examTags: mergeStrings(entry.examTags, enrichment.examTags),
    wordFamily: mergeStrings(entry.wordFamily, enrichment.wordFamily),
    sceneUsage: mergeStrings(entry.sceneUsage, enrichment.sceneUsage),
    mnemonics: mergeMnemonics(entry.mnemonics, enrichment.mnemonics),
  }
}

function cefrToLevel(cefr?: string | null): WordLevel {
  switch (cefr) {
    case 'A1': return 'beginner'
    case 'A2': return 'elementary'
    case 'B1': return 'intermediate'
    case 'B2': return 'advanced'
    case 'C1': case 'C2': return 'exam-prep'
    default: return 'intermediate'
  }
}

function importToDictionaryWord(entry: DictionaryImportWord): DictionaryWord {
  const now = new Date().toISOString()
  const sourceType = toDbSourceType(entry.sourceType)
  const primaryPos = entry.partOfSpeech[0] ?? 'unknown'

  const enDefs = entry.definitions.filter(d => d.language === 'en')
  const zhDefs = entry.definitions.filter(d => d.language === 'zh')
  const definitions: DictionaryDefinition[] = enDefs.map((d, i) => ({
    partOfSpeech: primaryPos,
    definitionEn: d.definition,
    definitionZh: zhDefs[i]?.definition,
    orderIndex: d.orderIndex ?? i,
    sourceType,
  }))

  const examples: DictionaryExample[] = (entry.examples ?? []).map((e, i) => ({
    sentenceEn: e.sentenceEn,
    sentenceZh: e.sentenceZh,
    orderIndex: e.orderIndex ?? i,
    sourceType,
  }))

  const collocations: DictionaryCollocation[] = (entry.collocations ?? []).map((c, i) => ({
    phrase: c.phrase,
    exampleEn: c.exampleEn,
    exampleZh: c.exampleZh,
    orderIndex: i,
  }))

  const sceneUsages: DictionarySceneUsage[] = (entry.sceneUsage ?? []).map((scene, i) => ({
    sceneEn: scene,
    orderIndex: i,
  }))

  const mnemonicStyle = (type: string | undefined): 'standard' | 'evil' | 'visual' | 'story' | 'phonetic' => {
    if (type === 'visual') return 'visual'
    if (type === 'sound') return 'phonetic'
    if (type === 'xiexiu') return 'evil'
    return 'standard'
  }

  return {
    id: entry.normalizedWord,
    word: entry.word,
    phoneticIpa: entry.ipa ?? null,
    partOfSpeech: primaryPos,
    cefrLevel: (entry.cefrLevel as CefrLevel) ?? null,
    level: cefrToLevel(entry.cefrLevel),
    difficulty: (entry.difficultyLevel ?? 3) as 1 | 2 | 3 | 4 | 5,
    isCore: entry.isCoreWord ?? false,
    isExamWord: entry.isExamWord ?? false,
    examTags: (entry.examTags ?? []) as ExamTag[],
    tags: [
      ...(entry.themeTags ?? []),
      ...(entry.domainTags ?? []),
      ...(entry.relatedWords ?? []),
      ...(entry.wordFamily ?? []),
    ],
    themeTags: entry.themeTags ?? [],
    domainTags: entry.domainTags ?? [],
    frequencyRank: entry.frequencyRank ?? null,
    sourceType,
    sourceNote: entry.sourceNote,
    definitions,
    examples,
    etymology: entry.etymologyBrief
      ? { roots: entry.etymologyBrief, explanationEn: entry.etymologyBrief }
      : null,
    mnemonics: (entry.mnemonics ?? []).map((m, i) => ({
      mnemonicEn: m.mnemonic,
      mnemonicZh: m.mnemonicZh,
      style: mnemonicStyle(m.type),
      isAiGenerated: false,
      isReviewed: true,
      orderIndex: i,
    })),
    synonyms: entry.synonyms ?? [],
    antonyms: entry.antonyms ?? [],
    collocations,
    sceneUsages,
    pronunciations: [],
    createdAt: now,
    updatedAt: now,
  }
}

// ── Pre-build lookup index ─────────────────────────────────────────────────

const _index = new Map<string, DictionaryWord>()

function getIndex(): Map<string, DictionaryWord> {
  if (_index.size === 0) {
    for (const entry of ALL_EXPANDED_SEED_WORDS) {
      const word = importToDictionaryWord(applyGraphEnrichment(entry))
      _index.set(word.id, word)
    }
  }
  return _index
}

// ── ExpandedSeedDictionaryClient ───────────────────────────────────────────

class ExpandedSeedDictionaryClient implements DictionaryClient {
  readonly isLive = false

  async lookupWord(slug: string): Promise<DictionaryWord | null> {
    return getIndex().get(slug) ?? null
  }

  async searchWords(query: string, options?: WordSearchOptions): Promise<DictionaryWord[]> {
    const q = query.toLowerCase().trim()
    let results = Array.from(getIndex().values())

    if (q) {
      results = results.filter(w =>
        w.word.toLowerCase().includes(q) ||
        w.tags.some(t => t.toLowerCase().includes(q)) ||
        w.definitions.some(d => d.definitionEn.toLowerCase().includes(q)) ||
        w.definitions.some(d => (d.definitionZh ?? '').includes(q))
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

  async getCoreWords(limit = 80): Promise<DictionaryWord[]> {
    return Array.from(getIndex().values())
      .filter(w => w.isCore)
      .slice(0, limit)
  }
}

let _instance: ExpandedSeedDictionaryClient | null = null

export function getExpandedSeedAdapter(): DictionaryClient {
  _instance ??= new ExpandedSeedDictionaryClient()
  return _instance
}
