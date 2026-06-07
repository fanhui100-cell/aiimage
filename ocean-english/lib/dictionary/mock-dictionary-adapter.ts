/**
 * MockDictionaryAdapter
 *
 * Implements DictionaryClient backed by the existing mock-words.ts data.
 * Used as the Phase 6A fallback until dictionary_words is seeded in Supabase.
 *
 * Converts the mock Word type (types/word.ts) to DictionaryWord (dictionary-types.ts)
 * so that future callers can program against DictionaryClient without caring
 * whether data comes from the DB or mock.
 */

import { getMockWord, searchMockWords, getMockWordsByLevel } from '@/data/mock-words'
import type { Word, ExamFrequency } from '@/types/word'
import type {
  DictionaryWord,
  DictionaryClient,
  DictionaryDefinition,
  DictionaryExample,
  DictionaryEtymology,
  DictionaryMnemonic,
  DictionaryCollocation,
  DictionarySceneUsage,
  ExamTag,
  WordLevel,
  WordSearchOptions,
} from './dictionary-types'

// ── Word → DictionaryWord conversion ──────────────────────────────────────

function convertExamFrequency(ef: ExamFrequency[]): ExamTag[] {
  return ef as ExamTag[]
}

function mockWordToDictionaryWord(w: Word): DictionaryWord {
  const now = new Date().toISOString()

  const sourceDefinitions = w.definitions ?? []
  const definitions: DictionaryDefinition[] = sourceDefinitions.map((d, i) => ({
    partOfSpeech: d.partOfSpeech,
    definitionEn: d.meaning,
    definitionZh: d.meaningZh,
    orderIndex: i,
    sourceType: 'original',
  }))

  // Extract examples that are embedded in each mock Definition (d.example / d.exampleZh)
  const examples: DictionaryExample[] = sourceDefinitions
    .filter(d => d.example)
    .map((d, i) => ({
      sentenceEn: d.example,
      sentenceZh: d.exampleZh,
      orderIndex: i,
      sourceType: 'original' as const,
    }))

  const etymology: DictionaryEtymology | null = w.etymology
    ? {
        roots: w.etymology.roots,
        explanationEn: w.etymology.explanation,
        explanationZh: w.etymology.explanationZh,
      }
    : null

  const mnemonics: DictionaryMnemonic[] = []
  if (w.mnemonic) {
    mnemonics.push({
      mnemonicEn: w.mnemonic,
      mnemonicZh: w.mnemonicZh,
      style: 'standard',
      isAiGenerated: false,
      isReviewed: true,
      orderIndex: 0,
    })
  }
  if (w.mnemonicEvil) {
    mnemonics.push({
      mnemonicEn: w.mnemonicEvil,
      mnemonicZh: w.mnemonicEvilZh,
      style: 'evil',
      isAiGenerated: false,
      isReviewed: true,
      orderIndex: 1,
    })
  }

  const collocations: DictionaryCollocation[] = (w.collocations ?? []).map((c, i) => ({
    phrase: c.phrase,
    exampleEn: c.example,
    exampleZh: c.exampleZh,
    orderIndex: i,
  }))

  const sceneUsages: DictionarySceneUsage[] = (w.sceneUsage ?? []).map((s, i) => ({
    sceneEn: s.scene,
    sceneZh: s.sceneZh,
    exampleEn: s.example,
    exampleZh: s.exampleZh,
    orderIndex: i,
  }))

  return {
    id: w.id,
    word: w.word,
    phoneticIpa: w.phonetic ?? null,
    partOfSpeech: sourceDefinitions[0]?.partOfSpeech ?? null,
    cefrLevel: null,   // mock data doesn't have CEFR
    level: w.level as WordLevel,
    difficulty: w.difficulty,
    isCore: w.level !== 'exam-prep',
    isExamWord: (w.examFrequency?.length ?? 0) > 0,
    examTags: convertExamFrequency(w.examFrequency ?? []),
    tags: w.tags ?? [],
    frequencyRank: null,
    sourceType: 'original',
    sourceNote: 'LexiOcean mock data — manually curated',

    definitions,
    examples,
    etymology,
    mnemonics,
    synonyms: w.synonyms ?? [],
    antonyms: w.antonyms ?? [],
    collocations,
    sceneUsages,
    pronunciations: [],     // no audio; browser TTS used at render time

    createdAt: now,
    updatedAt: now,
  }
}

// ── Mock DictionaryClient implementation ───────────────────────────────────

class MockDictionaryClient implements DictionaryClient {
  readonly isLive = false

  async lookupWord(slug: string): Promise<DictionaryWord | null> {
    const w = getMockWord(slug)
    return w ? mockWordToDictionaryWord(w) : null
  }

  async searchWords(query: string, options?: WordSearchOptions): Promise<DictionaryWord[]> {
    let results = searchMockWords(query).map(mockWordToDictionaryWord)
    if (options?.level) results = results.filter(w => w.level === options.level)
    if (options?.difficulty) results = results.filter(w => w.difficulty === options.difficulty)
    if (options?.limit) results = results.slice(options.offset ?? 0, (options.offset ?? 0) + options.limit)
    return results
  }

  async getWordsByLevel(level: WordLevel, options?: WordSearchOptions): Promise<DictionaryWord[]> {
    let results = getMockWordsByLevel(level).map(mockWordToDictionaryWord)
    if (options?.difficulty) results = results.filter(w => w.difficulty === options.difficulty)
    if (options?.limit) results = results.slice(options.offset ?? 0, (options.offset ?? 0) + options.limit)
    return results
  }

  async getCoreWords(limit = 20): Promise<DictionaryWord[]> {
    const all = searchMockWords('').map(mockWordToDictionaryWord)
    return all.slice(0, limit)
  }
}

// Singleton instance for Phase 6A
let _mockClient: MockDictionaryClient | null = null

export function getMockDictionaryAdapter(): DictionaryClient {
  _mockClient ??= new MockDictionaryClient()
  return _mockClient
}
