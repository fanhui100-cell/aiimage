'use client'
// TodayScreen — 1:1 port of prototype/screen-today.jsx

import { useEffect, useMemo } from 'react'
import { useLexiStore, type WordEntry } from '@/store/lexiStore'
import { STATE_META, type WordState } from '@/lib/state-meta'
import { hexA } from '@/lib/utils'
import { useNavigate } from '@/hooks/useNavigate'
import { ProgressRing, Eyebrow } from '@/components/screens/SharedUI'
import { DailyRecapCard } from '@/components/study/DailyRecapCard'
import { NumberRoll } from '@/components/ui/NumberRoll'

// ── WordChip（B3-3：done = 实底 + 划除）────────────────────────
function WordChip({ entry, done }: { entry: WordEntry; done?: boolean }) {
  const m = STATE_META[entry.state]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 9px',
      borderRadius: 99, fontSize: 11.5, fontWeight: 600,
      background: done ? m.light : hexA(m.light, 0.1),
      color: done ? '#fff' : m.light,
      border: `1px solid ${done ? m.light : hexA(m.light, 0.25)}`,
      textDecoration: done ? 'line-through' : 'none',
      fontFamily: 'var(--font-sans)',
    }}>
      {entry.word}
    </span>
  )
}

// ── PackRow（B3-3：完成计数「3/5 完成」）────────────────────────
function PackRow({ label, words, isDone }: {
  label: string; words: WordEntry[]; isDone: (w: WordEntry) => boolean
}) {
  if (!words.length) return null
  const doneN = words.filter(isDone).length
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
        {label} · {doneN}/{words.length} 完成
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {words.map((w, i) => (
          <span key={w.id} className="stagger-item" style={{ animationDelay: `${Math.min(i, 9) * 30}ms` }}>
            <WordChip entry={w} done={isDone(w)} />
          </span>
        ))}
      </div>
    </div>
  )
}

