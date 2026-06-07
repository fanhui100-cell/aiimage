/**
 * Dictionary Seed Validator
 *
 * Checks core-words-seed.ts for compliance, completeness, and integrity.
 * Run with: npx tsx scripts/validate-dictionary-seed.ts
 *
 * Exit codes:
 *   0 — all checks pass (warnings are OK)
 *   1 — one or more errors found
 */

import { CORE_WORDS_SEED } from '../data/dictionary/core-words-seed'
import type { SeedWordEntry } from '../data/dictionary/core-words-seed'

// ── Constants ──────────────────────────────────────────────────────────────

const VALID_POS = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'interjection']
const VALID_CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const VALID_EXAM_TAGS = ['TOEFL', 'IELTS', 'CET-4', 'CET-6', 'KAOYAN', 'GAOKAO', 'SAT', 'GRE', 'custom']
const VALID_DIFFICULTY = [1, 2, 3, 4, 5]

// These strings appearing in def, defZh, or sourceNote would indicate possible
// unauthorized commercial dictionary content.
const SUSPICIOUS_SOURCES = [
  'oxford', 'cambridge', 'longman', 'collins', 'merriam-webster', 'merriam webster',
  'macmillan', 'wordnet', 'wordreference',
]

// ── Types ──────────────────────────────────────────────────────────────────

interface ValidationIssue {
  level: 'error' | 'warning'
  wordId: string
  field: string
  message: string
}

// ── Validation functions ───────────────────────────────────────────────────

function validateEntry(entry: SeedWordEntry): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const id = entry.id || '(unknown)'

  function error(field: string, message: string) {
    issues.push({ level: 'error', wordId: id, field, message })
  }
  function warn(field: string, message: string) {
    issues.push({ level: 'warning', wordId: id, field, message })
  }

  // ── Required string fields ─────────────────────────────────────────────

  if (!entry.id || entry.id.trim() === '') error('id', 'id must not be empty')
  if (!entry.word || entry.word.trim() === '') error('word', 'word must not be empty')

  // id should match normalized form of word
  if (entry.id && entry.word) {
    const expectedId = entry.word.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    if (entry.id !== expectedId) {
      warn('id', `id "${entry.id}" does not match expected slug "${expectedId}"`)
    }
  }

  // ── Part of speech ─────────────────────────────────────────────────────

  if (!entry.pos || entry.pos.trim() === '') {
    error('pos', 'part of speech must not be empty')
  } else if (!VALID_POS.includes(entry.pos.toLowerCase())) {
    warn('pos', `"${entry.pos}" is not a recognized part of speech — allowed: ${VALID_POS.join(', ')}`)
  }

  // ── CEFR level ─────────────────────────────────────────────────────────

  if (entry.cefr !== null && !VALID_CEFR.includes(entry.cefr)) {
    error('cefr', `"${entry.cefr}" is not a valid CEFR level — must be one of: ${VALID_CEFR.join(', ')}`)
  }

  // ── Difficulty ─────────────────────────────────────────────────────────

  if (!VALID_DIFFICULTY.includes(entry.difficulty)) {
    error('difficulty', `difficulty ${entry.difficulty} is out of range — must be 1–5`)
  }

  // ── Definitions ────────────────────────────────────────────────────────

  if (!entry.def || entry.def.trim().length < 5) {
    error('def', 'English definition is required and must be at least 5 characters')
  }
  if (!entry.defZh || entry.defZh.trim().length < 1) {
    error('defZh', 'Chinese definition (defZh) is required')
  }

  // ── Examples ───────────────────────────────────────────────────────────

  if (!entry.ex || entry.ex.trim().length < 5) {
    error('ex', 'At least one English example sentence is required')
  }
  if (!entry.exZh || entry.exZh.trim().length < 1) {
    error('exZh', 'Chinese example translation (exZh) is required')
  }

  // ── Source compliance — scan ALL text-bearing fields ─────────────────

  // Covers: definition, example, mnemonic, etymology, collocations
  const textToScan = [
    entry.def,
    entry.defZh,
    entry.ex,
    entry.exZh,
    entry.mnem,
    entry.mnemZh,
    entry.etym,
    ...(entry.collos?.flatMap(c => [c.phrase, c.ex, c.exZh].filter(Boolean)) ?? []),
  ].filter(Boolean).join(' ').toLowerCase()

  for (const suspicious of SUSPICIOUS_SOURCES) {
    if (textToScan.includes(suspicious)) {
      error('content', `Text contains possible unauthorized source reference: "${suspicious}"`)
    }
  }

  // ── IPA ───────────────────────────────────────────────────────────────

  if (entry.ipa === null || entry.ipa.trim() === '') {
    warn('ipa', 'IPA phonetic is not provided — browser TTS will still work but no phonetic display')
  }

  // ── Exam tags ──────────────────────────────────────────────────────────

  for (const tag of entry.examTags ?? []) {
    if (!VALID_EXAM_TAGS.includes(tag)) {
      warn('examTags', `Unknown exam tag: "${tag}" — allowed: ${VALID_EXAM_TAGS.join(', ')}`)
    }
  }

  // ── Exam / isExamWord consistency ─────────────────────────────────────

  if (entry.exam && (!entry.examTags || entry.examTags.length === 0)) {
    warn('examTags', 'isExamWord is true but no examTags provided')
  }
  if (!entry.exam && entry.examTags && entry.examTags.length > 0) {
    warn('exam', 'examTags provided but isExamWord is false — set exam: true to be consistent')
  }

  // ── Synonyms/antonyms ─────────────────────────────────────────────────

  if (!Array.isArray(entry.synonyms)) {
    error('synonyms', 'synonyms must be an array')
  }
  if (!Array.isArray(entry.antonyms)) {
    error('antonyms', 'antonyms must be an array')
  }

  return issues
}

