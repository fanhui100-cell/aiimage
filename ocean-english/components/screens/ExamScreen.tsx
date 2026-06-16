'use client'

/* ════════════════════════════════════════════════════════════════════════
   试炼 LexiTrial（界面优化14 · 提示词2）—— 替换 BOSS CHALLENGE / 词汇大考验
   3 阶段：intro（试炼卡 + 配置）→ run（多题型引擎，按 inputMode 分流：
   choice / spell / listen）→ result（过线点亮星系 + skillTags 能力维度 + 错词回流）。
   题源：question_bank（96k，/api/questions?types= 多题型混合取样）；DB 空回退
   distractorsFor。星光紫标识，答对/掌握青绿。字段（type/skillTags/difficulty…）透传。
   ════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLexiStore } from '@/store/lexiStore'
import { useNavigate } from '@/hooks/useNavigate'
import { speakSmart } from '@/lib/pronunciation/word-audio'
import './lexitrial.css'

type TInputMode = 'choice' | 'spell' | 'listen'
type TChoice = { id: string; text: string }
type TQ = {
  id: string; type: string; inputMode: TInputMode
  wordId: string; word: string
  prompt: string; promptZh: string; phon?: string
  choices?: TChoice[]; answer?: string; answerText?: string
  hint?: { initials?: string; ipa?: string }; audioRef?: string; passage?: string
  blanks?: { options: string[]; answer: number; explain?: string }[]   // 完形填空(整篇)逐空
  bank?: string[]; gapAns?: number[]                                    // 七选五/选词填空：候选项 + 各空答案下标
  statements?: string[]; paraCount?: number                             // 长篇匹配：陈述句 + 段数（答案在 gapAns）
  gblanks?: { answer: string; hint?: string; explain?: string }[]       // 语法填空：逐空自由填词
  explanationZh: string; skillTags: string[]; examTags: string[]; difficultyLevel: number
  wordZh?: string                                                       // 该词中文释义（反馈先讲词义）
}

const TYPE_LABEL: Record<string, string> = {
  en_to_zh: '英译中', zh_to_en: '中译英', def_to_word: '看释义选词', synonym_choice: '近义词',
  confusable_choice: '易混辨析', cloze_choice: '例句填空', cet_cloze: '完形填空',
  zh_to_word_spell: '看中文拼写', word_form: '词形变化', listen_to_word: '听音选词',
  cloze_spell: '例句拼写', listen_to_meaning: '听音选义', dictation_spell: '听写', listening_comprehension: '听力理解',
  reading_comprehension: '阅读理解', antonym_choice: '反义词', synonym_substitute: '同义替换', collocation_choice: '搭配', cloze_passage: '完形填空', seven_select: '七选五', banked_cloze: '选词填空', para_match: '长篇匹配', grammar_fill: '语法填空',
}
const ASK: Record<string, string> = {
  antonym_choice: '选出与它意思相反的词',
  en_to_zh: '选出正确的中文意思', zh_to_en: '选出正确的英文单词', def_to_word: '看释义选出单词',
  synonym_choice: '选出最接近的同义词', confusable_choice: '看释义选出正确拼写',
  cloze_choice: '选词填入空格', cet_cloze: '选词填入空格',
  zh_to_word_spell: '根据中文释义拼出英文单词', word_form: '拼出正确的词形', listen_to_word: '听发音，选出对应单词',
  cloze_spell: '根据例句敲出空格处的词', listen_to_meaning: '听发音，选出词义', dictation_spell: '听写：拼出你听到的单词',
  listening_comprehension: '听短文，回答下面的问题',
  reading_comprehension: '阅读短文，回答下面的问题',
}
const SKILL_OF: Record<string, string> = {
  en_to_zh: 'translation', zh_to_en: 'translation', def_to_word: 'definition', synonym_choice: 'synonym',
  confusable_choice: 'usage', cloze_choice: 'usage', cet_cloze: 'usage',
  zh_to_word_spell: 'spelling', word_form: 'word_form', listen_to_word: 'listening',
  cloze_spell: 'spelling', listen_to_meaning: 'listening', dictation_spell: 'listening', listening_comprehension: 'listening',
  reading_comprehension: 'reading', antonym_choice: 'antonym', synonym_substitute: 'synonym', collocation_choice: 'collocation', cloze_passage: 'cloze', seven_select: 'reading', banked_cloze: 'reading', para_match: 'reading', grammar_fill: 'word_form',
}
const SKILL_LABEL: Record<string, string> = {
  translation: '翻译', definition: '释义', synonym: '近义', usage: '用法', collocation: '搭配',
  spelling: '拼写', word_form: '词形', listening: '听力', reading: '阅读', antonym: '反义', cloze: '完形',
}
const EXAM_TO_LEVEL: Record<string, number | undefined> = { '综合': undefined, '初中': 1, '高中': 2, 'CET-4': 3, 'CET-6': 4, '考研': 5, 'TOEFL': 6, 'SAT': 7 }
const MIX_TYPES: Record<string, string[]> = {
  mixed: ['en_to_zh', 'synonym_choice', 'antonym_choice', 'synonym_substitute', 'collocation_choice', 'cloze_choice', 'confusable_choice', 'zh_to_word_spell', 'listen_to_meaning', 'cloze_spell', 'reading_comprehension', 'cloze_passage', 'seven_select', 'banked_cloze', 'para_match', 'grammar_fill'],
  choice: ['en_to_zh', 'synonym_choice', 'antonym_choice', 'synonym_substitute', 'collocation_choice', 'cloze_choice', 'confusable_choice', 'def_to_word', 'zh_to_en'],
  spell: ['zh_to_word_spell', 'word_form', 'cloze_spell', 'dictation_spell'],
  listen: ['listen_to_meaning', 'dictation_spell', 'listening_comprehension'],
  read: ['reading_comprehension'],
  cloze: ['cloze_passage'],
  sevenselect: ['seven_select'],
  banked: ['banked_cloze'],
  match: ['para_match'],
  grammar: ['grammar_fill'],
}
const DIM_OF: Record<string, string> = {
  en_to_zh: 'recognize', zh_to_en: 'recognize', def_to_word: 'recognize', synonym_choice: 'recognize', confusable_choice: 'recognize', cloze_choice: 'recognize', cet_cloze: 'recognize',
  zh_to_word_spell: 'spell', word_form: 'spell', cloze_spell: 'spell',
  listen_to_meaning: 'listen', listen_to_word: 'listen', dictation_spell: 'listen', listening_comprehension: 'listen',
  reading_comprehension: 'recognize', antonym_choice: 'recognize', synonym_substitute: 'recognize', collocation_choice: 'recognize', cloze_passage: 'recognize', seven_select: 'recognize', banked_cloze: 'recognize', para_match: 'recognize', grammar_fill: 'spell',
}
const SECS_PER_Q = 20
// 返工FIX4：限时按「题型基准秒 × 等级系数」动态合成（不再固定 20s/题）
const BASE_SECS: Record<string, number> = {
  en_to_zh: 14, zh_to_en: 14, def_to_word: 14, synonym_choice: 14, antonym_choice: 14, synonym_substitute: 14,
  cloze_choice: 18, cet_cloze: 18, collocation_choice: 18, confusable_choice: 18,
  listen_to_word: 22, listen_to_meaning: 22,
  zh_to_word_spell: 26, word_form: 26, cloze_spell: 26,
  dictation_spell: 30, reading_comprehension: 40, listening_comprehension: 55,
  grammar_fill: 130, seven_select: 100, banked_cloze: 130, para_match: 150,
}
const LEVEL_FACTOR: Record<number, number> = { 1: 0.85, 2: 0.90, 3: 1.00, 4: 1.08, 5: 1.18, 6: 1.28, 7: 1.40 }
function secondsFor(type: string, level?: number) {
  const base = type === 'cloze_passage' ? 0 : (BASE_SECS[type] ?? SECS_PER_Q)
  const f = LEVEL_FACTOR[level ?? 3] ?? 1
  return Math.round(base * f)
}
const PASS_PCT = 80
// 短文题按短文计（wordId=passage），不进词级错题本
const PASSAGE_KEYED = new Set(['listening_comprehension', 'reading_comprehension', 'cloze_passage', 'seven_select', 'banked_cloze', 'para_match', 'grammar_fill'])
// 听力题放慢并咬字更清楚（slow）；单词仍优先真人音频
const speak = (t: string, slow = false) => { void speakSmart(t, 'us', { slow }) }
// 去掉解析开头重复的单词（含可能的「（释义）」），反馈区先讲词义再讲要点
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const stripLeadWord = (exp: string, word: string): string => {
  const out = exp.replace(new RegExp('^\\s*' + escapeRe(word) + '\\s*(（[^）]*）)?\\s*[—:：-]?\\s*', 'i'), '').trim()
  return out || exp
}

interface BankRow { id: string; type: string; input_mode: string; word_id: string | null; normalized_word: string | null; prompt: string | null; prompt_zh: string | null; choices: TChoice[] | null; answer: string | null; answer_text: string | null; hint: { initials?: string; ipa?: string; blanks?: { options: string[]; answer: number; explain?: string }[]; bank?: string[]; answers?: number[]; statements?: string[]; paras?: number; gblanks?: { answer: string; hint?: string; explain?: string }[] } | null; audio_ref: string | null; explanation_zh: string | null; exam_tags: string[] | null; theme_tags: string[] | null; word_zh?: string | null }

function mapTQ(r: BankRow): TQ | null {
  const type = r.type
  const hint = r.hint && typeof r.hint === 'object' ? r.hint : undefined
  const word = String(r.normalized_word ?? r.word_id ?? '')
  const lvOf = (r.theme_tags ?? []).map(t => /^lv(\d)/.exec(t)?.[1]).find(Boolean)
  // 完形填空(整篇)：整篇 1 行，逐空在 hint.blanks，短文在 audio_ref
  if (type === 'cloze_passage') {
    const blanks = (hint?.blanks ?? []).filter(b => Array.isArray(b.options) && b.options.length === 4 && b.answer >= 0 && b.answer < 4)
    if (blanks.length < 3 || !r.audio_ref) return null
    return {
      id: r.id, type, inputMode: 'choice', wordId: r.word_id ?? word, word,
      prompt: '', promptZh: r.prompt_zh ?? '完形填空 · 选出每空最佳选项',
      passage: r.audio_ref, blanks,
      explanationZh: r.explanation_zh ?? '', skillTags: [SKILL_OF[type] ?? 'cloze'],
      examTags: r.exam_tags ?? [], difficultyLevel: Math.min(Math.max(Number(lvOf ?? 3), 1), 5),
    }
  }
  // 候选库+空位指派（七选五 / 选词填空）：整篇 1 行，bank=候选项、gapAns=各空答案下标
  if (type === 'seven_select' || type === 'banked_cloze') {
    const bank = hint?.bank ?? []; const gapAns = hint?.answers ?? []
    if (bank.length < 4 || gapAns.length < 3 || bank.length < gapAns.length || !r.audio_ref) return null
    return {
      id: r.id, type, inputMode: 'choice', wordId: r.word_id ?? word, word,
      prompt: '', promptZh: r.prompt_zh ?? (type === 'banked_cloze' ? '选词填空 · 从词库为每空选词' : '七选五 · 为每空选最佳句子'),
      passage: r.audio_ref, bank, gapAns,
      explanationZh: r.explanation_zh ?? '', skillTags: [SKILL_OF[type] ?? 'reading'],
      examTags: r.exam_tags ?? [], difficultyLevel: Math.min(Math.max(Number(lvOf ?? 3), 1), 5),
    }
  }
  // 长篇阅读匹配：陈述句 statements + 段数 paraCount + 答案 gapAns（段下标），长文在 audio_ref
  if (type === 'para_match') {
    const statements = hint?.statements ?? []; const gapAns = hint?.answers ?? []; const paraCount = hint?.paras ?? 0
    if (statements.length < 3 || gapAns.length !== statements.length || paraCount < 2 || !r.audio_ref) return null
    return {
      id: r.id, type, inputMode: 'choice', wordId: r.word_id ?? word, word,
      prompt: '', promptZh: r.prompt_zh ?? '长篇阅读匹配 · 为每个陈述选出含其信息的段落',
      passage: r.audio_ref, statements, gapAns, paraCount,
      explanationZh: r.explanation_zh ?? '', skillTags: [SKILL_OF[type] ?? 'reading'],
      examTags: r.exam_tags ?? [], difficultyLevel: Math.min(Math.max(Number(lvOf ?? 3), 1), 5),
    }
  }
  // 语法填空：逐空自由填词，gblanks 在 hint，短文在 audio_ref
  if (type === 'grammar_fill') {
    const gblanks = (hint?.gblanks ?? []).filter(b => b && typeof b.answer === 'string' && b.answer)
    if (gblanks.length < 4 || !r.audio_ref) return null
    return {
      id: r.id, type, inputMode: 'choice', wordId: r.word_id ?? word, word,
      prompt: '', promptZh: r.prompt_zh ?? '语法填空 · 逐空填入正确的词',
      passage: r.audio_ref, gblanks,
      explanationZh: r.explanation_zh ?? '', skillTags: [SKILL_OF[type] ?? 'word_form'],
      examTags: r.exam_tags ?? [], difficultyLevel: Math.min(Math.max(Number(lvOf ?? 3), 1), 5),
    }
  }
  const choices = Array.isArray(r.choices) ? r.choices.filter(c => c?.id && c?.text) : undefined
  const isListen = r.input_mode === 'listen'
  const isReading = type === 'reading_comprehension'
  // 答题模式：spell（含听写）/ listen+choice（听音选义/选词）/ choice
  const im: TInputMode = r.input_mode === 'spell' ? 'spell'
    : isListen ? (choices && choices.length >= 2 ? 'listen' : 'spell')
      : 'choice'
  const lvTag = (r.theme_tags ?? []).map(t => /^lv(\d)/.exec(t)?.[1]).find(Boolean)
  const tq: TQ = {
    id: r.id, type, inputMode: im, wordId: r.word_id ?? word, word,
    prompt: r.prompt ?? '', promptZh: ASK[type] ?? r.prompt_zh ?? '',
    phon: (type === 'en_to_zh' || type === 'synonym_choice') ? (hint?.ipa || '') : '',
    choices, answer: r.answer ?? undefined, answerText: r.answer_text ?? undefined, hint,
    audioRef: isListen ? (r.audio_ref ?? word) : undefined,
    passage: isReading ? (r.audio_ref ?? '') : undefined,
    explanationZh: r.explanation_zh ?? '', skillTags: [SKILL_OF[type] ?? 'usage'],
    examTags: r.exam_tags ?? [], difficultyLevel: Math.min(Math.max(Number(lvTag ?? 3), 1), 5),
    wordZh: r.word_zh ?? undefined,
  }
  if (im === 'choice' && (!tq.choices || tq.choices.length < 2 || !tq.answer)) return null
  if (im === 'listen' && (!tq.choices || tq.choices.length < 2 || !tq.answer)) return null
  if (im === 'spell' && !tq.answerText) return null
  return tq
}
function toListen(tq: TQ): TQ | null {
  if (tq.inputMode !== 'choice' || !tq.choices || !tq.answer) return null
  if (!['synonym_choice', 'confusable_choice', 'zh_to_en', 'def_to_word'].includes(tq.type)) return null
  const correct = tq.choices.find(c => c.id === tq.answer)?.text
  if (!correct || !/^[a-zA-Z]/.test(correct)) return null
  return { ...tq, inputMode: 'listen', type: 'listen_to_word', audioRef: correct, prompt: correct, promptZh: ASK.listen_to_word, phon: '', skillTags: ['listening'] }
}

export function ExamScreen() {
  const navigate = useNavigate()
  const router = useRouter()
  const { markCorrect, markWrong, incXp, recordActivity, addWrongAnswer, distractorsFor, all, profile, byId, recordDimPass } = useLexiStore()

  const [phase, setPhase] = useState<'intro' | 'run' | 'result'>('intro')
  const [examSrc, setExamSrc] = useState('综合')
  const [typeMix, setTypeMix] = useState('mixed')
  const [count, setCount] = useState(10)
  const [loading, setLoading] = useState(false)

  const [questions, setQuestions] = useState<TQ[]>([])
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [spellVal, setSpellVal] = useState('')
  const [answered, setAnswered] = useState<{ correct: boolean } | null>(null)
  const [corrected, setCorrected] = useState(false)   // 拼写答错后订正（不改成绩，只供巩固）
  const [score, setScore] = useState(0)
  const [wrong, setWrong] = useState<TQ[]>([])
  const [skill, setSkill] = useState<Record<string, { right: number; total: number }>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const spellRef = useRef<HTMLInputElement | null>(null)
  const idxRef = useRef(0); const ansRef = useRef<typeof answered>(null)
  useEffect(() => { idxRef.current = idx }, [idx])
  useEffect(() => { ansRef.current = answered }, [answered])
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const total = questions.length || count

  // 客户端兜底出题（DB 空时用 distractorsFor）
  function fallbackQuestions(n: number): TQ[] {
    const pool = all().filter(w => w.state !== 'locked' && w.state !== 'unknown')
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, n)
    return shuffled.map((w, i) => {
      const opts = distractorsFor(w)
      return {
        id: `fb-${w.id}-${i}`, type: 'en_to_zh', inputMode: 'choice' as TInputMode, wordId: w.id, word: w.word,
        prompt: w.word, promptZh: ASK.en_to_zh, phon: w.phon,
        choices: opts.map(o => ({ id: o.id, text: o.text })), answer: opts.find(o => o.correct)?.id,
        explanationZh: w.ex ? `例：${w.ex}` : '', skillTags: ['translation'], examTags: [], difficultyLevel: 3,
      }
    }).filter(q => q.choices && q.choices.length >= 2 && q.answer)
  }

  async function start() {
    setLoading(true)
    const types = MIX_TYPES[typeMix] ?? MIX_TYPES.mixed
    const level = EXAM_TO_LEVEL[examSrc] ?? profile.level ?? undefined
    let built: TQ[] = []
    try {
      const p = new URLSearchParams({ types: types.join(','), limit: String(count) })
      if (level) p.set('level', String(level))
      const res = await fetch(`/api/questions?${p.toString()}`)
      const json = res.ok ? await res.json() : null
      built = ((json?.data ?? []) as BankRow[]).map(mapTQ).filter((q): q is TQ => q !== null)
    } catch { /* fall through */ }
    if (built.length < Math.min(3, count)) built = [...built, ...fallbackQuestions(count - built.length)]
    // 听力：mixed/listen 档保证至少一题听力（由 choice 题转写）
    if (typeMix === 'listen') {
      built = built.map(q => toListen(q) ?? q)
    } else if (typeMix === 'mixed' && !built.some(q => q.inputMode === 'listen')) {
      const i = built.findIndex(q => toListen(q) !== null)
      if (i >= 0) built[i] = toListen(built[i])!
    }
    built = built.slice(0, count)
    if (!built.length) { setLoading(false); return }
    setQuestions(built)
    setIdx(0); setPicked(null); setSpellVal(''); setAnswered(null); setCorrected(false); setScore(0); setWrong([]); setSkill({})
    // 返工FIX4：整篇完形按空数估，其余按 题型基准 × 等级系数（level 由所选考试/定级推出）
    setTimeLeft(built.reduce((s, qq) => s + (
      qq.type === 'cloze_passage' ? Math.max(60, (qq.blanks?.length ?? 8) * 12) : secondsFor(qq.type, level)
    ), 0))
    setLoading(false)
    setPhase('run')
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); settleUnanswered(built); setPhase('result'); return 0 }
        return t - 1
      })
    }, 1000)
  }

  function settleUnanswered(qs: TQ[]) {
    const from = idxRef.current + (ansRef.current ? 1 : 0)
    qs.slice(from).forEach(q => {
      if (byId(q.wordId)) markWrong(q.wordId)
      if (!PASSAGE_KEYED.has(q.type)) addWrongAnswer({ wordId: q.wordId, word: q.word, question: q.promptZh || q.prompt, userAnswer: '（超时未答）', correctAnswer: correctText(q), explanation: q.explanationZh, timestamp: Date.now() })
      setWrong(w => [...w, q])
    })
  }
  function correctText(q: TQ): string {
    if (q.inputMode === 'spell') return q.answerText ?? ''
    return q.choices?.find(c => c.id === q.answer)?.text ?? q.answer ?? ''
  }

  function settle(q: TQ, correct: boolean, userAnswer: string) {
    if (answered) return
    setAnswered({ correct })
    setSkill(s => { const k = q.skillTags[0]; const cur = s[k] ?? { right: 0, total: 0 }; return { ...s, [k]: { right: cur.right + (correct ? 1 : 0), total: cur.total + 1 } } })
    recordActivity('quizzed')
    if (correct) {
      setScore(v => v + 1)
      if (byId(q.wordId)) { markCorrect(q.wordId); recordDimPass(q.wordId, DIM_OF[q.type] ?? 'recognize') }
      incXp(15)
      useLexiStore.getState().wrongAnswers.filter(w => w.wordId === q.wordId).forEach(w => useLexiStore.getState().removeWrongAnswer(w.id))
    } else {
      setWrong(w => [...w, q])
      if (byId(q.wordId)) markWrong(q.wordId)
      // 短文题（听力/阅读/完形）按短文计，不进词级错题本
      if (!PASSAGE_KEYED.has(q.type)) {
        addWrongAnswer({ wordId: q.wordId, word: q.word, question: q.promptZh || q.prompt, userAnswer, correctAnswer: correctText(q), explanation: q.explanationZh, timestamp: Date.now() })
      }
    }
  }
  function next() {
    if (idx + 1 >= questions.length) { if (timerRef.current) clearInterval(timerRef.current); setPhase('result') }
    else { setIdx(i => i + 1); setPicked(null); setSpellVal(''); setAnswered(null); setCorrected(false) }
  }

  const q = questions[idx]
  const pct = Math.round((score / (questions.length || 1)) * 100)
  const passed = pct >= PASS_PCT

  // 拼写答错后保持输入可改并自动回焦（光标移到末尾，便于改写订正）
  useEffect(() => {
    if (answered && !answered.correct && !corrected && q?.inputMode === 'spell') {
      const el = spellRef.current
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length) }
    }
  }, [answered, corrected, q])

  // ── INTRO ──
  if (phase === 'intro') {
    // 返工FIX4：介绍卡限时 = 所选题型基准均值 × 等级系数 × 题量（与真实计时口径一致）
    const introLvl = EXAM_TO_LEVEL[examSrc] ?? profile.level ?? 3
    const introMix = MIX_TYPES[typeMix] ?? MIX_TYPES.mixed
    const introAvgBase = Math.round(introMix.reduce((s, t) => s + (BASE_SECS[t] ?? SECS_PER_Q), 0) / introMix.length)
    const introSecs = Math.round(introAvgBase * (LEVEL_FACTOR[introLvl] ?? 1)) * count
    return (
      <div className="theme-light lt-v2">
        <div className="lt-wrap">
          <p className="trial-eyebrow">考试 · LexiTrial</p>
          <h2 className="trial-title">词汇 <em>试炼</em></h2>
          <div className="boss-card">
            <div className="boss-stars">{Array.from({ length: 18 }).map((_, i) => <i key={i} style={{ top: `${(i * 37 + 7) % 100}%`, left: `${(i * 61 + 13) % 100}%`, animationDelay: `${(i % 30) / 10}s` }} />)}</div>
            <div className="boss-glow" />
            <div className="boss-kicker">✦ TRIAL · 综合试炼</div>
            <h3 className="boss-h">{count} 题 · 多题型限时检验</h3>
            <p className="boss-p">混合 <b style={{ color: '#cbb6f0' }}>选择 / 拼写 / 听音</b> 等题型。答对趋向「已掌握」，错题进薄弱并回流今日。过 <b style={{ color: '#7ff0db' }}>80%</b> 点亮星系。</p>
            <div className="boss-stats">
              <div className="boss-stat"><div className="n">{count}</div><div className="l">题目</div></div>
              <div className="boss-stat"><div className="n">{introSecs}s</div><div className="l">限时</div></div>
              <div className="boss-stat"><div className="n" style={{ color: '#7ff0db' }}>80%</div><div className="l">通关线</div></div>
            </div>
          </div>

          <div className="cfg">
            <div className="cfg-row">
              <div className="cfg-label">题库来源 <span className="hint">examTags</span></div>
              <div className="seg">{['综合', '初中', '高中', 'CET-4', 'CET-6', '考研', 'TOEFL', 'SAT'].map(e => <button key={e} className={examSrc === e ? 'on' : ''} onClick={() => setExamSrc(e)}>{e}</button>)}</div>
            </div>
            <div className="cfg-row">
              <div className="cfg-label">题型组合 <span className="hint">skillTags · type</span></div>
              <div className="seg teal">{([['mixed', '混合全题型'], ['choice', '仅选择'], ['spell', '侧重拼写'], ['listen', '侧重听力'], ['read', '侧重阅读'], ['cloze', '完形填空'], ['sevenselect', '七选五'], ['banked', '选词填空'], ['match', '长篇匹配'], ['grammar', '语法填空']] as const).map(([k, l]) => <button key={k} className={typeMix === k ? 'on' : ''} onClick={() => setTypeMix(k)}>{l}</button>)}</div>
            </div>
            <div className="cfg-row">
              <div className="cfg-label">题量 <span className="hint">count</span></div>
              <div className="seg">{[6, 10, 12, 20].map(c => <button key={c} className={count === c ? 'on' : ''} onClick={() => setCount(c)}>{c}</button>)}</div>
            </div>
          </div>

          <div className="bank-note">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--teal-ink)" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg>
            <span>已注入题库 <b>96,500 题</b> · 9 种题型 · 后续新题型自动入池</span>
          </div>

          <button className="lt-btn violet start-btn" disabled={loading} onClick={start}>{loading ? '正在抽题…' : '开始试炼 ✦'}</button>
        </div>
      </div>
    )
  }

  // ── RESULT ──
  if (phase === 'result') {
    return (
      <div className="theme-light lt-v2">
        <div className="lt-wrap result-wrap">
          <div className="result-badge" style={{ background: passed ? 'var(--teal-bg)' : 'var(--rose-bg)', color: passed ? 'var(--teal-ink)' : 'var(--rose-ink)' }}>{passed ? '✦' : '⚔'}</div>
          <h2 className="result-h" style={{ color: passed ? 'var(--teal-ink)' : 'var(--gold-ink)' }}>{passed ? '通关！星系点亮' : '差一点，再来一次'}</h2>
          <p className="result-pct" style={{ color: passed ? 'var(--teal-ink)' : 'var(--gold-ink)' }}>{score} / {questions.length} · {pct}%</p>
          <div className="galaxy"><GalaxySVG lit={passed} /></div>
          <div className="skill-break">
            <div style={{ fontSize: 12.5, color: 'var(--ink-sub)', fontWeight: 600, marginBottom: 13 }}>能力维度 · skillTags 命中率</div>
            {Object.keys(skill).map(s => {
              const sc = skill[s]; const v = Math.round((sc.right / sc.total) * 100)
              const col = v >= 80 ? 'var(--teal-ink)' : v >= 50 ? 'var(--gold-ink)' : 'var(--rose-ink)'
              return <div className="sb-row" key={s}><span className="sb-name">{SKILL_LABEL[s] ?? s}</span><div className="sb-bar"><i style={{ width: `${v}%`, background: col }} /></div><span className="sb-val">{v}%</span></div>
            })}
            {!Object.keys(skill).length && <div style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>本轮未记录维度</div>}
          </div>
          {(() => { const wrongWords = [...new Map(wrong.filter(w => !PASSAGE_KEYED.has(w.type)).map(w => [w.wordId, w])).values()]; return wrongWords.length > 0 && (
            <div className="wrong-card">
              <div className="wrong-head"><span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--rose-ink)' }} />{wrongWords.length} 个薄弱词已回流今日</div>
              <div className="wrong-chips">{wrongWords.map(w => <span key={w.wordId} className="wrong-chip"><span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--rose-ink)' }} />{w.word}</span>)}</div>
            </div>
          ) })()}
          <div className="result-actions">
            {wrong.length > 0
              ? <button className="lt-btn primary" onClick={() => navigate('review')}>去复习薄弱词 →</button>
              : <button className="lt-btn primary" onClick={() => router.push('/lexiverse?celebrate=1')}>看星系点亮 →</button>}
            <button className="lt-btn ghost" onClick={() => setPhase('intro')}>再试一次</button>
            <button className="lt-btn ghost" onClick={() => navigate('today')}>返回今日</button>
          </div>
        </div>
      </div>
    )
  }

  // ── RUN ──
  if (!q) return <div className="theme-light lt-v2"><div className="lt-wrap">没有可用题目</div></div>
  return (
    <div className="theme-light lt-v2">
      <div className="lt-wrap">
        <div className="run-top">
          <span className="run-idx">{idx + 1} / {total}</span>
          <div className="run-progress"><i style={{ width: `${(idx / total) * 100}%` }} /></div>
          <span className="run-timer" style={{ color: timeLeft < 15 ? 'var(--rose-ink)' : undefined }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg> {timeLeft}s
          </span>
        </div>

        <div className="q-meta">
          <span className="q-type">◆ {TYPE_LABEL[q.type] ?? q.type}</span>
          <span className="q-diff">{Array.from({ length: 5 }).map((_, i) => <i key={i} className={i < q.difficultyLevel ? 'on' : ''} />)}</span>
          {q.skillTags.map(s => <span key={s} className="q-tag">{SKILL_LABEL[s] ?? s}</span>)}
          <span className="q-tag" style={{ marginLeft: 'auto' }}>{q.examTags[0] ?? examSrc}</span>
        </div>

        {q.type === 'cloze_passage' ? (
          <ClozePassageCard key={q.id} q={q} done={!!answered} onSubmit={(correct, summary) => settle(q, correct, summary)} />
        ) : q.type === 'seven_select' || q.type === 'banked_cloze' ? (
          <SevenSelectCard key={q.id} q={q} done={!!answered} onSubmit={(correct, summary) => settle(q, correct, summary)} />
        ) : q.type === 'para_match' ? (
          <ParaMatchCard key={q.id} q={q} done={!!answered} onSubmit={(correct, summary) => settle(q, correct, summary)} />
        ) : q.type === 'grammar_fill' ? (
          <GrammarFillCard key={q.id} q={q} done={!!answered} onSubmit={(correct, summary) => settle(q, correct, summary)} />
        ) : (
        <>
        <div className="q-card">
          {q.type === 'reading_comprehension' && q.passage ? (
            <ReadStem q={q} />
          ) : q.audioRef ? (
            <ListenStem q={q} />
          ) : q.type === 'cloze_choice' || q.type === 'cet_cloze' || q.type === 'cloze_spell' || q.type === 'synonym_substitute' ? (
            <><div className="q-prompt-zh">{q.promptZh}</div><div className="q-cloze">{clozeNodes(q.prompt)}</div></>
          ) : q.inputMode === 'spell' ? (
            <><div className="q-prompt-zh">{q.promptZh}</div><div className="q-stem">{q.prompt}</div></>
          ) : (
            <><div className="q-prompt-zh">{q.promptZh}</div><div className="q-stem">{q.prompt}</div>{q.phon && <div className="q-phon">{q.phon}</div>}</>
          )}
        </div>

        {/* answer area */}
        {q.inputMode === 'spell' ? (
          <>
            <div className="spell-box">
              <input ref={spellRef} className={answered ? ((answered.correct || corrected) ? 'correct' : 'wrong') : ''} value={spellVal}
                placeholder="输入英文…" autoComplete="off" spellCheck={false} disabled={answered?.correct === true || corrected}
                onChange={e => setSpellVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key !== 'Enter' || !spellVal.trim()) return
                  const ok = spellVal.trim().toLowerCase() === (q.answerText ?? '').toLowerCase()
                  if (!answered) settle(q, ok, spellVal.trim())
                  else if (!answered.correct && !corrected && ok) setCorrected(true)   // 答错后订正成功
                }} autoFocus />
            </div>
            <div className="spell-hint">首字母 <b>{q.hint?.initials ?? (q.answerText ?? '').slice(0, 1)}</b>{q.hint?.ipa ? ` · ${q.hint.ipa}` : ''}</div>
          </>
        ) : (
          <div className="opts">
            {(q.choices ?? []).map(c => {
              const isAns = c.id === q.answer
              const cls = answered ? (isAns ? 'correct' : (picked === c.id ? 'wrong' : '')) : ''
              return (
                <button key={c.id} className={`opt ${cls} ${answered ? 'locked' : ''}`} disabled={!!answered}
                  onClick={() => { if (answered) return; setPicked(c.id); settle(q, isAns, c.text) }}>
                  <span className="key">{c.id.toUpperCase()}</span>{c.text}
                </button>
              )
            })}
          </div>
        )}
        </>
        )}

        {answered && (
          <>
            {q.type !== 'cloze_passage' && q.type !== 'seven_select' && q.type !== 'banked_cloze' && q.type !== 'para_match' && q.type !== 'grammar_fill' && (
              <div className="q-explain">
                <b>{(answered.correct || corrected) ? '✓ 正确' : '✗ 错误'}</b>
                {q.inputMode === 'spell' && !answered.correct
                  ? (corrected ? ' · 已订正 ✎' : ` · 正确拼写：${q.answerText ?? ''}（可在上方改写后回车订正）`)
                  : ''}
                {(q.wordZh || q.explanationZh) ? (
                  <> · <b>{q.word}{q.wordZh ? `（${q.wordZh}）` : ''}</b>{q.explanationZh ? ` — ${stripLeadWord(q.explanationZh, q.word)}` : ''}</>
                ) : ''}
              </div>
            )}
            <button className="lt-btn violet next-btn" onClick={next}>{idx + 1 >= questions.length ? '查看成绩' : '下一题'} →</button>
          </>
        )}
      </div>
    </div>
  )
}

