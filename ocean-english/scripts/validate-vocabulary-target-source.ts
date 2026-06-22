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
const REQUIRED = ['source_name', 'source_url', 'license_note', 'exam_id', 'level', 'kind'] as const
const errors: string[] = []

function metaFromFile(path: string): Record<string, unknown> | null {
  const raw = readFileSync(path, 'utf8')
  if (path.endsWith('.json')) { try { const j = JSON.parse(raw); return (j && typeof j === 'object' && j.meta && typeof j.meta === 'object') ? j.meta as Record<string, unknown> : null } catch { return null } }
  // csv/txt: leading comment block of `# key: value`
  const meta: Record<string, unknown> = {}
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*#\s*([a-z_]+)\s*:\s*(.+?)\s*$/i)
    if (m) meta[m[1]] = m[2]
    else if (line.trim() && !line.trim().startsWith('#')) break
  }
  return Object.keys(meta).length ? meta : null
}

function main() {
  if (!existsSync(DIR)) { console.error(`✗ ${DIR} missing`); process.exitCode = 1; return }
  const files = readdirSync(DIR).filter((f) => /\.(json|csv|txt)$/i.test(f) && f.toLowerCase() !== 'readme.md')
  if (!files.length) { console.log('✓ vocabulary-target-source: no list files present (Phase-2 convention only; nothing imported) — OK'); return }
  for (const f of files) {
    const path = join(DIR, f)
    const meta = metaFromFile(path)
    if (!meta) { errors.push(`${f}: missing meta/header block`); continue }
    for (const k of REQUIRED) if (meta[k] == null || String(meta[k]).trim() === '') errors.push(`${f}: missing ${k}`)
    const exam = String(meta.exam_id ?? '')
    if (exam && !(exam in EXAM_LEVEL)) errors.push(`${f}: bad exam_id "${exam}"`)
    else if (exam && meta.level != null && Number(meta.level) !== EXAM_LEVEL[exam]) errors.push(`${f}: level ${meta.level} ≠ ${EXAM_LEVEL[exam]} for ${exam}`)
    const lic = String(meta.license_note ?? '').trim()
    if (!lic) errors.push(`${f}: empty license_note (no license → must not be imported)`)
    const kind = String(meta.kind ?? '')
    if (kind && !['official', 'curated', 'internal'].includes(kind)) errors.push(`${f}: bad kind "${kind}"`)
    if ((exam === 'toefl' || exam === 'sat') && kind === 'official') errors.push(`${f}: ${exam} must be kind=curated (no claimed official complete vocabulary)`)
    if (!errors.some((e) => e.startsWith(f))) console.log(`  ✓ ${f}: ${meta.source_name} (${exam} lv${meta.level}, ${kind})`)
  }
  if (errors.length) { console.error(`\n✗ vocabulary-target-source FAILED (${errors.length}):`); for (const e of errors) console.error(`  ✗ ${e}`); process.exitCode = 1 }
  else console.log(`\n✓ vocabulary-target-source: ${files.length} list(s) validated — all carry provenance + license`)
}
main()
