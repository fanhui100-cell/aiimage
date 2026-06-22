/* ════════════════════════════════════════════════════════════════════════
   validate-coverage-audit.ts — R1 validator for the canonical coverage matrix.

   Tests the PURE state logic (classifyCell / buildExpectedRows) with synthetic
   fixtures (no DB), then cross-checks the generated report shape if present.

   Required fixtures (Plan R1 Steps):
     1. a canonical cell with zero DB rows appears as MISSING;
     2. SAT reading is counted per official domain (4 rows), not one combined pool;
     3. a listening pool with draft content but no active audio is BLOCKED, not READY_ACTIVE.
   Plus structure: every EXAM_SPECS task = exactly one matrix row (SAT reading split per domain);
   stopped TOEFL tasks visible as BLOCKED; required fields present; R0 expansions visible.

   Exit 1 on any failure. Usage: npx tsx scripts/validate-coverage-audit.ts
   ════════════════════════════════════════════════════════════════════════ */
import { readFileSync, existsSync } from 'node:fs'
import { EXAM_SPECS } from '@/lib/exam-specs'
import { classifyCell, buildExpectedRows, emptyCounts, READY_THRESHOLD, type CellLookup } from './audit-question-bank-v2-coverage'

const failures: string[] = []
const expect = (cond: boolean, msg: string) => { if (!cond) failures.push(msg) }

// ── Fixture 1: zero-row canonical cell → MISSING ──
{
  const r = classifyCell({ exam: 'cet4', taskType: 'reading_comprehension', requiresAudio: false, requiresRubric: false }, emptyCounts())
  expect(r.state === 'MISSING', `fixture1: zero-row cell state=${r.state} (expect MISSING)`)
}

// ── Fixture 2: SAT reading counted per official domain, not one combined pool ──
{
  const target = 'Craft and Structure'
  const getCell: CellLookup = (exam, _level, taskType, domain) => {
    const c = emptyCounts()
    if (exam === 'sat' && taskType === 'reading_comprehension' && domain === target) c.draft = READY_THRESHOLD
    return c
  }
  const rows = buildExpectedRows(getCell)
  const satReading = rows.filter((r) => r.exam === 'sat' && r.taskType === 'reading_comprehension')
  expect(satReading.length === 4, `fixture2: SAT reading rows=${satReading.length} (expect 4 per-domain)`)
  expect(new Set(satReading.map((r) => r.domain)).size === 4, `fixture2: distinct SAT domains=${new Set(satReading.map((r) => r.domain)).size} (expect 4)`)
  const hit = satReading.find((r) => r.domain === target)
  const others = satReading.filter((r) => r.domain !== target)
  expect(hit?.state === 'READY_DRAFT', `fixture2: target domain state=${hit?.state} (expect READY_DRAFT at ${READY_THRESHOLD})`)
  expect(others.every((r) => r.state === 'MISSING'), `fixture2: non-target SAT domains must be MISSING (proves per-domain, not combined): ${others.map((r) => r.state).join(',')}`)
}

// ── Fixture 3: listening draft + no active audio → BLOCKED, not READY_ACTIVE ──
{
  const c = emptyCounts(); c.draft = 60; c.items = 180; c.activeAudio = 0
  const r = classifyCell({ exam: 'cet4', taskType: 'listening_comprehension', requiresAudio: true, requiresRubric: false }, c)
  expect(r.state === 'BLOCKED', `fixture3: listening draft+no-audio state=${r.state} (expect BLOCKED)`)
  expect(r.state !== 'READY_ACTIVE', 'fixture3: must NOT be READY_ACTIVE')
  expect(r.blockingReasons.includes('audio_missing'), `fixture3: expected audio_missing reason, got [${r.blockingReasons.join(',')}]`)
}

