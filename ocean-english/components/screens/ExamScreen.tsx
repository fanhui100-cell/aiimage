'use client'
// ExamScreen — 1:1 port of prototype/screen-exam.jsx
// Boss battle exam: intro → run → result

import { useState, useMemo, useEffect, useRef } from 'react'
import { useLexiStore, type WordEntry, type DistractorOption } from '@/store/lexiStore'
import { useNavigate } from '@/hooks/useNavigate'
import { PrimaryBtn, GhostBtn, BackBtn } from '@/components/screens/SharedUI'

const N = 6
const PASS_PCT = 0.8
const SECS_PER_Q = 20

export function ExamScreen() {
  const navigate = useNavigate()
  const { all, markCorrect, markWrong, incXp, distractorsFor, recordActivity, profile, addWrongAnswer } = useLexiStore()

  function logWrong(w: WordEntry, options: DistractorOption[] | null, userAnswer: string) {
    const correctOpt = options?.find(o => o.correct)
    addWrongAnswer({
      wordId: w.id,
      word: w.word,
      question: `"${w.word}" 的意思是？`,
      userAnswer,
      correctAnswer: correctOpt?.text ?? w.zh,
      explanation: w.ex ? `例句：${w.ex}（${w.exZh ?? ''}）` : '',
      timestamp: Date.now(),
    })
  }

  const questions = useMemo<Array<{ word: WordEntry; options: DistractorOption[] }>>(() => {
    // A5：题池按 band±1 覆盖当前水平；不足 N 时先补到期/薄弱词，仍不足才放开全库
    const shuffle = (a: WordEntry[]) => [...a].sort(() => Math.random() - 0.5)
    const eligible = all().filter(w => w.state !== 'locked' && w.state !== 'unknown')
    const banded = eligible.filter(w => !w.band || Math.abs(w.band - profile.band) <= 1)
    const bandedIds = new Set(banded.map(w => w.id))
    const now = Date.now()
    const dueWeak = eligible.filter(w => !bandedIds.has(w.id)
      && (w.state === 'weak' || (w.nextReviewAt != null && w.nextReviewAt <= now)))
    const dueWeakIds = new Set(dueWeak.map(w => w.id))
    const rest = eligible.filter(w => !bandedIds.has(w.id) && !dueWeakIds.has(w.id))
    const sample = [...shuffle(banded), ...shuffle(dueWeak), ...shuffle(rest)].slice(0, N)
    return sample.map(w => ({ word: w, options: distractorsFor(w) }))
  }, [])

  const [phase, setPhase] = useState<'intro' | 'run' | 'result'>('intro')
  const [qIdx, setQIdx] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [wrong, setWrong] = useState<WordEntry[]>([])
  const [timeLeft, setTimeLeft] = useState(N * SECS_PER_Q)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // refs 供 timer 闭包读取最新进度（在 effect 中同步，避免 render 期写 ref）
  const qIdxRef = useRef(0)
  const pickedRef = useRef<string | null>(null)
  useEffect(() => { qIdxRef.current = qIdx }, [qIdx])
  useEffect(() => { pickedRef.current = picked }, [picked])

  function settleUnanswered() {
    // 未答的题全部按答错结算（含状态流转 + 错题记录）
    const startFrom = qIdxRef.current + (pickedRef.current ? 1 : 0)
    questions.slice(startFrom).forEach(({ word, options }) => {
      markWrong(word.id)
      setWrong(ws => [...ws, word])
      logWrong(word, options, '（超时未答）')
    })
  }

  function startExam() {
    setPhase('run')
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          settleUnanswered()
          setPhase('result')
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const q = questions[qIdx]

  function pick(opt: DistractorOption) {
    if (picked !== null || !q) return
    setPicked(opt.id)
    if (opt.correct) {
      markCorrect(q.word.id)
      incXp(15)
      setScore(s => s + 1)
    } else {
      markWrong(q.word.id)
      setWrong(w => [...w, q.word])
      logWrong(q.word, q.options, opt.text)
    }
    recordActivity('quizzed')
    setTimeout(() => {
      const next = qIdx + 1
      if (next >= questions.length) {
        clearInterval(timerRef.current!)
        setPhase('result')
      } else {
        setPicked(null)
        setQIdx(next)
      }
    }, 700)
  }

  const passed = score / (questions.length || 1) >= PASS_PCT
  const pct = Math.round(score / (questions.length || 1) * 100)
  const timerPct = (timeLeft / (N * SECS_PER_Q)) * 100

  // ── Intro ──
  if (phase === 'intro') {
    return (
      <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 24 }}>
        <BackBtn onClick={() => navigate('today')} />

        <div style={{ background: 'linear-gradient(135deg, #4a1d96 0%, #6d4bc4 50%, #9168e8 100%)', borderRadius: 28, padding: '40px 32px', textAlign: 'center', maxWidth: 400, width: '100%', boxShadow: '0 24px 48px -12px rgba(109,75,196,0.4)' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🏆</div>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>BOSS CHALLENGE</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-serif-zh)', marginBottom: 12 }}>词汇大考验</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
            {N} 道题，限时 {N * SECS_PER_Q} 秒<br />
            正确率 ≥ 80% 视为通过
          </div>
        </div>

        <PrimaryBtn onClick={startExam}>开始挑战</PrimaryBtn>
        <GhostBtn onClick={() => navigate('today')}>暂不挑战</GhostBtn>
      </div>
    )
  }

  // ── Result ──
  if (phase === 'result') {
    return (
      <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 }}>
        <div style={{ fontSize: 52 }}>{passed ? '🎉' : '💪'}</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: passed ? '#0e8c7a' : '#d2792f', fontFamily: 'var(--font-serif-zh)' }}>
          {passed ? '通过！' : '再努力一下'}
        </div>

        <div style={{ background: 'var(--card)', borderRadius: 20, padding: '28px', border: '1px solid var(--line)', textAlign: 'center', maxWidth: 360, width: '100%' }}>
          <div style={{ fontSize: 52, fontWeight: 800, color: passed ? '#0e8c7a' : '#d2792f', fontFamily: 'var(--font-news)', lineHeight: 1 }}>{pct}%</div>
          <div style={{ fontSize: 14, color: 'var(--ink-sub)', marginTop: 4 }}>答对 {score} / {questions.length} 题</div>
          {wrong.length > 0 && (
            <div style={{ marginTop: 16, textAlign: 'left' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 8 }}>错误词汇：</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {wrong.map(w => (
                  <span key={w.id} style={{ fontSize: 12, padding: '2px 8px', borderRadius: 99, background: 'rgba(212,71,126,0.1)', color: '#d4477e', border: '1px solid rgba(212,71,126,0.25)' }}>{w.word}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <PrimaryBtn onClick={() => navigate('today')}>返回今日</PrimaryBtn>
        {!passed && <GhostBtn onClick={startExam}>重新挑战</GhostBtn>}
      </div>
    )
  }

  // ── Run ──
  return (
    <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)', paddingBottom: 40 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 20px 0' }}>

        {/* Timer bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${timerPct}%`, borderRadius: 99,
              background: timerPct > 40 ? '#0e8c7a' : timerPct > 20 ? '#d2792f' : '#d4477e',
              transition: 'width 1s linear, background 0.3s',
            }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: timeLeft <= 10 ? '#d4477e' : 'var(--ink-muted)', minWidth: 36, fontFamily: 'var(--font-mono)' }}>{timeLeft}s</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>BOSS CHALLENGE</span>
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{qIdx + 1} / {questions.length}</span>
        </div>

        {/* Question */}
        <div style={{ background: 'var(--card)', borderRadius: 20, padding: '32px', border: '1px solid var(--line)', marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>选出正确的中文意思</div>
          <div style={{ fontSize: 34, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-news)' }}>{q?.word.word}</div>
          {q?.word.phon && <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>{q.word.phon}</div>}
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q?.options.map(opt => {
            let bg = 'var(--card)', border = '1.5px solid var(--line)', color = 'var(--ink)'
            if (picked === opt.id) {
              if (opt.correct) { bg = 'rgba(14,140,122,0.1)'; border = '1.5px solid #0e8c7a'; color = '#0e8c7a' }
              else { bg = 'rgba(212,71,126,0.1)'; border = '1.5px solid #d4477e'; color = '#d4477e' }
            } else if (picked !== null && opt.correct) {
              bg = 'rgba(14,140,122,0.07)'; border = '1.5px solid rgba(14,140,122,0.4)'
            }
            // Demo01：答对弹跳+描边 / 答错 shake
            const fxClass = picked === opt.id ? (opt.correct ? 'quiz-correct' : 'quiz-wrong') : ''
            return (
              <button key={opt.id} onClick={() => pick(opt)} disabled={picked !== null}
                className={picked === null ? 'btn-press' : fxClass}
                style={{ padding: '14px 18px', borderRadius: 12, border, background: bg, cursor: picked !== null ? 'default' : 'pointer', fontSize: 14, fontWeight: 500, color, fontFamily: 'var(--font-sans)', textAlign: 'left', transition: 'all 0.15s' }}>
                {opt.text}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
