/* ════════════════════════════════════════════════════════════════════════
   audit-question-bank-v2-coverage.ts — v2 题库覆盖审计（G7，只读）

   两条线：
   A) EXPECTED matrix（从 EXAM_SPECS 推导）：列出每个 exam/section/taskType 应有的池，
      对照 DB draft 计数，标 missing(0) / thin(<THIN) / ok。这能发现「规格要求但库里 0 条」。
      SAT reading_comprehension 按 4 domain（qa_flags.domain）分别统计。
   B) ACTUAL grid（从现有 question_sets）：level × task_type 的 draft/active/items/stimuli/audio/
      rubric/target-word 覆盖 + active 池告警。

   写 reports/qbank-v2-coverage-audit.{md,json}。绝不写库。
   用法：npm run audit:qbank-v2-coverage
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { EXAM_SPECS } from '@/lib/exam-specs'

const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))

const OUT_JSON = 'reports/qbank-v2-coverage-audit.json'
const OUT_MD = 'reports/qbank-v2-coverage-audit.md'

const PRODUCTIVE = new Set(['applied_writing', 'continuation_writing', 'essay_writing', 'translation_zh_en', 'translation_en_zh', 'build_a_sentence', 'email_writing', 'academic_discussion', 'listen_and_repeat', 'interview_speaking'])
const LISTENING = new Set(['listening_comprehension', 'listen_and_repeat', 'choose_a_response'])
const MIN_ACTIVE_POOL = 5    // active 池低于此值即告警
const THIN_DRAFT = 20        // draft < THIN_DRAFT 视为「薄池」
const SAT_DOMAIN_THIN = 20   // SAT 每 domain draft < 此值视为薄

async function pageCol<T>(table: string, cols: string): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select(cols).order('id', { ascending: true }).range(from, from + 999)
    if (error) throw new Error(`${table}: ${error.message}`)
    const rows = (data ?? []) as T[]
    out.push(...rows); if (rows.length < 1000) break
  }
  return out
}

const levelToExam = new Map<number, string>(EXAM_SPECS.map((s) => [s.level, s.id]))

interface Cell {
  draft: number; reviewed: number; active: number; retired: number; rejected: number
  items: number; stimuli: Set<string>; audioActive: number; rubricItems: number; targetWords: number
}
const newCell = (): Cell => ({ draft: 0, reviewed: 0, active: 0, retired: 0, rejected: 0, items: 0, stimuli: new Set(), audioActive: 0, rubricItems: 0, targetWords: 0 })

async function main() {
  type SetRow = { id: string; level: number | null; task_type: string; status: string; stimulus_id: string | null; qa_flags: Record<string, unknown> | null }
  type ItemRow = { id: string; question_set_id: string; rubric_id: string | null; status: string }
  const sets = await pageCol<SetRow>('question_sets', 'id, level, task_type, status, stimulus_id, qa_flags')
  const items = await pageCol<ItemRow>('question_items', 'id, question_set_id, rubric_id, status')
  const audio = await pageCol<{ stimulus_id: string | null; qa_status: string }>('audio_assets', 'id, stimulus_id, qa_status')
  const tw = await pageCol<{ question_item_id: string }>('question_target_words', 'id, question_item_id')

  const activeAudioStim = new Set(audio.filter((a) => a.qa_status === 'active' && a.stimulus_id).map((a) => a.stimulus_id as string))
  const itemsBySet = new Map<string, ItemRow[]>()
  for (const it of items) { (itemsBySet.get(it.question_set_id) ?? itemsBySet.set(it.question_set_id, []).get(it.question_set_id)!).push(it) }
  const twByItem = new Set(tw.map((r) => r.question_item_id))

  // ── 计数索引：draft by (level|task)；SAT lv7 reading 按 domain ──────────────
  const draftByLevelTask = new Map<string, number>()
  const draftSatByDomain = new Map<string, number>()
  for (const s of sets) {
    if (s.status !== 'draft') continue
    const k = `${s.level ?? '?'}|${s.task_type}`
    draftByLevelTask.set(k, (draftByLevelTask.get(k) ?? 0) + 1)
    if (s.level === 7 && s.task_type === 'reading_comprehension') {
      const dom = String((s.qa_flags ?? {}).domain ?? '(none)')
      draftSatByDomain.set(dom, (draftSatByDomain.get(dom) ?? 0) + 1)
    }
  }

  // ── A) EXPECTED matrix（从 EXAM_SPECS）────────────────────────────────────
  const expected: Record<string, unknown>[] = []
  const missing: string[] = []
  const thin: string[] = []
  for (const spec of EXAM_SPECS) {
    for (const sec of spec.sections) {
      for (const taskType of sec.taskTypes) {
        // SAT reading_comprehension 按 section 当作一个 domain 统计
        const isSatDomain = spec.id === 'sat' && taskType === 'reading_comprehension'
        const draftCount = isSatDomain ? (draftSatByDomain.get(sec.labelEn) ?? 0) : (draftByLevelTask.get(`${spec.level}|${taskType}`) ?? 0)
        const thinLimit = isSatDomain ? SAT_DOMAIN_THIN : THIN_DRAFT
        const state = draftCount === 0 ? 'MISSING' : (draftCount < thinLimit ? 'THIN' : 'ok')
        const label = `${spec.id} lv${spec.level} / ${sec.id} / ${taskType}${isSatDomain ? ` [domain: ${sec.labelEn}]` : ''}`
        if (state === 'MISSING') missing.push(`${label} — draft 0`)
        else if (state === 'THIN') thin.push(`${label} — draft ${draftCount} (<${thinLimit})`)
        expected.push({ exam: spec.id, level: spec.level, section: sec.id, taskType, domain: isSatDomain ? sec.labelEn : null, requiresAudio: !!sec.requiresAudio, requiresRubric: !!sec.requiresRubric, draftCount, state })
      }
    }
  }

  // ── B) ACTUAL grid（level × task_type）──────────────────────────────────
  const grid = new Map<string, Cell>()
  for (const s of sets) {
    const key = `${s.level ?? '?'}|${s.task_type}`
    const cell = grid.get(key) ?? grid.set(key, newCell()).get(key)!
    ;(cell as unknown as Record<string, number>)[s.status] = ((cell as unknown as Record<string, number>)[s.status] ?? 0) + 1
    if (s.stimulus_id) cell.stimuli.add(s.stimulus_id)
    if (s.stimulus_id && activeAudioStim.has(s.stimulus_id)) cell.audioActive++
    const its = itemsBySet.get(s.id) ?? []
    cell.items += its.length
    for (const it of its) { if (it.rubric_id) cell.rubricItems++; if (twByItem.has(it.id)) cell.targetWords++ }
  }
  const rows: Record<string, unknown>[] = []
  const warnings: string[] = []
  for (const [key, c] of [...grid.entries()].sort()) {
    const [levelStr, taskType] = key.split('|')
    const level = Number(levelStr)
    const exam = levelToExam.get(level) ?? '?'
    const totalSets = c.draft + c.reviewed + c.active + c.retired + c.rejected
    const warn: string[] = []
    if (c.active < MIN_ACTIVE_POOL) warn.push('insufficient_active_pool')
    if (LISTENING.has(taskType) && c.active > 0 && c.audioActive < c.active) warn.push('active_listening_without_audio')
    if (PRODUCTIVE.has(taskType) && c.rubricItems < c.items) warn.push('productive_items_missing_rubric')
    if (warn.length) warnings.push(`lv${level} ${taskType}: ${warn.join(', ')}`)
    rows.push({ exam, level, taskType, totalSets, draft: c.draft, active: c.active, items: c.items, stimuli: c.stimuli.size, audioActive: c.audioActive, rubricItems: c.rubricItems, targetWords: c.targetWords, warnings: warn })
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    totals: { sets: sets.length, items: items.length, activeSets: sets.filter((s) => s.status === 'active').length, draftSets: sets.filter((s) => s.status === 'draft').length, stimuliWithActiveAudio: activeAudioStim.size },
    expectedMatrix: { rows: expected, missingCount: missing.length, thinCount: thin.length, missing, thin },
    actualGrid: rows, warnings,
  }
  writeFileSync(OUT_JSON, JSON.stringify(summary, null, 2) + '\n', 'utf8')

  const md: string[] = []
  md.push('# v2 Question Bank Coverage Audit', '', `Generated: ${summary.generatedAt}`, '')
  md.push(`Totals: sets ${summary.totals.sets} · items ${summary.totals.items} · active ${summary.totals.activeSets} · draft ${summary.totals.draftSets}`, '')
  md.push(`## A. EXPECTED coverage (from EXAM_SPECS) — MISSING ${missing.length} · THIN ${thin.length}`, '')
  md.push('| exam | lv | section | taskType | domain | draft | state | audio | rubric |')
  md.push('|---|---:|---|---|---|---:|---|---|---|')
  for (const r of expected as Record<string, unknown>[]) {
    md.push(`| ${r.exam} | ${r.level} | ${r.section} | ${r.taskType} | ${r.domain ?? '-'} | ${r.draftCount} | ${r.state} | ${r.requiresAudio ? 'Y' : '-'} | ${r.requiresRubric ? 'Y' : '-'} |`)
  }
  md.push('', `### MISSING (draft 0) — ${missing.length}`, '')
  for (const m of missing) md.push(`- ${m}`)
  md.push('', `### THIN (0 < draft < threshold) — ${thin.length}`, '')
  for (const t of thin) md.push(`- ${t}`)
  md.push('', '## B. ACTUAL grid (level × task_type)', '')
  md.push('| exam | lv | task_type | sets | draft | active | items | stimuli | audioActive | rubricItems | targetWords | warnings |')
  md.push('|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---|')
  for (const r of rows as Record<string, number | string | string[]>[]) {
    md.push(`| ${r.exam} | ${r.level} | ${r.taskType} | ${r.totalSets} | ${r.draft} | ${r.active} | ${r.items} | ${r.stimuli} | ${r.audioActive} | ${r.rubricItems} | ${r.targetWords} | ${(r.warnings as string[]).join(', ') || '-'} |`)
  }
  md.push('', `## C. Active-pool warnings (${warnings.length})`, '')
  for (const w of warnings) md.push(`- ${w}`)
  writeFileSync(OUT_MD, md.join('\n') + '\n', 'utf8')

  console.log(`audit-coverage: sets ${summary.totals.sets} · draft ${summary.totals.draftSets} · active ${summary.totals.activeSets}`)
  console.log(`  EXPECTED matrix: ${expected.length} rows · MISSING ${missing.length} · THIN ${thin.length}`)
  console.log(`  ACTUAL grid: ${rows.length} rows · active-pool warnings ${warnings.length}`)
  console.log(`  报告：${OUT_MD} / ${OUT_JSON}`)
}
main().catch((e) => { console.error('audit-coverage fatal', e?.message ?? e); process.exit(1) })
