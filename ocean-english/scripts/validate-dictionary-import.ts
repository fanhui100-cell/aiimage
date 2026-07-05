/**
 * Dictionary Import Validator
 *
 * Validates all public dictionary import seed files for compliance,
 * completeness, graph-readiness, and integrity.
 *
 * Run: npx tsx scripts/validate-dictionary-import.ts
 */

import { EXPANDED_WORDS_SEED } from '../data/dictionary/import/core-words-expanded'
import { CORE_WORDS_150_BATCH_1 } from '../data/dictionary/import/core-words-150-batch-1'
import { CORE_WORDS_500_BATCH_2 } from '../data/dictionary/import/core-words-500-batch-2'
import { GRAPH_READY_ENRICHMENT_BATCH_1 } from '../data/dictionary/import/graph-ready-enrichment-batch-1'
import {
  DICTIONARY_DOMAIN_TAGS,
  DICTIONARY_THEME_TAGS,
  isKebabTag,
} from '../lib/dictionary/dictionary-tag-constants'
import type { DictionaryImportWord } from '../lib/dictionary/dictionary-import-types'

const VALID_CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const VALID_POS = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'interjection']
const VALID_DIFFICULTY = [1, 2, 3, 4, 5]
const VALID_SOURCE_TYPES = ['original_seed', 'ai_generated_draft', 'licensed_public']
const VALID_EXAM_TAGS = ['TOEFL', 'IELTS', 'CET-4', 'CET-6', 'KAOYAN', 'GAOKAO', 'SAT', 'GRE', 'custom']

const BLOCKED_STRINGS = [
  'oxford', 'cambridge', 'longman', 'collins', 'merriam-webster', 'merriam webster',
  'macmillan', 'wordnet', 'wordreference', 'dictionary.com',
  'user upload', 'uploaded document', 'private document', 'scan public', 'public scan',
  'exam paper', 'real exam', 'past paper', 'pirated', 'copyrighted',
]

const MAX_DEF_CHARS = 600
const MAX_EX_CHARS = 500

interface Issue {
  level: 'error' | 'warning'
  id: string
  field: string
  message: string
}

interface SeedGroup {
  label: string
  words: DictionaryImportWord[]
}

const SEED_GROUPS: SeedGroup[] = [
  { label: 'phase-6h-expanded', words: EXPANDED_WORDS_SEED },
  { label: 'phase-8b-1-core-150-batch-1', words: CORE_WORDS_150_BATCH_1 },
  { label: 'phase-8b-3-core-500-batch-2', words: CORE_WORDS_500_BATCH_2 },
]

