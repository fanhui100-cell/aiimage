/* ════════════════════════════════════════════════════════════════════════
   generate-question-sets-v2.ts — 题型扩展生成管线（Phase 11，默认 dry-run）

   安全契约：
   - 默认 dry-run：校验模板 + 打印生成计划，绝不调用 DeepSeek、绝不写库。
   - 仅 --apply 才生成并写 **draft** v2 sets；绝不写 active（上架须 QA + 批准的批次）。
   - 绝不生成退役题型（antonym_choice / cet_cloze）。
   - 模板 copyrightPolicy 必须 original_only，否则拒绝运行（杜绝抄录真题）。
   - --apply 需 v2 schema 已应用 + DEEPSEEK_API_KEY + 模板 generation.mode='ai'，否则拒绝。
   - 不改 DeepSeek 路由限流（本脚本直连 DeepSeek API，与 app 路由无关）。

   用法：
     npx tsx scripts/generate-question-sets-v2.ts --template=cet-banked-cloze --count=3 --level=3 [--apply]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { isDeprecatedQuestionType } from '@/lib/question-bank/question-type-taxonomy'
import { getExamSpec } from '@/lib/exam-specs'
import { shapeToItems, type ShapeResult } from '@/lib/exam-task-templates/shape'

const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const SUPABASE_URL = readEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_ROLE = readEnv('SUPABASE_SERVICE_ROLE_KEY')
const DS = readEnv('DEEPSEEK_API_KEY')
const TEMPLATE_DIR = 'data/exam-task-templates'
const REPORT_JSON = 'reports/question-sets-v2-generation-report.json'

const argValue = (name: string): string | null => {
  const hit = process.argv.find((a) => a.startsWith(`${name}=`))
  return hit ? hit.slice(name.length + 1) : null
}
const APPLY = process.argv.includes('--apply')
const TEMPLATE = (argValue('--template') || '').trim()
const COUNT = (() => { const n = Number(argValue('--count')); return Number.isFinite(n) && n > 0 ? Math.floor(n) : 2 })()
const LEVEL_ARG = (() => { const n = Number(argValue('--level')); return Number.isFinite(n) ? Math.floor(n) : null })()

interface Template {
  templateId: string
  examIds: string[]
  taskType: string
  skill: string
  generation: { mode: 'ai' | 'manual_seed'; promptHintZh: string }
  stimulusRequirements?: Record<string, unknown>
  itemCount: number
  optionCount: number
  answerSchema: Record<string, unknown>
  subskills: string[]
  qualityRules: string[]
  copyrightPolicy: string
  skills?: { skill: string; subtasks: string[]; itemCount: number }[]
  domains?: { domain: string; subskills: string[] }[]
  variants?: string[]
}

function loadTemplate(name: string): Template | null {
  const path = name.endsWith('.json') ? name : `${TEMPLATE_DIR}/${name}.json`
  if (!existsSync(path)) return null
  try { return JSON.parse(readFileSync(path, 'utf8')) as Template } catch { return null }
}

/** 模板合法性 + 安全门：copyrightPolicy 必须 original_only；taskType 不得退役。 */
function validateTemplate(t: Template): string[] {
  const errs: string[] = []
  if (t.copyrightPolicy !== 'original_only') errs.push('copyright_policy_not_original_only')   // 拒绝任何抄录真题的模板
  if (isDeprecatedQuestionType(t.taskType)) errs.push(`deprecated_task_type:${t.taskType}`)
  if (!t.templateId || !Array.isArray(t.examIds) || !t.examIds.length) errs.push('missing_core_fields')
  if (!t.generation || (t.generation.mode !== 'ai' && t.generation.mode !== 'manual_seed')) errs.push('invalid_generation_mode')
  for (const ex of t.examIds) if (!getExamSpec(ex)) errs.push(`unknown_exam:${ex}`)
  return errs
}

function writeReport(p: Record<string, unknown>) {
  writeFileSync(REPORT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), ...p }, null, 2) + '\n', 'utf8')
}

async function tableExists(db: SupabaseClient, t: string): Promise<boolean> {
  const { error } = await db.from(t).select('*').limit(1)
  return !error
}

