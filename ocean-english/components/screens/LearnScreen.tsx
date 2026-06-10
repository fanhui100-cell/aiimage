'use client'
// LearnScreen — 1:1 port of prototype/screen-learn.jsx
// Flashcard learn flow with state-toast feedback

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLexiStore, type WordEntry } from '@/store/lexiStore'
import { STATE_META, type WordState } from '@/lib/state-meta'
import { useNavigate } from '@/hooks/useNavigate'
import { FlowBar, StateToast, SoundBtn, GhostBtn, PrimaryBtn, EmptyState, useToast, BackBtn } from '@/components/screens/SharedUI'

// ── Flashcard ──────────────────────────────────────────────────
function Flashcard({ word, flipped, onFlip }: { word: WordEntry; flipped: boolean; onFlip: () => void }) {
  const m = STATE_META[word.state]
  return (
    <div
      onClick={onFlip}
      style={{
        background: 'var(--card)', borderRadius: 24, border: '1px solid var(--line)',
        padding: '40px 32px', textAlign: 'center', cursor: 'pointer',
        minHeight: 260, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 12, transition: 'transform 0.15s', userSelect: 'none',
        boxShadow: 'var(--card-shadow-sm)',
      }}
    >
      {!flipped ? (
        <>
          <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-news)', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            {word.word}
          </div>
          {word.phon && (
            <div style={{ fontSize: 14, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>{word.phon}</div>
          )}
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 8 }}>点击翻面查看</div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-serif-zh)' }}>{word.zh}</div>
          {word.pos && <div style={{ fontSize: 12, color: m.light, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{word.pos}</div>}
          {word.ex && (
            <div style={{ fontSize: 13, color: 'var(--ink-sub)', marginTop: 8, lineHeight: 1.6, fontStyle: 'italic', maxWidth: 340 }}>
              "{word.ex}"
            </div>
          )}
          {word.exZh && (
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.5, maxWidth: 340 }}>{word.exZh}</div>
          )}
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {word.syn?.slice(0, 3).map(s => (
              <span key={s} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'var(--teal-bg)', color: 'var(--teal-ink)', fontWeight: 600 }}>{s}</span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── LearnScreen ────────────────────────────────────────────────
export function LearnScreen() {
  const searchParams = useSearchParams()
  const isFlow = searchParams.get('flow') === 'true'
  const navigate = useNavigate()

  const { getToday, getLearning, markLearning, markWrong, recordActivity } = useLexiStore()

  const initialList = useMemo<WordEntry[]>(() => {
    if (isFlow) {
      const today = getToday()
      return today.recommended.length > 0 ? today.recommended : getLearning()
    }
    return getLearning()
  }, [isFlow])

  const [queue, setQueue] = useState<WordEntry[]>(() => initialList)
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [toast, showToast] = useToast()
  const [done, setDone] = useState(false)
  const [knewCount, setKnewCount] = useState(0)
  const [retried, setRetried] = useState<Set<string>>(new Set())

  const current = queue[idx]
  const isRetry = current ? retried.has(current.id) : false

  function goNext(append: WordEntry[] = []) {
    const nextQueue = append.length ? [...queue, ...append] : queue
    if (append.length) setQueue(nextQueue)
    const next = idx + 1
    if (next >= nextQueue.length) setDone(true)
    else { setIdx(next); setFlipped(false) }
  }

  function advance(action: 'know' | 'again') {
    if (!current) return
    const prevState = current.state as WordState
    if (action === 'know') {
      markLearning(current.id)
      recordActivity('learned')
      showToast(current.word, prevState, 'learning')
      setKnewCount(c => c + 1)
      goNext()
    } else if (!retried.has(current.id)) {
      // 第一次「还不熟」：排到队尾再见一面
      setRetried(p => new Set(p).add(current.id))
      goNext([current])
    } else {
      // 第二次仍不熟：转薄弱
      markWrong(current.id)
      showToast(current.word, prevState, 'weak')
      goNext()
    }
  }

  function finish() {
    if (isFlow) navigate('quiz', { flow: true })
    else navigate('today')
  }

  if (!queue.length) {
    // B10-3：空状态给下一步动作（文案照 README 空状态表）
    const dueN = useLexiStore.getState().getDue().length
    return (
      <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <EmptyState icon="✨" text="今日新词已学完"
          desc={dueN > 0 ? `复习 ${dueN} 个到期词，或去词典探索` : '去词典探索更多词汇'}
          actions={[
            { label: '去复习', onClick: () => navigate('review', { flow: isFlow }) },
            { label: '逛词典', onClick: () => navigate('words'), primary: false },
          ]} />
      </div>
    )
  }

  if (done) {
    return (
      <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 }}>
        <div style={{ fontSize: 52 }}>🎓</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-serif-zh)' }}>学习完成！</div>
        <div style={{ fontSize: 14, color: 'var(--ink-sub)' }}>认识了 {knewCount} 个词</div>
        {isFlow && <div style={{ fontSize: 13, color: 'var(--teal-ink)', fontWeight: 600 }}>下一步：单词练习</div>}
        <PrimaryBtn onClick={finish}>{isFlow ? '去练习 →' : '返回今日'}</PrimaryBtn>
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
        {isFlow && (
          <div style={{ marginBottom: 24 }}>
            <FlowBar step={0} />
          </div>
        )}

        {/* Sound + card */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: isRetry ? 'space-between' : 'flex-end', marginBottom: 8 }}>
          {isRetry && (
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: 'rgba(210,121,47,0.12)', color: '#d2792f', fontFamily: 'var(--font-mono)' }}>再见面</span>
          )}
          <SoundBtn word={current.word} />
        </div>

        <Flashcard word={current} flipped={flipped} onFlip={() => setFlipped(f => !f)} />

        {/* Progress bar */}
        <div style={{ margin: '16px 0', height: 4, borderRadius: 99, background: 'var(--line)' }}>
          <div style={{ height: '100%', width: `${(idx / queue.length) * 100}%`, borderRadius: 99, background: 'var(--teal)', transition: 'width 0.3s' }} />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <button onClick={() => advance('again')} className="btn-press"
            style={{ padding: '16px', borderRadius: 14, border: '1.5px solid var(--line)', background: 'var(--card)', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: 'var(--ink-sub)', fontFamily: 'var(--font-sans)' }}>
            还不熟 ✗
          </button>
          <button onClick={() => advance('know')} className="btn-press"
            style={{ padding: '16px', borderRadius: 14, border: '1.5px solid var(--teal-ink)', background: 'var(--teal-bg)', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: 'var(--teal-ink)', fontFamily: 'var(--font-sans)' }}>
            认识 ✓
          </button>
        </div>
      </div>

      {toast && <StateToast word={toast.word} from={toast.from} to={toast.to} visible={toast.visible} />}
    </div>
  )
}
