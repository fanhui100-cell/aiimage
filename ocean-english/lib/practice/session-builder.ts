/* ════════════════════════════════════════════════════════════════════════
   practice/session-builder.ts — 统一练习会话构建（Phase 4）

   - source='auto'：v2 表存在且有 active 数据 → 用 v2；否则回退 v1 question_bank。
   - source='v1' / 'v2'：强制对应来源。
   - 绝不返回退役题型（antonym_choice / cet_cloze）。
   - 空池：返回 { ok:true, source:'empty', items:[], warnings:[...] }，不报错。
   v1 抽题复用 lib/question-bank/question-api-utils（不改 /api/questions）。
   ════════════════════════════════════════════════════════════════════════ */
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  normalizeQuestionTypeForClient,
  questionTypeAliases,
} from '@/lib/question-bank/question-api-utils'
import {
  DEPRECATED_QUESTION_TYPES,
  EXAM_TASK_TYPES,
  isDeprecatedQuestionType,
  isWordUniverseType,
} from '@/lib/question-bank/question-type-taxonomy'
import { EXAM_ID_TO_LEVEL, getExamSpec, normalizeExamId } from '@/lib/exam-specs'
import { signAudioPath } from '@/lib/audio/audio-signing'
import type {
  BuildPracticeSessionInput,
  PracticeChoice,
  PracticeItem,
  PracticeSessionResponse,
} from './session-types'

const SEL_V1 = 'id,type,input_mode,word_id,normalized_word,prompt,prompt_zh,choices,answer,answer_text,hint,audio_ref,explanation_zh,exam_tags,theme_tags'
const DEPRECATED_FILTER = `(${DEPRECATED_QUESTION_TYPES.join(',')})`
const OBJECTIVE_SET = new Set<string>(EXAM_TASK_TYPES)

type V1Row = Record<string, unknown> & {
  id: string | number
  type: string
  input_mode?: string | null
  word_id?: string | null
  normalized_word?: string | null
  prompt?: string | null
  prompt_zh?: string | null
  choices?: { id: string; text: string }[] | null
  answer?: string | null
  answer_text?: string | null
  audio_ref?: string | null
  explanation_zh?: string | null
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(Number.isFinite(n) ? Math.floor(n) : lo, hi))
}

function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

