'use client'

/* ════════════════════════════════════════════════════════════════════════
   PracticeSession 统一练习屏（界面优化12 / 任务B · P1）
   1:1 移植自 design_handoff「PracticeSession 统一练习屏.html」：固定骨架
   （顶部进度/连击/计分 → 题型 eyebrow → 题干卡 → 输入区 → 即时反馈 → 结算环），
   5 题型同骨架（en_to_zh / zh_to_en / def_to_word / cloze_choice / zh_to_word_spell），
   打字题 Levenshtein 容错 + 差异高亮，连击计分（combo→gain），结算正确率环。
   收编原 4 模式（词汇速记/句子练习/应试/错题）为「出题来源」，并保留
   ?word 单词考一考、?word&vs 辨析、?yesterday 昨日回顾、?returnTo 回跳。
   结果回写 SRS（markCorrect/markWrong）+ 错词本；浅色 .theme-light .pr-v2。
   ════════════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { LoadingState } from '@/components/lexiverse/LoadingState'
import { useLexiverseDictionary } from '@/lib/lexiverse/useLexiverseDictionary'
import type { FilterableWord } from '@/lib/lexiverse/lexiverse-word-filter'
import type { DictionaryDefinition, DictionaryExample, DictionaryWord } from '@/lib/dictionary/dictionary-types'
import { useLexiStore } from '@/store/lexiStore'
import { speakSmart } from '@/lib/pronunciation/word-audio'
import type { QuizAttempt } from '@/types/quiz'
import './practice-session.css'

// ── 题型 / 数据契约（对齐 question_bank · §4 README）─────────────────────────
type PType = 'en_to_zh' | 'zh_to_en' | 'def_to_word' | 'cloze_choice' | 'zh_to_word_spell' | 'word_form' | 'synonym_choice' | 'confusable_choice' | 'cloze_spell' | 'listen_to_meaning' | 'dictation_spell' | 'listening_comprehension' | 'reading_comprehension' | 'synonym_substitute' | 'collocation_choice'
type PInputMode = 'choice' | 'spell'
type POption = { id: string; text: string; wordId?: string }
type PQuestion = {
  id: string
  wordId: string
  word: string
  type: PType
  inputMode: PInputMode
  prompt: string
  promptZh?: string
  ipa?: string
  ask?: string
  options?: POption[]
  answer: string                  // choice → 选项 id；spell → 英文单词
  hint?: { initials?: string; ipa?: string }
  audioRef?: string               // 听力题：播放的词/短文（TTS）
  passage?: string                // 阅读题：屏显短文
  explanationZh?: string
  wordZh?: string                 // 该词中文释义（反馈区先讲词义）
}
type QuizMode = 'vocabulary-drill' | 'sentence-practice' | 'exam-practice' | 'wrong-answer-booster' | 'listening-practice' | 'reading-practice'
type VocabWord = FilterableWord & Partial<Pick<DictionaryWord,
  'definitions' | 'examples' | 'partOfSpeech' | 'phoneticIpa' | 'examTags'
>>

const TYPE_LABEL: Record<PType, string> = {
  en_to_zh: '英 → 中', zh_to_en: '中 → 英', def_to_word: '释义选义',
  cloze_choice: '例句填空', zh_to_word_spell: '中文拼写', word_form: '词形变化',
  synonym_choice: '近义词', confusable_choice: '易混词',
  cloze_spell: '例句拼写', listen_to_meaning: '听音选义', dictation_spell: '听写', listening_comprehension: '听力理解',
  reading_comprehension: '阅读理解', synonym_substitute: '同义替换', collocation_choice: '搭配',
}
const DRILL_TYPES: PType[] = ['en_to_zh', 'def_to_word', 'zh_to_word_spell', 'zh_to_en', 'cloze_choice']

// P0：目标考试 → 7 档 level（题库按 theme_tags lvN 标，exam_tags 全库几乎为空不可用）
const EXAM_TO_LEVEL: Record<string, number> = {
  '初中': 1, '高中': 2, GAOKAO: 2,
  'CET-4': 3, CET4: 3, 'CET-6': 4, CET6: 4,
  '考研': 5, KAOYAN: 5, TOEFL: 6, SAT: 7, IELTS: 8,   // 八档：IELTS→8（修旧误映射到托福档 6；GRE 非八档已移除）
}
const SESSION_SIZE = 10
// 专练 UI 题型 → question_bank 题型映射（无对应题型的退到最近的可用类型）
const DRILL_TYPE_MAP: Record<string, string[]> = {
  meaning: ['en_to_zh', 'def_to_word'], listen: ['listen_to_meaning'], pic: ['en_to_zh', 'def_to_word'],
  cloze: ['cloze_choice'], sentence: ['cloze_choice', 'cloze_spell'], listenVocab: ['listen_to_meaning'],
  translate: ['en_to_zh', 'zh_to_en'], longSent: ['synonym_substitute', 'cloze_choice'],
  discern: ['confusable_choice', 'synonym_choice'], fullCloze: ['cloze_passage'], inferRead: ['reading_comprehension'],
  acadListen: ['listening_comprehension'], readVocab: ['synonym_substitute'], speakUse: ['en_to_zh', 'synonym_substitute'],
  writeWord: ['synonym_substitute'], hardDiscern: ['confusable_choice', 'synonym_choice'], equiv: ['synonym_substitute'],
  synant: ['synonym_choice', 'synonym_substitute'], ctxInfer: ['reading_comprehension', 'cloze_choice'],
}
// P3：题型 → 技能维度（认/拼/听），跨维通过驱动镀金
const DIM_OF: Record<string, string> = {
  en_to_zh: 'recognize', zh_to_en: 'recognize', def_to_word: 'recognize', synonym_choice: 'recognize', confusable_choice: 'recognize', cloze_choice: 'recognize',
  zh_to_word_spell: 'spell', word_form: 'spell', cloze_spell: 'spell',
  listen_to_meaning: 'listen', dictation_spell: 'listen', listening_comprehension: 'listen',
  reading_comprehension: 'recognize', synonym_substitute: 'recognize', collocation_choice: 'recognize',
}

// ── question_bank 行 → PQuestion 映射（读表化）────────────────────────────────
type BankRow = {
  id: string; type: string; input_mode: string; word_id: string | null; normalized_word: string | null
  prompt: string | null; prompt_zh: string | null; choices: { id: string; text: string }[] | null
  answer: string | null; answer_text: string | null; hint: { initials?: string; ipa?: string } | null
  audio_ref: string | null; explanation_zh: string | null; word_zh?: string | null
}
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
function mapBankRow(r: BankRow): PQuestion | null {
  const dbType = r.type
  if (dbType === 'antonym_choice') return null   // 退役题型：不渲染（后端默认已不下发，双保险）
  // legacy-only：后端默认已不再下发 cet_cloze；仅为兼容旧链接 / 旧缓存行保留重映到 cloze_choice
  const type = (dbType === 'cet_cloze' ? 'cloze_choice' : dbType) as PType
  const word = String(r.normalized_word ?? r.word_id ?? '')
  const wordId = r.word_id ?? word
  const hint = r.hint && typeof r.hint === 'object' ? r.hint : undefined
  const isListen = r.input_mode === 'listen'
  const isReading = dbType === 'reading_comprehension'
  const audioRef = isListen ? (r.audio_ref ?? word) : undefined
  const passage = isReading ? (r.audio_ref ?? undefined) : undefined
  const cleanChoices = Array.isArray(r.choices) ? r.choices.filter(c => c && c.id && c.text).map(c => ({ id: c.id, text: c.text })) : []
  // 答题模式：spell（含听写）/ choice（含听音选义 / 阅读理解）
  const answerMode: PInputMode = r.input_mode === 'spell' ? 'spell' : (isListen && cleanChoices.length < 2 ? 'spell' : 'choice')
  const baseQ = { id: r.id, wordId, word, type, audioRef, passage, ask: BANK_ASK[type] ?? '', explanationZh: r.explanation_zh ?? undefined, wordZh: r.word_zh ?? undefined }
  if (answerMode === 'choice') {
    if (cleanChoices.length < 2 || !r.answer) return null
    return { ...baseQ, inputMode: 'choice', prompt: r.prompt ?? '', promptZh: r.prompt_zh ?? undefined, ipa: type === 'en_to_zh' ? (hint?.ipa || undefined) : undefined, options: cleanChoices, answer: r.answer }
  }
  const answer = String(r.answer_text ?? '')
  if (!answer) return null
  return { ...baseQ, inputMode: 'spell', prompt: r.prompt ?? '', promptZh: dbType === 'word_form' ? (r.prompt ?? '') : (r.prompt_zh ?? r.prompt ?? ''), answer, hint: hint ? { initials: hint.initials, ipa: hint.ipa } : { ipa: undefined } }
}

// 去掉解析开头重复的单词（含可能的「（释义）」），避免「advertisement — advertisement 近义…」
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
function stripLeadWord(exp: string, word: string): string {
  const out = exp.replace(new RegExp('^\\s*' + escapeRe(word) + '\\s*(（[^）]*）)?\\s*[—:：-]?\\s*', 'i'), '').trim()
  return out || exp
}

// ── 会话状态 / 单题交互状态 ──────────────────────────────────────────────────
type Session = {
  step: 'play' | 'results'
  idx: number
  score: number
  xp: number
  combo: number
  maxCombo: number
  results: QuizAttempt[]
  startedAt: number
  completedAt: number
}
const freshSession = (): Session => ({
  step: 'play', idx: 0, score: 0, xp: 0, combo: 0, maxCombo: 0,
  results: [], startedAt: Date.now(), completedAt: 0,
})
type QState = {
  locked: boolean
  picked: string | null
  correct: boolean | null
  spellTried: boolean
  spellPhase: '' | 'tol' | 'bad' | 'good'
  spellDiffAns: string
  comboBump: boolean
}
const freshQ = (): QState => ({
  locked: false, picked: null, correct: null,
  spellTried: false, spellPhase: '', spellDiffAns: '', comboBump: false,
})

export function LexiverseQuizClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { words: rawWords, loading, error } = useLexiverseDictionary()
  const words = rawWords as VocabWord[]
  const profileLevel = useLexiStore(s => s.profile.level)
  // 出题用错词本快照（getState）而非订阅，避免答题中改本触发 questions 重算/会话重置

  const mode = parseMode(searchParams.get('mode'))
  const wordParam = searchParams.get('word') ?? undefined
  const vsParam = searchParams.get('vs') ?? undefined
  const yesterdayParam = searchParams.get('yesterday') === '1'
  const examTag = searchParams.get('exam') ?? 'IELTS'
  const returnTo = searchParams.get('returnTo')
  // 专练 /drill → /quiz?level=N&drill=1&type=<uiType>&(count=N|minutes=N|len=inf)：锁定等级+题型+练法
  const drillParam = searchParams.get('drill') === '1'
  const levelParam = searchParams.get('level') ?? undefined
  const drillType = searchParams.get('type') ?? undefined
  const countParam = Number(searchParams.get('count')) || 0
  const minutesParam = Number(searchParams.get('minutes')) || 0
  // 会话题量：按题数→count(≤200)；按时间→分钟×6 估算(≤200，另有倒计时精确收尾)；无限连续/默认→200 大批次
  const DRILL_QPM = 6
  const sessionN = !drillParam ? SESSION_SIZE
    : countParam > 0 ? Math.min(countParam, 200)
      : minutesParam > 0 ? Math.min(Math.max(minutesParam * DRILL_QPM, 10), 200)
        : 200

  const [seed, setSeed] = useState(0)
  const [S, setS] = useState<Session>(freshSession)
  const [qs, setQs] = useState<QState>(freshQ)
  const [spellInput, setSpellInput] = useState('')
  const sRef = useRef(S)
  useEffect(() => { sRef.current = S })
  const spellRef = useRef<HTMLInputElement | null>(null)
  const lockRef = useRef(false)   // 同步锁，挡住一题内的重复提交（不进 state 更新器，避免严格模式双调用）

  // P4：vs 辨析 — /quiz?word=A&vs=B 拉两词，生成 A/B 二选一辨析题
  const [vsQuestions, setVsQuestions] = useState<PQuestion[] | null>(null)
  useEffect(() => {
    if (!wordParam || !vsParam) { setVsQuestions(null); return }
    let cancelled = false
    Promise.all([wordParam, vsParam].map(async w => {
      const res = await fetch(`/api/dictionary/word/${encodeURIComponent(w.toLowerCase())}`)
      const json = res.ok ? await res.json() : null
      return json?.data ?? null
    })).then(([a, b]) => {
      if (cancelled) return
      setVsQuestions(a && b ? buildVsQuestions(a as VocabWord, b as VocabWord) : [])
    })
    return () => { cancelled = true }
  }, [wordParam, vsParam])

  // 真词修复：?word 指定词不在客户端词池时按需补取，14k 任意词都能「考一考」
  const [extraWord, setExtraWord] = useState<VocabWord | null>(null)
  useEffect(() => {
    setExtraWord(null)
    if (!wordParam || vsParam) return
    if (words.some(w => w.id === wordParam || w.word.toLowerCase() === wordParam.toLowerCase())) return
    let cancelled = false
    fetch(`/api/dictionary/word/${encodeURIComponent(wordParam.toLowerCase())}`)
      .then(r => (r.ok ? r.json() : null))
      .then(json => { if (!cancelled && json?.data) setExtraWord(json.data as VocabWord) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [wordParam, vsParam, words])

  // 题库读表：vocabulary-drill / exam-practice（含 ?word）优先读 question_bank；
  // vs / yesterday / wrong 仍走客户端即时出题（依赖 store 特定词）。空/失败 → 回退客户端。
  const isBankCase = !vsParam && !yesterdayParam && mode !== 'wrong-answer-booster'
  const [bankQuestions, setBankQuestions] = useState<PQuestion[] | null>(null)
  useEffect(() => {
    if (!isBankCase) { setBankQuestions([]); return }
    setBankQuestions(null)
    let cancelled = false
    const p = new URLSearchParams()
    if (wordParam) p.set('word', wordParam.toLowerCase())
    // 专练：锁定用户在 /drill 选的等级 + 题型（优先级最高，修「界面承诺与实际不符」）
    if (drillParam && !wordParam) {
      if (levelParam) p.set('level', levelParam)
      const dt = drillType ? DRILL_TYPE_MAP[drillType] : undefined
      if (dt) p.set('types', dt.join(','))
    }
    if (mode === 'listening-practice') p.set('types', 'listening_comprehension')
    if (mode === 'reading-practice') p.set('types', 'reading_comprehension')
    if (!p.has('level') && !wordParam && profileLevel) p.set('level', String(profileLevel))
    // P0：exam-practice 按目标考试映射到 7 档走 level 取题（原 exam_tags 过滤命中近 0）
    if (mode === 'exam-practice') {
      const lv = EXAM_TO_LEVEL[examTag] ?? profileLevel
      if (lv) p.set('level', String(lv))
      p.set('types', 'en_to_zh,synonym_choice,cloze_choice,confusable_choice,zh_to_word_spell,cloze_spell,reading_comprehension')
    }
    p.set('limit', wordParam ? '8' : String(sessionN))
    fetch(`/api/questions?${p.toString()}`)
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (cancelled) return
        const rows = (j?.data ?? []) as BankRow[]
        const seedN = hash(`${mode}:${wordParam ?? ''}:${examTag}:${seed}`)
        const mapped = shuffle(rows.map(mapBankRow).filter(isQ), mulberry32(seedN)).slice(0, wordParam ? 8 : sessionN)
        setBankQuestions(mapped)
      })
      .catch(() => { if (!cancelled) setBankQuestions([]) })
    return () => { cancelled = true }
  }, [isBankCase, mode, wordParam, examTag, profileLevel, seed, drillParam, levelParam, drillType, sessionN])

  // F6-B1：昨日回顾 — 昨天学过的词随机抽 5 个快测
  const yesterdayIds = useMemo(() => {
    if (!yesterdayParam) return []
    const lexi = useLexiStore.getState()
    const dayStart = new Date(new Date().setHours(0, 0, 0, 0)).getTime()
    const yStart = dayStart - 86_400_000
    const ids = [...new Set(lexi.log.filter(e => e.t >= yStart && e.t < dayStart).map(e => e.id))]
    return ids.sort(() => Math.random() - 0.5).slice(0, 5)
  }, [yesterdayParam])

  const questions = useMemo<PQuestion[]>(() => {
    if (vsQuestions) return vsQuestions
    // 听力/阅读练习：纯题库驱动（无客户端兜底；无题则空态）
    if (mode === 'listening-practice' || mode === 'reading-practice') return bankQuestions ?? []
    // 题库命中 → 直接用真题库；空数组 → 回退客户端即时出题
    if (isBankCase && bankQuestions && bankQuestions.length) return bankQuestions
    const pool = (extraWord ? [extraWord, ...words] : words).filter(w => w.word)
    if (!pool.length) return []
    const rng = mulberry32(hash(`${mode}:${wordParam ?? ''}:${examTag}:${yesterdayParam}:${seed}`))
    if (yesterdayParam) {
      const targets = pool.filter(w => yesterdayIds.includes(w.id))
      return targets.map((t, i) => buildQuestionFor(t, 'en_to_zh', pool, rng, `y${i}`)).filter(isQ)
    }
    return buildQuestions({ mode, pool, wordParam, examTag, rng })
  }, [vsQuestions, bankQuestions, isBankCase, extraWord, words, mode, wordParam, examTag, seed, yesterdayParam, yesterdayIds])

  // 新会话（mode/词/档/seed 变 或 题目首次就绪）→ 复位
  const sessionKey = `${mode}|${wordParam ?? ''}|${vsParam ?? ''}|${yesterdayParam}|${examTag}|${seed}`
  useEffect(() => {
    const init = freshSession()
    sRef.current = init
    lockRef.current = false
    setS(init)
    setQs(freshQ())
    setSpellInput('')
  }, [sessionKey])

  const total = questions.length
  const current = questions[S.idx] ?? null

  // 聚焦拼写输入
  useEffect(() => {
    if (current?.inputMode === 'spell' && !qs.locked) {
      const t = setTimeout(() => spellRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [current, qs.locked])

  const finishQuestion = useCallback((correct: boolean, q: PQuestion, userAnswer: string) => {
    const prev = sRef.current
    const combo = correct ? prev.combo + 1 : 0
    const gain = correct ? 10 + Math.max(0, (combo - 1) * 2) : 0
    const xpGain = correct ? Math.round(gain * 1.2) : 0
    const attempt: QuizAttempt = {
      questionId: q.id, wordId: q.wordId, word: q.word,
      userAnswer, correct, timestamp: Date.now(),
    }
    const next: Session = {
      ...prev,
      combo,
      maxCombo: Math.max(prev.maxCombo, combo),
      score: prev.score + gain,
      xp: prev.xp + xpGain,
      results: [...prev.results, attempt],
    }
    sRef.current = next
    setS(next)
    if (correct) {
      setQs(q0 => ({ ...q0, comboBump: true }))
      setTimeout(() => setQs(q0 => ({ ...q0, comboBump: false })), 220)
    }
    // 回写统一状态机 / 错词本（词不在学习库则静默跳过，纯刷题不强制入库）
    const lexi = useLexiStore.getState()
    lexi.recordActivity('quizzed')
    if (correct) {
      if (xpGain) lexi.incXp(xpGain)
      if (lexi.byId(q.wordId)) { lexi.markCorrect(q.wordId); lexi.recordDimPass(q.wordId, DIM_OF[q.type] ?? 'recognize') }
      lexi.wrongAnswers.filter(w => w.wordId === q.wordId).forEach(w => lexi.removeWrongAnswer(w.id))
    } else {
      const correctText = q.inputMode === 'spell'
        ? q.answer
        : (q.options?.find(o => o.id === q.answer)?.text ?? q.answer)
      // 听力/阅读短文题按短文计（wordId=passage），不进词级错题本
      if (q.type !== 'listening_comprehension' && q.type !== 'reading_comprehension') {
        lexi.addWrongAnswer({
          wordId: q.wordId, word: q.word, question: questionText(q),
          userAnswer, correctAnswer: correctText,
          explanation: q.explanationZh ?? '', timestamp: Date.now(),
        })
      }
      if (lexi.byId(q.wordId)) lexi.markWrong(q.wordId)
    }
  }, [])

  const answerChoice = useCallback((optId: string) => {
    if (lockRef.current) return
    const q = sRef.current.step === 'play' ? questions[sRef.current.idx] : null
    if (!q || q.inputMode !== 'choice') return
    lockRef.current = true
    const correct = optId === q.answer
    setQs(prev => ({ ...prev, locked: true, picked: optId, correct }))
    finishQuestion(correct, q, q.options?.find(o => o.id === optId)?.text ?? optId)
  }, [questions, finishQuestion])

  const submitSpell = useCallback(() => {
    if (lockRef.current) return
    const q = sRef.current.step === 'play' ? questions[sRef.current.idx] : null
    if (!q || q.inputMode !== 'spell') return
    const val = spellInput.trim().toLowerCase()
    const ans = q.answer.toLowerCase()
    if (!val) return
    if (val === ans) {
      lockRef.current = true
      setQs(prev => ({ ...prev, locked: true, correct: true, spellPhase: 'good' }))
      finishQuestion(true, q, val)
      return
    }
    const d = lev(val, ans)
    if (d === 1 && !qs.spellTried) {
      setQs(prev => ({ ...prev, spellTried: true, spellPhase: 'tol' }))
      setTimeout(() => spellRef.current?.select(), 30)
      return
    }
    lockRef.current = true
    setQs(prev => ({ ...prev, locked: true, correct: false, spellPhase: 'bad', spellDiffAns: val }))
    finishQuestion(false, q, val)
  }, [questions, qs.spellTried, spellInput, finishQuestion])

  // 结束整组并结算（正常做完最后一题 / 专练「按时间」倒计时到点 共用）
  const finishNow = useCallback(() => {
    const prev = sRef.current
    if (prev.step === 'results') return
    const correct = prev.results.filter(r => r.correct).length
    const lexi = useLexiStore.getState()
    lexi.addQuizSession({ id: `lexiverse-${Date.now()}`, startedAt: prev.startedAt, completedAt: Date.now(), attempts: prev.results, score: correct, total: prev.results.length || questions.length })
    // 今日动线：完成整组练习才标记对应卡完成（不再靠全局 quizzed 计数，避免「进了就算完成」）
    if (mode === 'exam-practice') lexi.markActivityDone('mock')
    else if (mode === 'wrong-answer-booster') lexi.markActivityDone('wrong')
    else if (mode === 'vocabulary-drill' || mode === 'sentence-practice') lexi.markActivityDone('practice')
    const done: Session = { ...prev, step: 'results', completedAt: Date.now() }
    sRef.current = done
    setS(done)
  }, [questions.length, mode])

  const nextQuestion = useCallback(() => {
    const prev = sRef.current
    if (prev.idx + 1 >= questions.length) { finishNow(); return }
    const next: Session = { ...prev, idx: prev.idx + 1 }
    sRef.current = next
    lockRef.current = false
    setS(next)
    setQs(freshQ())
    setSpellInput('')
  }, [questions.length, finishNow])

  // 专练「按时间」：到点自动收尾（无限连续 len=inf 不设倒计时，做满大批次或手动离开）
  useEffect(() => {
    if (!drillParam || minutesParam <= 0) return
    const t = setTimeout(() => finishNow(), minutesParam * 60_000)
    return () => clearTimeout(t)
  }, [drillParam, minutesParam, finishNow, seed])

  const restart = useCallback(() => { setSeed(s => s + 1) }, [])
  const leave = useCallback(() => { router.push(returnTo ?? '/today') }, [router, returnTo])

  // 键盘：选择题 1-4 / a-d 选项，作答后 Enter 下一题（拼写题 Enter 由输入框处理）
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (S.step === 'results' || !current) return
      if (!qs.locked) {
        if (current.inputMode !== 'choice') return
        const k = e.key.toLowerCase()
        const i = ['1', '2', '3', '4'].includes(k) ? Number(k) - 1 : ['a', 'b', 'c', 'd'].indexOf(k)
        if (i >= 0 && current.options?.[i]) { e.preventDefault(); answerChoice(current.options[i].id) }
      } else if (e.key === 'Enter') {
        e.preventDefault(); nextQuestion()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [S.step, current, qs.locked, answerChoice, nextQuestion])

  const isAsync = !!(wordParam && vsParam)
  // 题库命中前先等一拍（避免客户端兜底闪一下再被题库替换）；词典本身仍在加载也等
  if (isBankCase && bankQuestions === null && !total) return <LoadingState message="Loading Practice…" />
  if (loading && !isAsync && !yesterdayParam && !(isBankCase && bankQuestions && bankQuestions.length)) return <LoadingState message="Loading Practice…" />
  if (isAsync && vsQuestions === null) return <LoadingState message="生成辨析题…" />
  if (error && !total) return <PracticeFrame><EmptyView detail={error.message} onLeave={leave} /></PracticeFrame>
  if (!total) {
    const detail = yesterdayParam ? '昨天没有学习记录 — 先去学今天的词包。'
      : wordParam ? '该词还没有题目，去词典看看。'
      : mode === 'listening-practice' ? '当前等级暂时没有听力短文题（可切到其它练习）。'
      : mode === 'reading-practice' ? '当前等级暂时没有阅读短文题（可切到其它练习）。'
      : mode === 'wrong-answer-booster' ? '还没有错题 — 先做一轮练习吧。'
      : '暂时没有可练习的题目。'
    return <PracticeFrame><EmptyView detail={detail} onLeave={leave} mode={!wordParam ? mode : undefined} /></PracticeFrame>
  }

  // ── 结算页 ────────────────────────────────────────────────────────────────
  if (S.step === 'results') {
    const correctN = S.results.filter(r => r.correct).length
    const pct = total ? Math.round((correctN / total) * 100) : 0
    const wrong = total - correctN
    const secs = Math.max(1, Math.round(((S.completedAt || Date.now()) - S.startedAt) / 1000))
    const ss = String(secs % 60).padStart(2, '0')
    const mm = Math.floor(secs / 60)
    const R = 53, C = 2 * Math.PI * R, off = C * (1 - pct / 100)
    return (
      <PracticeFrame>
        <div className="results fade-up">
          <div className="res-hero">
            <div className="ring">
              <svg width="120" height="120">
                <circle cx="60" cy="60" r={R} fill="none" stroke="var(--line)" strokeWidth="8" />
                <circle cx="60" cy="60" r={R} fill="none" stroke="var(--teal-ink)" strokeWidth="8"
                  strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} transform="rotate(-90 60 60)" />
              </svg>
              <span className="pct"><b>{correctN}/{total}</b><span>正确率 {pct}%</span></span>
            </div>
            <h2>{pct >= 80 ? '练得漂亮' : pct >= 50 ? '继续保持' : '再练一轮会更好'}</h2>
          </div>
          <div className="res-stats">
            <div className="res-stat"><b>{mm}:{ss}</b><span>用时</span></div>
            <div className="res-stat" style={{ '--c': 'var(--gold-ink)' } as React.CSSProperties}><b>×{S.maxCombo}</b><span>最高连击</span></div>
            <div className="res-stat" style={{ '--c': 'var(--teal-ink)' } as React.CSSProperties}><b>+{S.xp}</b><span>获得 XP</span></div>
          </div>
          {wrong > 0 && (
            <Link href="/wrong-answers" className="wrongbook">
              <span className="ico">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5V6a2 2 0 0 1 2-2h12a1 1 0 0 1 1 1v13" /><path d="M6 17h13" />
                </svg>
              </span>
              <span>
                <span className="t">{wrong} 个错词已存入错词本</span>
                <span className="d">复习舱会优先安排，词图上长出红边提醒</span>
              </span>
            </Link>
          )}
          {!wordParam && <ModeSwitch current={mode} />}
          <div className="res-actions">
            <button className="cta ghost press" onClick={leave}>返回今日</button>
            <button className="cta press" onClick={restart}>再来一轮 ↻</button>
          </div>
        </div>
      </PracticeFrame>
    )
  }

  // ── 答题页 ────────────────────────────────────────────────────────────────
  if (!current) return <PracticeFrame><EmptyView detail="暂时没有可练习的题目。" onLeave={leave} /></PracticeFrame>
  const q = current
  const pbarPct = total ? (S.idx / total) * 100 : 0
  const ans = q.answer.toLowerCase()
  return (
    <PracticeFrame>
      {/* 顶部 */}
      <div className="topbar">
        <div className="tb-row">
          <button className="exit press" title="退出" onClick={leave}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <span className="pbar"><i style={{ width: `${pbarPct}%` }} /></span>
          <span className="pcount">{Math.min(S.idx + 1, total)}<span>/{total}</span></span>
        </div>
        <div className="tb-row">
          <span className={`combo ${S.combo >= 2 ? '' : 'dim'}${qs.comboBump ? ' bump' : ''}`}>
            {S.combo >= 2 ? '🔥' : '·'} {S.combo} 连击
          </span>
          <span className="score" style={{ marginLeft: 'auto' }}>{S.score}<span className="lab">分</span></span>
          <span className="score xp">+{S.xp}<span className="lab">XP</span></span>
        </div>
      </div>

      {/* 练习类型切换（仅通用练习场景显示） */}
      {!wordParam && !vsParam && !yesterdayParam && <ModeSwitch current={mode} />}

      {/* 题体 */}
      <div className="qbody fade-up" key={q.id}>
        <p className="eyebrow"><span className="tag">{TYPE_LABEL[q.type]}</span></p>
        <PromptCard q={q} />
        {q.inputMode === 'choice' ? (
          <div className="opts">
            {(q.options ?? []).map((o, i) => {
              const isPicked = qs.picked === o.id
              const isAnswer = q.answer === o.id
              const cls = qs.locked && isAnswer ? 'correct' : qs.locked && isPicked ? 'wrong' : ''
              return (
                <button key={o.id} type="button" className={`opt press ${qs.locked ? 'locked' : ''} ${cls}`}
                  disabled={qs.locked} onClick={() => answerChoice(o.id)}>
                  <span className="key">{'ABCD'[i]}</span>
                  <span className="otxt">{o.text}</span>
                  {qs.locked && (isAnswer || isPicked) && (
                    <span className="mk">{isAnswer ? <OkMark /> : <NoMark />}</span>
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="spell">
            <div className="hintrow">
              <span className="hint-initials"><Initials s={q.hint?.initials ?? ''} /></span>
              {q.hint?.ipa && <span className="hint-ipa">{q.hint.ipa}</span>}
            </div>
            <input ref={spellRef} className={`lg-input ${qs.spellPhase}`} type="text"
              autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder="敲出这个词…"
              value={spellInput} disabled={qs.locked}
              onChange={e => { setSpellInput(e.target.value); setQs(p => (p.spellPhase ? { ...p, spellPhase: '' } : p)) }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submitSpell() } }} />
            <div>
              {qs.spellPhase === 'tol' && <div className="tol-msg">差一个字母，再试一次 ✦</div>}
              {qs.spellPhase === 'bad' && (
                <>
                  <div className="diffrow"><div className="lab">你的拼写</div><div className="difftxt"><Diff val={qs.spellDiffAns} ans={ans} /></div></div>
                  <div className="diffrow" style={{ marginTop: 8 }}><div className="lab">正解</div><div className="answer-line">{ans}</div></div>
                </>
              )}
            </div>
          </div>
        )}

        {qs.locked && (
          <div className={`feedback show ${qs.correct ? 'ok' : 'no'}`}>
            <div className="fb-head">{qs.correct ? <><OkMark /> 答对了 · 连击 +1</> : <><NoMark /> 答错了</>}</div>
            {(q.wordZh || q.explanationZh) && (
              <div className="fb-exp">
                <b>{q.word}{q.wordZh ? `（${q.wordZh}）` : ''}</b>
                {q.explanationZh ? <> — {stripLeadWord(q.explanationZh, q.word)}</> : null}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部 CTA（拼写未提交时无按钮，回车提交；选择/作答后出现） */}
      <div className="qfoot">
        {qs.locked && (
          <button className="cta press" onClick={nextQuestion}>
            {S.idx >= total - 1 ? '查看结算 →' : '下一题 →'}
          </button>
        )}
      </div>
    </PracticeFrame>
  )
}

// ── 视图原语 ────────────────────────────────────────────────────────────────
function PracticeFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="theme-light pr-v2">
      <div className="pr-app">{children}</div>
    </main>
  )
}

// 练习类型切换（词汇 / 听力 / 阅读）——把短文题也接进练习页
function ModeSwitch({ current }: { current: QuizMode }) {
  const items: [QuizMode, string][] = [['vocabulary-drill', '词汇'], ['listening-practice', '听力'], ['reading-practice', '阅读']]
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', margin: '0 0 14px' }}>
      {items.map(([m, label]) => {
        const on = current === m
        return (
          <Link key={m} href={`/quiz?mode=${m}`} style={{ textDecoration: 'none', padding: '5px 15px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--font-sans)', border: '1px solid var(--line)', background: on ? 'var(--teal-ink)' : 'var(--card)', color: on ? '#fff' : 'var(--ink-sub)' }}>{label}</Link>
        )
      })}
    </div>
  )
}

function PromptCard({ q }: { q: PQuestion }) {
  let inner: React.ReactNode
  if (q.type === 'reading_comprehension' && q.passage) {
    // 阅读理解：屏显短文 + 问题
    inner = <>
      <div style={{ textAlign: 'left', fontSize: 14.5, lineHeight: 1.78, color: 'var(--ink-sub)', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 16px', marginBottom: 12, maxHeight: '34vh', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{q.passage}</div>
      {q.promptZh && <div className="ask">{q.promptZh}</div>}
      {q.prompt && <div style={{ marginTop: 8, fontSize: 16, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-news)', lineHeight: 1.5 }}>{q.prompt}</div>}
    </>
  } else if (q.audioRef) {
    // 听力题（听音选义 / 听写 / 听短文理解）：播放按钮 + 提示语 + 理解题题干
    inner = <>
      <ListenPlay word={q.audioRef} slow={q.type === 'listening_comprehension'} />
      {q.promptZh && <div className="ask" style={{ marginTop: 10 }}>{q.promptZh}</div>}
      {q.type === 'listening_comprehension' && q.prompt && <div style={{ marginTop: 12, fontSize: 16, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-news)', lineHeight: 1.5 }}>{q.prompt}</div>}
    </>
  } else if (q.type === 'cloze_choice' || q.type === 'cloze_spell' || q.type === 'synonym_substitute') {
    inner = <><div className="cloze">{clozeNodes(q.prompt)}</div>{q.ask && <div className="ask">{q.ask}</div>}</>
  } else if (q.inputMode === 'spell') {
    inner = <><div className="zh">{q.promptZh}</div>{q.ask && <div className="ask">{q.ask}</div>}</>
  } else if (q.type === 'def_to_word' || q.type === 'zh_to_en' || q.type === 'confusable_choice') {
    inner = <><div className="zh">{q.promptZh || q.prompt}</div>{q.ask && <div className="ask">{q.ask}</div>}</>
  } else {
    inner = <><div className="word">{q.prompt}</div>{q.ipa && <div className="ipa">{q.ipa}</div>}{q.ask && <div className="ask">{q.ask}</div>}</>
  }
  return <div className="prompt">{inner}<div className="audio-slot" /></div>
}

function ListenPlay({ word, slow = false }: { word: string; slow?: boolean }) {
  const [playing, setPlaying] = useState(false)
  const play = () => {
    setPlaying(true)
    void speakSmart(word, 'us', { slow })
    setTimeout(() => setPlaying(false), slow ? 2600 : 1000)
  }
  return (
    <button type="button" className="press" onClick={play} title="播放发音"
      style={{ width: 64, height: 64, borderRadius: 999, border: 'none', cursor: 'pointer', background: 'linear-gradient(180deg,#6ff0db,#34d8c0)', color: '#04241f', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 14px 28px -14px rgba(14,140,122,.7)' }}>
      {playing
        ? <span style={{ display: 'inline-flex', gap: 3 }}>{[0, 1, 2, 3].map(i => <span key={i} style={{ width: 3, height: 14, borderRadius: 2, background: '#04241f', animation: `pr-eq .7s ${i * 0.12}s ease-in-out infinite` }} />)}</span>
        : <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
    </button>
  )
}

function clozeNodes(text: string): React.ReactNode[] {
  const parts = text.split('[BLANK]')
  const out: React.ReactNode[] = []
  parts.forEach((p, i) => {
    if (i > 0) out.push(<span key={`b${i}`} className="blank">？</span>)
    out.push(<span key={`t${i}`}>{p}</span>)
  })
  return out
}

function Initials({ s }: { s: string }) {
  if (!s) return null
  return <><b>{s[0]}</b>{s.slice(1)}</>
}

function Diff({ val, ans }: { val: string; ans: string }) {
  const n = Math.max(val.length, ans.length)
  const out: React.ReactNode[] = []
  for (let i = 0; i < n; i++) {
    const c = val[i] ?? '·'
    const ok = !!val[i] && !!ans[i] && val[i] === ans[i]
    out.push(<span key={i} className={ok ? 'ok' : 'no'}>{c}</span>)
  }
  return <>{out}</>
}

function EmptyView({ detail, onLeave, mode }: { detail: string; onLeave: () => void; mode?: QuizMode }) {
  return (
    <div className="results fade-up" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 16 }}>
      <h2 style={{ margin: 0, fontFamily: 'var(--font-serif-zh)', fontSize: 21, color: 'var(--ink)' }}>没有可练习的题目</h2>
      <p style={{ margin: 0, color: 'var(--ink-sub)', fontSize: 14, lineHeight: 1.6 }}>{detail}</p>
      {mode && <ModeSwitch current={mode} />}
      <button className="cta press" style={{ maxWidth: 240 }} onClick={onLeave}>回到今日</button>
    </div>
  )
}

const OkMark = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--teal-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
)
const NoMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--rose-ink)" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
)

// ── 出题（规则层，从词库即时生成；后续可切 question_bank）──────────────────────
function buildQuestions(args: { mode: QuizMode; pool: VocabWord[]; wordParam?: string; examTag: string; rng: () => number }): PQuestion[] {
  const { mode, pool, wordParam, examTag, rng } = args
  const usable = pool.filter(w => zhOf(w))
  const preferred = wordParam
    ? usable.find(w => w.id === wordParam || w.word.toLowerCase() === wordParam.toLowerCase())
    : undefined
  if (wordParam && !preferred && mode !== 'wrong-answer-booster') return []   // A3：指定词无 → 空

  if (mode === 'wrong-answer-booster') {
    const wrong = useLexiStore.getState().wrongAnswers.slice(0, SESSION_SIZE)
    return wrong
      .map((w, i) => {
        const t = usable.find(u => u.id === w.wordId || u.word.toLowerCase() === w.word.toLowerCase())
        return t ? buildQuestionFor(t, 'en_to_zh', usable, rng, `w${i}`, ['def_to_word', 'zh_to_en']) : null
      })
      .filter(isQ)
  }

  let src = usable
  if (mode === 'sentence-practice') src = usable.filter(w => exOf(w).en)
  if (mode === 'exam-practice') {
    const lv = EXAM_TO_LEVEL[examTag]
    src = lv ? usable.filter(w => w.levels?.includes(lv) || w.primaryLevel === lv) : usable
  }
  if (!src.length) src = usable

  const targets = preferred
    ? [preferred, ...pickWords(src.filter(w => w.id !== preferred.id), SESSION_SIZE - 1, rng)]
    : pickWords(src, SESSION_SIZE, rng)

  const preferredTypes: PType[] = mode === 'sentence-practice'
    ? ['cloze_choice', 'def_to_word', 'en_to_zh']
    : DRILL_TYPES

  return targets
    .map((t, i) => {
      const order = rotate(preferredTypes, i)
      return buildFirst(t, order, usable, rng, `${mode}${i}`)
    })
    .filter(isQ)
}

/* vs 辨析 — A/B 各一题，题面例句挖空（无例句退释义选词），二选一 */
function buildVsQuestions(a: VocabWord, b: VocabWord): PQuestion[] {
  return [[a, b], [b, a]].map(([target, other], index) => {
    const ex = exOf(target)
    const blanked = ex.en ? clozeBlank(ex.en, target.word) : ''
    const pair = (index % 2 === 0 ? [target, other] : [other, target])
    const options: POption[] = pair.map((w, i) => ({ id: 'abcd'[i], text: w.word, wordId: w.id }))
    const answer = options.find(o => o.wordId === target.id)?.id ?? 'a'
    const base = {
      id: `vs-${target.id}-${index}`, wordId: target.id, word: target.word,
      inputMode: 'choice' as const, options, answer,
      explanationZh: `${target.word}：${zhOf(target)}　|　${other.word}：${zhOf(other)}`,
    }
    return blanked
      ? { ...base, type: 'cloze_choice' as const, prompt: blanked, ask: '选词填空（辨析）' }
      : { ...base, type: 'def_to_word' as const, prompt: zhOf(target), ask: '选择与释义匹配的单词' }
  })
}

function buildFirst(target: VocabWord, types: PType[], pool: VocabWord[], rng: () => number, key: string): PQuestion | null {
  for (const t of types) {
    const q = buildQuestionFor(target, t, pool, rng, key)
    if (q) return q
  }
  return buildQuestionFor(target, 'en_to_zh', pool, rng, key)
}

function buildQuestionFor(target: VocabWord, type: PType, pool: VocabWord[], rng: () => number, key: string, fallback?: PType[]): PQuestion | null {
  const zh = zhOf(target)
  const word = target.word
  const id = `${type}-${target.id}-${key}`
  const expl = explZh(target)

  const enOptions = (): POption[] | null => {
    const d = pickWords(pool.filter(w => w.id !== target.id && w.word && w.word.toLowerCase() !== word.toLowerCase()), 3, rng)
    if (d.length < 1) return null
    return shuffle([{ text: word, wordId: target.id }, ...d.map(w => ({ text: w.word, wordId: w.id }))], rng)
      .slice(0, 4).map((o, i) => ({ id: 'abcd'[i], text: o.text, wordId: o.wordId }))
  }
  const tryFallback = () => {
    for (const f of (fallback ?? [])) { if (f !== type) { const q = buildQuestionFor(target, f, pool, rng, key); if (q) return q } }
    return null
  }

  switch (type) {
    case 'en_to_zh': {
      if (!zh) return tryFallback()
      const withZh = pool.filter(w => w.id !== target.id && zhOf(w) && zhOf(w) !== zh)
      const d = pickWords(withZh, 3, rng)
      if (d.length < 1) return tryFallback()
      const opts = shuffle([{ text: zh, wordId: target.id }, ...d.map(w => ({ text: zhOf(w), wordId: w.id }))], rng)
        .slice(0, 4).map((o, i) => ({ id: 'abcd'[i], text: o.text, wordId: o.wordId }))
      return { id, wordId: target.id, word, type, inputMode: 'choice', prompt: word, ipa: ipaOf(target), ask: '选择正确的中文释义', options: opts, answer: opts.find(o => o.wordId === target.id)!.id, explanationZh: expl }
    }
    case 'zh_to_en': {
      if (!zh) return tryFallback()
      const opts = enOptions(); if (!opts) return tryFallback()
      return { id, wordId: target.id, word, type, inputMode: 'choice', prompt: zh, promptZh: zh, ask: '选择对应的英文单词', options: opts, answer: opts.find(o => o.wordId === target.id)!.id, explanationZh: expl }
    }
    case 'def_to_word': {
      if (!zh) return tryFallback()
      const opts = enOptions(); if (!opts) return tryFallback()
      return { id, wordId: target.id, word, type, inputMode: 'choice', prompt: zh, ask: '选择与释义匹配的单词', options: opts, answer: opts.find(o => o.wordId === target.id)!.id, explanationZh: expl }
    }
    case 'cloze_choice': {
      const ex = exOf(target)
      const blanked = ex.en ? clozeBlank(ex.en, word) : ''
      if (!blanked) return tryFallback()
      const opts = enOptions(); if (!opts) return tryFallback()
      return { id, wordId: target.id, word, type, inputMode: 'choice', prompt: blanked, ask: '选词填空', options: opts, answer: opts.find(o => o.wordId === target.id)!.id, explanationZh: ex.zh || expl }
    }
    case 'zh_to_word_spell': {
      if (!zh || word.length < 2 || /[^a-zA-Z]/.test(word)) return tryFallback()
      return { id, wordId: target.id, word, type, inputMode: 'spell', prompt: '', promptZh: zh, ask: '根据中文释义，拼出英文单词', hint: { initials: spellHint(word), ipa: ipaOf(target) }, answer: word, explanationZh: expl }
    }
    default:
      return null
  }
}

// ── 词数据取值 / 工具 ────────────────────────────────────────────────────────
function zhOf(w: VocabWord): string {
  const d = w.definitions?.[0] as DictionaryDefinition | undefined
  return (d?.definitionZh?.trim() || d?.definitionEn?.trim() || '')
}
function exOf(w: VocabWord): { en: string; zh: string } {
  const e = w.examples?.[0] as DictionaryExample | undefined
  return { en: e?.sentenceEn ?? '', zh: e?.sentenceZh ?? '' }
}
function ipaOf(w: VocabWord): string {
  const p = w.phoneticIpa ? String(w.phoneticIpa).trim() : ''
  if (!p) return ''
  return /^\/.*\/$/.test(p) ? p : `/${p.replace(/^\/|\/$/g, '')}/`
}
function explZh(w: VocabWord): string {
  const pos = (w.partOfSpeech || (w.definitions?.[0] as DictionaryDefinition | undefined)?.partOfSpeech || '').trim().replace(/\.+$/, '')
  const zh = zhOf(w)
  return [pos && `${pos}.`, zh].filter(Boolean).join(' ')
}
function spellHint(word: string): string {
  const w = word.toLowerCase()
  if (w.length <= 1) return w
  const mid = Array(Math.max(0, w.length - 2)).fill('_').join(' ')
  return [w[0], mid, w[w.length - 1]].filter(Boolean).join(' ')
}
function questionText(q: PQuestion): string {
  if (q.audioRef) return `${q.promptZh ?? '听力题'}（${q.word}）`
  if (q.type === 'cloze_choice' || q.type === 'cloze_spell') return q.prompt.replace('[BLANK]', '＿＿＿')
  if (q.inputMode === 'spell') return q.promptZh ?? q.word
  if (q.type === 'def_to_word' || q.type === 'zh_to_en') return q.promptZh || q.prompt
  return q.prompt
}
function clozeBlank(sentence: string, word: string): string {
  if (!sentence) return ''
  const p = new RegExp(`\\b${escapeRegExp(word)}(s|es|ed|ing|d)?\\b`, 'i')
  const r = sentence.replace(p, '[BLANK]')
  return r === sentence ? '' : r
}
function isQ(q: PQuestion | null): q is PQuestion { return q !== null }
function rotate<T>(arr: T[], by: number): T[] {
  const n = arr.length; if (!n) return arr
  const k = ((by % n) + n) % n
  return [...arr.slice(k), ...arr.slice(0, k)]
}
function pickWords(words: VocabWord[], count: number, rng: () => number): VocabWord[] {
  return shuffle(words, rng).slice(0, Math.min(count, words.length))
}
function shuffle<T>(items: T[], rng: () => number): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}
function parseMode(mode: string | null): QuizMode {
  if (mode === 'sentence-practice' || mode === 'exam-practice' || mode === 'wrong-answer-booster' || mode === 'listening-practice' || mode === 'reading-practice') return mode
  return 'vocabulary-drill'
}
function lev(a: string, b: string): number {
  const m = a.length, n = b.length
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)])
  for (let j = 0; j <= n; j++) d[0][j] = j
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[m][n]
}
function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
function mulberry32(seed: number): () => number {
  return function rng() {
    let t = (seed += 0x6D2B79F5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
