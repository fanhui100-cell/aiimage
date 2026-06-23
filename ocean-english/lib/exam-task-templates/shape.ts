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
  meta: { paras?: number; scoringNotReady?: boolean }
}
export type ShapeOutcome = { ok: true; result: ShapeResult } | { ok: false; reject: string }

const allInts = (a: number[]) => a.every((n) => Number.isInteger(n))
const allDistinct = (a: number[]) => new Set(a).size === a.length

// 统一词数口径：仅数英文词（数字/下划线占位/标点不计）。reading/para_match/cloze/grammar 通用。
export const countWords = (text: string): number => (text.match(/[A-Za-z][A-Za-z'’-]*/g) || []).length

// 篇幅强制校验：低于 minWords 或高于 maxWords 的 stimulus 一律 reject（import 前即拒）。
export function checkPassageWords(t: ShapeTemplate, passage: string): string | null {
  const req = t.stimulusRequirements as { minWords?: number; maxWords?: number } | undefined
  if (!req) return null
  const wc = countWords(passage)
  if (req.minWords != null && wc < Number(req.minWords)) return `passage_too_short:${wc}<${req.minWords}`
  if (req.maxWords != null && wc > Number(req.maxWords)) return `passage_too_long:${wc}>${req.maxWords}`
  return null
}

export function shapeToItems(t: ShapeTemplate, raw: Record<string, unknown>): ShapeOutcome {
  const shape = String((t.answerSchema as { shape?: string }).shape ?? '')
  const passage = String(raw.passage ?? '')
  // 篇幅校验（按模板 stimulusRequirements.minWords/maxWords）——任何越界的 stimulus 必被拒。
  const wordErr = checkPassageWords(t, passage)
  if (wordErr) return { ok: false, reject: wordErr }

  if (shape === 'bank_answers') {
    const bank = Array.isArray(raw.bank) ? (raw.bank as unknown[]).map((x) => String(x)) : []
    const answers = Array.isArray(raw.answers) ? (raw.answers as unknown[]).map((x) => Number(x)) : []
    if (bank.length !== t.optionCount) return { ok: false, reject: 'bank_count' }
    if (answers.length !== t.itemCount) return { ok: false, reject: 'answers_count' }
    if (!allInts(answers) || !allDistinct(answers)) return { ok: false, reject: 'answers_not_unique_int' }
    if (answers.some((a) => a < 0 || a >= bank.length)) return { ok: false, reject: 'answer_out_of_range' }
    // seven_select（answerSchema.requireSentenceOptions 标志）：候选必须互不重复且为完整句子
    if ((t.answerSchema as { requireSentenceOptions?: boolean }).requireSentenceOptions) {
      const lc = bank.map((b) => b.trim().toLowerCase())
      if (new Set(lc).size !== bank.length) return { ok: false, reject: 'options_not_distinct' }
      for (const b of bank) {
        const bt = b.trim()
        if (countWords(bt) < 4) return { ok: false, reject: 'option_not_sentence' }
        if (!/^[A-Z]/.test(bt) || !/[.!?][)"'’”]?$/.test(bt)) return { ok: false, reject: 'option_not_full_sentence' }
      }
    }
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

  if (shape === 'cloze_passage') {
    // 整篇完形：passage + N 空，每空 4 选项、唯一正确。存储与迁移数据一致：
    // item.answer = [{ options:[4], answer:"<索引0-3>" }]，input_mode=multi_blank（评分 looseEq 解析索引）。
    const blanks = Array.isArray(raw.blanks) ? (raw.blanks as Record<string, unknown>[]) : []
    if (blanks.length !== t.itemCount) return { ok: false, reject: 'blanks_count' }
    const norm: { options: string[]; answer: string }[] = []
    for (const b of blanks) {
      const opts = Array.isArray(b.options) ? (b.options as unknown[]).map((x) => String(x)) : []
      if (opts.length !== t.optionCount) return { ok: false, reject: 'options_count' }
      const a = String(b.answer ?? '').trim()
      let ci = 'abcd'.indexOf(a.toLowerCase())
      if (ci < 0 || ci >= opts.length) ci = opts.findIndex((o) => o.toLowerCase() === a.toLowerCase())
      if (ci < 0) return { ok: false, reject: 'answer_not_in_options' }
      norm.push({ options: opts, answer: String(ci) })
    }
    return { ok: true, result: { stimulusText: passage, meta: {}, items: [{ inputMode: 'multi_blank', prompt: passage, promptZh: null, choices: [], answer: norm }] } }
  }

  if (shape === 'reading_multi') {
    // 多题阅读：一段 passage + N 道 4 选 1（中考/高考/CET/考研 reading）。
    // 每题 { prompt, options[optionCount], answer(文本或 A-D) }，答案须命中某选项。
    const qs = Array.isArray(raw.questions) ? (raw.questions as Record<string, unknown>[]) : []
    if (qs.length < 2 || qs.length > 10) return { ok: false, reject: 'questions_count' }
    const items: DraftItem[] = []
    for (const q of qs) {
      const opts = Array.isArray(q.options) ? (q.options as unknown[]).map((x) => String(x)) : []
      if (opts.length !== t.optionCount) return { ok: false, reject: 'options_count' }
      const prompt = String(q.prompt ?? '').trim()
      if (!prompt) return { ok: false, reject: 'prompt_empty' }
      const raw_ans = String(q.answer ?? '').trim()
      // answer 允许是 A-D 字母或选项文本
      let ci = 'abcd'.indexOf(raw_ans.toLowerCase())
      if (ci < 0 || ci >= opts.length) ci = opts.findIndex((o) => o.toLowerCase() === raw_ans.toLowerCase())
      if (ci < 0) return { ok: false, reject: 'answer_not_in_options' }
      items.push({ inputMode: 'choice', prompt, promptZh: null, choices: opts.map((text, i) => ({ id: 'abcd'[i], text })), answer: 'abcd'[ci] })
    }
    return { ok: true, result: { stimulusText: passage, meta: {}, items } }
  }

  if (shape === 'listening_multi') {
    // 听力理解：一段口语 transcript（passage=要朗读的对话/短文）+ N 道 4 选 1。
    // 与 reading_multi 同构，但 item.input_mode='listen'（transcript 经 R6 管线合成音频，答前不下发原文）。
    const qs = Array.isArray(raw.questions) ? (raw.questions as Record<string, unknown>[]) : []
    if (qs.length < 1 || qs.length > 10) return { ok: false, reject: 'questions_count' }
    const items: DraftItem[] = []
    for (const q of qs) {
      const opts = Array.isArray(q.options) ? (q.options as unknown[]).map((x) => String(x)) : []
      if (opts.length !== t.optionCount) return { ok: false, reject: 'options_count' }
      const prompt = String(q.prompt ?? '').trim()
      if (!prompt) return { ok: false, reject: 'prompt_empty' }
      const raw_ans = String(q.answer ?? '').trim()
      let ci = 'abcd'.indexOf(raw_ans.toLowerCase())
      if (ci < 0 || ci >= opts.length) ci = opts.findIndex((o) => o.toLowerCase() === raw_ans.toLowerCase())
      if (ci < 0) return { ok: false, reject: 'answer_not_in_options' }
      items.push({ inputMode: 'listen', prompt, promptZh: null, choices: opts.map((text, i) => ({ id: 'abcd'[i], text })), answer: 'abcd'[ci] })
    }
    return { ok: true, result: { stimulusText: passage, meta: {}, items } }
  }

  if (shape === 'speak_prompt') {
    // 口语任务（listen_and_repeat / interview_speaking）：script = 听到的口语提示（→ R6 合成音频，
    // 作答前以音频呈现，不下发文字），item.input_mode='speak'，rubric 评分（rubric_id 由导入器按 exam/skill 绑）。
    // 注意：script 存为 stimulusText（非 raw.passage），故模板 stimulusRequirements 不要设 min/max（顶层
    // checkPassageWords 针对 raw.passage）；script 词数边界在此硬校验。
    const prompt = String(raw.prompt ?? '').trim()
    const script = String(raw.script ?? '').trim()
    if (!prompt) return { ok: false, reject: 'prompt_empty' }
    if (!script) return { ok: false, reject: 'script_empty' }
    const sw = countWords(script)
    if (sw < 3) return { ok: false, reject: `script_too_short:${sw}` }
    if (sw > 90) return { ok: false, reject: `script_too_long:${sw}` }
    const refs = Array.isArray(raw.referencePoints) ? (raw.referencePoints as unknown[]).map((x) => String(x)) : []
    return { ok: true, result: { stimulusText: script, meta: {}, items: [{ inputMode: 'speak', prompt, promptZh: typeof raw.promptZh === 'string' ? raw.promptZh : null, choices: [], answer: { official: false, referencePoints: refs } }] } }
  }

  if (shape === 'complete_words') {
    // TOEFL Complete the Words：语境中补全被部分遮盖的词。passage 存完整上下文（词数准确）；
    // maskedForm 用 '_' 表示缺失字母，其余位置必须与 targetWord 完全一致；targetWord 必须在 passage
    // 中出现（答案可恢复上下文），其全部整词出现都替换为 maskedForm（不泄露未遮盖副本）。独立建模，不复用普通 spell。
    const targetWord = String(raw.targetWord ?? '').trim()
    const maskedForm = String(raw.maskedForm ?? '').trim()
    if (!targetWord) return { ok: false, reject: 'target_empty' }
    if (!maskedForm) return { ok: false, reject: 'masked_empty' }
    if (!/^[A-Za-z][A-Za-z'’-]*$/.test(targetWord)) return { ok: false, reject: 'target_not_word' }
    if (maskedForm.length !== targetWord.length) return { ok: false, reject: 'masked_length_mismatch' }
    let missing = 0
    for (let i = 0; i < maskedForm.length; i++) {
      const m = maskedForm[i]
      if (m === '_') missing++
      else if (m !== targetWord[i]) return { ok: false, reject: 'shown_letter_mismatch' }
    }
    if (missing === 0) return { ok: false, reject: 'no_missing_letter' }
    if (missing === maskedForm.length) return { ok: false, reject: 'all_letters_missing' }
    const esc = targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const wordRe = () => new RegExp(`(?<![A-Za-z'’-])${esc}(?![A-Za-z'’-])`, 'gi')
    if (!wordRe().test(passage)) return { ok: false, reject: 'target_not_in_passage' }
    const prompt = passage.replace(wordRe(), maskedForm)
    return { ok: true, result: { stimulusText: passage, meta: {}, items: [{ inputMode: 'spell', prompt, promptZh: null, choices: [], answer: targetWord }] } }
  }

  if (shape === 'build_sentence') {
    // TOEFL Build a Sentence：给打乱的词块，按语法重构通顺句子。chunks 互异、answer 为全排列
    // （每块恰用一次），prompt 不得泄露成句。answer 为 canonical/参考语序，**非唯一合法解**
    // （英语论元 PP 等可前置，存在自然替代语序）；机器评分的重构等价判定本项目未就绪 →
    // meta.scoringNotReady（保持 draft + promote 硬拦截，不作唯一答案自动判分）。
    const chunks = Array.isArray(raw.chunks) ? (raw.chunks as unknown[]).map((x) => String(x).trim()) : []
    const answer = Array.isArray(raw.answer) ? (raw.answer as unknown[]).map((x) => Number(x)) : []
    if (chunks.length < 3) return { ok: false, reject: 'chunks_too_few' }
    if (chunks.length > 12) return { ok: false, reject: 'chunks_too_many' }
    if (chunks.some((c) => !c)) return { ok: false, reject: 'chunk_empty' }
    if (new Set(chunks.map((c) => c.toLowerCase())).size !== chunks.length) return { ok: false, reject: 'chunks_not_distinct' }
    if (answer.length !== chunks.length) return { ok: false, reject: 'answer_length_mismatch' }
    if (!allInts(answer)) return { ok: false, reject: 'answer_not_int' }
    if (answer.some((a) => a < 0 || a >= chunks.length)) return { ok: false, reject: 'answer_out_of_range' }
    if (!allDistinct(answer)) return { ok: false, reject: 'answer_not_permutation' }
    const sentence = answer.map((i) => chunks[i]).join(' ')
    const prompt = String(raw.prompt ?? '').trim() || 'Arrange all the words and phrases below to form a correct, complete sentence.'
    if (prompt.toLowerCase().includes(sentence.toLowerCase())) return { ok: false, reject: 'prompt_leaks_answer' }
    return { ok: true, result: { stimulusText: null, meta: { scoringNotReady: true }, items: [{ inputMode: 'multi_blank', prompt, promptZh: null, choices: chunks.map((text, i) => ({ id: String(i), text })), answer }] } }
  }

  // single_choice（SAT 短 RW 单题）
  const options = Array.isArray(raw.options) ? (raw.options as unknown[]).map((x) => String(x)) : []
  if (options.length !== t.optionCount) return { ok: false, reject: 'options_count' }
  const correct = String(raw.answer ?? '').trim()
  const ci = options.findIndex((o) => o.toLowerCase() === correct.toLowerCase())
  if (ci < 0) return { ok: false, reject: 'answer_not_in_options' }
  // SAT domain 模板（answerSchema.domain 标志）：强制非空 prompt + domain 命中四大且匹配模板声明
  const expectDomain = (t.answerSchema as { domain?: string }).domain
  if (expectDomain != null) {
    const scPrompt = String(raw.prompt ?? '').trim()
    if (!scPrompt) return { ok: false, reject: 'prompt_empty' }
    const SAT_DOMAINS = ['Information and Ideas', 'Craft and Structure', 'Expression of Ideas', 'Standard English Conventions']
    const dom = String(raw.domain ?? '').trim()
    if (!dom) return { ok: false, reject: 'domain_missing' }
    if (!SAT_DOMAINS.includes(dom)) return { ok: false, reject: `domain_invalid:${dom}` }
    if (dom !== expectDomain) return { ok: false, reject: `domain_mismatch:${dom}!=${expectDomain}` }
  }
  return { ok: true, result: { stimulusText: passage, meta: {}, items: [{ inputMode: 'choice', prompt: String(raw.prompt ?? ''), promptZh: null, choices: options.map((text, i) => ({ id: 'abcd'[i], text })), answer: 'abcd'[ci] }] } }
}
