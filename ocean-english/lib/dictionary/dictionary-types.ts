/**
 * Phase 6A Dictionary Types
 *
 * These types represent the canonical Phase 6 word data model — aligned with the
 * Supabase schema in phase-6a-dictionary-pronunciation-schema.sql.
 *
 * The existing types/word.ts (mock Word type) is preserved as-is.
 * This file is the Phase 6 successor type system.
 *
 * Relationship to mock Word:
 *   mock Word → MockDictionaryAdapter → DictionaryWord
 *   DictionaryClient.lookupWord(slug) returns DictionaryWord | null
 */

// ── Content types ──────────────────────────────────────────────────────────

export interface DictionaryDefinition {
  id?: string
  partOfSpeech: string
  definitionEn: string
  definitionZh?: string
  orderIndex: number
  sourceType: DictionarySourceType
}

export interface DictionaryExample {
  id?: string
  sentenceEn: string
  sentenceZh?: string
  orderIndex: number
  sourceType: DictionarySourceType
}

export interface DictionaryEtymology {
  roots: string
  explanationEn: string
  explanationZh?: string
}

export interface DictionaryMnemonic {
  id?: string
  mnemonicEn: string
  mnemonicZh?: string
  style: 'standard' | 'evil' | 'visual' | 'story' | 'phonetic'
  isAiGenerated: boolean
  isReviewed: boolean
  orderIndex: number
}

export interface DictionaryCollocation {
  id?: string
  phrase: string
  exampleEn?: string
  exampleZh?: string
  orderIndex: number
}

export interface DictionarySceneUsage {
  id?: string
  sceneEn: string
  sceneZh?: string
  exampleEn?: string
  exampleZh?: string
  orderIndex: number
}

export interface DictionaryPronunciation {
  id?: string
  accent: 'us' | 'uk' | 'au' | 'neutral'
  phoneticIpa?: string
  audioUrl?: string
  provider: 'browser-tts' | 'aws-polly' | 'google-tts' | 'azure-tts' | 'custom'
  isDefault: boolean
}

export type ExamTag = 'TOEFL' | 'IELTS' | 'CET-4' | 'CET-6' | 'KAOYAN' | 'GAOKAO' | 'SAT' | 'GRE' | 'custom'
export type DictionarySourceType = 'original' | 'ai-generated' | 'adapted' | 'public-domain' | 'licensed'
export type WordLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'exam-prep'
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

/**
 * Phase 8C — per-exam profile for fine-grained exam tagging.
 * examTags[] on DictionaryWord remains the primary filter field.
 * This provides additional metadata when a word belongs to a specific exam tier.
 */
export interface DictionaryExamProfile {
  exam: ExamTag
  /** e.g. 'Band-6', 'Core', 'Advanced' — exam-specific tier label */
  band?: string
  /** Official word list name, e.g. 'LexiOcean-Core', 'ETS-TOEFL-2024' */
  sourceList?: string
  /** Times the word appeared in recent exam papers (estimated/tracked) */
  appearanceCount?: number
  lastSeenYear?: number
}

// ── Main DictionaryWord type ───────────────────────────────────────────────

export interface DictionaryWord {
  id: string                        // slug, matches saved_words.word_id
  word: string
  phoneticIpa: string | null
  partOfSpeech: string | null       // primary POS
  cefrLevel: CefrLevel | null
  level: WordLevel
  difficulty: 1 | 2 | 3 | 4 | 5
  isCore: boolean
  isExamWord: boolean
  examTags: ExamTag[]
  tags: string[]
  /** Lexiverse filter support — theme dimension (e.g. 'academic', 'daily-life') */
  themeTags?: string[]
  /** Lexiverse filter support — domain dimension (e.g. 'engineering', 'ai-tech') */
  domainTags?: string[]
  frequencyRank: number | null
  /** P1-2/阶段2：词库 7 档标签（1初中…7SAT，多档共存）；阶段 2 注入前为空 */
  levels?: number[]
  /** 阶段2：最低档 */
  primaryLevel?: number
  /** 阶段2：常用短语（前 6 条） */
  phrases?: { phrase: string; translation?: string }[]
  sourceType: DictionarySourceType
  sourceNote: string | null
  /** Phase 8C: per-exam profiles (fine-grained). examTags[] remains the primary filter. */
  examProfiles?: DictionaryExamProfile[]
  /** Phase 8C: name of the source word list, e.g. 'LexiOcean-Core', 'ETS-TOEFL-2024' */
  sourceWordList?: string
  /** Phase 8C: how often this word appears in exam papers (for future analytics) */
  appearanceFrequency?: number

  definitions: DictionaryDefinition[]
  examples: DictionaryExample[]
  etymology: DictionaryEtymology | null
  mnemonics: DictionaryMnemonic[]
  synonyms: string[]
  antonyms: string[]
  collocations: DictionaryCollocation[]
  sceneUsages: DictionarySceneUsage[]
  pronunciations: DictionaryPronunciation[]

  createdAt: string
  updatedAt: string
}

// ── Client interface ───────────────────────────────────────────────────────

export interface WordSearchOptions {
  level?: WordLevel
  difficulty?: 1 | 2 | 3 | 4 | 5
  examTag?: ExamTag
  limit?: number
  offset?: number
}

export interface DictionaryClient {
  /** Fetch a single word by its slug. Returns null if not found. */
  lookupWord(slug: string): Promise<DictionaryWord | null>

  /** Full-text search across word and definitions. */
  searchWords(query: string, options?: WordSearchOptions): Promise<DictionaryWord[]>

  /** Get words filtered by level and optionally difficulty. */
  getWordsByLevel(level: WordLevel, options?: WordSearchOptions): Promise<DictionaryWord[]>

  /** Get the canonical word list for seeding quiz/review. */
  getCoreWords(limit?: number): Promise<DictionaryWord[]>

  /** Whether this client has a real DB backing (vs. mock fallback). */
  readonly isLive: boolean
}
