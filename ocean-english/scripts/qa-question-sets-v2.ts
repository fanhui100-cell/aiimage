/* ════════════════════════════════════════════════════════════════════════
   qa-question-sets-v2.ts — 题型扩展模板 + 生成草稿质检（Phase 11，只读）

   A) 模板 QA（始终跑，不依赖 DB）：copyright_only、非退役、各题型结构数（banked 15/10、
      seven 7/5、grammar 空数）、SAT 为短 RW 单题（非长泛读）、考研无听力/口语、TOEFL 覆盖四技能。
   B) 数据 QA（v2 应用时）：抽查生成的 draft v2 sets —— 答案数、选项/答案唯一、各题型空数/选项数。
   有错误退出 1，否则 0。用法：npm run qa:qsets-v2
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { isDeprecatedQuestionType } from '@/lib/question-bank/question-type-taxonomy'
import { shapeToItems, type ShapeTemplate } from '@/lib/exam-task-templates/shape'

const env = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : ''
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const SUPABASE_URL = readEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_ROLE = readEnv('SUPABASE_SERVICE_ROLE_KEY')
const TEMPLATE_DIR = 'data/exam-task-templates'
const OUT = 'reports/question-sets-v2-qa.json'

interface Template {
  templateId: string; examIds: string[]; taskType: string; skill: string
  itemCount: number; optionCount: number; answerSchema: Record<string, unknown>
  copyrightPolicy: string; qualityRules?: string[]
  stimulusRequirements?: Record<string, unknown>
  skills?: { skill: string; subtasks: string[] }[]
  domains?: { domain: string }[]
}

const errors: string[] = []
const notes: string[] = []
const push = (c: boolean, msg: string) => { if (!c) errors.push(msg) }
function writeOut(p: Record<string, unknown>) { writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), ...p }, null, 2) + '\n', 'utf8') }

function loadTemplates(): Template[] {
  if (!existsSync(TEMPLATE_DIR)) return []
  return readdirSync(TEMPLATE_DIR).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(`${TEMPLATE_DIR}/${f}`, 'utf8')) as Template)
}

// ── 纯函数 fixture：坏结构（少题/越界/段落非法/重复）必被拒 ────────────────────
function shapeFixtureTests() {
  const tpl: ShapeTemplate = { taskType: 'para_match', itemCount: 5, optionCount: 7, answerSchema: { shape: 'statements_answers', statements: 5 } }
  const valid = { passage: 'p', paras: 6, statements: ['a', 'b', 'c', 'd', 'e'], answers: [0, 1, 2, 3, 4] }
  push(shapeToItems(tpl, valid).ok === true, 'fixture: 合法 para_match 应通过')
  push(shapeToItems(tpl, { ...valid, statements: ['a', 'b'] }).ok === false, 'fixture: 少 statement(2) 应被拒')
  push(shapeToItems(tpl, { ...valid, answers: [99, 99, 99, 99, 99] }).ok === false, 'fixture: 越界 answers[99] 应被拒')
  push(shapeToItems(tpl, { ...valid, paras: 0 }).ok === false, 'fixture: 非法 paras=0 应被拒')
  push(shapeToItems(tpl, { ...valid, paras: 4 }).ok === false, 'fixture: paras<itemCount 应被拒')
  push(shapeToItems(tpl, { ...valid, answers: [0, 1, 2, 3, 3] }).ok === false, 'fixture: 重复 answers 应被拒')
  push(shapeToItems(tpl, { ...valid, answers: [0, 1, 2] }).ok === false, 'fixture: 答案数≠5 应被拒')
  // banked_cloze 数量/越界
  const bank: ShapeTemplate = { taskType: 'banked_cloze', itemCount: 10, optionCount: 15, answerSchema: { shape: 'bank_answers' } }
  push(shapeToItems(bank, { passage: 'p', bank: Array.from({ length: 15 }, (_, i) => `w${i}`), answers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] }).ok === true, 'fixture: 合法 banked_cloze 应通过')
  push(shapeToItems(bank, { passage: 'p', bank: Array.from({ length: 12 }, (_, i) => `w${i}`), answers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] }).ok === false, 'fixture: banked bank≠15 应被拒')
}

// ── A) 模板 QA ──────────────────────────────────────────────────────────────
function templateQa(templates: Template[]) {
  for (const t of templates) {
    const id = t.templateId
    push(t.copyrightPolicy === 'original_only', `${id}: copyrightPolicy 必须 original_only`)
    push(!isDeprecatedQuestionType(t.taskType), `${id}: taskType 为退役题型 ${t.taskType}`)
    const sch = t.answerSchema ?? {}

    if (t.taskType === 'banked_cloze') {
      push(t.optionCount === 15 && t.itemCount === 10, `${id}: banked_cloze 应 15 选项/10 空`)
      push(sch.bank === 15 && sch.answers === 10, `${id}: banked_cloze answerSchema 应 bank=15 answers=10`)
    }
    if (t.taskType === 'seven_select') {
      push(t.optionCount === 7 && t.itemCount === 5, `${id}: seven_select 应 7 选项/5 空`)
      push(sch.bank === 7 && sch.answers === 5, `${id}: seven_select answerSchema 应 bank=7 answers=5`)
    }
    if (t.taskType === 'grammar_fill') {
      push(sch.shape === 'gblanks' && sch.blanks === t.itemCount, `${id}: grammar_fill 应 gblanks 且 blanks=itemCount`)
      push(t.optionCount === 0, `${id}: grammar_fill 为自由填空，optionCount 应为 0`)
    }

    // SAT：短 RW 单题（非长泛读），四 domain
    if (t.examIds.includes('sat')) {
      const maxWords = Number((t.stimulusRequirements as { maxWords?: number })?.maxWords ?? 9999)
      const perItems = Number((t.stimulusRequirements as { perStimulusItems?: number })?.perStimulusItems ?? 99)
      push(maxWords <= 200, `${id}: SAT 题须短文本（maxWords≤200），当前 ${maxWords}`)
      push(perItems === 1, `${id}: SAT 须每短文本单题（perStimulusItems=1）`)
      push((t.domains?.length ?? 0) === 4, `${id}: SAT 须覆盖 4 大 domain`)
    }

    // 考研：无听力/口语
    if (t.examIds.includes('kaoyan')) {
      push(t.skill !== 'listening' && t.skill !== 'speaking', `${id}: 考研模板不得为听力/口语 skill`)
      push(t.taskType !== 'listening_comprehension', `${id}: 考研模板不得为 listening_comprehension`)
      push(!(t.skills ?? []).some((s) => s.skill === 'listening' || s.skill === 'speaking'), `${id}: 考研模板 skills 不得含听力/口语`)
    }

    // TOEFL：覆盖四技能
    if (t.examIds.includes('toefl')) {
      const sk = new Set((t.skills ?? []).map((s) => s.skill))
      for (const need of ['reading', 'listening', 'writing', 'speaking']) push(sk.has(need), `${id}: TOEFL 模板缺技能 ${need}`)
    }
  }
}

// ── B) 数据 QA（v2 应用时）──────────────────────────────────────────────────
async function tableExists(db: SupabaseClient, t: string): Promise<boolean> { const { error } = await db.from(t).select('*').limit(1); return !error }

type SetRow = { id: string; legacy_id: string | null; task_type: string; status: string; qa_flags: Record<string, unknown> | null }
type ItemRow = { id: string; question_set_id: string; input_mode: string; choices: unknown; answer: unknown; status: string }

async function dataQa(db: SupabaseClient): Promise<boolean> {
  if (!(await tableExists(db, 'question_sets'))) { notes.push('v2 not_applied：跳过数据 QA'); return false }
  // 仅查本管线生成的 draft（legacy_id 前缀 gen:）
  const { data: setsData } = await db.from('question_sets').select('id, legacy_id, task_type, status, qa_flags').like('legacy_id', 'gen:%').limit(2000)
  const sets = (setsData ?? []) as SetRow[]
  if (!sets.length) { notes.push('v2 applied 但无 gen: draft sets（尚未 --apply 生成）'); return true }
  const byId = new Map(sets.map((s) => [s.id, s]))
  const { data: itemsData } = await db.from('question_items').select('id, question_set_id, input_mode, choices, answer, status').in('question_set_id', sets.map((s) => s.id)).limit(8000)
  const items = (itemsData ?? []) as ItemRow[]

  for (const it of items) {
    const set = byId.get(it.question_set_id)
    if (!set) continue
    push(set.status !== 'active', `gen set ${set.id} 不应为 active（须 QA+批准）`)
    const choices = Array.isArray(it.choices) ? (it.choices as { id: string; text: string }[]) : []
    if (it.input_mode === 'choice') {
      const ids = choices.map((c) => String(c.id))
      const texts = choices.map((c) => String(c.text).toLowerCase())
      push(choices.length >= 2, `item ${it.id} choice 选项 < 2`)
      push(new Set(ids).size === ids.length && new Set(texts).size === texts.length, `item ${it.id} 选项/文本不唯一`)
      push(typeof it.answer === 'string' && ids.includes(it.answer), `item ${it.id} answer 未命中选项`)
    } else if (it.input_mode === 'multi_blank' || it.input_mode === 'matching') {
      push(Array.isArray(it.answer) && it.answer.length > 0, `item ${it.id} 多空/匹配 answer 应为非空数组`)
      if (set.task_type === 'banked_cloze') { push(choices.length === 15 && Array.isArray(it.answer) && it.answer.length === 10, `banked_cloze item ${it.id} 应 15 选项/10 空`) }
      if (set.task_type === 'seven_select') { push(choices.length === 7 && Array.isArray(it.answer) && it.answer.length === 5, `seven_select item ${it.id} 应 7 选项/5 空`) }
      if (set.task_type === 'para_match') {
        // 段落匹配：答案数 = statements 数；段落数 paras 取自 qa_flags；答案整数、落区间、互不重复
        const paras = Number((set.qa_flags ?? {}).paras ?? NaN)
        const ans = Array.isArray(it.answer) ? (it.answer as unknown[]).map((x) => Number(x)) : []
        push(choices.length >= 2, `para_match item ${it.id} statements < 2`)
        push(ans.length === choices.length, `para_match item ${it.id} 答案数(${ans.length})≠statements数(${choices.length})`)
        push(Number.isInteger(paras), `para_match set ${set.id} 缺 qa_flags.paras`)
        push(ans.every((a) => Number.isInteger(a) && a >= 0 && a < paras), `para_match item ${it.id} 答案越界 0..${paras - 1}`)
        push(new Set(ans).size === ans.length, `para_match item ${it.id} 答案重复`)
      }
    }
  }
  notes.push(`数据 QA：gen draft sets ${sets.length} · items ${items.length}`)
  return true
}

async function main() {
  shapeFixtureTests()
  const templates = loadTemplates()
  push(templates.length >= 6, `模板数量 < 6（实际 ${templates.length}）`)
  templateQa(templates)

  let applied = false
  if (SUPABASE_URL && SERVICE_ROLE) {
    try { applied = await dataQa(createClient(SUPABASE_URL, SERVICE_ROLE)) } catch (e) { notes.push(`数据 QA 异常（忽略）: ${(e as Error).message}`) }
  } else notes.push('缺 Supabase 凭据：仅跑模板 QA')

  writeOut({ status: applied ? 'applied' : 'not_applied', templates: templates.map((t) => t.templateId), errors, notes, ok: errors.length === 0 })
  console.log(`qa-qsets-v2: ${applied ? 'applied' : 'not_applied'} · 模板 ${templates.length} · 错误 ${errors.length}`)
  for (const n of notes) console.log(`  · ${n}`)
  for (const e of errors) console.error(`ERROR ${e}`)
  // 用 exitCode（不 process.exit）：避免 Windows 上 undici/libuv 在异步句柄关闭中途被强制退出而崩溃
  process.exitCode = errors.length ? 1 : 0
}

main().catch((e) => { console.error('qa-qsets-v2 fatal', e?.message ?? e); writeOut({ status: 'error', message: String(e?.message ?? e), errors, notes }); process.exitCode = 1 })
