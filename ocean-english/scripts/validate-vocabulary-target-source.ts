/* ════════════════════════════════════════════════════════════════════════
   validate-vocabulary-target-source.ts — R8 provenance/license gate (read-only).

   Validates every word-list source in data/vocabulary-targets/ against the README
   convention BEFORE any future backfill import: each file must declare
   source_name / source_url / license_note / exam_id / level / kind, with a real
   license_note (no license → must NOT be imported). TOEFL(6)/SAT(7) must be kind=curated
   (never claimed "official complete"). With no list files present, this passes
   (Phase-2 convention only — nothing imported).

   Exit 1 on any provenance/license violation. Never writes DB or files.
   Usage: npx tsx scripts/validate-vocabulary-target-source.ts
   ════════════════════════════════════════════════════════════════════════ */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const DIR = 'data/vocabulary-targets'
const EXAM_LEVEL: Record<string, number> = { zhongkao: 1, gaokao: 2, cet4: 3, cet6: 4, kaoyan: 5, toefl: 6, sat: 7 }
const hasOwn = (o: Record<string, unknown>, k: string) => Object.prototype.hasOwnProperty.call(o, k)
// a license_note must be a REAL statement, not a placeholder that defeats the no-license rule.
const PLACEHOLDER_LICENSE = new Set(['none', 'unknown', 'n/a', 'na', 'todo', 'tbd', 'tbc', 'null', 'undefined', '-', '--', '?', 'xxx', 'placeholder', 'pending'])
const REQUIRED = ['source_name', 'source_url', 'license_note', 'exam_id', 'level', 'kind'] as const
const errors: string[] = []

function metaFromFile(path: string): Record<string, unknown> | null {
  const raw = readFileSync(path, 'utf8')
  if (path.endsWith('.json')) { try { const j = JSON.parse(raw); return (j && typeof j === 'object' && j.meta && typeof j.meta === 'object') ? j.meta as Record<string, unknown> : null } catch { return null } }
  // csv/txt: leading comment block of `# key: value`
  const meta: Record<string, unknown> = {}
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*#\s*([a-z_]+)\s*:\s*(.+?)\s*$/i)
    if (m) meta[m[1].toLowerCase()] = m[2] // regex is case-insensitive; store lowercase so REQUIRED lookups match
    else if (line.trim() && !line.trim().startsWith('#')) break
  }
  return Object.keys(meta).length ? meta : null
}

/** Pure provenance/license check for one source's meta → list of violation strings (empty = OK). */
export function validateMeta(f: string, meta: Record<string, unknown>): string[] {
  const errs: string[] = []
  for (const k of REQUIRED) if (meta[k] == null || String(meta[k]).trim() === '') errs.push(`${f}: missing ${k}`)
  const exam = String(meta.exam_id ?? '')
  if (exam && !hasOwn(EXAM_LEVEL, exam)) errs.push(`${f}: bad exam_id "${exam}"`) // hasOwn, not `in` (avoid prototype keys like toString)
  else if (exam && meta.level != null && Number(meta.level) !== EXAM_LEVEL[exam]) errs.push(`${f}: level ${meta.level} ≠ ${EXAM_LEVEL[exam]} for ${exam}`)
  const lic = String(meta.license_note ?? '').trim()
  if (!lic) errs.push(`${f}: empty license_note (no license → must not be imported)`)
  else if (PLACEHOLDER_LICENSE.has(lic.toLowerCase())) errs.push(`${f}: placeholder license_note "${lic}" (a real license/permission statement is required to import)`)
  const kind = String(meta.kind ?? '')
  if (kind && !['official', 'curated', 'internal'].includes(kind)) errs.push(`${f}: bad kind "${kind}"`)
  // TOEFL/SAT have no published official complete word list → a present kind MUST be exactly 'curated'
  if ((exam === 'toefl' || exam === 'sat') && kind && kind !== 'curated') errs.push(`${f}: ${exam} must be kind=curated (got "${kind}"; no official/internal complete-vocabulary claim allowed)`)
  return errs
}

function selftest() {
  const fails: string[] = []
  const good = { source_name: 'X', source_url: 'https://x', license_note: 'CC-BY-4.0', exam_id: 'cet4', level: 3, kind: 'curated' }
  const cases: [string, Record<string, unknown>, boolean][] = [
    ['valid', good, true],
    ['placeholder license "none"', { ...good, license_note: 'none' }, false],
    ['placeholder license "TODO"', { ...good, license_note: 'TODO' }, false],
    ['empty license', { ...good, license_note: '' }, false],
    ['toefl must be curated (internal rejected)', { ...good, exam_id: 'toefl', level: 6, kind: 'internal' }, false],
    ['sat must be curated (official rejected)', { ...good, exam_id: 'sat', level: 7, kind: 'official' }, false],
    ['toefl curated accepted', { ...good, exam_id: 'toefl', level: 6, kind: 'curated' }, true],
    ['bad exam_id', { ...good, exam_id: 'ielts' }, false],
    ['prototype exam_id "toString" rejected', { ...good, exam_id: 'toString' }, false],
    ['level mismatch', { ...good, exam_id: 'cet4', level: 5 }, false],
  ]
  for (const [name, meta, shouldPass] of cases) {
    const got = validateMeta(name, meta).length === 0
    if (got !== shouldPass) fails.push(`selftest "${name}": expected ${shouldPass ? 'PASS' : 'FAIL'}, got ${got ? 'PASS' : 'FAIL'}`)
  }
  if (fails.length) { console.error(`✗ vocabulary-target-source SELFTEST FAILED (${fails.length}):`); for (const e of fails) console.error(`  ✗ ${e}`); process.exitCode = 1 }
  else console.log(`✓ vocabulary-target-source SELFTEST PASSED — ${cases.length} provenance/license cases (placeholder-license, curated-enforcement, prototype exam_id, level match)`)
}

function main() {
  if (process.argv.includes('--selftest')) { selftest(); return }
  if (!existsSync(DIR)) { console.error(`✗ ${DIR} missing`); process.exitCode = 1; return }
  const files = readdirSync(DIR).filter((f) => /\.(json|csv|txt)$/i.test(f) && f.toLowerCase() !== 'readme.md')
  if (!files.length) { console.log('✓ vocabulary-target-source: no list files present (Phase-2 convention only; nothing imported) — OK'); selftest(); return }
  for (const f of files) {
    const path = join(DIR, f)
    const meta = metaFromFile(path)
    if (!meta) { errors.push(`${f}: missing meta/header block`); continue }
    errors.push(...validateMeta(f, meta))
    if (!errors.some((e) => e.startsWith(f))) console.log(`  ✓ ${f}: ${meta.source_name} (${String(meta.exam_id ?? '')} lv${meta.level}, ${String(meta.kind ?? '')})`)
  }
  if (errors.length) { console.error(`\n✗ vocabulary-target-source FAILED (${errors.length}):`); for (const e of errors) console.error(`  ✗ ${e}`); process.exitCode = 1 }
  else { console.log(`\n✓ vocabulary-target-source: ${files.length} list(s) validated — all carry provenance + license`); selftest() }
}
main()