// ── DeepSeek（直连，apply 才用）─────────────────────────────────────────────
async function callDeepSeek(prompt: string): Promise<unknown | null> {
  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST', headers: { Authorization: 'Bearer ' + DS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.6, messages: [{ role: 'user', content: prompt }] }),
    })
    if (!res.ok) return null
    const j = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    let txt = (j.choices?.[0]?.message?.content ?? '').replace(/```json|```/g, '').trim()
    const m = txt.match(/\{[\s\S]*\}/) || txt.match(/\[[\s\S]*\]/); if (m) txt = m[0]
    return JSON.parse(txt)
  } catch { return null }
}

function buildPrompt(t: Template, level: number): string {
  const shape = String((t.answerSchema as { shape?: string }).shape ?? '')
  const json = shape === 'bank_answers'
    ? `{"passage":"...","bank":[${t.optionCount} 个词/句],"answers":[${t.itemCount} 个 0-${t.optionCount - 1} 索引],"explain_zh":"..."}`
    : shape === 'gblanks'
      ? `{"passage":"...含[BLANK]标记的短文...","gblanks":[{"answer":"","acceptable":["",""],"hint":""} × ${t.itemCount}],"explain_zh":"..."}`
      : shape === 'statements_answers'
        ? `{"passage":"...分段长文...","paras":段落数,"statements":[${t.answerSchema['statements']} 句],"answers":[对应段落索引],"explain_zh":"..."}`
        : `{"passage":"短文本","prompt":"题干","options":["A","B","C","D"],"answer":"正确选项文本","domain":"","explain_zh":"..."}`
  return `${t.generation.promptHintZh}\n等级=lv${level}，对标考试=${t.examIds.join('/')}。100% 原创，禁止抄袭任何真题。只输出 JSON、无其它文字：\n${json}`
}

// ── 写一个 draft v2 set（apply）──────────────────────────────────────────────
let _hashCounter = 0
function hashId(s: string): string { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0).toString(36) + (_hashCounter++).toString(36) }

async function writeDraftSet(db: SupabaseClient, t: Template, level: number, parsed: ShapeResult): Promise<boolean> {
  const tag = hashId(t.templateId + JSON.stringify(parsed.items[0]?.answer) + Date.now())
  let stimulusId: string | null = null
  if (parsed.stimulusText) {
    const kind = String((t.stimulusRequirements as { kind?: string })?.kind ?? 'passage') === 'short_passage' ? 'passage' : (t.skill === 'listening' ? 'lecture' : 'passage')
    const { data, error } = await db.from('stimuli').insert({
      legacy_id: `gen:${t.templateId}:stim:${tag}`, kind, text_en: parsed.stimulusText, level,
      source_type: 'ai_generated_practice', source_note: `Phase11 ${t.templateId} draft`, qa_status: 'draft',
    }).select('id').single()
    if (error) return false
    stimulusId = (data as { id: string }).id
  }
  const qaFlags: Record<string, unknown> = { generated: true, template: t.templateId }
  if (parsed.meta.paras != null) qaFlags.paras = parsed.meta.paras   // para_match：存段落数供 QA 范围校验
  const { data: setData, error: setErr } = await db.from('question_sets').insert({
    legacy_id: `gen:${t.templateId}:set:${tag}`, stimulus_id: stimulusId, level, task_type: t.taskType,
    topic_tags: t.subskills.slice(0, 4), status: 'draft', qa_flags: qaFlags,
  }).select('id').single()
  if (setErr) return false
  const setId = (setData as { id: string }).id
  let oi = 0
  for (const it of parsed.items) {
    const { error } = await db.from('question_items').insert({
      legacy_id: `gen:${t.templateId}:item:${tag}:${oi}`, question_set_id: setId, order_index: oi++,
      input_mode: it.inputMode, prompt: it.prompt, prompt_zh: it.promptZh, choices: it.choices, answer: it.answer,
      subskills: t.subskills, status: 'draft',
    })
    if (error) return false
  }
  return true
}