function clozeNodes(text: string): React.ReactNode[] {
  const parts = text.split(/\[BLANK\]|___+/)
  const out: React.ReactNode[] = []
  parts.forEach((p, i) => { if (i > 0) out.push(<span key={`b${i}`} className="blank">?</span>); out.push(<span key={`t${i}`}>{p}</span>) })
  return out
}

// 完形填空(整篇)：短文 + 逐空 4 选，提交后逐空判分（按答对比例计入本题）
function ClozePassageCard({ q, done, onSubmit }: { q: TQ; done: boolean; onSubmit: (correct: boolean, summary: string) => void }) {
  const blanks = q.blanks ?? []
  const [sel, setSel] = useState<number[]>(() => blanks.map(() => -1))
  const answeredN = sel.filter(s => s >= 0).length
  const correctN = sel.filter((s, i) => s === blanks[i].answer).length
  return (
    <>
      <div className="q-card" style={{ textAlign: 'left' }}>
        <div className="q-prompt-zh">{q.promptZh}</div>
        <div className="read-passage" style={{ marginTop: 10 }}>{q.passage}</div>
      </div>
      <div className="cloze-blanks">
        {blanks.map((b, i) => (
          <div key={i} className="cloze-blank">
            <div className="cb-head"><span className="cb-num">({i + 1})</span>{done && <span className="cb-mark" style={{ color: sel[i] === b.answer ? 'var(--teal-ink)' : 'var(--rose-ink)' }}>{sel[i] === b.answer ? '✓' : '✗'}</span>}{done && b.explain && <span className="cb-explain">{b.explain}</span>}</div>
            <div className="cb-opts">
              {b.options.map((opt, oi) => {
                const picked = sel[i] === oi
                const cls = done ? (oi === b.answer ? 'correct' : (picked ? 'wrong' : '')) : (picked ? 'sel' : '')
                return (
                  <button key={oi} className={`cb-opt ${cls}`} disabled={done}
                    onClick={() => { if (done) return; setSel(s => s.map((v, k) => (k === i ? oi : v))) }}>
                    <span className="key">{'ABCD'[oi]}</span>{opt}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      {done
        ? <div className="q-explain"><b>答对 {correctN} / {blanks.length}</b>{correctN / blanks.length >= 0.6 ? ' · 达标 ✓' : ' · 再接再厉'}</div>
        : <button className="lt-btn violet" style={{ width: '100%', marginTop: 4 }} disabled={answeredN < blanks.length}
            onClick={() => onSubmit(correctN / blanks.length >= 0.6, `${correctN}/${blanks.length}`)}>
            提交（{answeredN}/{blanks.length}）
          </button>}
    </>
  )
}

// 七选五：短文(含(1)-(5)空) + 7 候选句(A-G)，为每空指派一句（每句至多用一次），提交判分
function SevenSelectCard({ q, done, onSubmit }: { q: TQ; done: boolean; onSubmit: (correct: boolean, summary: string) => void }) {
  const bank = q.bank ?? []; const ans = q.gapAns ?? []
  const [sel, setSel] = useState<number[]>(() => ans.map(() => -1))   // 每空选的候选句下标
  const answeredN = sel.filter(s => s >= 0).length
  const correctN = sel.filter((s, i) => s === ans[i]).length
  const LET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return (
    <>
      <div className="q-card" style={{ textAlign: 'left' }}>
        <div className="q-prompt-zh">{q.promptZh}</div>
        <div className="read-passage" style={{ marginTop: 10 }}>{q.passage}</div>
      </div>
      <div className="ss-bank">
        {bank.map((s, i) => <div key={i} className="ss-opt"><span className="key">{LET[i]}</span><span>{s}</span></div>)}
      </div>
      <div className="cloze-blanks">
        {ans.map((_, gi) => (
          <div key={gi} className="cloze-blank">
            <div className="cb-head"><span className="cb-num">({gi + 1})</span>{done && <span className="cb-mark" style={{ color: sel[gi] === ans[gi] ? 'var(--teal-ink)' : 'var(--rose-ink)' }}>{sel[gi] === ans[gi] ? '✓' : `✗ 正确 ${LET[ans[gi]]}`}</span>}</div>
            <div className="ss-letters">
              {bank.map((_, oi) => {
                const usedElsewhere = !done && sel.some((v, k) => v === oi && k !== gi)
                const picked = sel[gi] === oi
                const cls = done ? (oi === ans[gi] ? 'correct' : (picked ? 'wrong' : '')) : (picked ? 'sel' : '')
                return (
                  <button key={oi} className={`ss-let ${cls}`} disabled={done || usedElsewhere}
                    onClick={() => { if (done) return; setSel(s => s.map((v, k) => (k === gi ? oi : v))) }}>{LET[oi]}</button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      {done
        ? <div className="q-explain"><b>答对 {correctN} / {ans.length}</b>{correctN / ans.length >= 0.6 ? ' · 达标 ✓' : ' · 再接再厉'}</div>
        : <button className="lt-btn violet" style={{ width: '100%', marginTop: 4 }} disabled={answeredN < ans.length}
            onClick={() => onSubmit(correctN / ans.length >= 0.6, `${correctN}/${ans.length}`)}>
            提交（{answeredN}/{ans.length}）
          </button>}
    </>
  )
}

// 长篇阅读匹配：长文(段标 A-N) + 10 陈述，为每句选所属段落（段可重复），提交判分
function ParaMatchCard({ q, done, onSubmit }: { q: TQ; done: boolean; onSubmit: (correct: boolean, summary: string) => void }) {
  const stmts = q.statements ?? []; const ans = q.gapAns ?? []; const paras = q.paraCount ?? 0
  const [sel, setSel] = useState<number[]>(() => stmts.map(() => -1))
  const answeredN = sel.filter(s => s >= 0).length
  const correctN = sel.filter((s, i) => s === ans[i]).length
  const LET = 'ABCDEFGHIJKLMN'
  return (
    <>
      <div className="q-card" style={{ textAlign: 'left' }}>
        <div className="q-prompt-zh">{q.promptZh}</div>
        <div className="read-passage" style={{ marginTop: 10 }}>{q.passage}</div>
      </div>
      <div className="cloze-blanks">
        {stmts.map((st, si) => (
          <div key={si} className="cloze-blank">
            <div className="cb-head"><span className="cb-num">{si + 1}.</span><span style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.5 }}>{st}</span></div>
            {done && <div className="cb-explain" style={{ marginBottom: 6, color: sel[si] === ans[si] ? 'var(--teal-ink)' : 'var(--rose-ink)' }}>{sel[si] === ans[si] ? '✓' : `✗ 正确 ${LET[ans[si]]}`}</div>}
            <div className="ss-letters">
              {Array.from({ length: paras }).map((_, oi) => {
                const picked = sel[si] === oi
                const cls = done ? (oi === ans[si] ? 'correct' : (picked ? 'wrong' : '')) : (picked ? 'sel' : '')
                return (
                  <button key={oi} className={`ss-let ${cls}`} disabled={done}
                    onClick={() => { if (done) return; setSel(s => s.map((v, k) => (k === si ? oi : v))) }}>{LET[oi]}</button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      {done
        ? <div className="q-explain"><b>答对 {correctN} / {stmts.length}</b>{correctN / stmts.length >= 0.6 ? ' · 达标 ✓' : ' · 再接再厉'}</div>
        : <button className="lt-btn violet" style={{ width: '100%', marginTop: 4 }} disabled={answeredN < stmts.length}
            onClick={() => onSubmit(correctN / stmts.length >= 0.6, `${correctN}/${stmts.length}`)}>
            提交（{answeredN}/{stmts.length}）
          </button>}
    </>
  )
}

// 语法填空：短文(含(1)-(N)空) + 逐空文本输入（部分给提示词原形），提交按答案判分
function GrammarFillCard({ q, done, onSubmit }: { q: TQ; done: boolean; onSubmit: (correct: boolean, summary: string) => void }) {
  const gb = q.gblanks ?? []
  const [val, setVal] = useState<string[]>(() => gb.map(() => ''))
  const norm = (s: string) => s.trim().toLowerCase()
  const answeredN = val.filter(v => v.trim()).length
  const correctN = val.filter((v, i) => norm(v) === norm(gb[i].answer)).length
  return (
    <>
      <div className="q-card" style={{ textAlign: 'left' }}>
        <div className="q-prompt-zh">{q.promptZh}</div>
        <div className="read-passage" style={{ marginTop: 10 }}>{q.passage}</div>
      </div>
      <div className="cloze-blanks">
        {gb.map((b, i) => {
          const ok = norm(val[i]) === norm(b.answer)
          return (
            <div key={i} className="cloze-blank">
              <div className="cb-head">
                <span className="cb-num">({i + 1})</span>
                {b.hint && <span className="gf-hint">{b.hint}</span>}
                {done && <span className="cb-mark" style={{ color: ok ? 'var(--teal-ink)' : 'var(--rose-ink)' }}>{ok ? '✓' : `✗ ${b.answer}`}</span>}
                {done && b.explain && <span className="cb-explain">{b.explain}</span>}
              </div>
              <input className={`gf-input ${done ? (ok ? 'correct' : 'wrong') : ''}`} value={val[i]} disabled={done}
                placeholder={b.hint ? `用 ${b.hint} 的正确形式` : '填入恰当的词'} autoComplete="off" spellCheck={false}
                onChange={e => setVal(s => s.map((v, k) => (k === i ? e.target.value : v)))} />
            </div>
          )
        })}
      </div>
      {done
        ? <div className="q-explain"><b>答对 {correctN} / {gb.length}</b>{correctN / gb.length >= 0.6 ? ' · 达标 ✓' : ' · 再接再厉'}</div>
        : <button className="lt-btn violet" style={{ width: '100%', marginTop: 4 }} disabled={answeredN < gb.length}
            onClick={() => onSubmit(correctN / gb.length >= 0.6, `${correctN}/${gb.length}`)}>
            提交（{answeredN}/{gb.length}）
          </button>}
    </>
  )
}

function ReadStem({ q }: { q: TQ }) {
  return (
    <>
      <div className="read-passage">{q.passage}</div>
      <div className="q-prompt-zh">{q.promptZh}</div>
      <div className="q-stem" style={{ fontSize: 17, marginTop: 8 }}>{q.prompt}</div>
    </>
  )
}

function ListenStem({ q }: { q: TQ }) {
  const [playing, setPlaying] = useState(false)
  return (
    <>
      <button className="listen-play" onClick={() => { setPlaying(true); speak(q.audioRef ?? q.word, true); setTimeout(() => setPlaying(false), q.type === 'listening_comprehension' ? 2600 : 1100) }}>
        {playing
          ? <span className="listen-wave">{Array.from({ length: 4 }).map((_, i) => <span key={i} className="eq-bar" style={{ background: '#fff', display: 'inline-block', width: 3, height: 13, borderRadius: 2 }} />)}</span>
          : <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
      </button>
      <div className="q-prompt-zh">{q.promptZh}</div>
      {q.type === 'listening_comprehension' && q.prompt
        ? <div className="q-stem" style={{ fontSize: 18, marginTop: 8 }}>{q.prompt}</div>
        : <div className="listen-hint">点击播放发音 · 可重复</div>}
    </>
  )
}

function GalaxySVG({ lit }: { lit: boolean }) {
  const nodes: [number, number][] = [[60, 60], [110, 40], [160, 70], [210, 45], [260, 65], [300, 40], [90, 85], [150, 95], [220, 90], [280, 95]]
  const cx = 180, cy = 65
  return (
    <svg viewBox="0 0 360 120">
      {nodes.map(([x, y], i) => <line key={`l${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke={lit ? 'rgba(79,230,206,0.35)' : 'var(--line)'} strokeWidth="1" />)}
      {nodes.map(([x, y], i) => <circle key={`n${i}`} cx={x} cy={y} r={3 + (i % 3)} fill={lit ? '#34d8c0' : 'var(--line-strong)'} style={{ opacity: lit ? 1 : 0.4, transition: `opacity .5s ${i * 0.08}s` }} />)}
      <circle cx={cx} cy={cy} r="7" fill={lit ? 'var(--teal-ink)' : 'var(--ink-muted)'} />
      <circle cx={cx} cy={cy} r="13" fill="none" stroke={lit ? 'rgba(79,230,206,0.5)' : 'var(--line)'} strokeWidth="1.5" />
    </svg>
  )
}
