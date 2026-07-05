'use client'
// PronunciationScreen — 1:1 port of prototype/screen-pronunciation.jsx
// Mock waveform + score ring

import { useState, useMemo, useEffect, useRef } from 'react'
import { useLexiStore, type WordEntry } from '@/store/lexiStore'
import { useNavigate } from '@/hooks/useNavigate'
import { ProgressRing, SoundBtn, PrimaryBtn, GhostBtn, BackBtn } from '@/components/screens/SharedUI'
import { useSpeechScoring } from '@/lib/pronunciation/use-speech-scoring'
import { readAccentPreference } from '@/lib/pronunciation/pronunciation-client'
import { NumberRoll } from '@/components/ui/NumberRoll'

const MAX_WORDS = 5
const BAR_COUNT = 32

// ── Waveform ───────────────────────────────────────────────────
function Waveform({ active, level = 0 }: { active: boolean; level?: number }) {
  // F4：真实麦克风音量驱动（level 0-1），滚动历史条
  const [bars, setBars] = useState<number[]>(Array(BAR_COUNT).fill(0.12))
  const levelRef = useRef(level)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    levelRef.current = level
  }, [level])

  useEffect(() => {
    if (!active) {
      setBars(Array(BAR_COUNT).fill(0.12))
      return
    }
    function frame() {
      setBars(prev => [...prev.slice(1), Math.max(0.08, Math.min(0.95, levelRef.current))])
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

// ── PronCard（F4：浏览器识别真实评分）──────────────────────────
const MARK_COLOR = { hit: 'var(--teal-ink)', close: 'var(--gold-ink)', miss: '#d4477e' } as const
const MARK_ZH = { hit: '命中', close: '接近', miss: '漏/错' } as const

function PronCard({
  word, onDone,
}: {
  word: WordEntry
  onDone: (score: number) => void
}) {
  const speech = useSpeechScoring()
  const [showBasis, setShowBasis] = useState(false)
  // F4-5：单词模式 / 例句模式（词典例句存在时可切换）
  const [mode, setMode] = useState<'word' | 'sentence'>('word')
  const target = mode === 'sentence' && word.ex ? word.ex : word.word
  const setPronScore = useLexiStore(st => st.setPronScore)
  const recordActivity = useLexiStore(st => st.recordActivity)
  const awardedRef = useRef(false)

  // 口音设置 → 识别语言
  const lang = useMemo(() => {
    const a = readAccentPreference()
    return a === 'uk' ? 'en-GB' : 'en-US'
  }, [])

  // 评分落库（最佳分 + 达标记活动）
  useEffect(() => {
    if (speech.phase !== 'scored' || !speech.score || awardedRef.current) return
    awardedRef.current = true
    setPronScore(word.id, speech.score.total)
    if (speech.score.total >= 80) recordActivity('pronounced')
  }, [speech.phase, speech.score, word.id, setPronScore, recordActivity])

  const sc = speech.score
  const scoreColor = !sc ? 'var(--ink-muted)' : sc.total >= 90 ? '#0e8c7a' : sc.total >= 75 ? '#3b5bd9' : '#d2792f'

  function playOriginal(text: string) {
    try {
      const u = new SpeechSynthesisUtterance(text)
      u.lang = lang
      speechSynthesis.cancel()
      speechSynthesis.speak(u)
    } catch { /* noop */ }
  }

  return (
    <div style={{ background: 'var(--card)', borderRadius: 24, padding: '32px', border: '1px solid var(--line)', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 34, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-news)' }}>{word.word}</span>
        <SoundBtn word={word.word} />
      </div>
      {word.phon && <div style={{ fontSize: 13, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{word.phon}</div>}
      <div style={{ fontSize: 14, color: 'var(--ink-sub)', marginBottom: 8 }}>{word.zh}</div>
      {(word.pronScore ?? 0) > 0 && (
        <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginBottom: 8 }}>历史最佳 <b style={{ color: 'var(--teal-ink)', fontFamily: 'var(--font-mono)' }}>{word.pronScore}</b> 分</div>
      )}
      {word.ex && (
        <div style={{ display: 'inline-flex', borderRadius: 99, overflow: 'hidden', border: '1px solid var(--line)', marginBottom: 12 }}>
          {(['word', 'sentence'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); speech.reset() }}
              style={{ padding: '5px 14px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', background: mode === m ? 'var(--teal-bg)' : 'transparent', color: mode === m ? 'var(--teal-ink)' : 'var(--ink-muted)' }}>
              {m === 'word' ? '单词' : '例句'}
            </button>
          ))}
        </div>
      )}
      {mode === 'sentence' && word.ex && (
        <div style={{ fontSize: 14.5, color: 'var(--ink)', fontStyle: 'italic', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 12px', fontFamily: 'var(--font-news)' }}>
          “{word.ex}”
        </div>
      )}

      <Waveform active={speech.phase === 'recording'} level={speech.level} />

      {/* 评分结果 */}
      {speech.phase === 'scored' && sc && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, margin: '16px 0' }}>
          <ProgressRing
            pct={sc.total} size={96} stroke={8} color={scoreColor}
            label={
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor, lineHeight: 1 }}><NumberRoll value={sc.total} /></div>
                <div style={{ fontSize: 10, color: 'var(--ink-muted)' }}>分</div>
              </div>
            }
          />
          {/* 三维度小条 */}
          <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--ink-sub)' }}>
            {([['完整度', sc.completeness], ['准确度', sc.accuracy], ['流利度', sc.fluency]] as const).map(([zh, v]) => (
              <span key={zh} style={{ display: 'flex', flexDirection: 'column', gap: 3, width: 64 }}>
                <span>{zh} {Math.round(v * 100)}</span>
                <span style={{ height: 4, borderRadius: 99, background: 'var(--paper-2)', overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: `${v * 100}%`, background: 'var(--teal-ink)', borderRadius: 99 }} />
                </span>
              </span>
            ))}
          </div>
          {/* 逐词标注（点错词听原音重试） */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {sc.wordMarks.map((m, i) => (
              <button key={i} onClick={() => playOriginal(m.word)} title={`${MARK_ZH[m.mark]}${m.heard ? ` · 识别为 ${m.heard}` : ''} · 点击听原音`}
                style={{ padding: '3px 10px', borderRadius: 99, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', color: MARK_COLOR[m.mark], background: `color-mix(in srgb, ${MARK_COLOR[m.mark]} 9%, transparent)`, border: `1px solid color-mix(in srgb, ${MARK_COLOR[m.mark]} 35%, transparent)` }}>
                {m.word}
              </button>
            ))}
          </div>
          {sc.bestTranscript && (
            <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>识别为：“{sc.bestTranscript}”</div>
          )}
          {speech.audioUrl && (
            <audio controls src={speech.audioUrl} style={{ height: 32, width: 220 }} />
          )}
          {/* 评分依据（诚实声明） */}
          <button onClick={() => setShowBasis(b => !b)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 11.5, color: 'var(--ink-muted)', fontFamily: 'var(--font-sans)' }}>
            评分依据 {showBasis ? '▲' : '▼'}
          </button>
          {showBasis && (
            <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', lineHeight: 1.6, maxWidth: 340, textAlign: 'left', background: 'var(--paper)', borderRadius: 10, padding: '10px 12px' }}>
              分数 = 完整度×0.4 + 准确度×0.4 + 流利度×0.2。依据浏览器语音识别结果与目标词比对（词级对齐 + 同音近似）及说话时长。<b>不含音素级重音/语调分析</b>——识别比对能回答「说得对不对、哪个词没说清」，不能评判口音地道程度。
            </div>
          )}
        </div>
      )}

      {/* 降级：跟读对比（不支持识别/拒麦） */}
      {!speech.supported && (
        <div style={{ fontSize: 12, color: 'var(--gold-ink)', margin: '10px 0' }}>
          当前浏览器不支持自动评分 — 跟读对比模式：先听原音，再录自己的，回放对比。
        </div>
      )}
      {speech.micDenied && (
        <div style={{ fontSize: 12, color: '#b3261e', margin: '10px 0' }}>麦克风权限被拒绝 — 可点喇叭听原音跟读，或在浏览器设置中允许麦克风后重试。</div>
      )}
      {speech.phase === 'fallback-recorded' && speech.audioUrl && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, margin: '12px 0' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={() => playOriginal(word.word)} className="btn-press" style={{ padding: '8px 14px', borderRadius: 99, border: '1px solid var(--line-strong)', background: 'var(--card)', fontSize: 12.5, cursor: 'pointer', fontFamily: 'var(--font-sans)', color: 'var(--ink)' }}>▶ 原音</button>
            <audio controls src={speech.audioUrl} style={{ height: 32, width: 200 }} />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>对比原音和自己的发音，注意差异处</div>
        </div>
      )}

      {/* 动作 */}
      {speech.phase === 'idle' && !speech.micDenied && (
        <button onClick={() => void speech.start(target, lang)} className="btn-press"
          style={{ marginTop: 8, padding: '14px 32px', borderRadius: 99, border: 'none', background: 'linear-gradient(180deg,#6ff0db,#34d8c0)', color: '#04241f', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 8, margin: '8px auto 0' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2"/><line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2"/>
          </svg>
          开始录音
        </button>
      )}
      {speech.phase === 'recording' && (
        <button onClick={speech.stop} className="btn-press"
          style={{ marginTop: 12, padding: '12px 28px', borderRadius: 99, border: '1.5px solid #d4477e', background: 'rgba(212,71,126,0.08)', color: '#d4477e', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          ■ 停止（说完点这里）
        </button>
      )}
      {speech.phase === 'processing' && (
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--teal-ink)', fontWeight: 600 }}>识别评分中…</div>
      )}
      {(speech.phase === 'scored' || speech.phase === 'fallback-recorded') && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 8 }}>
          <GhostBtn onClick={speech.reset}>再试一次</GhostBtn>
          <button onClick={() => onDone(sc?.total ?? 0)} className="btn-press"
            style={{ padding: '12px 28px', borderRadius: 99, border: 'none', background: 'linear-gradient(180deg,#6ff0db,#34d8c0)', color: '#04241f', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            下一个 →
          </button>
        </div>
      )}
    </div>
  )
}

// ── PronunciationScreen ────────────────────────────────────────
export function PronunciationScreen() {
  const navigate = useNavigate()
  const { getLearning, getToday, byState, markCorrect } = useLexiStore()
  // 订阅 words：store 异步 hydrate 后练习词需重算（否则 [] 依赖会停留在空列表）
  const allWords = useLexiStore(s => s.words)

  // F3-5：练习词 = 我的学习词优先（今日包 + 薄弱词在前，再学习中/复习）
  const words = useMemo<WordEntry[]>(() => {
    const today = getToday()
    const pool = [...today.recommended, ...byState('weak'), ...getLearning(), ...byState('review')]
    const unique = Array.from(new Map(pool.map(w => [w.id, w])).values())
    return unique.slice(0, MAX_WORDS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allWords])

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
