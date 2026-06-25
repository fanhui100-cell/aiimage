/* ════════════════════════════════════════════════════════════════════════
   audit-question-bank-v2-coverage.ts — v2 题库覆盖审计（R1 重写，只读）

   两条线：
   A) EXPECTED canonical matrix（从 EXAM_SPECS 推导）：每个 exam/section/taskType 恰一行
      （SAT reading 按 4 个官方 domain 拆分），带完整字段 + 确定性 state：
        MISSING / THIN / READY_DRAFT / READY_ACTIVE / BLOCKED + blockingReasons[]。
      阈值：客观/生产性/ SAT-per-domain 均在 50 套达到 READY_DRAFT。
      官方格式未确认的 TOEFL 题型（read_daily_life、学术阅读用的 reading_comprehension）显式为 BLOCKED，
      build_a_sentence 因 scoring_not_ready 为 BLOCKED；含音频题型在无 active 音频时不得 READY_ACTIVE。
   B) ACTUAL grid（level × task_type）：含全部题型（含单词宇宙迁移题，单独呈现、不混入考试段就绪度）。

   纯逻辑（classifyCell / buildExpectedRows / 常量）无副作用导出，供 validate-coverage-audit.ts 复用；
   DB/env 读取在 main() 内，import 本模块不触发任何 DB 访问。绝不写库。
   用法：npm run audit:qbank-v2-coverage
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { EXAM_SPECS } from '@/lib/exam-specs'

const OUT_JSON = 'reports/qbank-v2-coverage-audit.json'
const OUT_MD = 'reports/qbank-v2-coverage-audit.md'

// ── thresholds & classification inputs (R1) ───────────────────────────────
export const READY_THRESHOLD = 50 // objective + productive + SAT-per-domain reach READY_DRAFT at 50 valid sets/prompts
const MIN_ACTIVE_POOL = 5

export const PRODUCTIVE = new Set(['applied_writing', 'continuation_writing', 'essay_writing', 'translation_zh_en', 'translation_en_zh', 'build_a_sentence', 'email_writing', 'academic_discussion', 'listen_and_repeat', 'interview_speaking'])
export const LISTENING = new Set(['listening_comprehension', 'listen_and_repeat', 'choose_a_response'])
export const SPEAKING = new Set(['listen_and_repeat', 'interview_speaking'])

// required input mode per canonical task type (informational matrix field; values match runtime input_mode)
export const INPUT_MODE_BY_TASK: Record<string, string> = {
  complete_the_words: 'spell', read_daily_life: 'choice', reading_comprehension: 'choice',
  choose_a_response: 'choice', listening_comprehension: 'choice',
  build_a_sentence: 'multi_blank', email_writing: 'free_text', academic_discussion: 'free_text',
  applied_writing: 'free_text', essay_writing: 'free_text', continuation_writing: 'free_text',
  translation_zh_en: 'free_text', translation_en_zh: 'free_text',
  listen_and_repeat: 'speak', interview_speaking: 'speak',
}

// canonical cells blocked pending authoritative official-format confirmation (R4 resolves), keyed `${exam}|${taskType}`.
// TOEFL read_daily_life + the TOEFL academic-reading variant (which uses reading_comprehension) are stopped.
export const SPEC_BLOCKED = new Map<string, string>([
  ['toefl|read_daily_life', 'official_spec_unverified'],
  ['toefl|reading_comprehension', 'official_spec_unverified'],
])
// types not yet deterministically scorable → cannot become active (R3 resolves).
export const SCORING_NOT_READY = new Set(['build_a_sentence'])

export type CoverageState = 'MISSING' | 'THIN' | 'READY_DRAFT' | 'READY_ACTIVE' | 'BLOCKED'
export interface CellCounts {
  draft: number; reviewed: number; active: number; rejected: number; retired: number
  items: number; stimuli: number; activeAudio: number; rubricItems: number; targetWords: number; sourceStages: number
}
export interface CellContext { exam: string; taskType: string; requiresAudio: boolean; requiresRubric: boolean }
export const emptyCounts = (): CellCounts => ({ draft: 0, reviewed: 0, active: 0, rejected: 0, retired: 0, items: 0, stimuli: 0, activeAudio: 0, rubricItems: 0, targetWords: 0, sourceStages: 0 })

/** Deterministic state machine. Hard spec/scoring blocks dominate; audio cells cannot be READY_ACTIVE
 *  without active audio; a listening/speaking pool with draft but no active audio is BLOCKED. */
