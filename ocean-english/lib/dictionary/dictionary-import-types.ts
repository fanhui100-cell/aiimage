/**
 * DictionaryImportWord — standard format for LexiOcean dictionary import pipeline.
 *
 * Used by:
 *   - data/dictionary/import/core-words-expanded.ts
 *   - scripts/validate-dictionary-import.ts
 *   - scripts/generate-dictionary-seed-sql.ts
 *   - lib/dictionary/expanded-seed-adapter.ts
 *
 * COMPLIANCE: sourceType must be set; user_private data must never appear in
 * public import files.
 */

export type ImportSourceType =
  | 'original_seed'       // LexiOcean-authored educational content
  | 'ai_generated_draft'  // AI-generated, requires human review before production
  | 'licensed_public'     // Confirmed open license; sourceNote must cite license + URL
  | 'user_private'        // BLOCKED — must not appear in public import files

/** Maps ImportSourceType → DictionarySourceType (DB / DictionaryWord) */
export function toDbSourceType(t: ImportSourceType): 'original' | 'ai-generated' | 'licensed' {
  switch (t) {
    case 'original_seed':      return 'original'
    case 'ai_generated_draft': return 'ai-generated'
    case 'licensed_public':    return 'licensed'
    case 'user_private':
      throw new Error('user_private data must not enter the public dictionary')
  }
}

export interface DictionaryImportDefinition {
  language: 'en' | 'zh'
  definition: string
  definitionType?: 'simple' | 'learning' | 'exam' | 'usage'
  orderIndex?: number
}

export interface DictionaryImportExample {
  sentenceEn: string
  sentenceZh?: string
  sourceType: string
  orderIndex?: number
}

export interface DictionaryImportMnemonic {
  mnemonic: string
  mnemonicZh?: string
  type?: 'standard' | 'xiexiu' | 'visual' | 'sound'
}

export interface DictionaryImportCollocation {
  phrase: string
  exampleEn?: string
  exampleZh?: string
}

export interface DictionaryImportWord {
  /** Canonical slug (lowercase, spaces→dash). If omitted, derived from normalizedWord. */
  id?: string
  word: string
  normalizedWord: string        // lowercase, trimmed, spaces→dash
  ipa?: string
  partOfSpeech: string[]        // primary first, e.g. ['noun'] or ['verb', 'noun']
  cefrLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  difficultyLevel?: 1 | 2 | 3 | 4 | 5
  frequencyRank?: number
  isCoreWord?: boolean
  isExamWord?: boolean
  definitions: DictionaryImportDefinition[]     // must have ≥1 'en' + ≥1 'zh'
  examples?: DictionaryImportExample[]
  collocations?: DictionaryImportCollocation[]
  synonyms?: string[]
  antonyms?: string[]
  relatedWords?: string[]
  mnemonics?: DictionaryImportMnemonic[]
  etymologyBrief?: string
  sceneUsage?: string[]
  examTags?: string[]
  themeTags?: string[]
  domainTags?: string[]
  wordFamily?: string[]
  root?: string
  prefix?: string
  suffix?: string
  sourceType: ImportSourceType
  sourceNote: string
}
