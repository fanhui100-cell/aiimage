/**
 * LexiOcean Phase 8C — Dictionary & Question Bank Coverage Report
 *
 * Reads all word sources and the question bank, then writes structured reports
 * to the reports/ directory.
 *
 * Outputs:
 *   reports/dictionary-coverage.md
 *   reports/dictionary-coverage.json
 *   reports/question-bank-coverage.md
 *   reports/question-bank-coverage.json
 *   reports/missing-fields.md
 *
 * Run: npx tsx scripts/coverage-report.ts
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { CORE_WORDS_SEED } from '../data/dictionary/core-words-seed'
import { EXPANDED_WORDS_SEED } from '../data/dictionary/import/core-words-expanded'
import { CORE_WORDS_150_BATCH_1 } from '../data/dictionary/import/core-words-150-batch-1'
import { CORE_WORDS_500_BATCH_2 } from '../data/dictionary/import/core-words-500-batch-2'
import { ORIGINAL_VOCAB_DRILL_LITE } from '../data/question-bank/original-vocab-drill-lite'
import type { DictionaryImportWord } from '../lib/dictionary/dictionary-import-types'
import type { SeedWordEntry } from '../data/dictionary/core-words-seed'
import type { QuestionBankItem } from '../types/question-bank'

const REPORTS_DIR = path.resolve(__dirname, '../reports')
const NOW = new Date().toISOString()

// ── Normalized representation shared across both source formats ─────────────

interface WordStats {
  id: string
  word: string
  source: 'core-seed' | 'expanded' | 'batch-1' | 'batch-2'
  cefrLevel: string | null
  difficulty: number | null
  isCore: boolean
  isExamWord: boolean
  examTags: string[]
  themeTags: string[]
  domainTags: string[]
  hasDefinitionEn: boolean
  hasDefinitionZh: boolean
  hasExamples: boolean
  hasSynonyms: boolean
  hasAntonyms: boolean
  hasCollocations: boolean
  hasMnemonics: boolean
}

function fromSeedEntry(e: SeedWordEntry): WordStats {
  return {
    id: e.id,
    word: e.word,
    source: 'core-seed',
    cefrLevel: e.cefr ?? null,
    difficulty: e.difficulty,
    isCore: e.core,
    isExamWord: e.exam,
    examTags: e.examTags,
    themeTags: e.tags,
    domainTags: [],
    hasDefinitionEn: Boolean(e.def?.trim()),
    hasDefinitionZh: Boolean(e.defZh?.trim()),
    hasExamples: Boolean(e.ex?.trim()),
    hasSynonyms: (e.synonyms?.length ?? 0) > 0,
    hasAntonyms: (e.antonyms?.length ?? 0) > 0,
    hasCollocations: (e.collos?.length ?? 0) > 0,
    hasMnemonics: Boolean(e.mnem?.trim()),
  }
}

function fromImportWord(e: DictionaryImportWord, source: WordStats['source']): WordStats {
  return {
    id: e.normalizedWord,
    word: e.word,
    source,
    cefrLevel: e.cefrLevel ?? null,
    difficulty: e.difficultyLevel ?? null,
    isCore: e.isCoreWord ?? false,
    isExamWord: e.isExamWord ?? false,
    examTags: e.examTags ?? [],
    themeTags: e.themeTags ?? [],
    domainTags: e.domainTags ?? [],
    hasDefinitionEn: e.definitions.some(d => d.language === 'en' && Boolean(d.definition.trim())),
    hasDefinitionZh: e.definitions.some(d => d.language === 'zh' && Boolean(d.definition.trim())),
    hasExamples: (e.examples?.length ?? 0) > 0,
    hasSynonyms: (e.synonyms?.length ?? 0) > 0,
    hasAntonyms: (e.antonyms?.length ?? 0) > 0,
    hasCollocations: (e.collocations?.length ?? 0) > 0,
    hasMnemonics: (e.mnemonics?.length ?? 0) > 0,
  }
}

// ── Collect & deduplicate words ─────────────────────────────────────────────

const sources: { label: WordStats['source']; words: WordStats[] }[] = [
  { label: 'expanded',   words: EXPANDED_WORDS_SEED.map(w => fromImportWord(w, 'expanded')) },
  { label: 'batch-1',    words: CORE_WORDS_150_BATCH_1.map(w => fromImportWord(w, 'batch-1')) },
  { label: 'batch-2',    words: CORE_WORDS_500_BATCH_2.map(w => fromImportWord(w, 'batch-2')) },
  { label: 'core-seed',  words: CORE_WORDS_SEED.map(fromSeedEntry) },
]

const allBySource: Record<string, WordStats[]> = {}
for (const s of sources) allBySource[s.label] = s.words

// Build unique index (ExpandedSeedAdapter is first in runtime chain, then CoreSeedAdapter)
const uniqueById = new Map<string, WordStats>()
const duplicates: { id: string; sources: string[] }[] = []

for (const s of sources) {
  for (const w of s.words) {
    if (uniqueById.has(w.id)) {
      const existing = duplicates.find(d => d.id === w.id)
      if (existing) {
        existing.sources.push(w.source)
      } else {
        duplicates.push({ id: w.id, sources: [uniqueById.get(w.id)!.source, w.source] })
      }
    } else {
      uniqueById.set(w.id, w)
    }
  }
}

const allWords = sources.flatMap(s => s.words)
const uniqueWords = Array.from(uniqueById.values())

// ── Frequency helpers ───────────────────────────────────────────────────────

function freq<T>(items: T[], key: (i: T) => string | null | undefined): Record<string, number> {
  const out: Record<string, number> = {}
  for (const item of items) {
    const k = key(item) ?? '(none)'
    out[k] = (out[k] ?? 0) + 1
  }
  return Object.fromEntries(Object.entries(out).sort((a, b) => b[1] - a[1]))
}

function pct(n: number, total: number): string {
  return total === 0 ? '0%' : `${Math.round(n / total * 100)}%`
}

function mdTable(headers: string[], rows: (string | number)[][]): string {
  const sep = headers.map(() => '---')
  const fmt = (r: (string | number)[]) => `| ${r.join(' | ')} |`
  return [fmt(headers), fmt(sep), ...rows.map(fmt)].join('\n')
}

// ── Dictionary statistics ───────────────────────────────────────────────────

const cefrDist = freq(uniqueWords, w => w.cefrLevel)
const diffDist = freq(uniqueWords, w => w.difficulty !== null ? String(w.difficulty) : null)
const examTagDist: Record<string, number> = {}
for (const w of uniqueWords) {
  for (const t of w.examTags) examTagDist[t] = (examTagDist[t] ?? 0) + 1
}
if (Object.keys(examTagDist).length === 0) examTagDist['(none)'] = uniqueWords.length

const fieldCoverage = {
  definitionEn:  uniqueWords.filter(w => w.hasDefinitionEn).length,
  definitionZh:  uniqueWords.filter(w => w.hasDefinitionZh).length,
  examples:      uniqueWords.filter(w => w.hasExamples).length,
  synonyms:      uniqueWords.filter(w => w.hasSynonyms).length,
  antonyms:      uniqueWords.filter(w => w.hasAntonyms).length,
  collocations:  uniqueWords.filter(w => w.hasCollocations).length,
  mnemonics:     uniqueWords.filter(w => w.hasMnemonics).length,
  examTags:      uniqueWords.filter(w => w.examTags.length > 0).length,
  themeTags:     uniqueWords.filter(w => w.themeTags.length > 0).length,
  domainTags:    uniqueWords.filter(w => w.domainTags.length > 0).length,
}

// Words missing each field (use unique set)
const missing = {
  definitionZh:  uniqueWords.filter(w => !w.hasDefinitionZh).map(w => w.word),
  examples:      uniqueWords.filter(w => !w.hasExamples).map(w => w.word),
  synonyms:      uniqueWords.filter(w => !w.hasSynonyms).map(w => w.word),
  antonyms:      uniqueWords.filter(w => !w.hasAntonyms).map(w => w.word),
  collocations:  uniqueWords.filter(w => !w.hasCollocations).map(w => w.word),
  mnemonics:     uniqueWords.filter(w => !w.hasMnemonics).map(w => w.word),
  examTags:      uniqueWords.filter(w => w.examTags.length === 0).map(w => w.word),
  themeTags:     uniqueWords.filter(w => w.themeTags.length === 0).map(w => w.word),
  domainTags:    uniqueWords.filter(w => w.domainTags.length === 0).map(w => w.word),
}

// ── Question bank statistics ────────────────────────────────────────────────

const questions: QuestionBankItem[] = ORIGINAL_VOCAB_DRILL_LITE
const qByWord: Record<string, number> = {}
for (const q of questions) qByWord[q.wordId] = (qByWord[q.wordId] ?? 0) + 1

const uniqueWordIds = new Set(uniqueWords.map(w => w.id))
const wordsWithQuestions = Object.keys(qByWord).filter(id => uniqueWordIds.has(id)).length
const wordsWithoutQuestions = uniqueWords.length - wordsWithQuestions
const zeroQuestionWords = uniqueWords
  .filter(w => !qByWord[w.id])
  .sort((a, b) => a.word.localeCompare(b.word))
  .map(w => w.word)

const qtypeDist = freq(questions, q => q.type)
const qDiffDist = freq(questions, q => String(q.difficultyLevel))
const qExamDist: Record<string, number> = {}
for (const q of questions) {
  if (q.examTags.length === 0) { qExamDist['(none)'] = (qExamDist['(none)'] ?? 0) + 1 }
  for (const t of q.examTags) qExamDist[t] = (qExamDist[t] ?? 0) + 1
}

const perWordCounts = Object.values(qByWord)
const qStats = perWordCounts.length === 0 ? { min: 0, max: 0, avg: 0 } : {
  min: Math.min(...perWordCounts),
  max: Math.max(...perWordCounts),
  avg: Math.round((perWordCounts.reduce((s, n) => s + n, 0) / perWordCounts.length) * 100) / 100,
}

// ── Build JSON payloads ─────────────────────────────────────────────────────

const dictJson = {
  generatedAt: NOW,
  sources: sources.map(s => ({ label: s.label, entries: s.words.length })),
  totalAcrossAllSources: allWords.length,
  uniqueWordCount: uniqueWords.length,
  duplicateCount: duplicates.length,
  runtimeReachableWordCount: uniqueWords.length,
  cefrDistribution: cefrDist,
  difficultyDistribution: diffDist,
  examTagDistribution: examTagDist,
  fieldCoverage: Object.fromEntries(
    Object.entries(fieldCoverage).map(([k, v]) => [k, { count: v, total: uniqueWords.length, pct: pct(v, uniqueWords.length) }])
  ),
  duplicates,
}

const qbJson = {
  generatedAt: NOW,
  totalQuestions: questions.length,
  uniqueTargetWords: Object.keys(qByWord).length,
  wordsWithQuestions,
  wordsWithoutQuestions,
  questionTypeDistribution: qtypeDist,
  difficultyDistribution: qDiffDist,
  examTagDistribution: qExamDist,
  questionsPerWordStats: qStats,
  zeroQuestionWordCount: zeroQuestionWords.length,
}

// ── Build Markdown reports ──────────────────────────────────────────────────

function buildDictMd(): string {
  const lines: string[] = [
    '# LexiOcean Dictionary Coverage Report',
    `> Generated: ${NOW}`,
    '',
    '## Sources',
    '',
    mdTable(
      ['Source', 'Entries', 'Runtime'],
      [
        ...sources.map(s => [s.label, String(s.words.length), '✓']),
        ['**Total (all sources)**', String(allWords.length), '—'],
        ['**Unique words (by ID)**', String(uniqueWords.length), '—'],
        ['**Duplicate IDs (cross-source)**', String(duplicates.length), '—'],
      ]
    ),
    '',
    '## CEFR Distribution (unique words)',
    '',
    mdTable(
      ['CEFR', 'Count', '%'],
      Object.entries(cefrDist).map(([k, v]) => [k, String(v), pct(v, uniqueWords.length)])
    ),
    '',
    '## Difficulty Distribution (unique words)',
    '',
    mdTable(
      ['Difficulty', 'Count', '%'],
      Object.entries(diffDist).map(([k, v]) => [k, String(v), pct(v, uniqueWords.length)])
    ),
    '',
    '## Exam Tag Distribution (unique words)',
    '',
    mdTable(
      ['Exam Tag', 'Count', '%'],
      Object.entries(examTagDist).map(([k, v]) => [k, String(v), pct(v, uniqueWords.length)])
    ),
    '',
    '## Field Coverage (unique words)',
    '',
    mdTable(
      ['Field', 'Count', 'Total', '%'],
      Object.entries(fieldCoverage).map(([k, v]) => [k, String(v), String(uniqueWords.length), pct(v, uniqueWords.length)])
    ),
    '',
    '## Question Bank Integration',
    '',
    mdTable(
      ['Metric', 'Value'],
      [
        ['Total questions', String(questions.length)],
        ['Unique target words', String(Object.keys(qByWord).length)],
        [`Words with ≥1 question`, `${wordsWithQuestions} / ${uniqueWords.length} (${pct(wordsWithQuestions, uniqueWords.length)})`],
        [`Words with 0 questions`, `${wordsWithoutQuestions} / ${uniqueWords.length} (${pct(wordsWithoutQuestions, uniqueWords.length)})`],
        ['Questions per word (min/max/avg)', `${qStats.min} / ${qStats.max} / ${qStats.avg}`],
      ]
    ),
    '',
  ]

  if (duplicates.length > 0) {
    lines.push('## Duplicate Word IDs (cross-source)', '')
    for (const d of duplicates) {
      lines.push(`- \`${d.id}\` appears in: ${d.sources.join(', ')}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

function buildQbMd(): string {
  return [
    '# LexiOcean Question Bank Coverage Report',
    `> Generated: ${NOW}`,
    '',
    '## Summary',
    '',
    mdTable(
      ['Metric', 'Value'],
      [
        ['Total questions', String(questions.length)],
        ['Unique target words covered', String(Object.keys(qByWord).length)],
        ['Words with ≥1 question', `${wordsWithQuestions} / ${uniqueWords.length} (${pct(wordsWithQuestions, uniqueWords.length)})`],
        ['Words with 0 questions', `${wordsWithoutQuestions} / ${uniqueWords.length} (${pct(wordsWithoutQuestions, uniqueWords.length)})`],
        ['Min questions per word', String(qStats.min)],
        ['Max questions per word', String(qStats.max)],
        ['Avg questions per word', String(qStats.avg)],
      ]
    ),
    '',
    '## Question Type Distribution',
    '',
    mdTable(
      ['Type', 'Count', '%'],
      Object.entries(qtypeDist).map(([k, v]) => [k, String(v), pct(v, questions.length)])
    ),
    '',
    '## Difficulty Distribution',
    '',
    mdTable(
      ['Difficulty', 'Count', '%'],
      Object.entries(qDiffDist).map(([k, v]) => [k, String(v), pct(v, questions.length)])
    ),
    '',
    '## Exam Tag Distribution',
    '',
    mdTable(
      ['Exam Tag', 'Count', '%'],
      Object.entries(qExamDist).map(([k, v]) => [k, String(v), pct(v, questions.length)])
    ),
    '',
  ].join('\n')
}

function buildMissingFieldsMd(): string {
  const lines = [
    '# LexiOcean Missing Fields Report',
    `> Generated: ${NOW}  |  Unique words: ${uniqueWords.length}`,
    '',
  ]

  const fields: [keyof typeof missing, string][] = [
    ['definitionZh', 'Missing Chinese definition'],
    ['examples', 'Missing examples'],
    ['synonyms', 'Missing synonyms'],
    ['antonyms', 'Missing antonyms'],
    ['collocations', 'Missing collocations'],
    ['mnemonics', 'Missing mnemonics'],
    ['examTags', 'Missing exam tags'],
    ['themeTags', 'Missing theme tags'],
    ['domainTags', 'Missing domain tags'],
  ]

  for (const [key, label] of fields) {
    const words = missing[key]
    lines.push(`## ${label} (${words.length} / ${uniqueWords.length})`, '')
    if (words.length === 0) {
      lines.push('All words have this field. ✓', '')
    } else {
      const preview = words.slice(0, 30).join(', ')
      lines.push(preview + (words.length > 30 ? `, … (+${words.length - 30} more)` : ''), '')
    }
  }
  return lines.join('\n')
}

// ── Write files ─────────────────────────────────────────────────────────────

fs.mkdirSync(REPORTS_DIR, { recursive: true })

const files: { name: string; content: string }[] = [
  { name: 'dictionary-coverage.json',      content: JSON.stringify(dictJson, null, 2) },
  { name: 'dictionary-coverage.md',        content: buildDictMd() },
  { name: 'question-bank-coverage.json',   content: JSON.stringify(qbJson, null, 2) },
  { name: 'question-bank-coverage.md',     content: buildQbMd() },
  { name: 'missing-fields.md',             content: buildMissingFieldsMd() },
]

for (const f of files) {
  fs.writeFileSync(path.join(REPORTS_DIR, f.name), f.content, 'utf8')
}

// ── Console summary ─────────────────────────────────────────────────────────

console.log('\n==== LexiOcean Coverage Report ====')
for (const s of sources) console.log(`  ${s.label}: ${s.words.length} words`)
console.log(`  Total across sources: ${allWords.length}`)
console.log(`  Unique words:         ${uniqueWords.length}`)
console.log(`  Duplicates:           ${duplicates.length}`)
console.log(`  Questions:            ${questions.length}`)
console.log(`  Words with questions: ${wordsWithQuestions} / ${uniqueWords.length} (${pct(wordsWithQuestions, uniqueWords.length)})`)
console.log(`  Zero-question words:  ${zeroQuestionWords.length}`)
console.log(`\n  CEFR distribution:`)
for (const [k, v] of Object.entries(cefrDist)) console.log(`    ${k}: ${v}`)
console.log(`\n  Exam tag distribution:`)
for (const [k, v] of Object.entries(examTagDist)) console.log(`    ${k}: ${v}`)
console.log(`\nReports written to: ${REPORTS_DIR}`)
for (const f of files) console.log(`  ${f.name}`)
