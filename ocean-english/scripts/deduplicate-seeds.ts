/**
 * LexiOcean Phase 8C — Cross-Source Deduplication Report
 *
 * Checks for duplicate word IDs across ALL dictionary sources:
 *   - data/dictionary/core-words-seed.ts          (SeedWordEntry, id field)
 *   - data/dictionary/import/core-words-expanded.ts
 *   - data/dictionary/import/core-words-150-batch-1.ts
 *   - data/dictionary/import/core-words-500-batch-2.ts
 *
 * Writes: reports/duplicate-words.md
 *
 * Note: validate-dictionary-import.ts already checks for duplicates within
 * the three import batches. This script adds cross-source checks (import ↔ core-seed).
 *
 * Run: npx tsx scripts/deduplicate-seeds.ts
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { CORE_WORDS_SEED } from '../data/dictionary/core-words-seed'
import { EXPANDED_WORDS_SEED } from '../data/dictionary/import/core-words-expanded'
import { CORE_WORDS_150_BATCH_1 } from '../data/dictionary/import/core-words-150-batch-1'
import { CORE_WORDS_500_BATCH_2 } from '../data/dictionary/import/core-words-500-batch-2'

const REPORTS_DIR = path.resolve(__dirname, '../reports')
const NOW = new Date().toISOString()

interface SourceWord {
  id: string
  word: string
  source: string
}

const allSourceWords: SourceWord[] = [
  ...CORE_WORDS_SEED.map(w => ({ id: w.id, word: w.word, source: 'core-seed (core-words-seed.ts)' })),
  ...EXPANDED_WORDS_SEED.map(w => ({ id: w.normalizedWord, word: w.word, source: 'expanded (core-words-expanded.ts)' })),
  ...CORE_WORDS_150_BATCH_1.map(w => ({ id: w.normalizedWord, word: w.word, source: 'batch-1 (core-words-150-batch-1.ts)' })),
  ...CORE_WORDS_500_BATCH_2.map(w => ({ id: w.normalizedWord, word: w.word, source: 'batch-2 (core-words-500-batch-2.ts)' })),
]

// Group by id
const byId = new Map<string, SourceWord[]>()
for (const sw of allSourceWords) {
  const existing = byId.get(sw.id) ?? []
  existing.push(sw)
  byId.set(sw.id, existing)
}

// Find duplicates (id appears in >1 entry)
interface DuplicateEntry {
  id: string
  word: string
  count: number
  sources: string[]
}

const duplicates: DuplicateEntry[] = []
const withinImportDuplicates: DuplicateEntry[] = []

for (const [id, entries] of byId.entries()) {
  if (entries.length <= 1) continue

  const dup: DuplicateEntry = { id, word: entries[0].word, count: entries.length, sources: entries.map(e => e.source) }
  duplicates.push(dup)

  // Flag if the duplication is within import batches only (already caught by validate-dictionary-import.ts)
  const isWithinImportOnly = entries.every(e => !e.source.includes('core-seed'))
  if (isWithinImportOnly) withinImportDuplicates.push(dup)
}

const crossSourceDuplicates = duplicates.filter(d => !withinImportDuplicates.includes(d))

// ── Unique ID counts ─────────────────────────────────────────────────────────

const uniqueIds = new Set(allSourceWords.map(w => w.id)).size
const perSourceCounts = {
  'core-seed':  CORE_WORDS_SEED.length,
  'expanded':   EXPANDED_WORDS_SEED.length,
  'batch-1':    CORE_WORDS_150_BATCH_1.length,
  'batch-2':    CORE_WORDS_500_BATCH_2.length,
}
const totalAcrossSources = Object.values(perSourceCounts).reduce((s, n) => s + n, 0)

// ── Build report ─────────────────────────────────────────────────────────────

function buildMd(): string {
  const lines: string[] = [
    '# LexiOcean Duplicate Words Report',
    `> Generated: ${NOW}`,
    '',
    '## Summary',
    '',
    `| Metric | Value |`,
    `| --- | --- |`,
    `| core-words-seed.ts entries | ${perSourceCounts['core-seed']} |`,
    `| core-words-expanded.ts entries | ${perSourceCounts['expanded']} |`,
    `| core-words-150-batch-1.ts entries | ${perSourceCounts['batch-1']} |`,
    `| core-words-500-batch-2.ts entries | ${perSourceCounts['batch-2']} |`,
    `| Total across all sources | ${totalAcrossSources} |`,
    `| Unique IDs | ${uniqueIds} |`,
    `| Total duplicates (any source) | ${duplicates.length} |`,
    `| Cross-source duplicates (core-seed ↔ import) | ${crossSourceDuplicates.length} |`,
    `| Within-import duplicates only | ${withinImportDuplicates.length} |`,
    '',
  ]

  if (crossSourceDuplicates.length === 0) {
    lines.push('## Cross-Source Duplicates', '', 'No cross-source duplicates found. ✓', '')
  } else {
    lines.push('## Cross-Source Duplicates', '')
    lines.push('These IDs appear in both core-words-seed.ts AND one or more import batches.', '')
    lines.push('The CompositeDictionaryClient will serve the FIRST match (ExpandedSeedAdapter', 'before CoreSeedAdapter), so the import version wins.', '')
    for (const d of crossSourceDuplicates) {
      lines.push(`### \`${d.id}\` (${d.word})`)
      lines.push('Sources:')
      for (const s of d.sources) lines.push(`  - ${s}`)
      lines.push('')
    }
  }

  if (withinImportDuplicates.length === 0) {
    lines.push('## Within-Import Duplicates', '', 'No within-import duplicates found. ✓', '')
  } else {
    lines.push('## Within-Import Duplicates', '')
    lines.push('> These are also caught by `npm run validate:dictionary`.', '')
    for (const d of withinImportDuplicates) {
      lines.push(`- \`${d.id}\` appears ${d.count}× — ${d.sources.join(', ')}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

// ── Write report ─────────────────────────────────────────────────────────────

fs.mkdirSync(REPORTS_DIR, { recursive: true })
fs.writeFileSync(path.join(REPORTS_DIR, 'duplicate-words.md'), buildMd(), 'utf8')

// ── Console output ────────────────────────────────────────────────────────────

console.log('\n==== LexiOcean Deduplication Check ====')
for (const [label, count] of Object.entries(perSourceCounts)) {
  console.log(`  ${label}: ${count} words`)
}
console.log(`  Total across sources: ${totalAcrossSources}`)
console.log(`  Unique IDs:           ${uniqueIds}`)
console.log(`  Duplicates total:     ${duplicates.length}`)
console.log(`  Cross-source dups:    ${crossSourceDuplicates.length}`)
console.log(`  Within-import dups:   ${withinImportDuplicates.length}`)

if (crossSourceDuplicates.length > 0) {
  console.log('\n  Cross-source duplicates (import version wins at runtime):')
  for (const d of crossSourceDuplicates) {
    console.log(`    ${d.id} — ${d.sources.join(' + ')}`)
  }
}

console.log(`\nReport written: ${path.join(REPORTS_DIR, 'duplicate-words.md')}`)

// Exit with code 1 only if there are within-import duplicates (those are schema errors)
if (withinImportDuplicates.length > 0) {
  console.error(`\nERROR: ${withinImportDuplicates.length} within-import duplicate(s) found. Run npm run validate:dictionary for details.`)
  process.exit(1)
}