export function classifyCell(ctx: CellContext, c: CellCounts): { state: CoverageState; blockingReasons: string[] } {
  const reasons: string[] = []
  const key = `${ctx.exam}|${ctx.taskType}`
  if (SPEC_BLOCKED.has(key)) reasons.push(SPEC_BLOCKED.get(key) as string)
  if (SCORING_NOT_READY.has(ctx.taskType)) reasons.push('scoring_not_ready')

  // pool = all non-terminal content (draft + reviewed + active). Promotion drains draft→active, so the
  // readiness thresholds must count the WHOLE pool, not just draft (else a fully-promoted cell reads THIN).
  const pool = c.draft + c.reviewed + c.active

  if (ctx.requiresAudio) {
    // activeAudio = # of sets in this cell whose stimulus has an ACTIVE audio asset.
    if (pool > 0 && c.activeAudio === 0) reasons.push('audio_missing')          // content but no active audio at all
    else if (c.activeAudio < pool) reasons.push('audio_incomplete')             // SOME sets lack active audio (incl. partial draft audio)
    if (c.active > 0 && c.activeAudio < c.active) reasons.push('active_without_audio')
  }
  // rubric requirement applies to rubric-scored productive writing, not objective build_a_sentence
  if (ctx.requiresRubric && !SCORING_NOT_READY.has(ctx.taskType) && c.items > 0 && c.rubricItems < c.items) reasons.push('rubric_incomplete')

  // hard spec/scoring block dominates regardless of pool size
  if (reasons.includes('official_spec_unverified') || reasons.includes('scoring_not_ready')) return { state: 'BLOCKED', blockingReasons: reasons }
  // no content yet (counts reviewed too — a reviewed-only cell is NOT missing)
  if (pool === 0) return { state: 'MISSING', blockingReasons: reasons }
  // content present but a hard activation dependency unmet (audio not complete for an audio cell)
  if (reasons.includes('audio_missing') || reasons.includes('audio_incomplete') || reasons.includes('active_without_audio')) return { state: 'BLOCKED', blockingReasons: reasons }
  // a healthy ACTIVE pool with all deps met → READY_ACTIVE (reachable even after draft fully drains)
  if (c.active >= MIN_ACTIVE_POOL && !reasons.includes('rubric_incomplete')) return { state: 'READY_ACTIVE', blockingReasons: reasons }
  // thin pool (not enough total content to consider promoting)
  if (pool < READY_THRESHOLD) return { state: 'THIN', blockingReasons: reasons }
  // enough content; drafts ready to promote (or partially promoted but active pool still < MIN_ACTIVE_POOL)
  return { state: 'READY_DRAFT', blockingReasons: reasons }
}

export interface ExpectedRow {
  exam: string; level: number; section: string; taskType: string; domain: string | null
  requiredInputMode: string; requiresAudio: boolean; requiresRubric: boolean
  draft: number; reviewed: number; active: number; rejected: number; retired: number
  items: number; stimuli: number; activeAudio: number; rubricItems: number; sourceStages: number
  state: CoverageState; blockingReasons: string[]
}
export type CellLookup = (exam: string, level: number, taskType: string, domain: string | null) => CellCounts

/** Pure: build exactly one matrix row per EXAM_SPECS task, SAT reading split per official domain. */
export function buildExpectedRows(getCell: CellLookup): ExpectedRow[] {
  const rows: ExpectedRow[] = []
  for (const spec of EXAM_SPECS) {
    for (const sec of spec.sections) {
      for (const taskType of sec.taskTypes) {
        const isSatDomain = spec.id === 'sat' && taskType === 'reading_comprehension'
        const domain = isSatDomain ? sec.labelEn : null
        const c = getCell(spec.id, spec.level, taskType, domain)
        const ctx: CellContext = { exam: spec.id, taskType, requiresAudio: !!sec.requiresAudio, requiresRubric: !!sec.requiresRubric }
        const { state, blockingReasons } = classifyCell(ctx, c)
        rows.push({
          exam: spec.id, level: spec.level, section: sec.id, taskType, domain,
          requiredInputMode: INPUT_MODE_BY_TASK[taskType] ?? 'unknown',
          requiresAudio: ctx.requiresAudio, requiresRubric: ctx.requiresRubric,
          draft: c.draft, reviewed: c.reviewed, active: c.active, rejected: c.rejected, retired: c.retired,
          items: c.items, stimuli: c.stimuli, activeAudio: c.activeAudio, rubricItems: c.rubricItems, sourceStages: c.sourceStages,
          state, blockingReasons,
        })
      }
    }
  }
  return rows
}

