/* ════════════════════════════════════════════════════════════════════════
   exam-task-templates/shape.ts — 生成结果 → v2 draft item 的纯映射 + 严格校验（Phase 11）

   纯函数、无副作用：generate-question-sets-v2 与 qa-question-sets-v2 共用，
   保证「坏结构（少题/越界/段落数非法）必被拒，绝不写入 draft」。
   ════════════════════════════════════════════════════════════════════════ */

export interface ShapeTemplate {
  taskType: string
  skill?: string
  itemCount: number
  optionCount: number
  answerSchema: Record<string, unknown>
  stimulusRequirements?: Record<string, unknown>
}

export interface DraftChoice { id: string; text: string }
export interface DraftItem {
  inputMode: string
  prompt: string
  promptZh: string | null
  choices: DraftChoice[]
  answer: unknown
}
export interface ShapeResult {
  stimulusText: string | null
  items: DraftItem[]
  meta: { paras?: number }
}
export type ShapeOutcome = { ok: true; result: ShapeResult } | { ok: false; reject: string }

const allInts = (a: number[]) => a.every((n) => Number.isInteger(n))
const allDistinct = (a: number[]) => new Set(a).size === a.length

export function shapeToItems(t: ShapeTemplate, raw: Record<string, unknown>): ShapeOutcome {
  const shape = String((t.answerSchema as { shape?: string }).shape ?? '')
  const passage = String(raw.passage ?? '')

  if (shape === 'bank_answers') {
    const bank = Array.isArray(raw.bank) ? (raw.bank as unknown[]).map((x) => String(x)) : []
    const answers = Array.isArray(raw.answers) ? (raw.answers as unknown[]).map((x) => Number(x)) : []
    if (bank.length !== t.optionCount) return { ok: false, reject: 'bank_count' }
    if (answers.length !== t.itemCount) return { ok: false, reject: 'answers_count' }
    if (!allInts(answers) || !allDistinct(answers)) return { ok: false, reject: 'answers_not_unique_int' }
    if (answers.some((a) => a < 0 || a >= bank.length)) return { ok: false, reject: 'answer_out_of_range' }
    return { ok: true, result: { stimulusText: passage, meta: {}, items: [{ inputMode: 'multi_blank', prompt: passage, promptZh: null, choices: bank.map((text, i) => ({ id: String(i), text })), answer: answers }] } }
  }

  if (shape === 'gblanks') {
    const gb = Array.isArray(raw.gblanks) ? (raw.gblanks as Record<string, unknown>[]) : []
    if (gb.length !== t.itemCount) return { ok: false, reject: 'gblanks_count' }
    if (gb.some((b) => !String(b?.answer ?? '').trim())) return { ok: false, reject: 'gblank_answer_empty' }
    return { ok: true, result: { stimulusText: passage, meta: {}, items: [{ inputMode: 'multi_blank', prompt: passage, promptZh: null, choices: [], answer: gb }] } }
  }

  if (shape === 'statements_answers') {
    // para_match（考研 Part B）：5 句、5 答案、段落数合法、答案落在段落区间且互不重复
    const statements = Array.isArray(raw.statements) ? (raw.statements as unknown[]).map((x) => String(x)) : []
    const answers = Array.isArray(raw.answers) ? (raw.answers as unknown[]).map((x) => Number(x)) : []
    const paras = Number(raw.paras)
    if (statements.length !== t.itemCount) return { ok: false, reject: 'statements_count' }
    if (answers.length !== t.itemCount) return { ok: false, reject: 'answers_count' }
    if (!Number.isInteger(paras) || paras < t.itemCount || paras > t.optionCount) return { ok: false, reject: 'paras_invalid' }
    if (!allInts(answers)) return { ok: false, reject: 'answers_not_int' }
    if (answers.some((a) => a < 0 || a >= paras)) return { ok: false, reject: 'answer_out_of_range' }
    if (!allDistinct(answers)) return { ok: false, reject: 'answers_not_distinct' }
    return { ok: true, result: { stimulusText: passage, meta: { paras }, items: [{ inputMode: 'matching', prompt: passage, promptZh: null, choices: statements.map((text, i) => ({ id: String(i), text })), answer: answers }] } }
  }

  // single_choice（SAT 短 RW 单题）
  const options = Array.isArray(raw.options) ? (raw.options as unknown[]).map((x) => String(x)) : []
  if (options.length !== t.optionCount) return { ok: false, reject: 'options_count' }
  const correct = String(raw.answer ?? '').trim()
  const ci = options.findIndex((o) => o.toLowerCase() === correct.toLowerCase())
  if (ci < 0) return { ok: false, reject: 'answer_not_in_options' }
  return { ok: true, result: { stimulusText: passage, meta: {}, items: [{ inputMode: 'choice', prompt: String(raw.prompt ?? ''), promptZh: null, choices: options.map((text, i) => ({ id: 'abcd'[i], text })), answer: 'abcd'[ci] }] } }
}