// ── Structure: one row per EXAM_SPECS task (SAT reading split per domain) ──
{
  const rows = buildExpectedRows(() => emptyCounts())
  let expectedCount = 0
  for (const spec of EXAM_SPECS) for (const sec of spec.sections) expectedCount += sec.taskTypes.length
  expect(rows.length === expectedCount, `structure: matrix rows=${rows.length} (expect ${expectedCount} = sum of EXAM_SPECS section taskTypes)`)

  const rdl = rows.find((r) => r.exam === 'toefl' && r.taskType === 'read_daily_life')
  expect(!!rdl, 'structure: toefl read_daily_life row present (not omitted)')
  expect(rdl?.state === 'BLOCKED', `structure: toefl read_daily_life state=${rdl?.state} (expect BLOCKED)`)
  const trc = rows.find((r) => r.exam === 'toefl' && r.taskType === 'reading_comprehension')
  expect(trc?.state === 'BLOCKED', `structure: toefl reading_comprehension (academic) state=${trc?.state} (expect BLOCKED)`)
  const bas = rows.find((r) => r.exam === 'toefl' && r.taskType === 'build_a_sentence')
  expect(bas?.state === 'BLOCKED' && bas.blockingReasons.includes('scoring_not_ready'), `structure: toefl build_a_sentence state=${bas?.state} reasons=[${bas?.blockingReasons.join(',')}] (expect BLOCKED/scoring_not_ready)`)
  // a non-blocked, non-audio exam reading_comprehension at another level must be MISSING with empty counts
  const cet4rc = rows.find((r) => r.exam === 'cet4' && r.taskType === 'reading_comprehension')
  expect(cet4rc?.state === 'MISSING', `structure: cet4 reading_comprehension (empty) state=${cet4rc?.state} (expect MISSING)`)
}

// ── Report cross-check (if generated): field shape + R0 expansions visible ──
{
  const path = 'reports/qbank-v2-coverage-audit.json'
  if (existsSync(path)) {
    const rep = JSON.parse(readFileSync(path, 'utf8')) as { expectedMatrix?: { rows?: Record<string, unknown>[] } }
    const mrows = rep.expectedMatrix?.rows
    expect(Array.isArray(mrows), 'report: expectedMatrix.rows is an array')
    if (Array.isArray(mrows)) {
      const required = ['exam', 'level', 'section', 'taskType', 'domain', 'requiredInputMode', 'requiresAudio', 'requiresRubric', 'draft', 'reviewed', 'active', 'rejected', 'retired', 'items', 'stimuli', 'activeAudio', 'rubricItems', 'sourceStages', 'state', 'blockingReasons']
      const offender = mrows.find((r) => required.some((f) => !(f in r)))
      expect(!offender, `report: every matrix row has required fields (offender: ${offender ? JSON.stringify(offender).slice(0, 120) : 'none'})`)
      const cw = mrows.find((r) => r.exam === 'toefl' && r.taskType === 'complete_the_words')
      expect(!!cw && (cw.draft as number) >= 70, `report: toefl complete_the_words draft=${cw?.draft} (expect >=70 from R0)`)
      const em = mrows.find((r) => r.exam === 'toefl' && r.taskType === 'email_writing')
      const ad = mrows.find((r) => r.exam === 'toefl' && r.taskType === 'academic_discussion')
      expect(!!em && (em.draft as number) >= 60, `report: toefl email_writing draft=${em?.draft} (expect >=60 from R0)`)
      expect(!!ad && (ad.draft as number) >= 60, `report: toefl academic_discussion draft=${ad?.draft} (expect >=60 from R0)`)
    }
  } else {
    console.log('  (report not yet generated — run `npm run audit:qbank-v2-coverage` first for the report cross-check)')
  }
}

if (failures.length) {
  console.error(`✗ validate-coverage-audit FAILED (${failures.length}):`)
  for (const f of failures) console.error(`  ✗ ${f}`)
  process.exit(1)
}
console.log('✓ validate-coverage-audit PASSED — fixtures (MISSING / SAT-per-domain / listening-no-audio→BLOCKED) + structure + report cross-check')