const levelToExam = new Map<number, string>(EXAM_SPECS.map((s) => [s.level, s.id]))

// ── DB-side grid cell (mutable accumulator) ───────────────────────────────
interface GridCell { draft: number; reviewed: number; active: number; rejected: number; retired: number; items: number; stimuliSet: Set<string>; activeAudio: number; rubricItems: number; targetWords: number; stages: Set<string> }
const newGrid = (): GridCell => ({ draft: 0, reviewed: 0, active: 0, rejected: 0, retired: 0, items: 0, stimuliSet: new Set(), activeAudio: 0, rubricItems: 0, targetWords: 0, stages: new Set() })
const toCounts = (g: GridCell | undefined): CellCounts => g ? { draft: g.draft, reviewed: g.reviewed, active: g.active, rejected: g.rejected, retired: g.retired, items: g.items, stimuli: g.stimuliSet.size, activeAudio: g.activeAudio, rubricItems: g.rubricItems, targetWords: g.targetWords, sourceStages: g.stages.size } : emptyCounts()

async function pageCol<T>(db: SupabaseClient, table: string, cols: string): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select(cols).order('id', { ascending: true }).range(from, from + 999)
    if (error) throw new Error(`${table}: ${error.message}`)
    const rows = (data ?? []) as T[]
    out.push(...rows); if (rows.length < 1000) break
  }
  return out
}