function validateDuplicates(entries: SeedWordEntry[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const seenIds = new Map<string, number>()
  const seenWords = new Map<string, number>()

  entries.forEach((entry, idx) => {
    const { id, word } = entry
    if (id) {
      if (seenIds.has(id)) {
        issues.push({ level: 'error', wordId: id, field: 'id', message: `Duplicate id "${id}" at index ${idx} (first seen at index ${seenIds.get(id)})` })
      } else {
        seenIds.set(id, idx)
      }
    }
    if (word) {
      const norm = word.toLowerCase()
      if (seenWords.has(norm)) {
        issues.push({ level: 'error', wordId: id ?? `[${idx}]`, field: 'word', message: `Duplicate word "${word}" at index ${idx} (first seen at index ${seenWords.get(norm)})` })
      } else {
        seenWords.set(norm, idx)
      }
    }
  })

  return issues
}

// ── Main ───────────────────────────────────────────────────────────────────

function main(): void {
  const entries = CORE_WORDS_SEED
  const allIssues: ValidationIssue[] = []

  console.log(`\n🔍  Validating ${entries.length} dictionary seed entries…\n`)

  // Per-entry validation
  for (const entry of entries) {
    const issues = validateEntry(entry)
    allIssues.push(...issues)
  }

  // Cross-entry validation
  const dupIssues = validateDuplicates(entries)
  allIssues.push(...dupIssues)

  // ── Summary ──────────────────────────────────────────────────────────

  const errors = allIssues.filter(i => i.level === 'error')
  const warnings = allIssues.filter(i => i.level === 'warning')

  if (warnings.length > 0) {
    console.log(`⚠   Warnings (${warnings.length}):`)
    for (const w of warnings) {
      console.log(`    [${w.wordId}] ${w.field}: ${w.message}`)
    }
    console.log()
  }

  if (errors.length > 0) {
    console.log(`✗   Errors (${errors.length}):`)
    for (const e of errors) {
      console.error(`    [${e.wordId}] ${e.field}: ${e.message}`)
    }
    console.log()
  }

  // ── Statistics ───────────────────────────────────────────────────────

  const cefr = entries.reduce<Record<string, number>>((acc, e) => {
    const k = e.cefr ?? 'null'
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})
  const pos = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.pos] = (acc[e.pos] ?? 0) + 1
    return acc
  }, {})
  const examCount = entries.filter(e => e.exam).length
  const withMnem = entries.filter(e => e.mnem).length
  const withEtym = entries.filter(e => e.etym).length
  const withIpa = entries.filter(e => e.ipa).length

  console.log(`📊  Statistics:`)
  console.log(`    Total words:   ${entries.length}`)
  console.log(`    CEFR levels:   ${JSON.stringify(cefr)}`)
  console.log(`    Parts of speech: ${JSON.stringify(pos)}`)
  console.log(`    Exam words:    ${examCount}`)
  console.log(`    With IPA:      ${withIpa} / ${entries.length}`)
  console.log(`    With mnemonic: ${withMnem} / ${entries.length}`)
  console.log(`    With etymology:${withEtym} / ${entries.length}`)
  console.log()

  if (errors.length === 0) {
    console.log(`✅  All checks passed! ${warnings.length > 0 ? `(${warnings.length} warning(s) — review recommended)` : ''}`)
    process.exit(0)
  } else {
    console.error(`❌  Validation failed with ${errors.length} error(s). Fix before seeding.`)
    process.exit(1)
  }
}

main()
