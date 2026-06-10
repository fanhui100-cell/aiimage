'use client'
// LearnScreen — 1:1 port of prototype/screen-learn.jsx
// Flashcard learn flow with state-toast feedback

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLexiStore, type WordEntry } from '@/store/lexiStore'
import { STATE_META, type WordState } from '@/lib/state-meta'
import { useNavigate } from '@/hooks/useNavigate'
import { FlowBar, SoundBtn, GhostBtn, PrimaryBtn, EmptyState, showStateToast, BackBtn } from '@/components/screens/SharedUI'

// ── Flashcard（Demo10：真 3D rotateY 翻转，两面 backface-hidden）─
const faceStyle: React.CSSProperties = {
  position: 'absolute', inset: 0,
  background: 'var(--card)', borderRadius: 24, border: '1px solid var(--line)',
  padding: '40px 32px', textAlign: 'center',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  gap: 12, userSelect: 'none',
  boxShadow: 'var(--card-shadow-sm)',
}

function Flashcard({ word, flipped, onFlip }: { word: WordEntry; flipped: boolean; onFlip: () => void }) {
  const m = STATE_META[word.state]
  return (
    <div className="flip-outer" onClick={onFlip} style={{ cursor: 'pointer', minHeight: 340 }}>
      <div className={`flip-inner${flipped ? ' flipped' : ''}`} style={{ height: 340 }}>
        {/* 正面：词 + 音标 */}
        <div className="flip-face" style={faceStyle}>
          <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-news)', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            {word.word}
          </div>
          {word.phon && (
            <div style={{ fontSize: 14, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>{word.phon}</div>
          )}
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 8 }}>点击翻面 · Space</div>
        </div>
        {/* 背面：释义 + 例句 */}
        <div className="flip-face flip-back" style={faceStyle}>
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
        </div>
      </div>
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
  const [done, setDone] = useState(false)
  const [knewCount, setKnewCount] = useState(0)
  const [retried, setRetried] = useState<Set<string>>(new Set())
  // B4-3：首访提示「先回忆，再翻面作答」
  const [showRecallHint, setShowRecallHint] = useState(false)
  useEffect(() => {
    if (!localStorage.getItem('lexi-seen-recall-hint')) setShowRecallHint(true)
  }, [])

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
    if (!current || !flipped) return   // B4-3：未翻面禁止作答（先回忆）
    const prevState = current.state as WordState
    if (action === 'know') {
      markLearning(current.id)
      recordActivity('learned')
      showStateToast(current.word, prevState, 'learning')   // B4-2：非阻塞 sonner，无 700ms 等待
      setKnewCount(c => c + 1)
      goNext()
    } else if (!retried.has(current.id)) {
      // 第一次「还不熟」：排到队尾再见一面
      setRetried(p => new Set(p).add(current.id))
      goNext([current])
    } else {
      // 第二次仍不熟：转薄弱
      markWrong(current.id)
      showStateToast(current.word, prevState, 'weak')
      goNext()
    }
  }

  // B4-2：键盘 — Space 翻面、1=还不熟、2=认识、→=下一张（翻面后等同认识跳过）
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (done || !current) return
      if (e.code === 'Space') { e.preventDefault(); setFlipped(f => !f) }
      else if (e.key === '1') advance('again')
      else if (e.key === '2') advance('know')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, current, flipped, idx, queue, retried])

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

        {/* Action buttons（B4-3：未翻面 40% 透明禁用——先回忆再作答） */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12, opacity: flipped ? 1 : 0.4, transition: 'opacity .2s ease' }}>
          <button onClick={() => advance('again')} disabled={!flipped} className={flipped ? 'btn-press' : ''}
            style={{ padding: '16px', borderRadius: 14, border: '1.5px solid var(--line)', background: 'var(--card)', cursor: flipped ? 'pointer' : 'default', fontSize: 15, fontWeight: 600, color: 'var(--ink-sub)', fontFamily: 'var(--font-sans)' }}>
            还不熟 ✗ <span style={{ fontSize: 11, opacity: 0.6, fontFamily: 'var(--font-mono)' }}>1</span>
          </button>
          <button onClick={() => advance('know')} disabled={!flipped} className={flipped ? 'btn-press' : ''}
            style={{ padding: '16px', borderRadius: 14, border: '1.5px solid var(--teal-ink)', background: 'var(--teal-bg)', cursor: flipped ? 'pointer' : 'default', fontSize: 15, fontWeight: 700, color: 'var(--teal-ink)', fontFamily: 'var(--font-sans)' }}>
            认识 ✓ <span style={{ fontSize: 11, opacity: 0.6, fontFamily: 'var(--font-mono)' }}>2</span>
          </button>
        </div>
        {!flipped && (
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-muted)', marginTop: 10 }}>
            先回忆，再翻面作答
          </div>
        )}

        {/* B4-3：首访一次性提示 */}
        {showRecallHint && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12, padding: '10px 14px', borderRadius: 12, background: 'var(--card-2)', border: '1px solid var(--line)' }}>
            <span style={{ fontSize: 12.5, color: 'var(--ink-sub)' }}>记忆诀窍：翻面之前先在脑子里回想词义，效果翻倍</span>
            <button onClick={() => { localStorage.setItem('lexi-seen-recall-hint', '1'); setShowRecallHint(false) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--teal-ink)', fontFamily: 'var(--font-sans)', flexShrink: 0 }}>
              知道了
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
