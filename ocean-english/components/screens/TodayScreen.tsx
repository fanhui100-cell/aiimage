'use client'
// TodayScreen — 1:1 port of prototype/screen-today.jsx

import { useEffect, useMemo } from 'react'
import { useLexiStore, type WordEntry } from '@/store/lexiStore'
import { STATE_META, type WordState } from '@/lib/state-meta'
import { hexA } from '@/lib/utils'
import { useNavigate } from '@/hooks/useNavigate'
import { ProgressRing, Eyebrow } from '@/components/screens/SharedUI'

// ── WordChip ───────────────────────────────────────────────────
function WordChip({ entry }: { entry: WordEntry }) {
  const m = STATE_META[entry.state]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 9px',
      borderRadius: 99, fontSize: 11.5, fontWeight: 600,
      background: hexA(m.light, 0.1), color: m.light,
      border: `1px solid ${hexA(m.light, 0.25)}`,
      fontFamily: 'var(--font-sans)',
    }}>
      {entry.word}
    </span>
  )
}

// ── PackRow ────────────────────────────────────────────────────
function PackRow({ label, words }: { label: string; words: WordEntry[] }) {
  if (!words.length) return null
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
        {label} · {words.length}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {words.map(w => <WordChip key={w.id} entry={w} />)}
      </div>
    </div>
  )
}

// ── StepNode ───────────────────────────────────────────────────
function StepNode({
  step, label, sub, color, locked, active, onClick,
}: {
  step: number; label: string; sub: string; color: string
  locked: boolean; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={locked ? '' : 'btn-press card-hover'}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '16px 20px', borderRadius: 16,
        border: `1.5px solid ${active ? color : locked ? 'var(--line)' : 'var(--line)'}`,
        background: active ? hexA(color, 0.07) : 'var(--card)',
        cursor: locked ? 'default' : 'pointer',
        opacity: locked ? 0.45 : 1,
        width: '100%', textAlign: 'left',
        transition: 'all 0.2s',
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? color : locked ? 'var(--line)' : hexA(color, 0.15),
        color: active ? '#fff' : color,
        fontSize: 15, fontWeight: 800,
      }}>
        {step}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-sub)', marginTop: 2 }}>{sub}</div>
      </div>
      {!locked && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? color : 'var(--ink-muted)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </button>
  )
}

// ── TodayScreen ────────────────────────────────────────────────
export function TodayScreen() {
  const navigate = useNavigate()
  const { getToday, getTodayProgress, streakData, xp, profile, counts } = useLexiStore()

  // A5：挂载时生成今日包（当天只生成一次），订阅 words/todayPack 以便生成后刷新
  const words = useLexiStore(s => s.words)
  const todayPackCache = useLexiStore(s => s.todayPack)
  useEffect(() => {
    void useLexiStore.getState().buildTodayPack()
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const today = useMemo(() => getToday(), [words, todayPackCache])
  const progress = getTodayProgress()
  const studiedToday = progress.n
  const goalToday = progress.goal
  const streak = streakData.current
  const pct = progress.pct
  const stage = pct === 0 ? 0 : pct < 50 ? 1 : pct < 100 ? 2 : 3

  const wordCounts = useMemo(() => counts(), [])
  const totalDue = today.review.length + today.weak.length

  const STEP_COLORS = ['#0e8c7a', '#3b5bd9', '#d2792f']

  return (
    <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)', paddingBottom: 100 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 20px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <Eyebrow>今日学习</Eyebrow>
            <h1 style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-serif-zh)', color: 'var(--ink)' }}>
              {stage === 0 ? '准备好了吗？' : stage < 3 ? '继续保持 💪' : '今日完成 🎉'}
            </h1>
          </div>
          {streak > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 22 }}>🔥</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#d2792f' }}>{streak}天</span>
            </div>
          )}
        </div>

        {/* Progress card */}
        <div style={{ background: 'var(--card)', borderRadius: 20, padding: '24px', border: '1px solid var(--line)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 24 }}>
          <ProgressRing
            pct={pct} size={80} stroke={7} color="var(--teal-ink)"
            label={
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>{pct}%</div>
                <div style={{ fontSize: 10, color: 'var(--ink-muted)', marginTop: 2 }}>完成</div>
              </div>
            }
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--ink-sub)', marginBottom: 6 }}>
              今日进度：{studiedToday} / {goalToday} 词
            </div>
            <div style={{ height: 6, borderRadius: 99, background: 'var(--line)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: 'linear-gradient(90deg, var(--teal), #34d8c0)', transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 16 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-sub)' }}>⚡ {xp} XP</span>
              {totalDue > 0 && <span style={{ fontSize: 12, color: '#d2792f' }}>📋 {totalDue} 待复习</span>}
            </div>
          </div>
        </div>

        {/* Today's word packs */}
        {today.all.length > 0 && (
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: '18px 20px', border: '1px solid var(--line)', marginBottom: 20 }}>
            <PackRow label="今日推荐" words={today.recommended} />
            <PackRow label="待复习" words={today.review} />
            <PackRow label="薄弱词" words={today.weak} />
          </div>
        )}

        {/* Flow steps */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-sub)', marginBottom: 12 }}>今日学习三步走</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <StepNode
              step={1} label="学习单词"
              sub={today.recommended.length > 0
                ? `${today.recommended.length} 个新词等待学习`
                : todayPackCache.date ? '今日新词暂不可用 · 先复习巩固' : '正在准备今日新词…'}
              color={STEP_COLORS[0]} locked={false} active={stage === 0}
              onClick={() => navigate('learn', { flow: true })}
            />
            <StepNode
              step={2} label="单词练习" sub="MCQ 巩固记忆"
              color={STEP_COLORS[1]} locked={stage < 1} active={stage === 1}
              onClick={() => navigate('quiz', { flow: true })}
            />
            <StepNode
              step={3} label="记忆复习" sub={totalDue > 0 ? `${totalDue} 词待复习` : 'SRS 间隔复习'}
              color={STEP_COLORS[2]} locked={stage < 2} active={stage >= 2}
              onClick={() => navigate('review', { flow: true })}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: '学习中', val: wordCounts.learning ?? 0, color: '#3b5bd9' },
            { label: '待复习', val: (wordCounts.review ?? 0) + (wordCounts.weak ?? 0), color: '#d2792f' },
            { label: '已掌握', val: wordCounts.mastered ?? 0, color: '#0e8c7a' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--card)', borderRadius: 12, padding: '14px 12px', border: '1px solid var(--line)', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'var(--font-news)' }}>{s.val}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick access */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('words')} className="btn-press"
            style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer', fontSize: 13, color: 'var(--ink-sub)', fontFamily: 'var(--font-sans)' }}>
            📚 词库
          </button>
          <button onClick={() => navigate('exam')} className="btn-press"
            style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer', fontSize: 13, color: 'var(--ink-sub)', fontFamily: 'var(--font-sans)' }}>
            🏆 考试
          </button>
          <button onClick={() => navigate('pronunciation')} className="btn-press"
            style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer', fontSize: 13, color: 'var(--ink-sub)', fontFamily: 'var(--font-sans)' }}>
            🎤 发音
          </button>
        </div>
      </div>
    </div>
  )
}