function validate(entry: DictionaryImportWord): Issue[] {
  const issues: Issue[] = []
  const id = entry.normalizedWord || entry.word || '(unknown)'

  const err = (field: string, message: string) => issues.push({ level: 'error', id, field, message })
  const warn = (field: string, message: string) => issues.push({ level: 'warning', id, field, message })

  if (!entry.word?.trim()) {
    err('word', 'word must not be empty')
    return issues
  }
  if (!entry.normalizedWord?.trim()) err('normalizedWord', 'normalizedWord must not be empty')

  const expectedNorm = entry.word.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  if (entry.normalizedWord !== expectedNorm) {
    warn('normalizedWord', `expected "${expectedNorm}", got "${entry.normalizedWord}"`)
  }

  if (!entry.ipa?.trim()) err('ipa', 'ipa is required for import words')

  if (!entry.partOfSpeech?.length) {
    err('partOfSpeech', 'partOfSpeech must have at least one value')
  } else {
    for (const pos of entry.partOfSpeech) {
      if (!VALID_POS.includes(pos)) warn('partOfSpeech', `unknown POS: "${pos}"`)
    }
  }

  if (!entry.cefrLevel) err('cefrLevel', 'cefrLevel is required')
  if (entry.cefrLevel && !VALID_CEFR.includes(entry.cefrLevel)) {
    err('cefrLevel', `invalid cefrLevel: "${entry.cefrLevel}"`)
  }

  if (entry.difficultyLevel === undefined) err('difficultyLevel', 'difficultyLevel is required')
  if (entry.difficultyLevel !== undefined && !VALID_DIFFICULTY.includes(entry.difficultyLevel)) {
    err('difficultyLevel', `difficultyLevel must be 1-5, got ${entry.difficultyLevel}`)
  }

  const enDefs = entry.definitions.filter(d => d.language === 'en')
  const zhDefs = entry.definitions.filter(d => d.language === 'zh')
  if (enDefs.length === 0) err('definitions', 'must have at least one English definition')
  if (zhDefs.length === 0) err('definitions', 'must have at least one Chinese definition')

  for (const d of entry.definitions) {
    if (!d.definition?.trim()) err('definitions', `empty definition for language="${d.language}"`)
    if (d.definition && d.definition.length > MAX_DEF_CHARS) {
      warn('definitions', `definition too long (${d.definition.length} chars > ${MAX_DEF_CHARS})`)
    }
  }

  if (!entry.examples?.length) {
    err('examples', 'at least one example is required')
  } else {
    for (const ex of entry.examples) {
      if (!ex.sentenceEn?.trim()) err('examples', 'sentenceEn must not be empty')
      if (!ex.sentenceZh?.trim()) err('examples', 'sentenceZh must not be empty')
      if (ex.sentenceEn && ex.sentenceEn.length > MAX_EX_CHARS) {
        warn('examples', `example too long (${ex.sentenceEn.length} chars > ${MAX_EX_CHARS})`)
      }
    }
  }

  if (!entry.sourceType) {
    err('sourceType', 'sourceType is required')
  } else if (!VALID_SOURCE_TYPES.includes(entry.sourceType)) {
    err('sourceType', `invalid sourceType: "${entry.sourceType}"`)
  }
  if (entry.sourceType === 'user_private') {
    err('sourceType', 'user_private data must not appear in public import files')
  }

  if (!entry.sourceNote?.trim()) err('sourceNote', 'sourceNote is required')

  for (const tag of entry.examTags ?? []) {
    if (!VALID_EXAM_TAGS.includes(tag)) warn('examTags', `unknown exam tag: "${tag}"`)
  }
  if (entry.isExamWord && (!entry.examTags || entry.examTags.length === 0)) {
    warn('examTags', 'isExamWord=true but no examTags specified')
  }

  const allText = [
    entry.word,
    entry.normalizedWord,
    entry.sourceNote ?? '',
    ...entry.definitions.map(d => d.definition),
    ...(entry.examples ?? []).flatMap(e => [e.sentenceEn, e.sentenceZh ?? '']),
    ...(entry.collocations ?? []).flatMap(c => [c.phrase, c.exampleEn ?? '', c.exampleZh ?? '']),
    ...(entry.synonyms ?? []),
    ...(entry.antonyms ?? []),
    ...(entry.relatedWords ?? []),
    ...(entry.mnemonics ?? []).flatMap(m => [m.mnemonic, m.mnemonicZh ?? '']),
    entry.etymologyBrief ?? '',
    ...(entry.sceneUsage ?? []),
    ...(entry.examTags ?? []),
    ...(entry.themeTags ?? []),
    ...(entry.domainTags ?? []),
    ...(entry.wordFamily ?? []),
    entry.root ?? '',
    entry.prefix ?? '',
    entry.suffix ?? '',
  ].join(' ').toLowerCase()

  for (const blocked of BLOCKED_STRINGS) {
    if (allText.includes(blocked)) {
      warn('compliance', `text contains "${blocked}" — verify source and remove if needed`)
    }
  }

  return issues
}

const allIssues: Issue[] = []
const ids = new Set<string>()
const words = new Set<string>()
const allWords = SEED_GROUPS.flatMap(group => group.words.map(word => ({ group: group.label, word })))

for (const { group, word: entry } of allWords) {
  if (ids.has(entry.normalizedWord)) {
    allIssues.push({ level: 'error', id: entry.normalizedWord, field: 'normalizedWord', message: `duplicate normalizedWord across import seeds (${group})` })
  }
  ids.add(entry.normalizedWord)

  const lowerWord = entry.word.toLowerCase()
  if (words.has(lowerWord)) {
    allIssues.push({ level: 'error', id: entry.normalizedWord, field: 'word', message: `duplicate word across import seeds (${group})` })
  }
  words.add(lowerWord)

  allIssues.push(...validate(entry))
}

const errors = allIssues.filter(i => i.level === 'error')
const warnings = allIssues.filter(i => i.level === 'warning')

const cefrCounts: Record<string, number> = {}
for (const { word } of allWords) {
  const k = word.cefrLevel ?? 'none'
  cefrCounts[k] = (cefrCounts[k] ?? 0) + 1
}

const examCount = allWords.filter(({ word }) => word.isExamWord).length
const coreCount = allWords.filter(({ word }) => word.isCoreWord).length
const coverageFields = [
  ['ipa', (w: DictionaryImportWord) => Boolean(w.ipa?.trim())],
  ['examples', (w: DictionaryImportWord) => Boolean(w.examples?.length)],
  ['collocations', (w: DictionaryImportWord) => Boolean(w.collocations?.length)],
  ['synonyms', (w: DictionaryImportWord) => Boolean(w.synonyms?.length)],
  ['antonyms', (w: DictionaryImportWord) => Boolean(w.antonyms?.length)],
  ['mnemonics', (w: DictionaryImportWord) => Boolean(w.mnemonics?.length)],
  ['sceneUsage', (w: DictionaryImportWord) => Boolean(w.sceneUsage?.length)],
  ['examTags', (w: DictionaryImportWord) => Boolean(w.examTags?.length)],
  ['themeTags', (w: DictionaryImportWord) => Boolean(w.themeTags?.length)],
  ['domainTags', (w: DictionaryImportWord) => Boolean(w.domainTags?.length)],
  ['relatedWords', (w: DictionaryImportWord) => Boolean(w.relatedWords?.length)],
  ['wordFamily', (w: DictionaryImportWord) => Boolean(w.wordFamily?.length)],
] as const