function newSessionId(seed?: string): string {
  return seed ? `sess_${seed}` : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** 把请求题型展开为 DB 别名集合，剔除退役题型。 */
function expandTypes(types: string[]): string[] {
  const out = new Set<string>()
  for (const t of types) {
    if (isDeprecatedQuestionType(t)) continue
    for (const alias of questionTypeAliases(t)) out.add(alias)
  }
  return [...out]
}

// ── v1 行 → PracticeItem ────────────────────────────────────────────────────
function mapV1Row(row: V1Row): PracticeItem | null {
  const dbType = row.type
  const type = normalizeQuestionTypeForClient(dbType)
  const inputMode = (row.input_mode as string) || 'choice'
  const rawChoices = Array.isArray(row.choices) ? row.choices.filter((c) => c && c.id && c.text) : []
  const choices: PracticeChoice[] = rawChoices.map((c) => ({ id: c.id, text: c.text }))
  const isListen = inputMode === 'listen' || type === 'listening_comprehension'
  const isReading = type === 'reading_comprehension'
  const word = String(row.normalized_word ?? row.word_id ?? '')

  const item: PracticeItem = {
    id: `v1:${row.id}`,
    legacyQuestionId: String(row.id),
    type,
    inputMode,
    prompt: String(row.prompt ?? ''),
    promptZh: row.prompt_zh ?? undefined,
    choices: choices.length ? choices : undefined,
    answer: row.answer ?? null,
    answerText: row.answer_text ?? undefined,
    // v1 阅读：passage 文本存在 audio_ref（与旧 PromptCard 一致），映射成 stimulus 供阅读 stem 显示
    stimulus: isReading && row.audio_ref ? { kind: 'passage', textEn: String(row.audio_ref) } : undefined,
    audio: isListen ? { url: row.audio_ref ?? undefined } : null,
    targetWords: row.word_id ? [{ wordId: String(row.word_id), surface: word || undefined, role: 'tested_answer' }] : [],
    subskills: [],
    explanationZh: row.explanation_zh ?? undefined,
  }
  // 可作答性：有 ≥2 选项+answer（选择/听选）或有 answerText（拼写/听写）。
  // 注意：listening MCQ 的 input_mode 可能是 'listen'，仍按选择题判定，不能因缺 answerText 丢弃。
  const choiceValid = !!(item.choices && item.choices.length >= 2 && item.answer != null)
  const spellValid = !!(item.answerText && item.answerText.length > 0)
  if (!choiceValid && !spellValid) return null
  return item
}

interface V1Filter {
  word?: string
  wordId?: string
  types?: string[]   // 已展开（含别名、剔退役）
  level?: number
  exam?: string
}

async function fetchV1Pool(db: SupabaseClient, f: V1Filter, limit: number): Promise<V1Row[]> {
  const base = () => {
    let q = db.from('question_bank').select(SEL_V1).eq('status', 'active').eq('is_reviewed', true)
    if (f.wordId) q = q.eq('word_id', f.wordId)
    else if (f.word) q = q.eq('normalized_word', f.word)
    if (f.types && f.types.length) q = f.types.length > 1 ? q.in('type', f.types) : q.eq('type', f.types[0])
    else q = q.not('type', 'in', DEPRECATED_FILTER)
    if (f.exam) q = q.contains('exam_tags', [f.exam])
    if (f.level) q = q.contains('theme_tags', [`lv${f.level}`])
    return q
  }

  const byWord = !!(f.word || f.wordId)
  if (byWord) {
    const { data } = await base().limit(limit * 4)
    return shuffle(((data ?? []) as unknown as V1Row[]).slice()).slice(0, limit)
  }

  // 随机窗口：先数总量再随机偏移，避免每次只取 id 最小段
  let cq = db.from('question_bank').select('id', { count: 'exact', head: true }).eq('status', 'active').eq('is_reviewed', true)
  if (f.types && f.types.length) cq = f.types.length > 1 ? cq.in('type', f.types) : cq.eq('type', f.types[0])
  else cq = cq.not('type', 'in', DEPRECATED_FILTER)
  if (f.exam) cq = cq.contains('exam_tags', [f.exam])
  if (f.level) cq = cq.contains('theme_tags', [`lv${f.level}`])
  const { count } = await cq
  const total = count ?? 0
  if (!total) return []
  const win = Math.min(limit * 8, 500)
  const offset = total > win ? Math.floor(Math.random() * (total - win)) : 0
  const { data } = await base().order('id', { ascending: true }).range(offset, offset + win - 1)
  return shuffle(((data ?? []) as unknown as V1Row[]).slice()).slice(0, limit)
}

/** 从 examId 推断该档「v1 可用的客观考试题型」（用于 task 无 taskType 时）。 */
function objectiveTypesForExam(examId: string): { level?: number; types: string[] } {
  const id = normalizeExamId(examId)
  if (!id) return { types: [] }
  const spec = getExamSpec(id)
  const level = EXAM_ID_TO_LEVEL[id]
  if (!spec) return { level, types: [] }
  const types = new Set<string>()
  for (const sec of spec.sections) {
    for (const t of sec.taskTypes) if (OBJECTIVE_SET.has(t) && !isDeprecatedQuestionType(t)) types.add(t)
  }
  return { level, types: [...types] }
}

async function buildFromV1(
  db: SupabaseClient,
  input: BuildPracticeSessionInput,
  count: number,
  warnings: string[],
): Promise<PracticeItem[]> {
  const normExam = input.examId ? normalizeExamId(input.examId) : null
  const examLevel = normExam ? EXAM_ID_TO_LEVEL[normExam] : undefined

  if (input.mode === 'word') {
    if (!input.word && !input.wordId) {
      warnings.push('missing_word')
      return []
    }
    const rows = await fetchV1Pool(db, { word: input.word?.toLowerCase().trim(), wordId: input.wordId }, count)
    return rows.map(mapV1Row).filter((x): x is PracticeItem => x !== null)
  }

  if (input.mode === 'task') {
    const level = input.level ?? examLevel
    let requested: string[] = []
    if (input.taskType) requested = [input.taskType]
    else if (input.examId) requested = objectiveTypesForExam(input.examId).types
    if (!requested.length) {
      warnings.push('missing_task_type')
      return []
    }
    const expanded = expandTypes(requested)
    if (!expanded.length) {
      warnings.push('deprecated_type')
      return []
    }
    if (input.taskType && !OBJECTIVE_SET.has(input.taskType) && !isWordUniverseType(input.taskType)) {
      // 仅生产性任务（写作/翻译/口语等）v1 无题库；单词宇宙题型仍可按 type+level 抽
      warnings.push('no_v1_pool_for_task')
      return []
    }
    // 注意：question_bank.exam_tags 全库几乎为空，等级靠 theme_tags lvN（同 /api/mock-exam），故只按 level 过滤
    const rows = await fetchV1Pool(db, { types: expanded, level }, count)
    if (!rows.length) warnings.push('insufficient_pool')
    return rows.map(mapV1Row).filter((x): x is PracticeItem => x !== null)
  }

  if (input.mode === 'section') {
    const id = input.examId ? normalizeExamId(input.examId) : null
    const spec = id ? getExamSpec(id) : null
    const section = spec?.sections.find((s) => s.id === input.sectionId)
    if (!spec || !section) {
      warnings.push('unknown_section')
      return []
    }
    const objective = section.taskTypes.filter((t) => OBJECTIVE_SET.has(t) && !isDeprecatedQuestionType(t))
    if (!objective.length) {
      warnings.push('no_v1_pool_for_section')
      return []
    }
    const rows = await fetchV1Pool(db, { types: expandTypes(objective), level: EXAM_ID_TO_LEVEL[spec.id] }, count)
    if (!rows.length) warnings.push('insufficient_pool')
    return rows.map(mapV1Row).filter((x): x is PracticeItem => x !== null)
  }

  // mode === 'paper'
  const id = input.examId ? normalizeExamId(input.examId) : null
  const spec = id ? getExamSpec(id) : null
  if (!spec) {
    warnings.push('unknown_exam')
    return []
  }
  warnings.push('v1_paper_approximation')
  const out: PracticeItem[] = []
  const TOTAL_CAP = 50
  for (const section of spec.sections) {
    if (out.length >= TOTAL_CAP) break
    const objective = section.taskTypes.filter((t) => OBJECTIVE_SET.has(t) && !isDeprecatedQuestionType(t))
    if (!objective.length) continue
    const perSection = clamp(section.itemCount ?? 5, 1, 8)
    const rows = await fetchV1Pool(db, { types: expandTypes(objective), level: EXAM_ID_TO_LEVEL[spec.id] }, perSection)
    for (const r of rows.map(mapV1Row)) {
      if (!r) continue
      r.setId = section.id
      out.push(r)
      if (out.length >= TOTAL_CAP) break
    }
  }
  if (!out.length) warnings.push('insufficient_pool')
  return out
}

// ── v2 ──────────────────────────────────────────────────────────────────────
async function v2Available(db: SupabaseClient): Promise<boolean> {
  const { error } = await db.from('question_items').select('id').limit(1)
  return !error
}

/**
 * 从 v2 抽题。表不存在/无 active 数据时返回 []（调用方据此回退 v1）。
 * v2 题库当前未填充（schema 默认未应用），该路径在数据就绪后生效。
 */
// ── 分组完形重建（R3）──────────────────────────────────────────────────────────
// banked_cloze / grammar_fill 存为「一道 multi_blank + 含 (n) 标记的 passage」。服务端按
// 标记切段重建 ClozeBody（题面，无正解）+ review.cloze.key（正解,提交后才渲染）。复用既有
// MultiBlankRenderer（banked=词库模式 bank；grammar_fill=自由输入,提示 (hint) 作为段内文本保留）。
type ClozeTok = string | { blank: number }
const BLANK_MARK = /\((\d+)\)_*/g  // (1) 或 (1)______；词中括号(如 (surprising))非数字 → 不匹配,保留为提示文本
export function reconstructCloze(
  taskType: string, passage: string | null | undefined,
  choices: { id: string; text: string }[], answer: unknown,
  explanationZh: string,
): { clozeBody: { title?: string; ask?: string; segments: ClozeTok[]; bank?: string[] }; review: { cloze: { key: Record<number, string>; explanationZh: string } } } | null {
  if (!passage) return null
  const segments: ClozeTok[] = []
  const blankNums: number[] = []
  let last = 0, m: RegExpExecArray | null
  BLANK_MARK.lastIndex = 0
  while ((m = BLANK_MARK.exec(passage)) !== null) {
    if (m.index > last) segments.push(passage.slice(last, m.index))
    segments.push({ blank: Number(m[1]) })
    blankNums.push(Number(m[1]))
    last = m.index + m[0].length
  }
  if (!blankNums.length) return null
  if (last < passage.length) segments.push(passage.slice(last))
  const bank = (taskType === 'banked_cloze' && choices.length) ? choices.map((c) => c.text) : undefined
  const ans = Array.isArray(answer) ? answer : []
  const key: Record<number, string> = {}
  const acceptable: Record<number, string[]> = {}
  blankNums.forEach((n, i) => {
    const a = ans[i]
    if (taskType === 'banked_cloze') { const idx = typeof a === 'number' ? a : Number(a); key[n] = choices[idx]?.text ?? '' }
    else if (a && typeof a === 'object' && 'answer' in (a as object)) {
      // grammar_fill gblanks shape {answer, acceptable?, hint?}; 取主答案，acceptable 备选透传（渲染器支持后判分用）
      key[n] = String((a as { answer: unknown }).answer ?? '')
      const acc = (a as { acceptable?: unknown }).acceptable
      if (Array.isArray(acc) && acc.length) acceptable[n] = acc.map((x) => String(x))
    } else key[n] = typeof a === 'string' ? a : String(a ?? '')
  })
  const cloze: { key: Record<number, string>; acceptable?: Record<number, string[]>; explanationZh: string } = { key, explanationZh }
  if (Object.keys(acceptable).length) cloze.acceptable = acceptable
  return { clozeBody: { segments, ...(bank ? { bank } : {}) }, review: { cloze } }
}
const CLOZE_RECONSTRUCT = new Set(['banked_cloze', 'grammar_fill'])

// ── cloze_passage：逐空四选（每空自带 4 选项）──────────────────────────────────
// 存储：passage 含 (n)___ 标记；item.answer = [{answer: 选项序号字符串, options: [4 文本]}]（按空序）。
const BLANK_UND = /\((\d+)\)_+/g
export function reconstructPassageCloze(passage: string | null | undefined, answer: unknown, explanationZh: string):
  { passageClozeBody: { segments: (string | { blank: number; options: { id: string; text: string }[] })[] }; review: { passageCloze: { key: Record<number, string>; explanationZh: string } } } | null {
  if (!passage || !Array.isArray(answer)) return null
  const segs: (string | { blank: number; options: { id: string; text: string }[] })[] = []
  const nums: number[] = []
  let last = 0, m: RegExpExecArray | null
  BLANK_UND.lastIndex = 0
  while ((m = BLANK_UND.exec(passage)) !== null) {
    if (m.index > last) segs.push(passage.slice(last, m.index))
    nums.push(Number(m[1])); segs.push({ blank: Number(m[1]), options: [] }); last = m.index + m[0].length
  }
  if (!nums.length || nums.length !== answer.length) return null
  if (last < passage.length) segs.push(passage.slice(last))
  const key: Record<number, string> = {}
  let bi = 0
  for (const seg of segs) {
    if (typeof seg === 'object') {
      const a = answer[bi] as { answer?: unknown; options?: unknown }
      const opts = Array.isArray(a?.options) ? (a!.options as string[]) : []
      seg.options = opts.map((t, i) => ({ id: String(i), text: String(t) }))
      key[seg.blank] = String(a?.answer ?? '')
      bi++
    }
  }
  return { passageClozeBody: { segments: segs }, review: { passageCloze: { key, explanationZh } } }
}

// ── seven_select：七选五（5 空填 7 候选句，2 干扰）──────────────────────────────
const GAP_MARK = /\((\d+)\)/g
export function reconstructSevenSelect(passage: string | null | undefined, choices: { id: string; text: string }[], answer: unknown, explanationZh: string):
  { sevenSelectBody: { segments: (string | { gap: number })[]; candidates: { id: string; text: string }[] }; review: { sevenSelect: { key: Record<number, string>; explanationZh: string } } } | null {
  if (!passage || !Array.isArray(answer) || !choices.length) return null
  const segs: (string | { gap: number })[] = []
  const nums: number[] = []
  let last = 0, m: RegExpExecArray | null
  GAP_MARK.lastIndex = 0
  while ((m = GAP_MARK.exec(passage)) !== null) {
    if (m.index > last) segs.push(passage.slice(last, m.index))
    nums.push(Number(m[1])); segs.push({ gap: Number(m[1]) }); last = m.index + m[0].length
  }
  if (!nums.length || nums.length !== answer.length) return null
  if (last < passage.length) segs.push(passage.slice(last))
  const key: Record<number, string> = {}
  nums.forEach((n, i) => { const idx = typeof answer[i] === 'number' ? answer[i] as number : Number(answer[i]); key[n] = choices[idx]?.id ?? String(idx) })
  return { sevenSelectBody: { segments: segs, candidates: choices.map((c) => ({ id: c.id, text: c.text })) }, review: { sevenSelect: { key, explanationZh } } }
}

// ── para_match：段落信息匹配（陈述→段落字母，多对一）──────────────────────────
const PARA_MARK = /\[([A-Z])\]/g
export function reconstructParaMatch(passage: string | null | undefined, choices: { id: string; text: string }[], answer: unknown, explanationZh: string):
  { paraMatchBody: { paragraphs: { label: string; text: string }[]; statements: { id: string; text: string }[] }; review: { paraMatch: { key: Record<string, string>; explanationZh: string } } } | null {
  if (!passage || !Array.isArray(answer) || !choices.length) return null
  const paras: { label: string; text: string }[] = []
  const marks: { label: string; idx: number; end: number }[] = []
  let m: RegExpExecArray | null
  PARA_MARK.lastIndex = 0
  while ((m = PARA_MARK.exec(passage)) !== null) marks.push({ label: m[1], idx: m.index, end: m.index + m[0].length })
  if (!marks.length) return null
  marks.forEach((mk, i) => { const textEnd = i + 1 < marks.length ? marks[i + 1].idx : passage.length; paras.push({ label: mk.label, text: passage.slice(mk.end, textEnd).trim() }) })
  if (answer.length !== choices.length) return null
  const key: Record<string, string> = {}
  choices.forEach((c, i) => { const pIdx = typeof answer[i] === 'number' ? answer[i] as number : Number(answer[i]); key[c.id] = paras[pIdx]?.label ?? String.fromCharCode(65 + pIdx) })
  return { paraMatchBody: { paragraphs: paras, statements: choices.map((c) => ({ id: c.id, text: c.text })) }, review: { paraMatch: { key, explanationZh } } }
}

export function reconstructBuildSentence(
  prompt: string | null | undefined,
  promptZh: string | null | undefined,
  choices: { id: string; text: string }[],
  answer: unknown,
  explanationZh: string,
): { buildBody: { ask?: string; zh: string; tokens: { id: string; t: string }[] }; review: { build: { canonical: string[]; explanationZh?: string } } } | null {
  if (choices.length < 3) return null
  // accepted-sequence 契约（2026-07-05 Task 2）：answer 为 { canonical: string[], acceptedSequences, ... }
  // 对象 → 直接读 canonical 词块文本作参考语序；tokens 仍来自 choices（乱序词块）。
  if (answer && typeof answer === 'object' && !Array.isArray(answer) && Array.isArray((answer as { canonical?: unknown }).canonical)) {
    const canonical = ((answer as { canonical: unknown[] }).canonical).map((x) => String(x))
    if (canonical.length !== choices.length || canonical.some((t) => !t.trim())) return null
    return {
      buildBody: {
        ask: prompt || 'Arrange all chunks into a natural English sentence.',
        zh: promptZh || prompt || 'Arrange all chunks into a natural English sentence.',
        tokens: choices.map((c) => ({ id: c.id, t: c.text })),
      },
      review: { build: { canonical, ...(explanationZh ? { explanationZh } : {}) } },
    }
  }
  if (!Array.isArray(answer)) return null
  const ids = choices.map((c) => c.id)
  const answerIds = answer.map((x) => String(x))
  if (answerIds.length !== ids.length) return null
  if (new Set(answerIds).size !== answerIds.length) return null
  if (answerIds.some((id) => !ids.includes(id))) return null
  const byId = new Map(choices.map((c) => [c.id, c.text]))
  return {
    buildBody: {
      ask: prompt || 'Arrange all chunks into a natural English sentence.',
      zh: promptZh || prompt || 'Arrange all chunks into a natural English sentence.',
      tokens: choices.map((c) => ({ id: c.id, t: c.text })),
    },
    review: {
      build: {
        canonical: answerIds.map((id) => byId.get(id) ?? id),
        ...(explanationZh ? { explanationZh } : {}),
      },
    },
  }
}

async function tryBuildFromV2(
  db: SupabaseClient,
  input: BuildPracticeSessionInput,
  count: number,
): Promise<PracticeItem[]> {
  if (!(await v2Available(db))) return []

  // 1)+2) 选 active 题组与题目。word 模式走 target-word-first（先按目标词查 question_target_words
  //   得 item，再回查 active set），避免「先抽一批题再过滤目标词」导致的假空池（P1-6）；
  //   其余模式 set-first（按 examId/sectionId/taskType/level 抽）。全程排除退役题型。
  type SetRow = { id: string; section_id: string | null; task_type: string; stimulus_id: string | null }
  const isWordMode = input.mode === 'word' && !!(input.wordId || input.word)
  let sets: SetRow[] = []
  let items: Record<string, unknown>[] = []

  if (isWordMode) {
    // ① 先按目标词查命中的 item（target-word-first）
    let tw = db.from('question_target_words').select('question_item_id')
    if (input.wordId) tw = tw.eq('word_id', input.wordId)
    else tw = tw.ilike('surface', (input.word ?? '').trim())
    const { data: twData } = await tw.limit(count * 16)
    const targetItemIds = [...new Set((twData ?? []).map((r: { question_item_id: string }) => String(r.question_item_id)))]
    if (!targetItemIds.length) return []
    // ② 这些 item 的 active 题目
    const { data: itemsData } = await db.from('question_items')
      .select('id, question_set_id, input_mode, prompt, prompt_zh, choices, answer, explanation_zh, subskills')
      .eq('status', 'active').in('id', targetItemIds).limit(count * 4)
    items = (itemsData ?? []) as Record<string, unknown>[]
    if (!items.length) return []
    // ③ 回查这些 item 所属 active set（排除退役题型；可选按 examId/level 收窄）
    const wantSetIds = [...new Set(items.map((i) => String(i.question_set_id)))]
    let setsQ = db.from('question_sets').select('id, section_id, task_type, stimulus_id')
      .eq('status', 'active').in('id', wantSetIds).not('task_type', 'in', DEPRECATED_FILTER)
    if (input.examId) { const norm = normalizeExamId(input.examId); if (norm) setsQ = setsQ.eq('exam_id', norm) }
    if (input.level) setsQ = setsQ.eq('level', input.level)
    const { data: setsData, error: setsErr } = await setsQ.limit(200)
    if (setsErr) return []
    sets = ((setsData ?? []) as SetRow[]).filter((s) => !isDeprecatedQuestionType(s.task_type))
    if (!sets.length) return []
    const activeSetIds = new Set(sets.map((s) => s.id))
    items = items.filter((i) => activeSetIds.has(String(i.question_set_id)))
    if (!items.length) return []
  } else {
    // set-first：按 examId/sectionId/taskType/level 抽 active 题组（taskType 缺省 → 该考试混合题）
    let setsQ = db.from('question_sets').select('id, section_id, task_type, stimulus_id')
      .eq('status', 'active').not('task_type', 'in', DEPRECATED_FILTER)
    if (input.examId) { const norm = normalizeExamId(input.examId); if (norm) setsQ = setsQ.eq('exam_id', norm) }
    if (input.sectionId) setsQ = setsQ.eq('section_id', input.sectionId)
    if (input.taskType && !isDeprecatedQuestionType(input.taskType)) setsQ = setsQ.eq('task_type', input.taskType)
    if (input.level) setsQ = setsQ.eq('level', input.level)
    const { data: setsData, error: setsErr } = await setsQ.limit(200)
    if (setsErr) return []
    sets = ((setsData ?? []) as SetRow[]).filter((s) => !isDeprecatedQuestionType(s.task_type))
    if (!sets.length) return []
    const setIds = sets.map((s) => s.id)
    const { data: itemsData } = await db.from('question_items')
      .select('id, question_set_id, input_mode, prompt, prompt_zh, choices, answer, explanation_zh, subskills')
      .eq('status', 'active').in('question_set_id', setIds).limit(count * 4)
    items = (itemsData ?? []) as Record<string, unknown>[]
  }
  if (!items.length) return []
  const setById = new Map(sets.map((s) => [s.id, s]))

  // 3) 目标词 + 材料 + 音频
  const itemIds = items.map((i) => String(i.id))
  const { data: twAll } = await db
    .from('question_target_words')
    .select('question_item_id, word_id, surface, role, sense_key, dimension')
    .in('question_item_id', itemIds)
  const twByItem = new Map<string, { word_id: string | null; surface: string | null; role: string; sense_key: string | null; dimension: string | null }[]>()
  for (const r of (twAll ?? []) as { question_item_id: string; word_id: string | null; surface: string | null; role: string; sense_key: string | null; dimension: string | null }[]) {
    const arr = twByItem.get(r.question_item_id) ?? []
    arr.push(r)
    twByItem.set(r.question_item_id, arr)
  }

  const stimulusIds = [...new Set(sets.map((s) => s.stimulus_id).filter((x): x is string => !!x))]
  const stimById = new Map<string, { id: string; kind: string; title: string | null; text_en: string | null; text_zh: string | null }>()
  // 仅取可播放字段：练习载荷绝不下发 transcript（答题后由 audio-asset-client review 模式拉）。
  // 私有桶：DB 存的是对象路径(storage_path)，此处服务端现签短时 URL 下发，绝不下发公开 URL/路径。
  const audioByStim = new Map<string, { url: string }>()
  if (stimulusIds.length) {
    const { data: stims } = await db.from('stimuli').select('id, kind, title, text_en, text_zh').in('id', stimulusIds).eq('qa_status', 'active')
    for (const s of (stims ?? []) as { id: string; kind: string; title: string | null; text_en: string | null; text_zh: string | null }[]) stimById.set(s.id, s)
    const { data: auds } = await db.from('audio_assets').select('stimulus_id, url, storage_path').in('stimulus_id', stimulusIds).eq('qa_status', 'active')
    const audRows = (auds ?? []) as { stimulus_id: string; url: string; storage_path: string | null }[]
    // 一个 stimulus 可能有多条 active 音频行：先按 stimulus_id 去重（每 stimulus 取一条）再签，避免对同一 stimulus 重复现签。
    const byStim = new Map<string, { stimulus_id: string; url: string; storage_path: string | null }>()
    for (const a of audRows) if (a.stimulus_id && !byStim.has(a.stimulus_id)) byStim.set(a.stimulus_id, a)
    const uniqAud = [...byStim.values()]
    // 私有桶 → 短时签名 https；并行现签（避免逐个 await 串行拖慢，与 paper-generator 一致）
    const audSigned = await Promise.all(uniqAud.map((a) => signAudioPath(a.storage_path ?? a.url)))
    uniqAud.forEach((a, k) => {
      if (audSigned[k]) audioByStim.set(a.stimulus_id, { url: audSigned[k]! })
      else if (/^(https?:)?\/\//.test(a.url) || a.url?.startsWith('/')) audioByStim.set(a.stimulus_id, { url: a.url }) // 历史公开 URL 兜底
    })
  }

  const built: PracticeItem[] = []
  for (const it of items.slice(0, count)) {
    const id = String(it.id)
    const set = setById.get(String(it.question_set_id))
    const stim = set?.stimulus_id ? stimById.get(set.stimulus_id) : undefined
    const audio = set?.stimulus_id ? audioByStim.get(set.stimulus_id) : undefined
    const choicesRaw = Array.isArray(it.choices) ? (it.choices as { id: string; text: string }[]) : []
    // 听力材料：text_en/text_zh 即原文(transcript)，练习态不下发（避免答前暴露）；阅读等保留材料文本。
    const isListening = set?.task_type === 'listening_comprehension' || String(it.input_mode) === 'listen'
    // 拼写型（spell）/ complete_the_words：stimulus 文本是含完整答案词的句子（prompt 已是挖空版自带题面），
    //   整体不下发 stimulus，杜绝答案文本进入客户端 payload（审计 P1）。dictation_spell 是 input_mode='listen'
    //   不在此列，其音频走听力分支不受影响。
    const isSpellAnswerLeak = String(it.input_mode) === 'spell' || set?.task_type === 'complete_the_words'
    // 分组阅读/完形型：passage 重建为题体（body 即题面）→ stimulus 不再重复下发 passage。
    const taskType = set?.task_type ?? 'unknown'
    const exZh = (it.explanation_zh as string) ?? ''
    const cloze = CLOZE_RECONSTRUCT.has(taskType) ? reconstructCloze(taskType, stim?.text_en, choicesRaw, it.answer, exZh) : null
    const pcloze = taskType === 'cloze_passage' ? reconstructPassageCloze(stim?.text_en, it.answer, exZh) : null
    const seven = taskType === 'seven_select' ? reconstructSevenSelect(stim?.text_en, choicesRaw, it.answer, exZh) : null
    const pmatch = taskType === 'para_match' ? reconstructParaMatch(stim?.text_en, choicesRaw, it.answer, exZh) : null
    const build = taskType === 'build_a_sentence'
      ? reconstructBuildSentence(String(it.prompt ?? ''), (it.prompt_zh as string) ?? null, choicesRaw, it.answer, exZh)
      : null
    const grouped = cloze || pcloze || seven || pmatch || build
    const stimulusOut = stim && !grouped && !isSpellAnswerLeak
      ? { kind: stim.kind, title: stim.title ?? undefined, textEn: isListening ? undefined : (stim.text_en ?? undefined), textZh: isListening ? undefined : (stim.text_zh ?? undefined), audioUrl: audio?.url }
      : undefined
    // 【学习模式即时反馈，审计 P2-1】下发 answer / explanationZh / review(key)：客户端即时判分并显示解析，
    // 是练习（非考试）的有意取舍。防作弊考试（限时/排行/正式分）必须走 /api/papers 服务端判分（已剥前置答案）；
    // 普通 /api/practice/session 属「学习模式安全级」，不可作防作弊考试入口。
    built.push({
      id: `v2:${id}`,
      questionItemId: id,
      setId: set?.id,
      type: taskType,
      inputMode: build ? 'build_sentence' : String(it.input_mode ?? 'choice'),
      prompt: String(it.prompt ?? ''),
      promptZh: (it.prompt_zh as string) ?? undefined,
      // 分组型题面在各自 body；choices 是词库/候选/陈述，不作为通用 MCQ 选项下发。
      choices: (!grouped && choicesRaw.length) ? choicesRaw.map((c) => ({ id: c.id, text: c.text })) : undefined,
      answer: (it.answer as string | string[] | null) ?? null,
      stimulus: stimulusOut,
      audio: audio ? { url: audio.url } : null,
      stimulusId: set?.stimulus_id ?? undefined,
      targetWords: (twByItem.get(id) ?? []).map((t) => ({ wordId: t.word_id ?? undefined, surface: t.surface ?? undefined, role: t.role, senseKey: t.sense_key ?? undefined, dimension: t.dimension ?? undefined })),
      subskills: Array.isArray(it.subskills) ? (it.subskills as string[]) : [],
      explanationZh: (it.explanation_zh as string) ?? undefined,
      ...(cloze ? { clozeBody: cloze.clozeBody, review: cloze.review } : {}),
      ...(pcloze ? { passageClozeBody: pcloze.passageClozeBody, review: pcloze.review } : {}),
      ...(seven ? { sevenSelectBody: seven.sevenSelectBody, review: seven.review } : {}),
      ...(pmatch ? { paraMatchBody: pmatch.paraMatchBody, review: pmatch.review } : {}),
      ...(build ? { buildBody: build.buildBody, review: build.review } : {}),
    })
  }
  return built
}

// ── 入口 ────────────────────────────────────────────────────────────────────
export async function buildPracticeSession(
  db: SupabaseClient,
  input: BuildPracticeSessionInput,
): Promise<PracticeSessionResponse> {
  const sessionId = newSessionId(input.seed)
  const count = clamp(input.count ?? 10, 1, 50)
  const source = input.source ?? 'auto'
  const warnings: string[] = []

  // 硬拦截：退役题型一律空池，v1/v2/auto 都不再查询（Never return deprecated types）。
  if (input.taskType && isDeprecatedQuestionType(input.taskType)) {
    return { ok: true, source: 'empty', sessionId, mode: input.mode, items: [], warnings: ['deprecated_type'] }
  }

  // draft / coming_soon 考试不对用户开放（与 /papers 一致）：仅考试专项练习（mode='task' + examId）拦，
  // 词宇宙练词（mode='word'，跨考试）不受影响。
  if (input.mode === 'task' && input.examId) {
    const spec = getExamSpec(normalizeExamId(input.examId) ?? input.examId)
    if (spec && spec.status !== 'active') {
      return { ok: true, source: 'empty', sessionId, mode: input.mode, items: [], warnings: [spec.status === 'coming_soon' ? 'exam_coming_soon' : 'exam_not_active'] }
    }
  }

  let items: PracticeItem[] = []
  let used: 'v1' | 'v2' | 'empty' = 'empty'

  if (source === 'v2') {
    items = await tryBuildFromV2(db, input, count).catch(() => [])
    if (!items.length) warnings.push('v2_unavailable_or_empty')
    used = items.length ? 'v2' : 'empty'
  } else if (source === 'v1') {
    items = await buildFromV1(db, input, count, warnings)
    used = items.length ? 'v1' : 'empty'
  } else {
    // auto：v2 优先，空则回退 v1
    items = await tryBuildFromV2(db, input, count).catch(() => [])
    if (items.length) {
      used = 'v2'
    } else {
      items = await buildFromV1(db, input, count, warnings)
      used = items.length ? 'v1' : 'empty'
    }
  }

  if (!items.length) {
    if (!warnings.length) warnings.push('insufficient_pool')
    return { ok: true, source: 'empty', sessionId, mode: input.mode, items: [], warnings }
  }
  return { ok: true, source: used, sessionId, mode: input.mode, items, warnings }
}
