'use client'
// ReviewScreen — 1:1 port of prototype/screen-review.jsx
// SRS grading: 忘了/勉强/记得/简单

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLexiStore, type WordEntry, type LogEntry } from '@/store/lexiStore'
import type { ReviewGrade } from '@/lib/srs/schedule'
import { useNavigate } from '@/hooks/useNavigate'
import { FlowBar, SoundBtn, StateToast, PrimaryBtn, GhostBtn, useToast, BackBtn } from '@/components/screens/SharedUI'

const GRADE_OPTS: { id: ReviewGrade; zh: string; color: string; bg: string }[] = [
  { id: 'again', zh: '忘了',   color: '#d4477e',  bg: 'rgba(212,71,126,0.1)' },
  { id: 'hard',  zh: '勉强',   color: '#d2792f',  bg: 'rgba(210,121,47,0.1)' },
  { id: 'good',  zh: '记得',   color: '#3b5bd9',  bg: 'rgba(59,91,217,0.1)'  },
  { id: 'easy',  zh: '简单',   color: '#0e8c7a',  bg: 'rgba(14,140,122,0.1)' },
]

export function ReviewScreen({ source = 'all' }: { source?: 'due' | 'weak' | 'all' } = {}) {
  const searchParams = useSearchParams()
  const isFlow = searchParams.get('flow') === 'true'
  const navigate = useNavigate()

  const { getDue, getWeak, reviewGrade, recordActivity, incXp, masteredPct, byId, previewFor, log } = useLexiStore()

  const queue = useMemo<WordEntry[]>(() => {
    if (source === 'due') return getDue()
    if (source === 'weak') return getWeak()
    const due = getDue()
    const weak = getWeak()
    return [...due, ...weak.filter(w => !due.find(d => d.id === w.id))]
  }, [source])

  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [toast, showToast] = useToast()
  const [done, setDone] = useState(false)
  const [graded, setGraded] = useState(0)

  const current = queue[idx]

  function grade(g: ReviewGrade) {
    if (!current) return
    const prev = current.state
    reviewGrade(current.id, g)
    recordActivity('reviewed')
    if (g !== 'again') incXp(15)
    // 取流转后的真实状态做 toast
    const to = byId(current.id)?.state ?? prev
    showToast(current.word, prev, to)
    setGraded(c => c + 1)
    const next = idx + 1
    if (next >= queue.length) {
      setDone(true)
    } else {
      setIdx(next)
      setRevealed(false)
    }
  }

  function finish() {
    if (isFlow) navigate('today')
    else navigate('today')
  }

  if (!queue.length) {
    return (
      <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
        <div style={{ fontSize: 48 }}>🌟</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-serif-zh)' }}>无需复习</div>
        <div style={{ fontSize: 14, color: 'var(--ink-sub)' }}>今日无到期词汇，继续保持！</div>
        <PrimaryBtn onClick={finish}>返回今日</PrimaryBtn>
      </div>
    )
  }

  if (done) {
    const pct = masteredPct()
    const recentLog = log.slice(0, 8)
    return (
      <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)', paddingBottom: 40 }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 20px' }}>
          {isFlow && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, color: 'var(--teal-ink)', fontFamily: 'var(--font-serif-zh)', marginBottom: 8 }}>🎯 今日闭环完成！</div>
              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-sub)' }}>完整学习→练习→复习流程</div>
            </div>
          )}

          {/* Stats */}
          <div style={{ background: 'var(--card)', borderRadius: 20, padding: '28px', border: '1px solid var(--line)', marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--teal-ink)', fontFamily: 'var(--font-news)', lineHeight: 1 }}>{pct.toFixed(0)}%</div>
            <div style={{ fontSize: 14, color: 'var(--ink-sub)', marginTop: 4 }}>词汇掌握率</div>
            <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 8 }}>复习了 {graded} 个词</div>
          </div>

          {/* Log */}
          {recentLog.length > 0 && (
            <div style={{ background: 'var(--card)', borderRadius: 16, padding: '18px 20px', border: '1px solid var(--line)', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 12, fontFamily: 'var(--font-mono)' }}>复习记录</div>
              {recentLog.map((entry: LogEntry) => (
                <div key={`${entry.id}-${entry.t}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)', flex: 1 }}>{entry.word}</span>
                  <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{entry.note}</span>
                </div>
              ))}
            </div>
          )}

          <PrimaryBtn onClick={finish} style={{ width: '100%' }}>完成</PrimaryBtn>
        </div>
      </div>
    )
  }

  return (
    <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)', paddingBottom: 40 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 20px 0' }}>

        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <BackBtn onClick={() => navigate('today')} />
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{idx + 1} / {queue.length}</span>
        </div>

        {/* FlowBar */}
        {isFlow && <div style={{ marginBottom: 24 }}><FlowBar step={2} /></div>}

        {/* Word card */}
        <div style={{ background: 'var(--card)', borderRadius: 24, padding: '40px 32px', border: '1px solid var(--line)', marginBottom: 20, textAlign: 'center', minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 38, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-news)' }}>{current.word}</div>
            <SoundBtn word={current.word} />
          </div>
          {current.phon && <div style={{ fontSize: 14, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>{current.phon}</div>}

          {!revealed ? (
            <button onClick={() => setRevealed(true)} className="btn-press"
              style={{ marginTop: 16, padding: '10px 24px', borderRadius: 99, border: '1px solid var(--line)', background: 'var(--card-2)', cursor: 'pointer', fontSize: 14, color: 'var(--ink-sub)', fontFamily: 'var(--font-sans)' }}>
              显示答案
            </button>
          ) : (
            <div style={{ marginTop: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-serif-zh)' }}>{current.zh}</div>
              {current.pos && <div style={{ fontSize: 12, color: 'var(--teal-ink)', fontWeight: 600, marginTop: 4, fontFamily: 'var(--font-mono)' }}>{current.pos}</div>}
              {current.ex && <div style={{ fontSize: 13, color: 'var(--ink-sub)', marginTop: 10, lineHeight: 1.6, fontStyle: 'italic' }}>"{current.ex}"</div>}
            </div>
          )}
        </div>

        {/* Grade buttons — only show after reveal；副标题为真实 SRS 间隔 */}
        {revealed && (() => {
          const iv = previewFor(current)
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {GRADE_OPTS.map(g => (
                <button key={g.id} onClick={() => grade(g.id)} className="btn-press"
                  style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '12px 8px', borderRadius: 12, border: `1.5px solid ${g.color}`, background: g.bg, cursor: 'pointer', fontFamily: 'var(--font-sans)', textAlign: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: g.color }}>{g.zh}</span>
                  <span style={{ fontSize: 11, color: g.color, opacity: 0.75, fontFamily: 'var(--font-mono)' }}>{iv[g.id]}</span>
                </button>
              ))}
            </div>
          )
        })()}

        {/* Progress */}
        <div style={{ margin: '20px 0', height: 4, borderRadius: 99, background: 'var(--line)' }}>
          <div style={{ height: '100%', width: `${(idx / queue.length) * 100}%`, borderRadius: 99, background: 'var(--teal)', transition: 'width 0.3s' }} />
        </div>
      </div>

      {toast && <StateToast word={toast.word} from={toast.from} to={toast.to} visible={toast.visible} />}
    </div>
  )
}
