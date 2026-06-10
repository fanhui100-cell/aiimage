'use client'
// QuizScreen — 1:1 port of prototype/screen-quiz.jsx
// 5-question MCQ with state feedback

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLexiStore, type WordEntry, type DistractorOption } from '@/store/lexiStore'
import { useNavigate } from '@/hooks/useNavigate'
import { FlowBar, StateToast, PrimaryBtn, GhostBtn, useToast, BackBtn } from '@/components/screens/SharedUI'

const QUIZ_SIZE = 5

// ── QuizScreen ─────────────────────────────────────────────────
export function QuizScreen() {
  const searchParams = useSearchParams()
  const isFlow = searchParams.get('flow') === 'true'
  const navigate = useNavigate()

  const { getLearning, getToday, markCorrect, markWrong, incXp, distractorsFor } = useLexiStore()

  const questions = useMemo<Array<{ word: WordEntry; options: DistractorOption[] }>>(() => {
    const today = getToday()
    const pool = [...getLearning(), ...today.recommended]
    const unique = Array.from(new Map(pool.map(w => [w.id, w])).values())
    const sample = unique.sort(() => Math.random() - 0.5).slice(0, QUIZ_SIZE)
    return sample.map(w => ({ word: w, options: distractorsFor(w) }))
  }, [])

  const [qIdx, setQIdx] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [wrong, setWrong] = useState<WordEntry[]>([])
  const [toast, showToast] = useToast()
  const [done, setDone] = useState(false)

  const q = questions[qIdx]

  function pick(opt: DistractorOption) {
    if (picked !== null || !q) return
    setPicked(opt.id)
    const correct = opt.correct

    if (correct) {
      markCorrect(q.word.id)
      incXp(20)
      setScore(s => s + 1)
      showToast(q.word.word, q.word.state, 'mastered')
    } else {
      markWrong(q.word.id)
      setWrong(w => [...w, q.word])
      showToast(q.word.word, q.word.state, 'weak')
    }

    setTimeout(() => {
      const next = qIdx + 1
      if (next >= questions.length) {
        setDone(true)
      } else {
        setPicked(null)
        setQIdx(next)
      }
    }, 800)
  }

  function finish() {
    if (isFlow) navigate('review', { flow: true })
    else navigate('today')
  }

  if (!questions.length) {
    return (
      <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
        <div style={{ fontSize: 48 }}>📝</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-serif-zh)' }}>暂无练习题目</div>
        <div style={{ fontSize: 14, color: 'var(--ink-sub)' }}>先去学习一些词汇吧</div>
        <PrimaryBtn onClick={() => navigate('learn')}>去学习</PrimaryBtn>
      </div>
    )
  }

  if (done) {
    const pct = Math.round(score / questions.length * 100)
    return (
      <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 }}>
        <div style={{ fontSize: 52 }}>{pct >= 80 ? '🏆' : pct >= 60 ? '💪' : '📚'}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-serif-zh)' }}>练习完成</div>
        <div style={{ background: 'var(--card)', borderRadius: 20, padding: '24px 32px', border: '1px solid var(--line)', textAlign: 'center', width: '100%', maxWidth: 360 }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: pct >= 80 ? '#0e8c7a' : '#d2792f', fontFamily: 'var(--font-news)' }}>{pct}%</div>
          <div style={{ fontSize: 14, color: 'var(--ink-sub)', marginTop: 4 }}>答对 {score} / {questions.length} 题</div>
          {wrong.length > 0 && (
            <div style={{ marginTop: 16, textAlign: 'left' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 8 }}>错误词汇（已加入复习）：</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {wrong.map(w => (
                  <span key={w.id} style={{ fontSize: 12, padding: '2px 8px', borderRadius: 99, background: 'rgba(212,71,126,0.1)', color: '#d4477e', border: '1px solid rgba(212,71,126,0.25)' }}>{w.word}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        {isFlow && <div style={{ fontSize: 13, color: 'var(--teal-ink)', fontWeight: 600 }}>下一步：记忆复习</div>}
        <PrimaryBtn onClick={finish}>{isFlow ? '去复习 →' : '返回今日'}</PrimaryBtn>
        {!isFlow && <GhostBtn onClick={() => navigate('today')}>回今日</GhostBtn>}
      </div>
    )
  }

  return (
    <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)', paddingBottom: 40 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 20px 0' }}>

        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <BackBtn onClick={() => navigate('today')} />
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{qIdx + 1} / {questions.length}</span>
        </div>

        {/* FlowBar */}
        {isFlow && <div style={{ marginBottom: 24 }}><FlowBar step={1} /></div>}

        {/* Question */}
        <div style={{ background: 'var(--card)', borderRadius: 20, padding: '32px', border: '1px solid var(--line)', marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>选出正确的中文意思</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-news)', letterSpacing: '-0.01em' }}>{q.word.word}</div>
          {q.word.phon && <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>{q.word.phon}</div>}
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options.map(opt => {
            let bg = 'var(--card)', border = '1.5px solid var(--line)', color = 'var(--ink)'
            if (picked === opt.id) {
              if (opt.correct) { bg = 'rgba(14,140,122,0.1)'; border = '1.5px solid #0e8c7a'; color = '#0e8c7a' }
              else { bg = 'rgba(212,71,126,0.1)'; border = '1.5px solid #d4477e'; color = '#d4477e' }
            } else if (picked !== null && opt.correct) {
              bg = 'rgba(14,140,122,0.07)'; border = '1.5px solid rgba(14,140,122,0.4)'
            }
            return (
              <button key={opt.id} onClick={() => pick(opt)} disabled={picked !== null}
                className={picked === null ? 'btn-press' : ''}
                style={{ padding: '16px 20px', borderRadius: 14, border, background: bg, cursor: picked !== null ? 'default' : 'pointer', fontSize: 15, fontWeight: 500, color, fontFamily: 'var(--font-sans)', textAlign: 'left', transition: 'all 0.15s' }}>
                {opt.text}
                {picked !== null && opt.correct && <span style={{ float: 'right' }}>✓</span>}
                {picked === opt.id && !opt.correct && <span style={{ float: 'right' }}>✗</span>}
              </button>
            )
          })}
        </div>

        {/* Progress */}
        <div style={{ margin: '20px 0', height: 4, borderRadius: 99, background: 'var(--line)' }}>
          <div style={{ height: '100%', width: `${(qIdx / questions.length) * 100}%`, borderRadius: 99, background: 'var(--teal)', transition: 'width 0.3s' }} />
        </div>
      </div>

      {toast && <StateToast word={toast.word} from={toast.from} to={toast.to} visible={toast.visible} />}
    </div>
  )
}
