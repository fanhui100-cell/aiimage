'use client'
/* ════════════════════════════════════════════════════════════════════════
   PracticeRunner — 统一练习屏（Phase 5）
   消费 GET /api/practice/session；每题作答 POST /api/practice/attempts；
   五态(loading/empty/error/play/results) + 六 renderer(按 inputMode 路由)；
   复用 .pr-v2 视觉 + premium overlay；退役题型永不渲染；wordUpdates 回流 lexiStore。
   ════════════════════════════════════════════════════════════════════════ */
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LoadingState } from '@/components/lexiverse/LoadingState'
import { useLexiStore } from '@/store/lexiStore'
import type { QuizAttempt } from '@/types/quiz'
import { PracticeFrame } from './PracticeFrame'
import { OkMark, NoMark, clozeNodes } from './icons'
import { ChoiceRenderer } from './renderers/ChoiceRenderer'
import { SpellRenderer } from './renderers/SpellRenderer'
import { ListeningRenderer } from './renderers/ListeningRenderer'
import { FreeTextRenderer, type FreeTextEstimate, type FreeTextRubricLine } from './renderers/FreeTextRenderer'
import { scoringSkillForTask } from '@/lib/scoring/rubrics'
import { resolvePracticeAnswerMode, type PracticeAnswerMode } from '@/lib/practice/answer-mode'
import { MultiBlankRenderer } from './renderers/MultiBlankRenderer'
import { MatchingRenderer } from './renderers/MatchingRenderer'
import { BuildSentenceRenderer } from './renderers/BuildSentenceRenderer'
import { PassageClozeRenderer } from './renderers/PassageClozeRenderer'
import { SevenSelectRenderer } from './renderers/SevenSelectRenderer'
import { ParaMatchRenderer } from './renderers/ParaMatchRenderer'
import {
  ASK_OF, DIM_OF, freshQState, freshRunnerSession, isDeprecatedSafe,
  type PracticeItem, type PracticeItemView, type PracticeRunnerProps, type PracticeSessionResponse,
  type QState, type RecordAttemptInput, type RecordAttemptResponse, type RunnerSession, type SessionStatus,
} from './practice-types'

const LABEL_OF: Record<string, string> = {
  en_to_zh: '英→中', zh_to_en: '中→英', def_to_word: '释义选义', cloze_choice: '例句填空',
  zh_to_word_spell: '中文拼写', word_form: '词形变化', synonym_choice: '近义词', confusable_choice: '易混词',
  cloze_spell: '例句拼写', listen_to_meaning: '听音选义', dictation_spell: '听写', listening_comprehension: '听力理解',
  reading_comprehension: '阅读理解', synonym_substitute: '同义替换', collocation_choice: '搭配',
  cloze_passage: '完形填空', seven_select: '七选五', para_match: '段落信息匹配', banked_cloze: '选词填空', grammar_fill: '语法填空',
}

type AnswerMode = PracticeAnswerMode
function answerMode(item: PracticeItem): AnswerMode {
  return resolvePracticeAnswerMode(item)
}

// Levenshtein 距离（拼写一次容错用）
function lev(a: string, b: string): number {
  const m = a.length, n = b.length
  const d = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let i = 0; i <= m; i++) d[i][0] = i
  for (let j = 0; j <= n; j++) d[0][j] = j
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    const c = a[i - 1] === b[j - 1] ? 0 : 1
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c)
  }
  return d[m][n]
}