console.log('\n==== Dictionary Import Validator ====')
for (const group of SEED_GROUPS) console.log(`${group.label}: ${group.words.length}`)
console.log(`phase-8b-5-graph-enrichment-batch-1: ${GRAPH_READY_ENRICHMENT_BATCH_1.length}`)
console.log(`Total words:   ${allWords.length}`)
console.log(`Core words:    ${coreCount}`)
console.log(`Exam words:    ${examCount}`)
console.log(`Errors:        ${errors.length}`)
console.log(`Warnings:      ${warnings.length}`)
console.log('\nCEFR distribution:')
for (const [k, v] of Object.entries(cefrCounts).sort()) console.log(`  ${k}: ${v}`)

console.log('\nField coverage:')
for (const [label, predicate] of coverageFields) {
  const count = allWords.filter(({ word }) => predicate(word)).length
  const pct = allWords.length > 0 ? Math.round((count / allWords.length) * 100) : 0
  console.log(`  ${label}: ${count}/${allWords.length} (${pct}%)`)
}

if (warnings.length > 0) {
  console.log('\nWarnings:')
  for (const w of warnings) console.log(`  [WARN] ${w.id} / ${w.field}: ${w.message}`)
}
if (errors.length > 0) {
  console.log('\nErrors:')
  for (const e of errors) console.log(`  [ERR]  ${e.id} / ${e.field}: ${e.message}`)
  console.log('\nValidation failed.')
  process.exit(1)
}

console.log('\nAll checks passed.')

const importWordIds = new Set(allWords.map(({ word }) => word.normalizedWord))
const enrichmentIssues: Issue[] = []
const allowedThemeTags = new Set<string>(DICTIONARY_THEME_TAGS)
const allowedDomainTags = new Set<string>(DICTIONARY_DOMAIN_TAGS)

function validateUniqueRelationList(id: string, field: string, values: string[] | undefined, allowSelf = false) {
  if (!values) return
  const seen = new Set<string>()
  for (const raw of values) {
    const value = raw.trim()
    const key = value.toLowerCase()
    if (!value) enrichmentIssues.push({ level: 'error', id, field, message: 'empty relation value' })
    if (!allowSelf && key === id) enrichmentIssues.push({ level: 'warning', id, field, message: 'relation points to itself' })
    if (seen.has(key)) enrichmentIssues.push({ level: 'warning', id, field, message: `duplicate relation "${value}"` })
    seen.add(key)
  }
}

for (const enrichment of GRAPH_READY_ENRICHMENT_BATCH_1) {
  const id = enrichment.normalizedWord
  if (!importWordIds.has(id)) {
    enrichmentIssues.push({ level: 'error', id, field: 'normalizedWord', message: 'enrichment target is not in import seeds' })
  }
  validateUniqueRelationList(id, 'synonyms', enrichment.synonyms)
  validateUniqueRelationList(id, 'antonyms', enrichment.antonyms)
  validateUniqueRelationList(id, 'relatedWords', enrichment.relatedWords)
  validateUniqueRelationList(id, 'wordFamily', enrichment.wordFamily, true)

  for (const tag of enrichment.themeTags ?? []) {
    if (!isKebabTag(tag)) enrichmentIssues.push({ level: 'error', id, field: 'themeTags', message: `theme tag is not kebab-case: "${tag}"` })
    if (!allowedThemeTags.has(tag)) enrichmentIssues.push({ level: 'warning', id, field: 'themeTags', message: `theme tag is outside constants: "${tag}"` })
  }
  for (const tag of enrichment.domainTags ?? []) {
    if (!isKebabTag(tag)) enrichmentIssues.push({ level: 'error', id, field: 'domainTags', message: `domain tag is not kebab-case: "${tag}"` })
    if (!allowedDomainTags.has(tag)) enrichmentIssues.push({ level: 'warning', id, field: 'domainTags', message: `domain tag is outside constants: "${tag}"` })
  }
  for (const collocation of enrichment.collocations ?? []) {
    const wordCount = collocation.phrase.trim().split(/\s+/).filter(Boolean).length
    if (wordCount > 5) {
      enrichmentIssues.push({ level: 'warning', id, field: 'collocations', message: `collocation may be too long: "${collocation.phrase}"` })
    }
  }
}

const enrichmentErrors = enrichmentIssues.filter(i => i.level === 'error')
const enrichmentWarnings = enrichmentIssues.filter(i => i.level === 'warning')
console.log('\nGraph enrichment checks:')
console.log(`  targets:  ${GRAPH_READY_ENRICHMENT_BATCH_1.length}`)
console.log(`  errors:   ${enrichmentErrors.length}`)
console.log(`  warnings: ${enrichmentWarnings.length}`)
for (const w of enrichmentWarnings) console.log(`  [WARN] ${w.id} / ${w.field}: ${w.message}`)
for (const e of enrichmentErrors) console.log(`  [ERR]  ${e.id} / ${e.field}: ${e.message}`)
if (enrichmentErrors.length > 0) {
  console.log('\nGraph enrichment validation failed.')
  process.exit(1)
}