// ── StepNode（B3-1：独立完成态 + 「去完成 →」动作按钮）──────────
function StepNode({
  step, label, sub, color, locked, done, onClick,
}: {
  step: number; label: string; sub: string; color: string
  locked: boolean; done: boolean; onClick: () => void
}) {
  const active = !locked && !done
  return (
    <div
      className={locked ? '' : 'card-hover'}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '16px 20px', borderRadius: 16,
        border: `1.5px solid ${active ? color : 'var(--line)'}`,
        background: active ? hexA(color, 0.07) : 'var(--card)',
        opacity: locked ? 0.45 : 1,
        width: '100%', textAlign: 'left',
        transition: 'all 0.2s',
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: done ? color : active ? color : 'var(--line)',
        color: done || active ? '#fff' : 'var(--ink-muted)',
        fontSize: 15, fontWeight: 800,
      }}>
        {done ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        ) : step}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-sub)', marginTop: 2 }}>{sub}</div>
      </div>
      {!locked && !done && (
        <button onClick={onClick} className="btn-press"
          style={{ flexShrink: 0, padding: '9px 16px', borderRadius: 999, border: `1.5px solid ${color}`, background: hexA(color, 0.08), cursor: 'pointer', fontSize: 13, fontWeight: 700, color, fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>
          去完成 →
        </button>
      )}
    </div>
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

  const wordCounts = useMemo(() => counts(), [])
  const totalDue = today.review.length + today.weak.length

  // B3-1：三步动线真实判定（学=新词学完；练=当日答题≥5；复=到期清零）
  const daily = useLexiStore(s => s.daily)
  const dueLen = useLexiStore(s => s.getDue().length)
  const todayStr = new Date().toISOString().slice(0, 10)
  const quizzedToday = daily.date === todayStr ? daily.quizzed : 0
  // 步骤1以「包内仍是 recommended 的词清零」为准（today.recommended 随学习消耗）
  const packTotal = todayPackCache.recommendedIds.length
  const step1done = today.recommended.length === 0
  const step2done = quizzedToday >= 5
  const step3done = dueLen === 0
  const allDone = step1done && step2done && step3done
  const now = Date.now()

  const STEP_COLORS = ['#0e8c7a', '#3b5bd9', '#d2792f']

  return (
    <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)', paddingBottom: 100 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 20px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <Eyebrow>今日学习</Eyebrow>
            <h1 style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-serif-zh)', color: 'var(--ink)' }}>
              {allDone ? '今日已闭环 🎉' : pct === 0 ? '准备好了吗？' : '继续保持 💪'}
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
              <span style={{ fontSize: 12, color: 'var(--ink-sub)' }}>⚡ <NumberRoll value={xp} /> XP</span>
              {totalDue > 0 && <span style={{ fontSize: 12, color: '#d2792f' }}>📋 {totalDue} 待复习</span>}
            </div>
          </div>
        </div>

        {/* Today's word packs（B3-3：完成态可见） */}
        {today.all.length > 0 && (
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: '18px 20px', border: '1px solid var(--line)', marginBottom: 20 }}>
            <PackRow label="今日推荐" words={today.recommended} isDone={w => w.state !== 'recommended'} />
            <PackRow label="待复习" words={today.review} isDone={w => w.nextReviewAt == null || w.nextReviewAt > now} />
            <PackRow label="薄弱词" words={today.weak} isDone={w => w.state !== 'weak'} />
          </div>
        )}

        {/* B10-3：今日包生成失败明示 + 重试（按包本身为空判定，学完不误报） */}
        {todayPackCache.date !== '' && todayPackCache.recommendedIds.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--card-2)', border: '1px solid var(--line)', borderRadius: 12, padding: '11px 14px', marginBottom: 14 }}>
            <span style={{ flex: 1, fontSize: 13, color: 'var(--ink-sub)' }}>新词推荐暂时不可用，先完成复习部分</span>
            <button onClick={() => void useLexiStore.getState().buildTodayPack(true)} className="btn-press"
              style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 999, border: '1.5px solid var(--teal-ink)', background: 'var(--teal-bg)', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: 'var(--teal-ink)', fontFamily: 'var(--font-sans)' }}>
              重试
            </button>
          </div>
        )}

        {/* Flow steps（B3-1：独立判定 + 去完成按钮） */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-sub)', marginBottom: 12 }}>今日学习三步走</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <StepNode
              step={1} label="学习单词"
              sub={packTotal > 0
                ? step1done
                  ? `今日 ${packTotal} 个新词已学完`
                  : `新词 ${packTotal - today.recommended.length}/${packTotal}`
                : todayPackCache.date ? '今日新词暂不可用 · 先复习巩固' : '正在准备今日新词…'}
              color={STEP_COLORS[0]} locked={false} done={step1done}
              onClick={() => navigate('learn', { flow: true })}
            />
            <StepNode
              step={2} label="单词练习"
              sub={step2done ? `今日已答 ${quizzedToday} 题` : `MCQ 巩固记忆 · ${quizzedToday}/5 题`}
              color={STEP_COLORS[1]} locked={!step1done} done={step2done}
              onClick={() => navigate('quiz', { flow: true })}
            />
            <StepNode
              step={3} label="记忆复习"
              sub={step3done ? '到期复习已清零' : `${dueLen} 词到期待复习`}
              color={STEP_COLORS[2]} locked={!step2done} done={step3done}
              onClick={() => navigate('review', { flow: true })}
            />
          </div>
        </div>

        {/* B3-2：全闭环 → 今日小结分享卡 */}
        {allDone && (
          <div style={{ background: 'var(--card)', borderRadius: 16, padding: '22px 20px', border: '1px solid var(--line)', marginBottom: 20 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--teal-ink)', fontFamily: 'var(--font-serif-zh)' }}>🎯 今日已闭环</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-sub)', marginTop: 4 }}>学习 → 练习 → 复习全部完成，保存今天的航行记录吧</div>
            </div>
            <DailyRecapCard />
          </div>
        )}

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
