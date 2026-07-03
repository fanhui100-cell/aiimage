/* ════════════════════════════════════════════════════════════════════════
   verify-toefl-complete-words-expansion.ts — TOEFL 2026 Expansion Window A
   stage-specific verifier (read-only) for the +60 complete_the_words draft sets.

   This verifier is intentionally STAGE-SCOPED. It does NOT touch the canonical
   verify-toefl-pilot.ts baseline. It owns only the expansion source file under
   data/generated-question-sets/toefl-2026-expansion-a/.

   Two modes:
     (default / --mode=source) source-only — runs BEFORE apply, no DB access.
     (--db / --mode=db)        DB mode     — runs AFTER apply, deterministic 1:1
                                              source↔DB payload comparison.

   Source-only checks (Plan §7.1-§7.8, §5):
     1. Load template + the 60-record source.
     2. Every record passes shapeToItems(); exactly 60 pass (no more, no fewer).
     3. Each source set has EXACTLY the 4 allowed keys (passage/targetWord/maskedForm/explain_zh).
     4. Per-domain quota via companion metadata: 8/8/8/8/7/7/7/7, 60 total, 8 domains.
        (Domain label and the 18 B1 / 24 B2 / 18 C1 split are declared COMPANION METADATA / difficulty
         INTENT only — they are NOT a machine verification of the passages' real linguistic difficulty.)
     5. Target words unique across the 60 AND disjoint from the existing pilot 10.
     6. Each target occurs as a whole word EXACTLY ONCE in the raw passage.
     7. Mask: hidden>=2, hidden ratio>=30%, never all hidden, shown letters match exactly.
     8. Derive the exact importer legacy id via FNV-1a hashId over `template|level|JSON.stringify(raw)`.

   DB-mode adds (Plan §7.9-§7.13, §10):
     9.  Each of the 60 expected sets exists: exactly one set + exactly one item.
     10. input_mode / prompt / choices / answer compared EXACTLY against shapeToItems() output.
     11. input_mode==='spell', choices empty, set+item status='draft', 0 active.
     12. Reverse check: every DB complete_the_words set is in {pilot 10} ∪ {new 60}; total draft==70.
     13. Global: gen active=0, antonym_choice=0, cet_cloze=0.
     14. Exit 1 on ANY mismatch or DB error. Missing expected DB rows in --db mode = failure.

   Usage:
     npx tsx scripts/verify-toefl-complete-words-expansion.ts            # source-only
     npx tsx scripts/verify-toefl-complete-words-expansion.ts --db       # after apply
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { shapeToItems, countWords, type ShapeTemplate, type DraftChoice } from '@/lib/exam-task-templates/shape'

const MODE: 'source' | 'db' =
  process.argv.includes('--db') || process.argv.includes('--mode=db') ? 'db' : 'source'

const TEMPLATE = 'toefl-complete-the-words'
const TPLDIR = 'data/exam-task-templates'
const SRC = 'data/generated-question-sets/toefl-2026-expansion-a/toefl-complete-the-words-60.json'
const PILOT_SRC = 'data/generated-question-sets/toefl-2026-pilot/toefl-complete-the-words.json'

// ── Companion metadata (Plan §7.4): the source JSON carries only the 4 content keys,
//    so the domain label + difficulty INTENT live here, keyed by source index. The 60 sets are written
//    grouped by domain (5 each) and, within a domain, ordered B1→B2→C1, so both maps
//    are fully deterministic. ──────────────────────────────────────────────────────
const DOMAIN_ORDER = [
  'biology and ecology',
  'earth and environmental science',
  'physics and technology',
  'medicine and health',
  'history and archaeology',
  'economics and social science',
  'psychology and education',
  'arts and humanities',
]
// Target 60 (Window A, scaled from 40 at user request 2026-06-22): first four domains 8 sets,
// last four 7 sets. Within each domain the file is ordered B1->B2->C1, matching these arrays.
const DOMAIN_DIFF: Record<string, string[]> = {
  'biology and ecology': ['B1', 'B1', 'B1', 'B2', 'B2', 'B2', 'C1', 'C1'],
  'earth and environmental science': ['B1', 'B1', 'B1', 'B2', 'B2', 'B2', 'C1', 'C1'],
  'physics and technology': ['B1', 'B1', 'B1', 'B2', 'B2', 'B2', 'C1', 'C1'],
  'medicine and health': ['B1', 'B1', 'B1', 'B2', 'B2', 'B2', 'C1', 'C1'],
  'history and archaeology': ['B1', 'B1', 'B2', 'B2', 'B2', 'C1', 'C1'],
  'economics and social science': ['B1', 'B1', 'B2', 'B2', 'B2', 'C1', 'C1'],
  'psychology and education': ['B1', 'B2', 'B2', 'B2', 'C1', 'C1', 'C1'],
  'arts and humanities': ['B1', 'B2', 'B2', 'B2', 'C1', 'C1', 'C1'],
}
const DOMAIN_BY_INDEX: string[] = []
const DIFFICULTY_BY_INDEX: string[] = []
for (const d of DOMAIN_ORDER) for (const diff of DOMAIN_DIFF[d]) { DOMAIN_BY_INDEX.push(d); DIFFICULTY_BY_INDEX.push(diff) }
const EXPECTED_TOTAL = DOMAIN_BY_INDEX.length // 60

// ── deterministic hashId — byte-for-byte identical to import-authored-question-sets-v2.ts ──
function hashId(s: string): string { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0).toString(36) }
const normChoices = (cs: DraftChoice[]) => JSON.stringify(cs.map((c) => [String(c.id), String(c.text)]))

function escRe(w: string): string { return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
function wholeWordCount(passage: string, word: string): number {
  const re = new RegExp(`(?<![A-Za-z'’-])${escRe(word)}(?![A-Za-z'’-])`, 'gi')
  return (passage.match(re) || []).length
}

interface AuthoredFile { template: string; level?: number; sets: Record<string, unknown>[] }
interface Template { taskType: string; skill: string; itemCount: number; optionCount: number; answerSchema: Record<string, unknown>; stimulusRequirements?: Record<string, unknown> }

const errors: string[] = []
const fail = (m: string) => errors.push(m)

function loadTemplate(): Template {
  const path = `${TPLDIR}/${TEMPLATE}.json`
  if (!existsSync(path)) throw new Error(`template not found: ${path}`)
  return JSON.parse(readFileSync(path, 'utf8')) as Template
}
function toShapeTemplate(t: Template): ShapeTemplate {
  return { taskType: t.taskType, skill: t.skill, itemCount: t.itemCount, optionCount: t.optionCount, answerSchema: t.answerSchema, stimulusRequirements: t.stimulusRequirements }
}

// Derive the deterministic set legacy_id for one source record (any complete_the_words file).
function setLegacyId(template: string, level: number, raw: Record<string, unknown>): string {
  const tag = hashId(`${template}|${level}|${JSON.stringify(raw)}`)
  return `gen:${template}:set:claude:${tag}`
}

interface SourceCheck {
  af: AuthoredFile
  st: ShapeTemplate
  level: number
  expected: { index: number; raw: Record<string, unknown>; legacyId: string; tag: string; targetWord: string; maskedForm: string; shaped: ReturnType<typeof shapeToItems> }[]
  wordCounts: number[]
  hiddenRatios: number[]
}

function runSourceChecks(): SourceCheck | null {
  if (!existsSync(SRC)) { fail(`source file missing: ${SRC}`); return null }
  const t = loadTemplate()
  const st = toShapeTemplate(t)
  const af = JSON.parse(readFileSync(SRC, 'utf8')) as AuthoredFile
  if (af.template !== TEMPLATE) fail(`source template=${af.template} (must ${TEMPLATE})`)
  const level = af.level ?? 6
  if (af.level == null) fail('source missing level')

  if (!Array.isArray(af.sets)) { fail('source.sets not an array'); return null }
  if (af.sets.length !== EXPECTED_TOTAL) fail(`source set count=${af.sets.length} (must ${EXPECTED_TOTAL})`)

  // Companion-metadata integrity (declared domain label + difficulty INTENT, NOT machine-verified text
  // difficulty): per-domain quota 8/8/8/8/7/7/7/7, totals 60, difficulty intent 18 B1 / 24 B2 / 18 C1.
  const domCount: Record<string, number> = {}
  for (const d of DOMAIN_ORDER) domCount[d] = 0
  for (const d of DOMAIN_BY_INDEX) domCount[d] = (domCount[d] ?? 0) + 1
  for (const d of DOMAIN_ORDER) { const want = DOMAIN_DIFF[d].length; if (domCount[d] !== want) fail(`domain "${d}" companion count=${domCount[d]} (must ${want})`) }
  if (Object.keys(domCount).length !== DOMAIN_ORDER.length) fail('unexpected domain key in companion map')
  const diffCount: Record<string, number> = {}
  for (const d of DIFFICULTY_BY_INDEX) diffCount[d] = (diffCount[d] ?? 0) + 1
  if (diffCount.B1 !== 18 || diffCount.B2 !== 24 || diffCount.C1 !== 18) fail(`difficulty distribution ${JSON.stringify(diffCount)} (must B1:18,B2:24,C1:18)`)

  // Pilot exclusion set (derived from the pilot source itself).
  const pilotTargets = new Set<string>()
  if (existsSync(PILOT_SRC)) {
    const paf = JSON.parse(readFileSync(PILOT_SRC, 'utf8')) as AuthoredFile
    for (const r of paf.sets) pilotTargets.add(String((r as { targetWord?: unknown }).targetWord ?? '').trim().toLowerCase())
  } else fail(`pilot source missing: ${PILOT_SRC}`)

  const seen = new Set<string>()
  const expected: SourceCheck['expected'] = []
  const wordCounts: number[] = []
  const hiddenRatios: number[] = []
  const ALLOWED_KEYS = ['explain_zh', 'maskedForm', 'passage', 'targetWord']

  af.sets.forEach((raw, i) => {
    const tag = `#${i}`
    // §4: exactly the 4 allowed keys.
    const keys = Object.keys(raw).sort()
    if (keys.length !== 4 || keys.join(',') !== ALLOWED_KEYS.join(',')) fail(`${tag} keys=[${keys.join(',')}] (must exactly ${ALLOWED_KEYS.join(',')})`)

    const passage = String(raw.passage ?? '')
    const targetWord = String(raw.targetWord ?? '').trim()
    const maskedForm = String(raw.maskedForm ?? '').trim()
    const explainZh = String(raw.explain_zh ?? '')

    // §7.2: shape must pass.
    const shaped = shapeToItems(st, raw)
    if (!shaped.ok) fail(`${tag} shapeToItems reject=${shaped.reject} (target=${targetWord})`)

    // §5.4: ordinary lowercase lexical word, length>=6, no proper-noun/acronym/number/hyphen.
    if (!/^[a-z][a-z']*$/.test(targetWord)) fail(`${tag} targetWord "${targetWord}" not a plain lowercase word`)
    if (targetWord.length < 6) fail(`${tag} targetWord "${targetWord}" too short (<6)`)

    // §7.6: exactly one whole-word occurrence in the raw passage.
    const occ = wholeWordCount(passage, targetWord)
    if (occ !== 1) fail(`${tag} targetWord "${targetWord}" occurs ${occ}× in passage (must 1)`)

    // §7.7: mask hidden-letter ratio + minimum hidden count (shapeToItems already enforces shown-letter match & length).
    if (maskedForm.length !== targetWord.length) fail(`${tag} mask length ${maskedForm.length}≠${targetWord.length}`)
    let hidden = 0
    for (let k = 0; k < maskedForm.length; k++) {
      const c = maskedForm[k]
      if (c === '_') hidden++
      else if (c !== targetWord[k]) fail(`${tag} shown letter mismatch at ${k}`)
    }
    if (hidden < 2) fail(`${tag} hidden letters ${hidden} (<2)`)
    if (maskedForm.length && hidden / maskedForm.length < 0.3) fail(`${tag} hidden ratio ${(hidden / maskedForm.length).toFixed(2)} (<0.30)`)
    if (maskedForm.length && hidden >= maskedForm.length) fail(`${tag} all letters hidden`)
    hiddenRatios.push(maskedForm.length ? hidden / maskedForm.length : 0)

    // §5.15: mapped prompt must not leak the unmasked answer.
    if (shaped.ok) {
      const promptWord = wholeWordCount(shaped.result.items[0].prompt, targetWord)
      if (promptWord !== 0) fail(`${tag} mapped prompt still contains unmasked "${targetWord}" (${promptWord}×)`)
    }

    // §5.14: explain_zh must reference context + visible letters (heuristic: Chinese + contains target).
    if (!/[一-鿿]/.test(explainZh) || explainZh.length < 12) fail(`${tag} explain_zh too weak`)
    if (!explainZh.toLowerCase().includes(targetWord.toLowerCase())) fail(`${tag} explain_zh does not mention target "${targetWord}"`)

    // §7.5: uniqueness across the 60 + disjoint from pilot 10.
    const tw = targetWord.toLowerCase()
    if (seen.has(tw)) fail(`${tag} duplicate targetWord "${targetWord}" within the 60`)
    seen.add(tw)
    if (pilotTargets.has(tw)) fail(`${tag} targetWord "${targetWord}" overlaps the pilot 10`)

    wordCounts.push(countWords(passage))
    expected.push({ index: i, raw, legacyId: setLegacyId(af.template, level, raw), tag: hashId(`${af.template}|${level}|${JSON.stringify(raw)}`), targetWord, maskedForm, shaped })
  })

  // §7.3: exactly EXPECTED_TOTAL records pass shape.
  const passed = expected.filter((e) => e.shaped.ok).length
  if (passed !== EXPECTED_TOTAL) fail(`shape-passing records=${passed} (must ${EXPECTED_TOTAL})`)

  // Legacy id uniqueness (collision guard).
  const legacySet = new Set(expected.map((e) => e.legacyId))
  if (legacySet.size !== expected.length) fail('derived legacy ids are not unique (hash collision)')

  return { af, st, level, expected, wordCounts, hiddenRatios }
}

function reportSourceStats(sc: SourceCheck) {
  const wc = sc.wordCounts
  const min = Math.min(...wc), max = Math.max(...wc), avg = wc.reduce((a, b) => a + b, 0) / wc.length
  const hr = sc.hiddenRatios
  const hrMin = Math.min(...hr), hrMax = Math.max(...hr), hrAvg = hr.reduce((a, b) => a + b, 0) / hr.length
  console.log(`  source: ${sc.expected.length} records · all shape-pass`)
  console.log(`  passage words  min/avg/max = ${min}/${avg.toFixed(1)}/${max}`)
  console.log(`  hidden ratio   min/avg/max = ${hrMin.toFixed(2)}/${hrAvg.toFixed(2)}/${hrMax.toFixed(2)}`)
  console.log(`  sample legacy ids: ${sc.expected.slice(0, 5).map((e) => e.legacyId).join('  ')}`)
}

async function runDbChecks(sc: SourceCheck) {
  const env = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : ''
  const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
  const url = readEnv('NEXT_PUBLIC_SUPABASE_URL'), key = readEnv('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) { fail('DB mode: missing Supabase credentials'); return }
  const db: SupabaseClient = createClient(url, key)

  // Fetch all gen:% sets for global + reverse checks.
  type SetRow = { id: string; legacy_id: string | null; task_type: string; status: string; qa_flags: Record<string, unknown> | null }
  const sets: SetRow[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('question_sets').select('id, legacy_id, task_type, status, qa_flags').like('legacy_id', 'gen:%').range(from, from + 999)
    if (error) { fail(`DB select question_sets: ${error.message}`); return }
    const rows = (data ?? []) as SetRow[]
    sets.push(...rows)
    if (rows.length < 1000) break
  }
  const byLegacy = new Map<string, SetRow>()
  for (const s of sets) if (s.legacy_id) byLegacy.set(s.legacy_id, s)
  console.log(`  gen sets total: ${sets.length}`)

  type ItemRow = { question_set_id: string; input_mode: string; prompt: string | null; choices: unknown; answer: unknown; status: string }
  const itemsOf = async (setId: string): Promise<ItemRow[]> => {
    const { data, error } = await db.from('question_items').select('question_set_id, input_mode, prompt, choices, answer, status').eq('question_set_id', setId)
    if (error) { fail(`DB select question_items (${setId}): ${error.message}`); return [] }
    return (data ?? []) as ItemRow[]
  }

  // §7.9-§7.11: each of the 60 expected sets exists once, one draft item, exact payload.
  let okCmp = 0
  for (const e of sc.expected) {
    if (!e.shaped.ok) continue
    const dbSet = byLegacy.get(e.legacyId)
    if (!dbSet) { fail(`#${e.index} expected set missing in DB (legacy ${e.legacyId})`); continue }
    if (dbSet.task_type !== 'complete_the_words') fail(`#${e.index} ${e.legacyId} task_type=${dbSet.task_type}`)
    if (dbSet.status !== 'draft' && dbSet.status !== 'active') fail(`#${e.index} ${e.legacyId} set status=${dbSet.status} (must draft or active)`)
    const items = await itemsOf(dbSet.id)
    if (items.length !== 1) { fail(`#${e.index} ${e.legacyId} item count=${items.length} (must 1)`); continue }
    const it = items[0]
    const exp = e.shaped.result.items[0]
    if (it.input_mode !== 'spell' || it.input_mode !== exp.inputMode) fail(`#${e.index} ${e.legacyId} input_mode=${it.input_mode} (must spell)`)
    if (it.status !== 'draft' && it.status !== 'active') fail(`#${e.index} ${e.legacyId} item status=${it.status} (must draft or active)`)
    if ((it.prompt ?? '') !== exp.prompt) fail(`#${e.index} ${e.legacyId} prompt mismatch vs shapeToItems`)
    const dbCh = Array.isArray(it.choices) ? (it.choices as DraftChoice[]) : []
    if (dbCh.length !== 0) fail(`#${e.index} ${e.legacyId} choices not empty (${dbCh.length})`)
    if (normChoices(dbCh) !== normChoices(exp.choices)) fail(`#${e.index} ${e.legacyId} choices mismatch`)
    if (JSON.stringify(it.answer) !== JSON.stringify(exp.answer)) fail(`#${e.index} ${e.legacyId} answer mismatch (db=${JSON.stringify(it.answer)} exp=${JSON.stringify(exp.answer)})`)
    okCmp++
  }
  console.log(`  source↔DB exact payload match: ${okCmp}/${sc.expected.length}`)

  // §7.12 reverse check: every DB complete_the_words set ∈ {pilot 10} ∪ {new 60}; total draft == 70.
  const pilotLegacy = new Set<string>()
  if (existsSync(PILOT_SRC)) {
    const paf = JSON.parse(readFileSync(PILOT_SRC, 'utf8')) as AuthoredFile
    const plevel = paf.level ?? 6
    for (const r of paf.sets) pilotLegacy.add(setLegacyId(paf.template, plevel, r))
  }
  // F2B (2026-07-03) added a THIRD complete_the_words batch (+30) via stage toefl-text-topup-2026-07-03,
  // owned by verify-toefl-text-topup.ts. Those sets are legitimate; allow them in the reverse check and
  // count them toward the pool total (pilot 10 + window-A 60 + F2B 30 = 100).
  const F2B_STAGE = 'toefl-text-topup-2026-07-03'
  const isF2B = (s: SetRow) => (s.qa_flags as { stage?: string } | null)?.stage === F2B_STAGE
  const newLegacy = new Set(sc.expected.map((e) => e.legacyId))
  const cwSets = sets.filter((s) => s.task_type === 'complete_the_words')
  const cwDraft = cwSets.filter((s) => s.status === 'draft').length
  const cwActive = cwSets.filter((s) => s.status === 'active').length
  const f2bCw = cwSets.filter(isF2B).length
  for (const s of cwSets) {
    if (isF2B(s)) continue // owned + verified by verify-toefl-text-topup.ts
    if (s.legacy_id && !newLegacy.has(s.legacy_id) && !pilotLegacy.has(s.legacy_id)) fail(`reverse: unexpected complete_the_words set ${s.legacy_id}`)
  }
  const newPresent = [...newLegacy].filter((l) => byLegacy.has(l)).length
  if (newPresent !== EXPECTED_TOTAL) fail(`reverse: ${newPresent}/${EXPECTED_TOTAL} new sets present in DB`)
  // Post-F2B（owner-approved 扩容+晋级）：complete_the_words 池 = pilot 10 + window-A 60 + F2B 30 = 100，全 active。
  if (cwDraft + cwActive !== 100) fail(`complete_the_words draft+active total=${cwDraft + cwActive} (must 100)`)
  console.log(`  complete_the_words: draft=${cwDraft} active=${cwActive} (pilot 10 + window-A ${newPresent} + F2B ${f2bCw}；owner-approved active)`)

  // §7.13 global invariants. Blocked/deprecated denylist — 2026-07-04: read_daily_life + choose_a_response
  // removed (both now legitimately active: reading promoted F2, listening pilot active since 2026-07-02).
  const BLOCKED_ACTIVE = new Set(['build_a_sentence', 'listen_and_repeat', 'interview_speaking', 'antonym_choice', 'cet_cloze'])
  const genActive = sets.filter((s) => s.status === 'active').length
  const blockedActive = sets.filter((s) => s.status === 'active' && BLOCKED_ACTIVE.has(s.task_type)).length
  const deprecated = sets.filter((s) => s.task_type === 'antonym_choice' || s.task_type === 'cet_cloze').length
  console.log(`  global: gen active=${genActive}（阻塞/退役 active=${blockedActive}） · antonym/cet_cloze=${deprecated}`)
  if (blockedActive !== 0) fail(`blocked/deprecated gen active=${blockedActive} (must 0)`)
  if (deprecated !== 0) fail(`gen antonym/cet_cloze=${deprecated} (must 0)`)
}

async function main() {
  console.log(`verify-toefl-complete-words-expansion — mode=${MODE}`)
  const sc = runSourceChecks()
  if (sc) reportSourceStats(sc)

  if (MODE === 'db') {
    if (!sc) { fail('DB mode aborted: source checks could not run'); }
    else await runDbChecks(sc)
  } else {
    console.log('  [source-only mode] not_applied — DB comparison skipped (run with --db after apply).')
  }

  if (errors.length) {
    console.error(`\n✗ verification FAILED (${errors.length}):`)
    for (const e of errors) console.error(`  ✗ ${e}`)
    process.exitCode = 1
  } else {
    console.log(`\n✓ verification PASSED (mode=${MODE})`)
  }
}
main().catch((e) => { console.error('verify-toefl-complete-words-expansion fatal', e?.message ?? e); process.exitCode = 1 })
