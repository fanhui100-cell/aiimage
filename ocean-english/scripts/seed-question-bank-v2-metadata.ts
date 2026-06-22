/* ════════════════════════════════════════════════════════════════════════
   seed-question-bank-v2-metadata.ts — v2 元数据表 seed（G1D）

   把 TS canonical specs/templates/rubrics 镜像到 v2 DB 元数据表，支持后续正式
   归因 / 组卷 / report。只写元数据，绝不写 question content，绝不改前端。

   安全契约：
   - 默认 dry-run：只计算计划，绝不写库。
   - 仅 --apply 才写库。
   - 幂等 upsert：specs/sections/templates 用稳定 TEXT id onConflict；
     rubrics（UUID PK 无自然键）按 (exam_id, skill) 查重后 update/insert。
   - 写入顺序遵守 FK：exam_specs → exam_sections → task_templates → rubrics。
   - 来源：lib/exam-specs（EXAM_SPECS）、data/exam-task-templates/*.json、
     lib/scoring/rubrics（RUBRICS）。

   用法：
     npx tsx scripts/seed-question-bank-v2-metadata.ts            # dry-run
     npx tsx scripts/seed-question-bank-v2-metadata.ts --apply    # 写库
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { EXAM_SPECS } from '@/lib/exam-specs'
import { RUBRICS } from '@/lib/scoring/rubrics'

const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const SUPABASE_URL = readEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_ROLE = readEnv('SUPABASE_SERVICE_ROLE_KEY')

const APPLY = process.argv.includes('--apply')
const TEMPLATE_DIR = 'data/exam-task-templates'
const OUT = 'reports/qbank-v2-metadata-seed.json'

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('seed-metadata: 缺少 Supabase 凭据')
  process.exit(1)
}
const db = createClient(SUPABASE_URL, SERVICE_ROLE)

// ── 题型 → input_mode（task_templates.input_mode CHECK 约束）────────────────
const INPUT_MODE_BY_TASK: Record<string, string> = {
  banked_cloze: 'multi_blank',
  seven_select: 'multi_blank',
  grammar_fill: 'multi_blank',
  cloze_passage: 'multi_blank',
  para_match: 'matching',
  reading_comprehension: 'choice',
  listening_comprehension: 'listen',
  multi_skill: 'free_text',
}

// ── 行构造 ──────────────────────────────────────────────────────────────────
function specRows() {
  return EXAM_SPECS.map((s) => ({
    id: s.id,
    level: s.level,
    name_zh: s.labelZh,
    name_en: s.labelEn,
    version: s.version,
    source_urls: s.sourceUrls,
    total_minutes: s.totalMinutes,
    full_score: s.fullScore,
    scoring_scale: s.scoringScale,
    status: s.status,
  }))
}

function sectionRows() {
  const rows: Record<string, unknown>[] = []
  for (const s of EXAM_SPECS) {
    s.sections.forEach((sec, idx) => {
      rows.push({
        id: `${s.id}_${sec.id}`,
        exam_id: s.id,
        order_index: idx,
        name_zh: sec.labelZh,
        name_en: sec.labelEn,
        skill: sec.skill,
        selection_mode: sec.groupMode, // single|rows|passages|paper —— 与 CHECK 一致
        item_count: sec.itemCount,
        points: sec.points,
        time_limit_sec: sec.timeLimitSec ?? null,
        requires_audio: sec.requiresAudio ?? false,
        requires_rubric: sec.requiresRubric ?? false,
        metadata: { taskTypes: sec.taskTypes, notes: sec.notes ?? null },
      })
    })
  }
  return rows
}

function templateRows() {
  const files = readdirSync(TEMPLATE_DIR).filter((f) => f.endsWith('.json'))
  return files.map((f) => {
    const tpl = JSON.parse(readFileSync(join(TEMPLATE_DIR, f), 'utf8'))
    const examIds: string[] = Array.isArray(tpl.examIds) ? tpl.examIds : []
    const groupMode = Array.isArray(tpl.skills)
      ? 'paper'
      : tpl?.answerSchema?.shape === 'single_choice'
        ? 'single'
        : 'set'
    return {
      id: tpl.templateId as string,
      exam_id: examIds.length === 1 ? examIds[0] : null, // 多档共享 → null（跨档）
      section_id: null,
      task_type: tpl.taskType as string,
      name_zh: tpl.templateId as string,
      subskills: Array.isArray(tpl.subskills) ? tpl.subskills : [],
      input_mode: INPUT_MODE_BY_TASK[tpl.taskType] ?? 'free_text',
      group_mode: groupMode,
      answer_schema: tpl.answerSchema ?? {},
      min_pool: 0,
      status: 'active',
    }
  })
}

function rubricRows() {
  return RUBRICS.map((r) => ({
    name_zh: r.nameZh,
    exam_id: r.examId,
    skill: r.skill,
    criteria: r.dimensions,
    max_score: r.fullScore,
    status: 'active',
  }))
}

async function upsertById(table: string, rows: Record<string, unknown>[]) {
  const { error } = await db.from(table).upsert(rows, { onConflict: 'id' })
  if (error) throw new Error(`${table} upsert: ${error.message}`)
}

async function upsertRubrics(rows: Record<string, unknown>[]) {
  // UUID PK 无自然键：按 (exam_id, skill) 查重 → update / insert，保证幂等。
  const { data: existing, error } = await db.from('rubrics').select('id, exam_id, skill')
  if (error) throw new Error(`rubrics select: ${error.message}`)
  const byKey = new Map((existing ?? []).map((e) => [`${e.exam_id}:${e.skill}`, e.id as string]))
  let inserted = 0
  let updated = 0
  for (const row of rows) {
    const key = `${row.exam_id}:${row.skill}`
    const id = byKey.get(key)
    if (id) {
      const { error: e } = await db.from('rubrics').update(row).eq('id', id)
      if (e) throw new Error(`rubrics update ${key}: ${e.message}`)
      updated++
    } else {
      const { error: e } = await db.from('rubrics').insert(row)
      if (e) throw new Error(`rubrics insert ${key}: ${e.message}`)
      inserted++
    }
  }
  return { inserted, updated }
}

async function main() {
  const specs = specRows()
  const sections = sectionRows()
  const templates = templateRows()
  const rubrics = rubricRows()

  const plan = {
    examSpecs: specs.length,
    examSections: sections.length,
    taskTemplates: templates.length,
    rubrics: rubrics.length,
    templateIds: templates.map((t) => t.id),
    rubricKeys: rubrics.map((r) => `${r.exam_id}:${r.skill}`),
  }

  console.log(`seed-metadata: apply=${APPLY}`)
  console.log(`  plan: exam_specs ${plan.examSpecs} · exam_sections ${plan.examSections} · task_templates ${plan.taskTemplates} · rubrics ${plan.rubrics}`)

  let rubricResult = { inserted: 0, updated: 0 }
  if (APPLY) {
    await upsertById('exam_specs', specs)
    await upsertById('exam_sections', sections)
    await upsertById('task_templates', templates)
    rubricResult = await upsertRubrics(rubrics)
    console.log(`  applied: rubrics inserted ${rubricResult.inserted} / updated ${rubricResult.updated}`)
  } else {
    console.log('  dry-run：未写库。加 --apply 写入。')
  }

  writeFileSync(
    OUT,
    JSON.stringify({ generatedAt: new Date().toISOString(), apply: APPLY, plan, rubricResult }, null, 2) + '\n',
    'utf8',
  )
  console.log(`  报告：${OUT}`)
}

main().catch((e) => {
  console.error('seed-metadata fatal', e?.message ?? e)
  process.exit(1)
})