async function main() {
  if (!TEMPLATE) { console.error('generate-qsets-v2: 必须指定 --template=<id>'); process.exit(1) }
  const t = loadTemplate(TEMPLATE)
  if (!t) { console.error(`generate-qsets-v2: 模板未找到: ${TEMPLATE}`); process.exit(1) }

  const tplErrors = validateTemplate(t)
  if (tplErrors.length) {
    console.error(`generate-qsets-v2: 模板校验失败，拒绝运行: ${tplErrors.join(', ')}`)
    writeReport({ template: t.templateId, apply: false, refused: true, reasons: tplErrors })
    process.exit(1)
  }
  const level = LEVEL_ARG ?? (getExamSpec(t.examIds[0])?.level ?? 3)

  // ── dry-run：打印计划，不调用 DeepSeek、不写库 ──
  if (!APPLY) {
    const plan = {
      template: t.templateId, taskType: t.taskType, skill: t.skill, examIds: t.examIds, level, count: COUNT,
      itemCount: t.itemCount, optionCount: t.optionCount, answerSchema: t.answerSchema, subskills: t.subskills,
      generationMode: t.generation.mode, copyrightPolicy: t.copyrightPolicy,
    }
    writeReport({ ...plan, apply: false, wrote: 0, note: 'dry-run：未调用 DeepSeek、未写库。' })
    console.log(`generate-qsets-v2 [DRY-RUN] ${t.templateId}`)
    console.log(`  taskType=${t.taskType} skill=${t.skill} exams=${t.examIds.join('/')} lv${level} · 计划生成 ${COUNT} 组`)
    console.log(`  itemCount=${t.itemCount} optionCount=${t.optionCount} mode=${t.generation.mode} policy=${t.copyrightPolicy}`)
    console.log('  dry-run：未写库。确认后加 --apply（需 v2 已应用 + DEEPSEEK_API_KEY + mode=ai，仅写 draft）。')
    process.exit(0)
  }

  // ── apply 门控 ──
  if (t.generation.mode !== 'ai') {
    console.error(`generate-qsets-v2: --apply 拒绝 —— 模板 ${t.templateId} generation.mode=${t.generation.mode}（需人工种子，不自动批量）。`)
    process.exit(1)
  }
  if (!SUPABASE_URL || !SERVICE_ROLE) { console.error('generate-qsets-v2: --apply 拒绝 —— 缺 Supabase 凭据'); process.exit(1) }
  if (!DS) { console.error('generate-qsets-v2: --apply 拒绝 —— 缺 DEEPSEEK_API_KEY'); process.exit(1) }
  const db = createClient(SUPABASE_URL, SERVICE_ROLE)
  for (const tbl of ['stimuli', 'question_sets', 'question_items']) {
    // 用 exitCode（不 process.exit）：避免 Windows 上 undici/libuv 句柄关闭中途强退崩溃
    if (!(await tableExists(db, tbl))) { console.error(`generate-qsets-v2: --apply 拒绝 —— v2 表 ${tbl} 未应用`); process.exitCode = 1; return }
  }

  let wrote = 0, rejected = 0
  for (let i = 0; i < COUNT; i++) {
    const raw = await callDeepSeek(buildPrompt(t, level))
    if (!raw || typeof raw !== 'object') { rejected++; continue }
    const outcome = shapeToItems(t, raw as Record<string, unknown>)
    if (!outcome.ok) { rejected++; continue }   // 坏结构（少题/越界/段落数非法）→ 拒，绝不写 draft
    const okWrite = await writeDraftSet(db, t, level, outcome.result)
    if (okWrite) wrote++; else rejected++
    process.stdout.write(`\r  生成 ${wrote} draft / 拒 ${rejected}（${i + 1}/${COUNT}）`)
  }
  console.log()
  writeReport({ template: t.templateId, taskType: t.taskType, level, apply: true, wrote, rejected, note: '已写 draft v2 sets（绝不 active）。' })
  console.log(`generate-qsets-v2 [APPLY] ${t.templateId}: 写入 ${wrote} draft，拒 ${rejected}。待 qa:qsets-v2 + 人工批准后再转 active。`)
  process.exitCode = 0
}

main().catch((e) => { console.error('generate-qsets-v2 fatal', e?.message ?? e); process.exitCode = 1 })