// ── 产出型 AI 估分（free_text/speak）：按技能选端点；后端返回统一形状 ──
const SCORING_PATH: Record<string, string> = {
  writing: '/api/scoring/writing',
  translation: '/api/scoring/translation',
  speaking: '/api/scoring/speaking',
}
const PROVIDER_LABEL: Record<string, string> = { deepseek: 'DeepSeek', mock: '本地估算' }
/** 后端 SubjectiveScore JSON → FreeTextEstimate（每维度归一为 0–100 进度值）。 */
function toEstimate(j: Record<string, unknown>): FreeTextEstimate {
  const provRaw = String(j.provider ?? 'AI')
  const dims = Array.isArray(j.dimensions) ? j.dimensions : []
  const rubric: FreeTextRubricLine[] = dims.map((d) => {
    const o = (d && typeof d === 'object' ? d : {}) as Record<string, unknown>
    const max = Number(o.max) || 0
    const awarded = Number(o.awarded) || 0
    return { name: String(o.labelZh ?? o.key ?? ''), v: max ? Math.max(0, Math.min(100, Math.round((awarded / max) * 100))) : 0 }
  })
  return {
    provider: PROVIDER_LABEL[provRaw] ?? provRaw,
    score: Number(j.overall) || 0,
    outOf: Number(j.fullScore) || 0,
    band: String(j.band ?? ''),
    rubric,
  }
}

