/* ════════════════════════════════════════════════════════════════════════
   import-authored-question-sets-v2.ts — Claude-authored JSON → v2 draft importer

   背景：本 run 的 G3/G4/G5 题目由 Claude 亲自撰写（不调用 DeepSeek）。本脚本读取
   Claude-authored 的结构化 JSON，复用 lib/exam-task-templates/shape.ts 的严格 shape
   校验（坏结构必拒、绝不写库），通过后只写 **draft** v2 sets。

   安全契约：
   - 默认 dry-run：只校验 + 打印计划，绝不写库。
   - 仅 --apply 才写 draft（绝不 active）。
   - 退役题型（antonym_choice / cet_cloze）硬拒。
   - 模板 copyrightPolicy 必须 original_only。
   - 幂等：legacy_id 由内容确定性哈希派生；已存在则 dup-skip，不重复写。
   - 不调用 DeepSeek。不改前端。

   输入：data/generated-question-sets/<stage>/<file>.json，形如
     { "template": "cet-banked-cloze", "level": 3, "sets": [ <raw>, ... ] }
   <raw> 必须符合该模板 answerSchema.shape（与 DeepSeek 期望输出同形）：
     - bank_answers   : { passage, bank[optionCount], answers[itemCount], explain_zh? }
     - gblanks        : { passage, gblanks:[{answer,acceptable?,hint?}]×itemCount, explain_zh? }
     - statements_answers : { passage, statements[itemCount], answers[itemCount], paras, explain_zh? }
     - single_choice  : { passage, prompt, options[optionCount], answer, explain_zh? }

   用法：
     npx tsx scripts/import-authored-question-sets-v2.ts --stage=g3            # dry-run
     npx tsx scripts/import-authored-question-sets-v2.ts --stage=g3 --apply    # 写 draft
     npx tsx scripts/import-authored-question-sets-v2.ts --file=path/to.json [--apply]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { isDeprecatedQuestionType } from '@/lib/question-bank/question-type-taxonomy'
import { getExamSpec } from '@/lib/exam-specs'
import { shapeToItems, countWords, type ShapeResult, type ShapeTemplate } from '@/lib/exam-task-templates/shape'

const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const SUPABASE_URL = readEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_ROLE = readEnv('SUPABASE_SERVICE_ROLE_KEY')

const TEMPLATE_DIR = 'data/exam-task-templates'
const AUTHORED_ROOT = 'data/generated-question-sets'

const argValue = (n: string) => { const h = process.argv.find((a) => a.startsWith(`${n}=`)); return h ? h.slice(n.length + 1) : null }
const APPLY = process.argv.includes('--apply')
const REPLACE = process.argv.includes('--replace')
const STAGE = argValue('--stage')
const FILE = argValue('--file')

interface Template {
  templateId: string; examIds: string[]; taskType: string; skill: string
  generation: { mode: string }; stimulusRequirements?: Record<string, unknown>
  itemCount: number; optionCount: number; answerSchema: Record<string, unknown>
  subskills: string[]; copyrightPolicy: string
}

function loadTemplate(name: string): Template | null {
  const path = `${TEMPLATE_DIR}/${name}.json`
  if (!existsSync(path)) return null
  try { return JSON.parse(readFileSync(path, 'utf8')) as Template } catch { return null }
}

function validateTemplate(t: Template): string[] {
  const errs: string[] = []
  if (t.copyrightPolicy !== 'original_only') errs.push('copyright_policy_not_original_only')
  if (isDeprecatedQuestionType(t.taskType)) errs.push(`deprecated_task_type:${t.taskType}`)
  for (const ex of t.examIds) if (!getExamSpec(ex)) errs.push(`unknown_exam:${ex}`)
  return errs
}

// 确定性哈希（无时间戳）→ 幂等 legacy_id
function hashId(s: string): string { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0).toString(36) }

function toShapeTemplate(t: Template): ShapeTemplate {
  return { taskType: t.taskType, skill: t.skill, itemCount: t.itemCount, optionCount: t.optionCount, answerSchema: t.answerSchema, stimulusRequirements: t.stimulusRequirements }
}

async function tableExists(db: SupabaseClient, t: string): Promise<boolean> { const { error } = await db.from(t).select('*').limit(1); return !error }

async function setExists(db: SupabaseClient, legacyId: string): Promise<boolean> {
  const { data } = await db.from('question_sets').select('id').eq('legacy_id', legacyId).limit(1)
  return !!(data && data.length)
}

async function writeDraftSet(db: SupabaseClient, t: Template, level: number, stage: string, tag: string, parsed: ShapeResult, explainZh: string | null, domain: string | null, rubricId: string | null): Promise<boolean> {
  let stimulusId: string | null = null
  if (parsed.stimulusText) {
    const { data, error } = await db.from('stimuli').insert({
      legacy_id: `gen:${t.templateId}:stim:claude:${tag}`, kind: 'passage', text_en: parsed.stimulusText, level,
      word_count: countWords(parsed.stimulusText), source_type: 'original_authored',
      source_note: `Claude-authored ${stage} ${t.templateId} draft`, qa_status: 'draft',
    }).select('id').single()
    if (error) { console.error(`  stimulus insert: ${error.message}`); return false }
    stimulusId = (data as { id: string }).id
  }
  const qaFlags: Record<string, unknown> = { generated: true, authored: 'claude', provider: 'claude-authored', stage, template: t.templateId }
  if (parsed.meta.paras != null) qaFlags.paras = parsed.meta.paras
  if (parsed.meta.scoringNotReady) qaFlags.scoring_not_ready = true
  if (explainZh) qaFlags.explainZh = explainZh
  if (domain) qaFlags.domain = domain
  const topicTags = domain ? [domain, ...t.subskills.slice(0, 3)] : t.subskills.slice(0, 4)
  const { data: setData, error: setErr } = await db.from('question_sets').insert({
    legacy_id: `gen:${t.templateId}:set:claude:${tag}`, stimulus_id: stimulusId, level, task_type: t.taskType,
    topic_tags: topicTags, status: 'draft', qa_flags: qaFlags,
  }).select('id').single()
  if (setErr) { console.error(`  set insert: ${setErr.message}`); return false }
  const setId = (setData as { id: string }).id
  let oi = 0
  for (const it of parsed.items) {
    const { error } = await db.from('question_items').insert({
      legacy_id: `gen:${t.templateId}:item:claude:${tag}:${oi}`, question_set_id: setId, order_index: oi++,
      input_mode: it.inputMode, prompt: it.prompt, prompt_zh: it.promptZh, choices: it.choices, answer: it.answer,
      subskills: t.subskills, status: 'draft',
      rubric_id: (it.inputMode === 'free_text' || it.inputMode === 'speak') ? rubricId : null, // productive/speak → rubric
    })
    if (error) { console.error(`  item insert: ${error.message}`); return false }
  }
  return true
}

// --replace：删除某 stage 之前 Claude-authored 导入的 draft（用于内容返工重导）。
// 只动 legacy_id like 'gen:%' 且 status='draft' 且 qa_flags.stage===stage 的 set。顺序 items→sets→stimuli。
async function pruneStage(db: SupabaseClient, stage: string): Promise<{ sets: number; items: number; stimuli: number }> {
  type Row = { id: string; stimulus_id: string | null; qa_flags: Record<string, unknown> | null }
  const all: Row[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('question_sets').select('id, stimulus_id, qa_flags').like('legacy_id', 'gen:%').eq('status', 'draft').range(from, from + 999)
    if (error) throw new Error(`prune select: ${error.message}`)
    const rows = (data ?? []) as Row[]
    all.push(...rows)
    if (rows.length < 1000) break
  }
  const target = all.filter((s) => (s.qa_flags as { stage?: string } | null)?.stage === stage)
  const setIds = target.map((s) => s.id)
  const stimIds = target.map((s) => s.stimulus_id).filter((x): x is string => !!x)
  let items = 0
  for (let i = 0; i < setIds.length; i += 100) {
    const { data, error } = await db.from('question_items').delete().in('question_set_id', setIds.slice(i, i + 100)).select('id')
    if (error) throw new Error(`prune items: ${error.message}`)
    items += (data ?? []).length
  }
  for (let i = 0; i < setIds.length; i += 100) {
    const { error } = await db.from('question_sets').delete().in('id', setIds.slice(i, i + 100))
    if (error) throw new Error(`prune sets: ${error.message}`)
  }
  for (let i = 0; i < stimIds.length; i += 100) {
    const { error } = await db.from('stimuli').delete().in('id', stimIds.slice(i, i + 100))
    if (error) throw new Error(`prune stimuli: ${error.message}`)
  }
  return { sets: setIds.length, items, stimuli: stimIds.length }
}

interface AuthoredFile { template: string; level?: number; sets: Record<string, unknown>[] }

function collectFiles(): string[] {
  if (FILE) return [FILE]
  if (!STAGE) { console.error('import: 需 --stage=<dir> 或 --file=<path>'); process.exit(1) }
  const dir = join(AUTHORED_ROOT, STAGE)
  if (!existsSync(dir)) { console.error(`import: 目录不存在 ${dir}`); process.exit(1) }
  return readdirSync(dir).filter((f) => f.endsWith('.json') && !f.endsWith('.productive.json')).map((f) => join(dir, f))
}

async function main() {
  const files = collectFiles()
  const report: Record<string, unknown>[] = []
  let totalOk = 0, totalReject = 0, totalDup = 0, totalWrote = 0
  const rejectsByReason: Record<string, number> = {}

  let db: SupabaseClient | null = null
  if (APPLY) {
    if (!SUPABASE_URL || !SERVICE_ROLE) { console.error('import: --apply 需 Supabase 凭据'); process.exit(1) }
    db = createClient(SUPABASE_URL, SERVICE_ROLE)
    for (const tbl of ['stimuli', 'question_sets', 'question_items']) {
      if (!(await tableExists(db, tbl))) { console.error(`import: --apply 拒绝 — v2 表 ${tbl} 未应用`); process.exit(1) }
    }
    if (REPLACE) {
      if (!STAGE) { console.error('import: --replace 需 --stage=<dir>'); process.exit(1) }
      const removed = await pruneStage(db, STAGE)
      console.log(`[REPLACE] stage=${STAGE} 删除旧 draft：sets ${removed.sets} · items ${removed.items} · stimuli ${removed.stimuli}`)
    }
  }

  for (const path of files) {
    const af = JSON.parse(readFileSync(path, 'utf8')) as AuthoredFile
    const t = loadTemplate(af.template)
    if (!t) { console.error(`✗ ${path}: 模板未找到 ${af.template}`); continue }
    const tplErr = validateTemplate(t)
    if (tplErr.length) { console.error(`✗ ${path}: 模板拒绝 ${tplErr.join(',')}`); continue }
    const level = af.level ?? getExamSpec(t.examIds[0])?.level ?? 3
    const st = toShapeTemplate(t)
    // subjective skills (writing/translation/speaking) → resolve the exam/skill rubric to link on speak/free_text items
    const SUBJECTIVE = new Set(['writing', 'translation', 'speaking'])
    let rubricId: string | null = null
    if (APPLY && db && SUBJECTIVE.has(t.skill)) {
      const { data } = await db.from('rubrics').select('id').eq('exam_id', t.examIds[0]).eq('skill', t.skill).limit(1)
      rubricId = data && data.length ? (data[0] as { id: string }).id : null
      if (!rubricId) console.error(`  ⚠ no rubric for ${t.examIds[0]}/${t.skill} — speak/free_text items will have null rubric_id (promotion will reject)`)
    }

    let ok = 0, reject = 0, dup = 0, wrote = 0
    let idx = 0
    for (const raw of af.sets) {
      idx++
      const outcome = shapeToItems(st, raw)
      if (!outcome.ok) {
        reject++; totalReject++
        rejectsByReason[outcome.reject] = (rejectsByReason[outcome.reject] ?? 0) + 1
        console.error(`  ✗ ${af.template}#${idx} reject=${outcome.reject}`)
        continue
      }
      ok++; totalOk++
      const tag = hashId(`${af.template}|${level}|${JSON.stringify(raw)}`)
      const legacyId = `gen:${t.templateId}:set:claude:${tag}`
      const explainZh = typeof raw.explain_zh === 'string' ? raw.explain_zh : null
      const domain = typeof raw.domain === 'string' ? raw.domain : null
      if (APPLY && db) {
        if (await setExists(db, legacyId)) { dup++; totalDup++; continue }
        const okWrite = await writeDraftSet(db, t, level, STAGE ?? 'adhoc', tag, outcome.result, explainZh, domain, rubricId)
        if (okWrite) { wrote++; totalWrote++ } else { reject++; totalReject++ }
      }
    }
    console.log(`${APPLY ? '[APPLY]' : '[DRY-RUN]'} ${af.template} lv${level}: parsed_ok ${ok} · reject ${reject}` + (APPLY ? ` · wrote ${wrote} · dup-skip ${dup}` : ''))
    report.push({ file: path, template: af.template, level, parsedOk: ok, reject, wrote, dupSkip: dup })
  }

  const report_path = `reports/authored-import-${STAGE ?? 'adhoc'}-${APPLY ? 'apply' : 'dryrun'}-report.json`
  writeFileSync(report_path, JSON.stringify({ generatedAt: new Date().toISOString(), apply: APPLY, stage: STAGE, provider: 'claude-authored', totals: { parsedOk: totalOk, reject: totalReject, wrote: totalWrote, dupSkip: totalDup }, rejectsByReason, files: report }, null, 2) + '\n', 'utf8')
  console.log(`import ${APPLY ? 'APPLY' : 'DRY-RUN'}: parsed_ok ${totalOk} · reject ${totalReject}` + (APPLY ? ` · wrote ${totalWrote} · dup-skip ${totalDup}` : '') + ` · 报告 ${report_path}`)
  process.exitCode = totalReject > 0 && totalOk === 0 ? 1 : 0
}

main().catch((e) => { console.error('import fatal', e?.message ?? e); process.exitCode = 1 })
