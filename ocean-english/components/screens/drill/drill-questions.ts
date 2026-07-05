/* drill-questions.ts — 自由练/试炼出题口 + 题库行适配
   出题口移植自原型 samples.jsx 的 buildSession；行→题目结构的映射对齐 /quiz 的 mapBankRow
   （components/quiz/LexiverseQuizClient.tsx），保证 22 个题型在所有等级都按正确语义渲染。 */

import { isDeprecatedQuestionType } from '@/lib/question-bank/question-type-taxonomy'

export interface DrillQuestion {
  id: string; wordId: string; type: string
  inputMode: 'choice' | 'spell'   // 作答控件
  isListen: boolean               // 听力题 → 播放按钮
  isReading: boolean              // 阅读题 → 屏显短文
  prompt: string; promptZh?: string; ask?: string; ipa?: string
  passage?: string; audioRef?: string
  opts?: string[]; ans?: number; answerText?: string
  word: string; wz?: string; ex?: string
}

interface QChoice { id: string; text: string }
interface QRow {
  id: string | number; type: string; input_mode?: string
  word_id?: string | number | null
  normalized_word?: string | null; prompt?: string | null; prompt_zh?: string | null
  choices?: QChoice[] | null; answer?: string | number | null; answer_text?: string | null
  hint?: { initials?: string; ipa?: string } | string | null
  audio_ref?: string | null; explanation_zh?: string | null; word_zh?: string | null
}

// 各题型固定提示语（与 /quiz BANK_ASK 一致）
const BANK_ASK: Record<string, string> = {
  en_to_zh: '选择正确的中文释义', zh_to_en: '选择对应的英文单词', def_to_word: '选择与释义匹配的单词',
  cloze_choice: '选词填空', zh_to_word_spell: '根据中文释义，拼出英文单词', word_form: '',
  synonym_choice: '选择与它意思最接近的词', confusable_choice: '选择与释义匹配的拼写',
  cloze_spell: '根据例句，敲出空格处的词', listen_to_meaning: '听发音，选出词义', dictation_spell: '听写：拼出你听到的单词',
  listening_comprehension: '听短文，回答下面的问题',
  reading_comprehension: '阅读短文，回答下面的问题',
  synonym_substitute: '选出与句中「」内词意思最接近的词',
  collocation_choice: '选出含该词的正确搭配',
}

// 阅读/听力短文题（其 word 是 passage id，不是词汇）—— 错题不入词级错题本、结果区不显示为词
export const PASSAGE_TYPES = new Set(['reading_comprehension', 'listening_comprehension'])

// /api/questions 原始行 → 答题屏题目结构（对齐 /quiz mapBankRow；无法作答的行返回 null）
function adapt(r: QRow): DrillQuestion | null {
  const dbType = r.type
  if (isDeprecatedQuestionType(dbType)) return null   // 退役题型不渲染（后端默认已不下发，双保险）
  const type = dbType
  const word = String(r.normalized_word ?? r.word_id ?? '')
  const wordId = String(r.word_id ?? word)
  const hint = r.hint && typeof r.hint === 'object' ? r.hint : undefined
  const ipa = hint?.ipa || undefined
  const isListen = r.input_mode === 'listen'
  const isReading = dbType === 'reading_comprehension'
  const audioRef = isListen ? (r.audio_ref ?? word) : undefined
  const passage = isReading ? (r.audio_ref ?? undefined) : undefined
  const choices = Array.isArray(r.choices) ? r.choices.filter(c => c && c.id && c.text) : []
  // 作答模式：spell（含听写：听力但选项<2）/ choice
  const inputMode: DrillQuestion['inputMode'] = r.input_mode === 'spell' ? 'spell' : (isListen && choices.length < 2 ? 'spell' : 'choice')
  const base = {
    id: String(r.id), wordId, word, type, isListen, isReading, audioRef, passage,
    ask: BANK_ASK[dbType] ?? '', ipa, wz: r.word_zh ?? '', ex: r.explanation_zh ?? '',
  }
  if (inputMode === 'choice') {
    if (choices.length < 2 || r.answer == null) return null
    const opts = choices.map(c => c.text)
    const ans = choices.findIndex(c => c.id === String(r.answer))
    if (ans < 0) return null
    return { ...base, inputMode: 'choice', prompt: r.prompt ?? '', promptZh: r.prompt_zh ?? undefined, opts, ans }
  }
  const answerText = String(r.answer_text ?? '')
  if (!answerText) return null
  return { ...base, inputMode: 'spell', prompt: r.prompt ?? '', promptZh: dbType === 'word_form' ? (r.prompt ?? '') : (r.prompt_zh ?? r.prompt ?? ''), answerText }
}

export { adapt }

// async；DrillScreen 的 BRun 已改为 await。服务端已随机+去重；无法作答的题型行被过滤。
export async function buildSession(types: string[], len: number, _shuffle: boolean, level?: number): Promise<DrillQuestion[]> {
  void _shuffle
  // Phase 0B：过滤退役题型，避免旧 UI 状态 / localStorage 配置请求 antonym_choice / cet_cloze
  const safe = (types ?? []).filter(x => !isDeprecatedQuestionType(x))
  if (types && types.length && !safe.length) return []   // 请求的全是退役题型 → 返回空，触发现有空状态
  const t = (safe.length ? safe : ['en_to_zh']).join(',')
  const lv = level ? `&level=${level}` : ''
  const res = await fetch(`/api/questions?types=${encodeURIComponent(t)}${lv}&limit=${Math.max(len, 8)}`).then(r => r.json()).catch(() => null)
  const rows: QRow[] = res?.ok && Array.isArray(res.data) ? res.data : []
  return rows.map(adapt).filter((q): q is DrillQuestion => q !== null)
}