export function PracticeRunner(props: PracticeRunnerProps) {
  const router = useRouter()
  const [seed, setSeed] = useState(0)
  const [status, setStatus] = useState<SessionStatus>('loading')
  const [items, setItems] = useState<PracticeItem[]>([])
  const [warnings, setWarnings] = useState<string[]>([])

  const [S, setS] = useState<RunnerSession>(freshRunnerSession)
  const [qs, setQs] = useState<QState>(freshQState)
  const [spellInput, setSpellInput] = useState('')
  const [freeText, setFreeText] = useState('')
  // multi_blank / matching / build_sentence 作答态 + 可提交标志（renderer 经 onChange/onCanSubmit 回填）
  const [canSubmit, setCanSubmit] = useState(false)
  const [blankState, setBlankState] = useState<Record<number, string>>({})
  const [matchState, setMatchState] = useState<Record<string, string>>({})
  const [buildState, setBuildState] = useState<string[]>([])
  const sRef = useRef(S)
  useEffect(() => { sRef.current = S })
  const spellRef = useRef<HTMLInputElement | null>(null)
  const lockRef = useRef(false)

  // ── 取会话 ──
  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    const p = new URLSearchParams()
    p.set('mode', props.mode)
    if (props.word) p.set('word', props.word)
    if (props.wordId) p.set('wordId', props.wordId)
    if (props.examId) p.set('examId', props.examId)
    if (props.sectionId) p.set('sectionId', props.sectionId)
    if (props.taskType) p.set('taskType', props.taskType)
    if (props.level != null) p.set('level', String(props.level))
    if (props.count != null) p.set('count', String(props.count))
    fetch(`/api/practice/session?${p.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j: PracticeSessionResponse) => {
        if (cancelled) return
        if (!j.ok) { setStatus('error'); return }
        setItems((j.items ?? []).filter((it) => !isDeprecatedSafe(it.type)))   // 退役题型双保险
        setWarnings(j.warnings ?? [])
        setStatus('ready')
      })
      .catch(() => { if (!cancelled) setStatus('error') })
    return () => { cancelled = true }
  }, [props.mode, props.word, props.wordId, props.examId, props.sectionId, props.taskType, props.level, props.count, seed])

  // 新会话复位
  const sessionKey = `${props.mode}|${props.word ?? ''}|${props.examId ?? ''}|${props.sectionId ?? ''}|${props.taskType ?? ''}|${props.level ?? ''}|${seed}`
  useEffect(() => {
    const init = freshRunnerSession()
    sRef.current = init
    lockRef.current = false
    setS(init); setQs(freshQState()); setSpellInput(''); setFreeText('')
    setCanSubmit(false); setBlankState({}); setMatchState({}); setBuildState([])
  }, [sessionKey])

  const total = items.length
  const current = items[S.idx] ?? null

  // 聚焦拼写输入
  useEffect(() => {
    if (current && answerMode(current) === 'spell' && !qs.locked) {
      const t = setTimeout(() => spellRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [current, qs.locked])

  // ── 词状态回流（应用 attempts 返回的 wordUpdates；POST 失败回退本地） ──
  const applyWordUpdates = useCallback((updates: RecordAttemptResponse['wordUpdates'] | undefined, item: PracticeItem, correct: boolean) => {
    const lexi = useLexiStore.getState()
    const list = updates && updates.length
      ? updates
      : item.targetWords
          .filter((t) => t.wordId && (!t.role || t.role === 'tested_answer' || t.role === 'tested_context'))
          .map((t) => ({ wordId: t.wordId as string, isCorrect: correct, dimension: t.dimension }))
    for (const u of list) {
      if (!u.wordId || !lexi.byId(u.wordId)) continue
      if (u.isCorrect) { lexi.markCorrect(u.wordId); lexi.recordDimPass(u.wordId, u.dimension || DIM_OF[item.type] || 'recognize') }
      else lexi.markWrong(u.wordId)
    }
  }, [])

  const postAttempt = useCallback((item: PracticeItem, answer: unknown, isCorrect?: boolean) => {
    const body: RecordAttemptInput = {
      questionItemId: item.questionItemId,
      legacyQuestionId: item.legacyQuestionId,
      setId: item.setId,
      examId: props.examId,
      sectionId: props.sectionId,
      taskType: props.taskType ?? item.type,
      subskills: item.subskills,
      answer,
      isCorrect,
      targetWords: item.targetWords,
    }
    fetch('/api/practice/attempts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then((r) => (r.ok ? r.json() : null))
      .then((res: RecordAttemptResponse | null) => { if (isCorrect != null) applyWordUpdates(res?.wordUpdates, item, isCorrect) })
      .catch(() => { if (isCorrect != null) applyWordUpdates(undefined, item, isCorrect) })
  }, [props.examId, props.sectionId, props.taskType, applyWordUpdates])

  const finishQuestion = useCallback((correct: boolean, item: PracticeItem, userAnswer: string) => {
    const prev = sRef.current
    const combo = correct ? prev.combo + 1 : 0
    const gain = correct ? 10 + Math.max(0, (combo - 1) * 2) : 0
    const xpGain = correct ? Math.round(gain * 1.2) : 0
    const wordId = item.targetWords[0]?.wordId ?? ''
    const word = item.targetWords[0]?.surface ?? wordId
    const attempt: QuizAttempt = { questionId: item.id, wordId, word, userAnswer, correct, timestamp: Date.now() }
    const next: RunnerSession = {
      ...prev, combo, maxCombo: Math.max(prev.maxCombo, combo),
      score: prev.score + gain, xp: prev.xp + xpGain, results: [...prev.results, attempt],
    }
    sRef.current = next
    setS(next)
    if (correct) {
      setQs((q0) => ({ ...q0, comboBump: true }))
      setTimeout(() => setQs((q0) => ({ ...q0, comboBump: false })), 220)
    }
    // 本地 lexi：活跃度 / XP / 错词本（短文题不入词级错题本）
    const lexi = useLexiStore.getState()
    lexi.recordActivity('quizzed')
    if (correct) {
      if (xpGain) lexi.incXp(xpGain)
      if (wordId) lexi.wrongAnswers.filter((w) => w.wordId === wordId).forEach((w) => lexi.removeWrongAnswer(w.id))
    } else if (item.type !== 'listening_comprehension' && item.type !== 'reading_comprehension' && wordId) {
      const correctText = answerMode(item) === 'spell'
        ? (item.answerText ?? '')
        : (item.choices?.find((o) => o.id === item.answer)?.text ?? String(item.answer ?? ''))
      lexi.addWrongAnswer({
        wordId, word, question: item.prompt || item.promptZh || '',
        userAnswer, correctAnswer: correctText, explanation: item.explanationZh ?? '', timestamp: Date.now(),
      })
    }
    // SRS 回流走 attempts 的 wordUpdates
    postAttempt(item, userAnswer, correct)
  }, [postAttempt])

  const finishNow = useCallback(() => {
    const prev = sRef.current
    if (prev.step === 'results') return
    const correct = prev.results.filter((r) => r.correct).length
    const lexi = useLexiStore.getState()
    lexi.addQuizSession({ id: `practice-${Date.now()}`, startedAt: prev.startedAt, completedAt: Date.now(), attempts: prev.results, score: correct, total: prev.results.length || total })
    lexi.markActivityDone(props.mode === 'paper' ? 'mock' : 'practice')
    const done: RunnerSession = { ...prev, step: 'results', completedAt: Date.now() }
    sRef.current = done
    setS(done)
  }, [total, props.mode])

  const nextQuestion = useCallback(() => {
    const prev = sRef.current
    if (prev.idx + 1 >= items.length) { finishNow(); return }
    const next: RunnerSession = { ...prev, idx: prev.idx + 1 }
    sRef.current = next
    lockRef.current = false
    setS(next); setQs(freshQState()); setSpellInput(''); setFreeText('')
    setCanSubmit(false); setBlankState({}); setMatchState({}); setBuildState([])
  }, [items.length, finishNow])

  const answerChoice = useCallback((optId: string) => {
    if (lockRef.current) return
    const item = items[sRef.current.idx]
    if (!item || answerMode(item) !== 'choice') return
    lockRef.current = true
    const correct = optId === item.answer
    setQs((p) => ({ ...p, locked: true, picked: optId, correct }))
    finishQuestion(correct, item, item.choices?.find((o) => o.id === optId)?.text ?? optId)
  }, [items, finishQuestion])

  const submitSpell = useCallback(() => {
    if (lockRef.current) return
    const item = items[sRef.current.idx]
    if (!item) return
    const ans = (item.answerText ?? '').toLowerCase()
    const val = spellInput.trim().toLowerCase()
    if (!val || !ans) return
    if (val === ans) {
      lockRef.current = true
      setQs((p) => ({ ...p, locked: true, correct: true, spellPhase: 'good' }))
      finishQuestion(true, item, val)
      return
    }
    if (lev(val, ans) === 1 && !qs.spellTried) {
      setQs((p) => ({ ...p, spellTried: true, spellPhase: 'tol' }))
      setTimeout(() => spellRef.current?.select(), 30)
      return
    }
    lockRef.current = true
    setQs((p) => ({ ...p, locked: true, correct: false, spellPhase: 'bad', spellDiffAns: val }))
    finishQuestion(false, item, val)
  }, [items, spellInput, qs.spellTried, finishQuestion])

  // 产出型 AI 估分：提交后调对应评分端点 → 填 review.freeText（pending→done/error）。
  // 守卫：异步返回时若已切题（item.id 不再是当前题）则丢弃，避免污染下一题的 qs。
  // 估分非官方分（isEstimate）；R12 不变量：不伪造对错，仅给估分与改进方向。
  const scoreFreeText = useCallback(async (item: PracticeItem, text: string) => {
    const examId = props.examId
    const taskType = props.taskType ?? item.type
    const skill = scoringSkillForTask(taskType) ?? (item.inputMode === 'speak' ? 'speaking' : 'writing')
    const isCurrent = () => items[sRef.current.idx]?.id === item.id
    if (isCurrent()) setQs((p) => ({ ...p, review: { ...(p.review ?? {}), freeText: { phase: 'pending', provider: 'AI' } } }))
    if (!examId || !text.trim()) {
      if (isCurrent()) setQs((p) => ({ ...p, review: { ...(p.review ?? {}), freeText: { phase: 'error' } } }))
      return
    }
    try {
      const res = await fetch(SCORING_PATH[skill] ?? SCORING_PATH.writing, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId, taskType, level: props.level, text, sourceText: item.prompt }),
      })
      const j = (await res.json()) as Record<string, unknown>
      if (!res.ok || !j.ok) throw new Error(String(j?.error ?? 'score_failed'))
      if (isCurrent()) setQs((p) => ({ ...p, review: { ...(p.review ?? {}), freeText: { phase: 'done', estimate: toEstimate(j) } } }))
    } catch {
      if (isCurrent()) setQs((p) => ({ ...p, review: { ...(p.review ?? {}), freeText: { phase: 'error' } } }))
    }
  }, [items, props.examId, props.taskType, props.level])

  const submitFree = useCallback(() => {
    if (lockRef.current) return
    const item = items[sRef.current.idx]
    if (!item) return
    lockRef.current = true
    setQs((p) => ({ ...p, submitted: true, locked: true, review: { freeText: { phase: 'pending', provider: 'AI' } } }))
    postAttempt(item, freeText, undefined)   // 产出型不判分/不伪造对错（仅记录作答）
    void scoreFreeText(item, freeText)        // 异步 AI 估分 → 回填 review.freeText
  }, [items, freeText, postAttempt, scoreFreeText])

  // multi_blank / matching / build_sentence：提交把作答上行 → 拿回 review → 置 locked + 写 review。
  // build_sentence 为开放排序 → scoringNotReady：不判分、不加分、不计连击。
  const submitStructured = useCallback(() => {
    if (lockRef.current) return
    const item = items[sRef.current.idx]
    if (!item) return
    const am = answerMode(item)
    if (am !== 'multi_blank' && am !== 'matching' && am !== 'build_sentence') return
    lockRef.current = true
    const answer = am === 'multi_blank' ? blankState : am === 'matching' ? matchState : buildState
    // review 仅在提交回合进入 state（提交前 qs.review 恒为 null；正解只来自此处）
    const review = (item as { review?: QState['review'] }).review ?? null
    setQs((p) => ({ ...p, locked: true, submitted: true, review }))
    postAttempt(item, answer, undefined)   // multi_blank/matching 的逐空/逐对判定在 renderer 侧据 review 计算；build_sentence 不判分
  }, [items, blankState, matchState, buildState, postAttempt])

  const restart = useCallback(() => setSeed((s) => s + 1), [])
  const leave = useCallback(() => router.push(props.returnTo ?? '/today'), [router, props.returnTo])

  // 键盘：选择题 1-4 / a-d，作答后 Enter 下一题（拼写题 Enter 由输入框处理并 stopPropagation）
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (S.step === 'results' || !current) return
      const am = answerMode(current)
      if (!qs.locked && !qs.submitted) {
        if (am !== 'choice') return
        const k = e.key.toLowerCase()
        const i = ['1', '2', '3', '4'].includes(k) ? Number(k) - 1 : ['a', 'b', 'c', 'd'].indexOf(k)
        if (i >= 0 && current.choices?.[i]) { e.preventDefault(); answerChoice(current.choices[i].id) }
      } else if (e.key === 'Enter') {
        e.preventDefault(); nextQuestion()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [S.step, current, qs.locked, qs.submitted, answerChoice, nextQuestion])

  // 结算环（top-level hook：strokeDashoffset 初值=整圈 C，挂载后画到目标）
  const correctN = S.results.filter((r) => r.correct).length
  const pct = total ? Math.round((correctN / total) * 100) : 0
  const R = 53, C = 2 * Math.PI * R, off = C * (1 - pct / 100)
  const [ringOff, setRingOff] = useState(C)
  useEffect(() => {
    if (S.step !== 'results') { setRingOff(C); return }
    const id = requestAnimationFrame(() => setRingOff(off))
    return () => cancelAnimationFrame(id)
  }, [S.step, off, C])

  // ── 渲染：loading / error / empty / results / play ──
  if (status === 'loading') return <LoadingState message="Loading Practice…" />
  if (status === 'error') {
    return (
      <PracticeFrame>
        <div className="results fade-up" role="alert" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 16 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif-zh)', fontSize: 21, color: 'var(--ink)' }}>题目加载失败</h2>
          <p style={{ margin: 0, color: 'var(--ink-sub)', fontSize: 14, lineHeight: 1.6 }}>网络或服务异常，请重试。</p>
          <div className="res-actions error-row" style={{ marginTop: 4 }}>
            <button className="cta ghost press" onClick={leave}>返回今日</button>
            <button className="cta press" onClick={restart}>重试 ↻</button>
          </div>
        </div>
      </PracticeFrame>
    )
  }
  if (total === 0) {
    const w = warnings[0]
    const { title, desc } = emptyCopy(w, props)
    return (
      <PracticeFrame>
        <div className="results fade-up" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 16 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--font-serif-zh)', fontSize: 21, color: 'var(--ink)' }}>{title}</h2>
          <p style={{ margin: 0, color: 'var(--ink-sub)', fontSize: 14, lineHeight: 1.6 }}>{desc}</p>
          {!props.word && <ModeSwitch />}
          <button className="cta press" style={{ maxWidth: 240 }} onClick={leave}>回到今日</button>
        </div>
      </PracticeFrame>
    )
  }

  if (S.step === 'results') {
    const wrong = total - correctN
    const secs = Math.max(1, Math.round(((S.completedAt || Date.now()) - S.startedAt) / 1000))
    const ss = String(secs % 60).padStart(2, '0')
    const mm = Math.floor(secs / 60)
    return (
      <PracticeFrame>
        <div className="results fade-up">
          <div className="res-hero">
            <div className="ring">
              <svg width="120" height="120" role="img" aria-label={`正确率 ${pct}%`}>
                <circle cx="60" cy="60" r={R} fill="none" stroke="var(--line)" strokeWidth="8" />
                <circle className="pr-ring" cx="60" cy="60" r={R} fill="none" stroke="var(--teal-ink)" strokeWidth="8"
                  strokeLinecap="round" strokeDasharray={C} strokeDashoffset={ringOff} transform="rotate(-90 60 60)" />
              </svg>
              <span className="pct"><b>{correctN}/{total}</b><span>正确率 {pct}%</span></span>
            </div>
            <h2>{pct >= 80 ? '练得漂亮' : pct >= 50 ? '继续保持' : '再练一轮会更好'}</h2>
          </div>
          <div className="res-stats">
            <div className="res-stat"><b>{mm}:{ss}</b><span>用时</span></div>
            <div className="res-stat" style={{ '--c': 'var(--gold-ink)' } as CSSProperties}><b>×{S.maxCombo}</b><span>最高连击</span></div>
            <div className="res-stat" style={{ '--c': 'var(--teal-ink)' } as CSSProperties}><b>+{S.xp}</b><span>获得 XP</span></div>
          </div>
          {wrong > 0 && (
            <Link href="/wrong-answers" className="wrongbook">
              <span className="ico">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5V6a2 2 0 0 1 2-2h12a1 1 0 0 1 1 1v13" /><path d="M6 17h13" /></svg>
              </span>
              <span><span className="t">{wrong} 个错词已存入错词本</span><span className="d">复习舱会优先安排，词图上长出红边提醒</span></span>
            </Link>
          )}
          {!props.word && <ModeSwitch />}
          <div className="res-actions">
            <button className="cta ghost press" onClick={leave}>返回今日</button>
            <button className="cta press" onClick={restart}>再来一轮 ↻</button>
          </div>
        </div>
      </PracticeFrame>
    )
  }

  // ── 答题页 ──
  if (!current) return <PracticeFrame><div className="qbody" /></PracticeFrame>
  const item = current
  const view = item as PracticeItemView
  const am = answerMode(item)
  // 自渲染复审的结构题型：题体 + 复审都由 renderer 负责，runner 跳过 StemCard / 通用 .feedback
  const selfRendered = am === 'multi_blank' || am === 'matching' || am === 'build_sentence' || am === 'free_text'
  const pbarPct = total ? (S.idx / total) * 100 : 0

  return (
    <PracticeFrame>
      <div className="topbar">
        <div className="tb-row">
          <button className="exit press" title="退出" aria-label="退出" onClick={leave}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
          <span className="pbar"><i style={{ width: `${pbarPct}%` }} /></span>
          <span className="pcount">{Math.min(S.idx + 1, total)}<span>/{total}</span></span>
        </div>
        <div className="tb-row">
          <span className={`combo ${S.combo >= 2 ? '' : 'dim'}${qs.comboBump ? ' bump' : ''}`}>{S.combo >= 2 ? '🔥' : '·'} {S.combo} 连击</span>
          <span className="score" style={{ marginLeft: 'auto' }}>{S.score}<span className="lab">分</span></span>
          <span className="score xp">+{S.xp}<span className="lab">XP</span></span>
        </div>
      </div>

      {!props.word && <ModeSwitch />}

      <div className="qbody fade-up" key={item.id}>
        <p className="eyebrow"><span className="tag">{LABEL_OF[item.type] ?? item.type}</span></p>

        {item.type === 'cloze_passage' ? (
          <PassageClozeRenderer body={view.passageClozeBody} submitted={qs.locked} review={qs.review} onCanSubmit={setCanSubmit} onChange={setBlankState} />
        ) : item.type === 'seven_select' ? (
          <SevenSelectRenderer body={view.sevenSelectBody} submitted={qs.locked} review={qs.review} onCanSubmit={setCanSubmit} onChange={setBlankState} />
        ) : item.type === 'para_match' ? (
          <ParaMatchRenderer body={view.paraMatchBody} submitted={qs.locked} review={qs.review} onCanSubmit={setCanSubmit} onChange={setMatchState} />
        ) : am === 'multi_blank' ? (
          <MultiBlankRenderer body={view.clozeBody} submitted={qs.locked} review={qs.review} onCanSubmit={setCanSubmit} onChange={setBlankState} />
        ) : am === 'matching' ? (
          <MatchingRenderer body={view.matchBody} submitted={qs.locked} review={qs.review?.matching ?? null} onCanSubmit={setCanSubmit} onChange={setMatchState} />
        ) : am === 'build_sentence' ? (
          <BuildSentenceRenderer body={view.buildBody} submitted={qs.locked} review={qs.review?.build ?? null} onCanSubmit={setCanSubmit} />
        ) : am === 'free_text' ? (
          <FreeTextRenderer item={view} value={freeText} submitted={qs.submitted} review={qs.review?.freeText ?? null} onChange={setFreeText} onRetry={() => { void scoreFreeText(item, freeText) }} />
        ) : (
          <>
            <StemCard item={item} locked={qs.locked} />
            {am === 'choice' && (
              <ChoiceRenderer item={item} locked={qs.locked} picked={qs.picked} correctId={typeof item.answer === 'string' ? item.answer : null} onPick={answerChoice} />
            )}
            {am === 'spell' && (
              <SpellRenderer item={item} phase={qs.spellPhase} diffAns={qs.spellDiffAns} value={spellInput} correctAnswer={item.answerText ?? ''} locked={qs.locked} inputRef={spellRef} onChange={setSpellInput} onSubmit={submitSpell} />
            )}

            {/* 通用 .feedback：仅 choice/spell；multi_blank/matching/build_sentence/free_text 自渲染复审，跳过 */}
            {qs.locked && !selfRendered && (
              <div className={`feedback show ${qs.correct ? 'ok' : 'no'}`} role="status">
                <div className="fb-head">{qs.correct ? <><OkMark /> 答对了 · 连击 +1</> : <><NoMark /> 答错了</>}</div>
                {(item.explanationZh || item.targetWords[0]?.surface) && (
                  <div className="fb-exp">
                    {item.targetWords[0]?.surface && <b>{item.targetWords[0].surface}</b>}
                    {item.explanationZh ? <> — {item.explanationZh}</> : null}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="qfoot">
        {am === 'multi_blank' || am === 'matching' || am === 'build_sentence' ? (
          !qs.locked
            ? <button className="cta press" onClick={submitStructured} disabled={!canSubmit}>提交</button>
            : <button className="cta press" onClick={nextQuestion}>{S.idx >= total - 1 ? '查看结算 →' : '下一题 →'}</button>
        ) : am === 'free_text' ? (
          !qs.submitted
            ? <button className="cta press" onClick={submitFree} disabled={!freeText.trim()}>提交</button>
            : <button className="cta press" onClick={nextQuestion}>{S.idx >= total - 1 ? '查看结算 →' : '下一题 →'}</button>
        ) : qs.locked ? (
          <button className="cta press" onClick={nextQuestion}>{S.idx >= total - 1 ? '查看结算 →' : '下一题 →'}</button>
        ) : null}
      </div>
    </PracticeFrame>
  )
}

// ── 题干卡（按题型语义渲染 .prompt 内容） ──
function StemCard({ item, locked }: { item: PracticeItem; locked: boolean }) {
  const ask = ASK_OF[item.type] ?? ''
  const audioStem = !!(item.audio?.url || item.type === 'listening_comprehension' || item.inputMode === 'listen')
  const readingStem = item.type === 'reading_comprehension' && !!item.stimulus?.textEn
  let inner: ReactNode
  if (audioStem) {
    inner = <ListeningRenderer item={item} locked={locked} />
  } else if (readingStem) {
    inner = (
      <>
        <div style={{ textAlign: 'left', fontSize: 14.5, lineHeight: 1.78, color: 'var(--ink-sub)', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 12, padding: '14px 16px', marginBottom: 12, maxHeight: '34vh', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>{item.stimulus?.textEn}</div>
        {item.promptZh && <div className="ask">{item.promptZh}</div>}
        {item.prompt && <div style={{ marginTop: 8, fontSize: 16, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-news)', lineHeight: 1.5 }}>{item.prompt}</div>}
      </>
    )
  } else if (item.type === 'cloze_choice' || item.type === 'cloze_spell' || item.type === 'synonym_substitute') {
    inner = <><div className="cloze">{clozeNodes(item.prompt)}</div>{ask && <div className="ask">{ask}</div>}</>
  } else if (answerMode(item) === 'spell') {
    inner = <><div className="zh">{item.promptZh || item.prompt}</div>{ask && <div className="ask">{ask}</div>}</>
  } else if (item.type === 'def_to_word' || item.type === 'zh_to_en' || item.type === 'confusable_choice') {
    inner = <><div className="zh">{item.promptZh || item.prompt}</div>{ask && <div className="ask">{ask}</div>}</>
  } else {
    inner = <><div className="word">{item.prompt || item.targetWords[0]?.surface || ''}</div>{ask && <div className="ask">{ask}</div>}</>
  }
  return <div className="prompt">{inner}<div className="audio-slot" /></div>
}

// ── 练习类型切换（词汇 / 听力 / 阅读）——链接到旧 /quiz 模式，由 page 映射 ──
function ModeSwitch() {
  const items: [string, string][] = [['vocabulary-drill', '词汇'], ['listening-practice', '听力'], ['reading-practice', '阅读']]
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', margin: '0 0 14px' }}>
      {items.map(([m, label]) => (
        <Link key={m} href={`/quiz?mode=${m}`} style={{ textDecoration: 'none', padding: '5px 15px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--font-sans)', border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--ink-sub)' }}>{label}</Link>
      ))}
    </div>
  )
}

function emptyCopy(w: string | undefined, props: PracticeRunnerProps): { title: string; desc: string } {
  if (props.word || w === 'missing_word') return { title: '还没有这个词的题', desc: '该词还没有题目，去词典看看。' }
  if (w === 'v2_unavailable_or_empty') return { title: '题库建设中', desc: '这个题型还在准备，先练别的吧。' }
  if (w === 'no_v1_pool_for_task' || w === 'no_v1_pool_for_section') return { title: '题库建设中', desc: '这个题型还在准备，先练别的吧。' }
  if (props.taskType === 'listening_comprehension') return { title: '暂时没有可练习的题目', desc: '当前等级暂时没有听力短文题（可切到其它练习）。' }
  if (props.taskType === 'reading_comprehension') return { title: '暂时没有可练习的题目', desc: '当前等级暂时没有阅读短文题（可切到其它练习）。' }
  return { title: '暂时没有可练习的题目', desc: '当前等级或题型下题量不足，换个练习试试。' }
}
