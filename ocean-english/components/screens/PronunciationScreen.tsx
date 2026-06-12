'use client'
// PronunciationScreen — 1:1 port of prototype/screen-pronunciation.jsx
// Mock waveform + score ring

import { useState, useMemo, useEffect, useRef } from 'react'
import { useLexiStore, type WordEntry } from '@/store/lexiStore'
import { useNavigate } from '@/hooks/useNavigate'
import { ProgressRing, SoundBtn, PrimaryBtn, GhostBtn, BackBtn } from '@/components/screens/SharedUI'

const MAX_WORDS = 5
const BAR_COUNT = 32

type CardState = 'idle' | 'recording' | 'scored'

// ── Waveform ───────────────────────────────────────────────────
function Waveform({ active }: { active: boolean }) {
  const [bars, setBars] = useState<number[]>(Array(BAR_COUNT).fill(0.15))
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!active) {
      setBars(Array(BAR_COUNT).fill(0.15))
      return
    }
    let t = 0
    function frame() {
      t += 0.12
      setBars(Array(BAR_COUNT).fill(0).map((_, i) => {
        const base = Math.sin(t + i * 0.4) * 0.4 + 0.5
        const noise = (Math.random() - 0.5) * 0.3
        return Math.max(0.08, Math.min(0.95, base + noise))
      }))
      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [active])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 56, padding: '0 4px' }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          flex: 1, borderRadius: 99,
          background: active ? 'var(--teal)' : 'var(--line)',
          height: `${h * 100}%`,
          transition: active ? 'height 0.08s' : 'height 0.3s, background 0.3s',
        }} />
      ))}
    </div>
  )
}

// ── PronCard ───────────────────────────────────────────────────
function PronCard({
  word, onDone,
}: {
  word: WordEntry
  onDone: (score: number) => void
}) {
  const [cardState, setCardState] = useState<CardState>('idle')
  const [score, setScore] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function startRecording() {
    setCardState('recording')
    timerRef.current = setTimeout(() => {
      const s = 68 + Math.floor(Math.random() * 30)
      setScore(s)
      setCardState('scored')
    }, 2200)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const scoreColor = score >= 90 ? '#0e8c7a' : score >= 75 ? '#3b5bd9' : '#d2792f'

  return (
    <div style={{ background: 'var(--card)', borderRadius: 24, padding: '32px', border: '1px solid var(--line)', textAlign: 'center' }}>
      {/* Word header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 34, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-news)' }}>{word.word}</span>
        <SoundBtn word={word.word} />
      </div>
      {word.phon && <div style={{ fontSize: 13, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{word.phon}</div>}
      <div style={{ fontSize: 14, color: 'var(--ink-sub)', marginBottom: 20 }}>{word.zh}</div>

      {/* Waveform */}
      <Waveform active={cardState === 'recording'} />

      {/* Score ring */}
      {cardState === 'scored' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, margin: '16px 0' }}>
          <ProgressRing
            pct={score} size={96} stroke={8} color={scoreColor}
            label={
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-muted)' }}>分</div>
              </div>
            }
          />
          <div style={{ fontSize: 13, color: scoreColor, fontWeight: 600 }}>
            {score >= 90 ? '完美！' : score >= 75 ? '不错！' : '继续练习'}
          </div>
        </div>
      )}

      {/* Actions */}
      {cardState === 'idle' && (
        <button onClick={startRecording} className="btn-press"
          style={{ marginTop: 8, padding: '14px 32px', borderRadius: 99, border: 'none', background: 'linear-gradient(180deg,#6ff0db,#34d8c0)', color: '#04241f', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 8, margin: '8px auto 0' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2"/><line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2"/>
          </svg>
          开始录音
        </button>
      )}
      {cardState === 'recording' && (
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--teal-ink)', fontWeight: 600, animation: 'fadeUp 0.3s ease' }}>录音中…</div>
      )}
      {cardState === 'scored' && (
        <button onClick={() => onDone(score)} className="btn-press"
          style={{ marginTop: 8, padding: '12px 28px', borderRadius: 99, border: 'none', background: 'linear-gradient(180deg,#6ff0db,#34d8c0)', color: '#04241f', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          下一个 →
        </button>
      )}
    </div>
  )
}

// ── PronunciationScreen ────────────────────────────────────────
export function PronunciationScreen() {
  const navigate = useNavigate()
  const { getLearning, getToday, byState, markCorrect } = useLexiStore()

  // F3-5：练习词 = 我的学习词优先（今日包 + 薄弱词在前，再学习中/复习）
  const words = useMemo<WordEntry[]>(() => {
    const today = getToday()
    const pool = [...today.recommended, ...byState('weak'), ...getLearning(), ...byState('review')]
    const unique = Array.from(new Map(pool.map(w => [w.id, w])).values())
    return unique.slice(0, MAX_WORDS)
  }, [])

  const [idx, setIdx] = useState(0)
  const [scores, setScores] = useState<number[]>([])
  const [done, setDone] = useState(false)

  function handleDone(score: number) {
    if (score >= 85) markCorrect(words[idx].id)
    const next = idx + 1
    setScores(s => [...s, score])
    if (next >= words.length) {
      setDone(true)
    } else {
      setIdx(next)
    }
  }

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

  if (!words.length) {
    return (
      <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
        <div style={{ fontSize: 48 }}>🎤</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-serif-zh)' }}>暂无练习词汇</div>
        <PrimaryBtn onClick={() => navigate('today')}>返回今日</PrimaryBtn>
      </div>
    )
  }

  if (done) {
    return (
      <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 }}>
        <div style={{ fontSize: 52 }}>🎙️</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-serif-zh)' }}>发音练习完成</div>
        <div style={{ background: 'var(--card)', borderRadius: 20, padding: '28px 32px', border: '1px solid var(--line)', textAlign: 'center', maxWidth: 320, width: '100%' }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: avgScore >= 85 ? '#0e8c7a' : '#d2792f', fontFamily: 'var(--font-news)' }}>{avgScore}</div>
          <div style={{ fontSize: 14, color: 'var(--ink-sub)', marginTop: 4 }}>平均得分 · 共 {words.length} 个词</div>
        </div>
        <PrimaryBtn onClick={() => navigate('today')}>返回今日</PrimaryBtn>
      </div>
    )
  }

  return (
    <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)', paddingBottom: 40 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <BackBtn onClick={() => navigate('today')} />
          <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{idx + 1} / {words.length}</span>
        </div>

        <PronCard key={words[idx].id} word={words[idx]} onDone={handleDone} />

        <div style={{ margin: '16px 0', height: 4, borderRadius: 99, background: 'var(--line)' }}>
          <div style={{ height: '100%', width: `${(idx / words.length) * 100}%`, borderRadius: 99, background: 'var(--teal)', transition: 'width 0.3s' }} />
        </div>
      </div>
    </div>
  )
}