async function main() {
  const env = readFileSync('.env.local', 'utf8')
  const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
  const db = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))

  type SetRow = { id: string; level: number | null; task_type: string; status: string; stimulus_id: string | null; qa_flags: Record<string, unknown> | null }
  type ItemRow = { id: string; question_set_id: string; rubric_id: string | null; status: string }
  const sets = await pageCol<SetRow>(db, 'question_sets', 'id, level, task_type, status, stimulus_id, qa_flags')
  const items = await pageCol<ItemRow>(db, 'question_items', 'id, question_set_id, rubric_id, status')
  const audio = await pageCol<{ stimulus_id: string | null; qa_status: string }>(db, 'audio_assets', 'id, stimulus_id, qa_status')
  const tw = await pageCol<{ question_item_id: string }>(db, 'question_target_words', 'id, question_item_id')

  const activeAudioStim = new Set(audio.filter((a) => a.qa_status === 'active' && a.stimulus_id).map((a) => a.stimulus_id as string))
  const itemsBySet = new Map<string, ItemRow[]>()
  for (const it of items) { const arr = itemsBySet.get(it.question_set_id) ?? itemsBySet.set(it.question_set_id, []).get(it.question_set_id)!; arr.push(it) }
  const twByItem = new Set(tw.map((r) => r.question_item_id))

  // grids: by level|task, and SAT lv7 reading by qa_flags.domain
  const gridLT = new Map<string, GridCell>()
  const gridSat = new Map<string, GridCell>()
  const bump = (g: GridCell, s: SetRow) => {
    if (s.status === 'draft') g.draft++; else if (s.status === 'reviewed') g.reviewed++; else if (s.status === 'active') g.active++; else if (s.status === 'rejected') g.rejected++; else if (s.status === 'retired') g.retired++
    if (s.stimulus_id) g.stimuliSet.add(s.stimulus_id)
    if (s.stimulus_id && activeAudioStim.has(s.stimulus_id)) g.activeAudio++
    const stage = (s.qa_flags ?? {}).stage
    if (typeof stage === 'string' && stage) g.stages.add(stage)
    const its = itemsBySet.get(s.id) ?? []
    g.items += its.length
    for (const it of its) { if (it.rubric_id) g.rubricItems++; if (twByItem.has(it.id)) g.targetWords++ }
  }
  for (const s of sets) {
    const k = `${s.level ?? '?'}|${s.task_type}`
    bump(gridLT.get(k) ?? gridLT.set(k, newGrid()).get(k)!, s)
    if (s.level === 7 && s.task_type === 'reading_comprehension') {
      const dom = String((s.qa_flags ?? {}).domain ?? '(none)')
      bump(gridSat.get(dom) ?? gridSat.set(dom, newGrid()).get(dom)!, s)
    }
  }

  // ── A) EXPECTED canonical matrix ──
  const getCell: CellLookup = (exam, level, taskType, domain) => {
    if (exam === 'sat' && taskType === 'reading_comprehension' && domain) return toCounts(gridSat.get(domain))
    return toCounts(gridLT.get(`${level}|${taskType}`))
  }
  const expected = buildExpectedRows(getCell)
  const byState = (st: CoverageState) => expected.filter((r) => r.state === st)
  const missing = byState('MISSING').map((r) => `${r.exam} lv${r.level} / ${r.section} / ${r.taskType}${r.domain ? ` [${r.domain}]` : ''} — draft 0`)
  const thin = byState('THIN').map((r) => `${r.exam} lv${r.level} / ${r.section} / ${r.taskType}${r.domain ? ` [${r.domain}]` : ''} — pool ${r.draft + r.reviewed + r.active} (draft ${r.draft}/rev ${r.reviewed}/active ${r.active}, <${READY_THRESHOLD})`)
  const blocked = byState('BLOCKED').map((r) => `${r.exam} lv${r.level} / ${r.section} / ${r.taskType}${r.domain ? ` [${r.domain}]` : ''} — draft ${r.draft} · ${r.blockingReasons.join(',')}`)
  const readyDraft = byState('READY_DRAFT').map((r) => `${r.exam} lv${r.level} / ${r.taskType}${r.domain ? ` [${r.domain}]` : ''} — draft ${r.draft}`)
  const readyActive = byState('READY_ACTIVE').map((r) => `${r.exam} lv${r.level} / ${r.taskType}${r.domain ? ` [${r.domain}]` : ''} — active ${r.active}`)
  const stateCounts = { MISSING: missing.length, THIN: thin.length, READY_DRAFT: readyDraft.length, READY_ACTIVE: readyActive.length, BLOCKED: blocked.length }

  // ── B) ACTUAL grid (level × task_type) — includes word-universe types ──
  const rows: Record<string, unknown>[] = []
  const warnings: string[] = []
  for (const [key, g] of [...gridLT.entries()].sort()) {
    const [levelStr, taskType] = key.split('|')
    const level = Number(levelStr)
    const exam = levelToExam.get(level) ?? '?'
    const c = toCounts(g)
    const totalSets = c.draft + c.reviewed + c.active + c.retired + c.rejected
    const warn: string[] = []
    if (c.active < MIN_ACTIVE_POOL) warn.push('insufficient_active_pool')
    if (LISTENING.has(taskType) && c.active > 0 && c.activeAudio < c.active) warn.push('active_listening_without_audio')
    // rubric 仅适用于 rubric 评分的产出型写作；build_a_sentence 是客观排序题(multi_blank, scoring_not_ready)、非 rubric 评分，
    // 须与 canonical 矩阵分类器(classifyCell 的 !SCORING_NOT_READY 排除)一致，否则同一题型两处呈现冲突(噪声)。
    if (PRODUCTIVE.has(taskType) && !SCORING_NOT_READY.has(taskType) && c.rubricItems < c.items) warn.push('productive_items_missing_rubric')
    if (warn.length) warnings.push(`lv${level} ${taskType}: ${warn.join(', ')}`)
    rows.push({ exam, level, taskType, totalSets, draft: c.draft, active: c.active, items: c.items, stimuli: c.stimuli, audioActive: c.activeAudio, rubricItems: c.rubricItems, targetWords: c.targetWords, sourceStages: c.sourceStages, warnings: warn })
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    totals: { sets: sets.length, items: items.length, activeSets: sets.filter((s) => s.status === 'active').length, draftSets: sets.filter((s) => s.status === 'draft').length, stimuliWithActiveAudio: activeAudioStim.size },
    expectedMatrix: { rows: expected, stateCounts, missing, thin, blocked, readyDraft, readyActive },
    actualGrid: rows, warnings,
  }
  writeFileSync(OUT_JSON, JSON.stringify(summary, null, 2) + '\n', 'utf8')

  const md: string[] = []
  md.push('# v2 Question Bank Coverage Audit (R1 canonical matrix)', '', `Generated: ${summary.generatedAt}`, '')
  md.push(`Totals: sets ${summary.totals.sets} · items ${summary.totals.items} · active ${summary.totals.activeSets} · draft ${summary.totals.draftSets}`, '')
  md.push(`## A. EXPECTED canonical matrix (from EXAM_SPECS) — MISSING ${stateCounts.MISSING} · THIN ${stateCounts.THIN} · READY_DRAFT ${stateCounts.READY_DRAFT} · READY_ACTIVE ${stateCounts.READY_ACTIVE} · BLOCKED ${stateCounts.BLOCKED}`, '')
  md.push('| exam | lv | section | taskType | domain | inMode | aud | rub | draft | rev | active | items | stim | actAudio | rubItems | stages | state | blockingReasons |')
  md.push('|---|---:|---|---|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---|')
  for (const r of expected) {
    md.push(`| ${r.exam} | ${r.level} | ${r.section} | ${r.taskType} | ${r.domain ?? '-'} | ${r.requiredInputMode} | ${r.requiresAudio ? 'Y' : '-'} | ${r.requiresRubric ? 'Y' : '-'} | ${r.draft} | ${r.reviewed} | ${r.active} | ${r.items} | ${r.stimuli} | ${r.activeAudio} | ${r.rubricItems} | ${r.sourceStages} | ${r.state} | ${r.blockingReasons.join(',') || '-'} |`)
  }
  const list = (title: string, arr: string[]) => { md.push('', `### ${title} — ${arr.length}`, ''); for (const x of arr) md.push(`- ${x}`) }
  list('MISSING (draft 0)', missing)
  list('THIN (0 < draft < 50)', thin)
  list('BLOCKED', blocked)
  list('READY_DRAFT (draft ≥ 50)', readyDraft)
  list('READY_ACTIVE', readyActive)
  md.push('', '## B. ACTUAL grid (level × task_type; includes word-universe types)', '')
  md.push('| exam | lv | task_type | sets | draft | active | items | stimuli | audioActive | rubricItems | targetWords | stages | warnings |')
  md.push('|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|')
  for (const r of rows as Record<string, number | string | string[]>[]) {
    md.push(`| ${r.exam} | ${r.level} | ${r.taskType} | ${r.totalSets} | ${r.draft} | ${r.active} | ${r.items} | ${r.stimuli} | ${r.audioActive} | ${r.rubricItems} | ${r.targetWords} | ${r.sourceStages} | ${(r.warnings as string[]).join(', ') || '-'} |`)
  }
  md.push('', `## C. Active-pool warnings (${warnings.length})`, '')
  for (const w of warnings) md.push(`- ${w}`)
  writeFileSync(OUT_MD, md.join('\n') + '\n', 'utf8')

  console.log(`audit-coverage: sets ${summary.totals.sets} · draft ${summary.totals.draftSets} · active ${summary.totals.activeSets}`)
  console.log(`  EXPECTED matrix: ${expected.length} rows · MISSING ${stateCounts.MISSING} · THIN ${stateCounts.THIN} · READY_DRAFT ${stateCounts.READY_DRAFT} · READY_ACTIVE ${stateCounts.READY_ACTIVE} · BLOCKED ${stateCounts.BLOCKED}`)
  console.log(`  ACTUAL grid: ${rows.length} rows · active-pool warnings ${warnings.length}`)
  console.log(`  报告：${OUT_MD} / ${OUT_JSON}`)
}

// run only when invoked directly (so validate-coverage-audit.ts can import the pure logic without DB side effects)
const invokedDirectly = !!process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('audit-question-bank-v2-coverage.ts')
if (invokedDirectly) main().catch((e) => { console.error('audit-coverage fatal', e?.message ?? e); process.exit(1) })
