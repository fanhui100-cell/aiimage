'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { NAVIGATE_MAP } from './BanyanHero'
import { HomeHero } from './HomeHero'
import { useLexiStore } from '@/store/lexiStore'
import { useScanHistoryStore } from '@/store/useScanHistoryStore'
import { useMotivationStore } from '@/store/useMotivationStore'
import { levelDef } from '@/lib/levels'
import { STATE_META, STATE_ORDER, type WordState } from '@/lib/state-meta'
import { TOOL_NAV } from '@/lib/product-flow/nav'
import { NumberRoll } from '@/components/ui/NumberRoll'

// ── Shared UI ──────────────────────────────────────────────────────────────

function ProgressRing({ value, size = 120, stroke = 9, color = 'var(--teal-ink)', track = 'rgba(20,30,40,0.08)', children }: {
  value: number; size?: number; stroke?: number; color?: string; track?: string; children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c - (c * value) / 100} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(.34,1.56,.64,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  )
}

// ── Icon map（B2：仅保留工具条所需 6 个，按 TOOL_NAV key）───────────────────

const TOOL_ICON: Record<string, (p?: { s?: number }) => React.ReactNode> = {
  reading: p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l10-4 10 4-10 4z"/><path d="M6 9.5V15c0 1.5 2.7 3 6 3s6-1.5 6-3V9.5"/></svg>,
  scan:    p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="3" y1="12" x2="21" y2="12"/></svg>,
  speak:   p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/></svg>,
  tutor:   p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>,
  exam:    p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M4 6h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><path d="M8 12h8M8 16h5"/></svg>,
  graph:   p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="7" r="2.4"/><circle cx="12" cy="17.5" r="2.4"/><path d="M8 7 16 16M16 8.6 13 15"/></svg>,
  drill:   p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.8" fill="currentColor"/></svg>,
  roots:   p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2.5"/><path d="M12 7.5V13M12 13l-6 6M12 13l6 6M12 13v6"/><circle cx="6" cy="19" r="2"/><circle cx="12" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></svg>,
  rank:    p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M5 4H3v2a3 3 0 0 0 3 3M19 4h2v2a3 3 0 0 1-3 3"/></svg>,
  speaking: p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  listening: p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 14v-2a9 9 0 0 1 18 0v2"/><path d="M21 16a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2zM3 16a2 2 0 0 0 2 2h1v-6H5a2 2 0 0 0-2 2z"/></svg>,
  writing: p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>,
  groups:  p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  report:  p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>,
  vault:   p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v4H4zM4 8v12h16V8M9 12h6"/></svg>,
}

// ── Sub-components ─────────────────────────────────────────────────────────

function HomeHeader() {
  const streak = useLexiStore(s => s.streakData.current)
  const h = new Date().getHours()
  const greet = h < 5 ? '夜深了，学一个就睡'
    : h < 12 ? '早上好，先拿下今天的词'
    : h < 18 ? '下午好，继续你的航行'
    : '晚上好，收个尾再休息'
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--teal-ink)', opacity: 0.72 }}>欢迎回来 · Welcome back</p>
        <h1 style={{ margin: '2px 0 0', fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 'clamp(24px,3.2vw,32px)', color: 'var(--ink)' }}>
          {greet}
        </h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 999, background: 'var(--card)', border: '1px solid var(--line)', flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold-ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c1 4 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3 .5 2 2 2.5 2 2.5C9 8 12 6 12 2z"/></svg>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{streak}</span>
        <span style={{ fontSize: 12, color: 'var(--ink-sub)' }}>天</span>
      </div>
    </div>
  )
}

function MiniStat({ label, n, color }: { label: string; n: number; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color }}>{n}</div>
      <div style={{ fontSize: 11, color: 'rgba(234,243,246,0.55)' }}>{label}</div>
    </div>
  )
}

function ContinueCard({ navigate }: { navigate: (go: string) => void }) {
  // selector 只订阅稳定切片；返回新对象的派生 getter 用 useMemo 计算，
  // 否则 SSR 水合时触发 getServerSnapshot 死循环警告
  const words = useLexiStore(s => s.words)
  const todayPack = useLexiStore(s => s.todayPack)
  const goalToday = useLexiStore(s => s.goalToday)
  const daily = useLexiStore(s => s.daily)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const today = useMemo(() => useLexiStore.getState().getToday(), [words, todayPack, goalToday])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const progress = useMemo(() => useLexiStore.getState().getTodayProgress(), [daily, goalToday])
  const dueCount = useMemo(() => {
    const now = Date.now()
    return words.filter(w => w.nextReviewAt != null && w.nextReviewAt <= now).length
  }, [words])
  const weakCount = useMemo(() => words.filter(w => w.state === 'weak').length, [words])

  const studiedToday = progress.n
  const pct = progress.pct
  const remaining = Math.max(0, goalToday - studiedToday)
  const bg = 'linear-gradient(160deg, #0a1722 0%, #0e2230 60%, #123042 100%)'

  return (
    <div style={{ position: 'relative', borderRadius: 'var(--r-card)', overflow: 'hidden', background: bg, color: '#eaf3f6', padding: 'clamp(22px,4vw,34px)', boxShadow: '0 30px 60px -32px rgba(8,20,30,0.7)', border: '1px solid rgba(79,230,206,0.14)' }}>
      {/* Demo08：深海光斑 20s/26s 极慢漂移（仅 transform） */}
      <div className="drift-a" style={{ position: 'absolute', top: -80, right: -60, width: 260, height: 260, borderRadius: 999, background: 'radial-gradient(circle, rgba(79,230,206,0.22), transparent 70%)', pointerEvents: 'none' }} />
      <div className="drift-b" style={{ position: 'absolute', bottom: -100, left: -70, width: 220, height: 220, borderRadius: 999, background: 'radial-gradient(circle, rgba(59,91,217,0.14), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', position: 'relative' }}>
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(79,230,206,0.8)' }}>今日学习 · Today</p>
          <h2 style={{ margin: '8px 0 6px', fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 'clamp(24px,4vw,34px)' }}>
            {remaining > 0 ? `还有 ${remaining} 个词待完成` : '今日目标已完成 🎉'}
          </h2>
          <p style={{ margin: 0, fontSize: 14.5, color: 'rgba(234,243,246,0.7)', lineHeight: 1.6 }}>
            {/* F1-2 口径修复：进度=完成量(daily)，此行=剩余任务，文案区分清楚 */}
            {today.all.length > 0
              ? <>今日包剩余 <b style={{ color: STATE_META.recommended.dark }}>{today.recommended.length} 推荐</b> · <b style={{ color: STATE_META.review.dark }}>{today.review.length} 待复习</b> · <b style={{ color: STATE_META.weak.dark }}>{today.weak.length} 薄弱</b></>
              : <>今日包任务已全部清空 — 已学 {studiedToday} 词</>}
          </p>
          <div style={{ marginTop: 18, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'rgba(234,243,246,0.6)', marginBottom: 7 }}>
              <span>{studiedToday} / {goalToday} 词</span><span>{pct}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: 'linear-gradient(90deg,#1f9f8c,#4fe6ce)', transition: 'width .7s cubic-bezier(.34,1.56,.64,1)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('today')} className="btn-press"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 28px', fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-sans)', color: '#06231d', background: 'linear-gradient(180deg,#5ff0d8,#33d3b8)', border: 'none', borderRadius: 999, cursor: 'pointer', boxShadow: '0 16px 30px -14px rgba(79,230,206,0.6)' }}>
              {remaining > 0 ? '继续学习' : '复习巩固'}
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <button onClick={() => navigate('universe')} className="btn-press"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '15px 22px', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-sans)', color: '#eaf3f6', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(225,238,244,0.22)', borderRadius: 999, cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="4.3" transform="rotate(28 12 12)"/></svg>
              词汇宇宙
            </button>
          </div>
        </div>
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <ProgressRing value={pct} size={120} stroke={10} color="#4fe6ce" track="rgba(255,255,255,0.08)">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: '#eaf3f6' }}><NumberRoll value={pct} /><span style={{ fontSize: 15 }}>%</span></div>
            <div style={{ fontSize: 11, color: 'rgba(234,243,246,0.55)', letterSpacing: '0.08em' }}>今日完成</div>
          </ProgressRing>
          <div style={{ display: 'flex', gap: 14 }}>
            <MiniStat label="待复习" n={dueCount} color={STATE_META.review.dark} />
            <MiniStat label="薄弱" n={weakCount} color={STATE_META.weak.dark} />
          </div>
        </div>
      </div>
    </div>
  )
}

/** F1-2：词库掌握度（照设计稿：标题外置 + 大数字 + 六段条 + chips + 空态 CTA） */
function MasterySection({ navigate }: { navigate: (go: string) => void }) {
  const router = useRouter()
  const words = useLexiStore(s => s.words)
  const log = useLexiStore(s => s.log)
  const profile = useLexiStore(s => s.profile)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const counts = useMemo(() => useLexiStore.getState().counts(), [words])
  const pct = useLexiStore(s => s.masteredPct())
  const learnedN = useMemo(
    () => words.filter(w => ['learning', 'review', 'weak', 'mastered'].includes(w.state)).length,
    [words])
  // 本周 +N：log 中近 7 天转 mastered 的条目（log 仅留 30 条，为尽力值）
  const weekMastered = useMemo(() => {
    const weekAgo = Date.now() - 7 * DAY
    return new Set(log.filter(e => e.t >= weekAgo && e.to === 'mastered').map(e => e.id)).size
  }, [log])
  const def = profile.level != null ? levelDef(profile.level) : null
  const empty = learnedN === 0
  const toDictionary = (st: WordState) => router.push(`/dictionary?state=${st}`)

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'var(--font-serif-zh)', fontSize: 19, fontWeight: 600, margin: 0, color: 'var(--ink)' }}>
          词库掌握度
          <small style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--ink-muted)', marginLeft: 10, textTransform: 'uppercase' }}>Mastery</small>
        </h3>
        <button onClick={() => navigate('universe')} className="btn-press"
          style={{ fontSize: 12.5, color: 'var(--teal-ink)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', padding: 0 }}>
          在宇宙中查看 →
        </button>
      </div>
      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 18, padding: '22px 24px', boxShadow: 'var(--shadow-rest)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 34, fontWeight: 700, color: 'var(--teal-ink)', lineHeight: 1 }}>
            <NumberRoll value={pct} />%
          </span>
          <span style={{ fontSize: 13, color: 'var(--ink-sub)', whiteSpace: 'nowrap' }}>
            已掌握{def ? ` · 共 ${def.wordCount.toLocaleString()} 词（${def.zh}）` : ''} · 已学 {learnedN}
          </span>
          {weekMastered > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--teal-ink)', background: 'var(--teal-bg)', borderRadius: 99, padding: '3px 12px', fontWeight: 600 }}>本周 +{weekMastered}</span>
          )}
        </div>
        <div style={{ display: 'flex', height: 14, borderRadius: 999, overflow: 'hidden', gap: 2 }}>
          {empty ? (
            <div style={{ flex: 1, background: 'var(--paper-2)', borderRadius: 3 }} />
          ) : (
            STATE_ORDER.filter(st => st !== 'locked' && st !== 'unknown').map(st => (counts[st] ?? 0) > 0 && (
              <div key={st} onClick={() => toDictionary(st)} role="button" tabIndex={0} className="seg-grow"
                style={{ flexGrow: Math.max(counts[st], 1), minWidth: 8, borderRadius: 3, background: STATE_META[st].light, cursor: 'pointer' }}
                title={`${STATE_META[st].zh} ${counts[st]} 词 · 点击查看`} />
            ))
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          {STATE_ORDER.filter(st => st !== 'locked' && st !== 'unknown').map(st => {
            const m = STATE_META[st]
            return (
              <button key={st} onClick={() => toDictionary(st)} className="btn-press"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--ink-sub)', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 99, padding: '6px 13px', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)' }}>
                <i style={{ width: 8, height: 8, borderRadius: 99, background: m.light }} />
                <span>{m.zh}</span>
                <b style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, color: 'var(--ink)' }}>{counts[st] ?? 0}</b>
              </button>
            )
          })}
        </div>
        {empty && (
          <button onClick={() => navigate('onboarding')} className="btn-press"
            style={{ marginTop: 14, width: '100%', textAlign: 'left', fontSize: 12.5, color: 'var(--teal-ink)', fontWeight: 600, background: 'var(--teal-bg)', border: 'none', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            完成定级，解锁你的词库地形 →
          </button>
        )}
      </div>
    </section>
  )
}

/** F1-2：未来 7 天复习量（words.nextReviewAt 按日聚合，今天高亮） */
function ForecastCard() {
  const router = useRouter()
  const words = useLexiStore(s => s.words)
  const bars = useMemo(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0)
    const labels = ['今', '明', ...Array.from({ length: 5 }, (_, i) => '周日一二三四五六'.charAt(new Date(now.getTime() + (i + 2) * DAY).getDay() + 1))]
    return Array.from({ length: 7 }, (_, i) => {
      const d0 = now.getTime() + i * DAY
      const d1 = d0 + DAY
      const n = words.filter(w => w.nextReviewAt != null
        && (i === 0 ? w.nextReviewAt < d1 : w.nextReviewAt >= d0 && w.nextReviewAt < d1)).length
      return { label: labels[i], n }
    })
  }, [words])
  const mx = Math.max(1, ...bars.map(b => b.n))
  return (
    <div onClick={() => router.push('/memory')} className="card-hover"
      style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 18, padding: '18px 20px', boxShadow: 'var(--shadow-rest)', cursor: 'pointer' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.16em', color: 'var(--ink-muted)', textTransform: 'uppercase' }}>未来 7 天复习量 · Forecast</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 56, marginTop: 10 }}>
        {bars.map((b, i) => (
          <div key={i} title={`${b.n} 词到期`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
            <i style={{ width: '100%', height: Math.max(8, b.n / mx * 44), borderRadius: '4px 4px 2px 2px', background: i === 0 ? 'var(--teal-ink)' : 'var(--teal-bg)', border: `1px solid ${i === 0 ? 'var(--teal-ink)' : 'rgba(14,140,122,0.2)'}` }} />
            <small style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--ink-muted)' }}>{b.label}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

/** F1-2：工具网格（卡片式 + 真实活性状态行，照设计稿） */
const TOOL_DESC: Record<string, string> = {
  reading: '边读边收生词', drill: '按档刷该档新词', roots: '词根串记一族词', scan: '拍照提取生词', speak: '跟读评分练口语',
  tutor: '基于你的数据答疑', exam: '限时全真测验', graph: '词形与关系图谱', report: '记忆矩阵与词汇量', rank: '周/总/连击排名',
  speaking: 'AI 场景口语陪练', listening: '听音拼词练听力', writing: '用词造句 AI 批改', groups: '小组打卡互监督', vault: '我的学习档案馆',
}
const TOOL_TINT: Record<string, [string, string]> = {
  reading: ['var(--teal-ink)', 'var(--teal-bg)'],
  drill: ['var(--gold-ink)', 'rgba(179,120,31,.08)'],
  roots: ['var(--teal-ink)', 'var(--teal-bg)'],
  scan: ['var(--blue-ink)', 'rgba(59,91,217,.08)'],
  speak: ['#d4477e', 'rgba(212,71,126,.07)'],
  tutor: ['#6d4bc4', 'rgba(109,75,196,.07)'],
  exam: ['var(--gold-ink)', 'rgba(179,120,31,.08)'],
  graph: ['var(--teal-ink)', 'var(--teal-bg)'],
  report: ['#3b5bd9', 'rgba(59,91,217,.08)'],
  rank: ['var(--gold-ink)', 'rgba(179,120,31,.08)'],
  speaking: ['#d4477e', 'rgba(212,71,126,.07)'],
  listening: ['var(--teal-ink)', 'var(--teal-bg)'],
  writing: ['#6d4bc4', 'rgba(109,75,196,.07)'],
  groups: ['var(--blue-ink)', 'rgba(59,91,217,.08)'],
  vault: ['var(--ink-sub)', 'var(--paper-2)'],
}

function ToolsGrid() {
  const router = useRouter()
  const log = useLexiStore(s => s.log)
  const quizHistory = useLexiStore(s => s.quizHistory)
  const pronToday = useMotivationStore(s => s.dailyMissionProgress.pronunciationCount)

  // 活性状态（全部真实数据；取不到的不显示该行）
  const hints = useMemo(() => {
    const h: Partial<Record<string, { text: string; warn?: boolean }>> = {}
    if (pronToday === 0) h.speak = { text: '今日未练', warn: true }
    else h.speak = { text: `今日已练 ${pronToday} 次` }
    const lastQuiz = quizHistory[0]
    if (lastQuiz && lastQuiz.total > 0) h.exam = { text: `上次 ${Math.round(lastQuiz.score / lastQuiz.total * 100)} 分` }
    const dayStart = new Date(new Date().setHours(0, 0, 0, 0)).getTime()
    const vaultToday = new Set(log.filter(e => e.t >= dayStart).map(e => e.id)).size
    if (vaultToday > 0) h.vault = { text: `今日 +${vaultToday} 条` }
    return h
  }, [pronToday, quizHistory, log])

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'var(--font-serif-zh)', fontSize: 19, fontWeight: 600, margin: 0, color: 'var(--ink)' }}>
          工具
          <small style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--ink-muted)', marginLeft: 10, textTransform: 'uppercase' }}>Tools</small>
        </h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(186px, 1fr))', gap: 12 }}>
        {TOOL_NAV.map((t, i) => {
          const [color, bg] = TOOL_TINT[t.key] ?? ['var(--teal-ink)', 'var(--teal-bg)']
          const hint = hints[t.key]
          return (
            <div key={t.key} onClick={() => router.push(t.href)} className="card-hover stagger-item" role="button" tabIndex={0}
              style={{ animationDelay: `${i * 30}ms`, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, padding: '16px 18px', cursor: 'pointer', boxShadow: 'var(--shadow-rest)', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
              <span style={{ width: 38, height: 38, borderRadius: 10, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {TOOL_ICON[t.key]?.({ s: 20 })}
              </span>
              {hint?.warn && (
                <span style={{ position: 'absolute', top: 14, right: 14, minWidth: 18, height: 18, borderRadius: 99, background: 'rgba(212,71,126,.12)', color: '#d4477e', border: '1px solid rgba(212,71,126,.3)', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>!</span>
              )}
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{t.zh}</span>
              <span style={{ fontSize: 11.5, color: 'var(--ink-muted)', lineHeight: 1.5 }}>{TOOL_DESC[t.key]}</span>
              {hint && (
                <span style={{ fontSize: 11, fontWeight: 600, color: hint.warn ? 'var(--st-due, #d2792f)' : 'var(--teal-ink)' }}>{hint.text}</span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

/** B2-2：「继续上次」智能卡 — 优先级：未完成今日流程 → 最近扫描；无可继续项不渲染
 *  （阅读页已真实化，但暂未记录「读到第几篇」的续读进度，故 ResumeCard 不含阅读级） */
function ResumeCard() {
  const router = useRouter()
  const daily = useLexiStore(s => s.daily)
  const dueCount = useLexiStore(s => s.getDue().length)
  const recommendedCount = useLexiStore(s => s.getToday().recommended.length)
  const latestScan = useScanHistoryStore(s => s.scanDocuments[0])

  const today = new Date().toISOString().slice(0, 10)
  const activeToday = daily.date === today && (daily.learned + daily.quizzed + daily.reviewed) > 0

  let label: string | null = null
  let href: string | null = null
  if (activeToday) {
    if (recommendedCount > 0 && daily.learned < recommendedCount) {
      label = `新词学到 ${daily.learned}/${recommendedCount}，继续`
      href = '/learn?flow=true'
    } else if (daily.quizzed < 5) {
      label = `测验做到 ${daily.quizzed}/5，继续`
      href = '/quiz?flow=true'
    } else if (dueCount > 0) {
      label = `复习还剩 ${dueCount} 词，收个尾`
      href = '/memory?flow=true'
    }
  }
  if (!label && latestScan) {
    label = `继续看《${latestScan.fileName}》`
    href = `/scan/history/${latestScan.id}`
  }
  if (!label || !href) return null

  return (
    <button onClick={() => router.push(href!)} className="btn-press card-hover"
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', cursor: 'pointer', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 18, boxShadow: 'var(--shadow-rest)', padding: '18px 20px' }}>
      <span style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--teal-bg)', color: 'var(--teal-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>继续上次 · Resume</span>
        <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', margin: '6px 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      </span>
      <span style={{ marginLeft: 'auto', color: 'var(--teal-ink)', fontSize: 18, flexShrink: 0 }}>→</span>
    </button>
  )
}

// ── Main HomeScreen ─────────────────────────────────────────────────────────

const DAY = 86_400_000

export function HomeScreen() {
  const router = useRouter()
  const profile = useLexiStore(s => s.profile)
  const quizHistory = useLexiStore(s => s.quizHistory)

  // A5：挂载时生成今日包（当天只生成一次）
  useEffect(() => {
    void useLexiStore.getState().buildTodayPack()
  }, [])

  function navigate(go: string) {
    const href = NAVIGATE_MAP[go]
    if (href) router.push(href)
  }

  // B2-4：定级引导条第二状态 — 定级超 30 天，或近 7 天答题 ≥20 且正确率 >90%
  const needsRecalibration = (() => {
    if (!profile.onboarded) return false
    const overdue = profile.onboardedAt ? Date.now() - profile.onboardedAt > 30 * DAY : false
    const weekAgo = Date.now() - 7 * DAY
    const recent = quizHistory.filter(q => (q.completedAt ?? 0) >= weekAgo)
    const total = recent.reduce((a, q) => a + q.total, 0)
    const correct = recent.reduce((a, q) => a + q.score, 0)
    return overdue || (total >= 20 && correct / total > 0.9)
  })()

  return (
    <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)' }}>
      {/* F1：整页米白，深色画框卡与内容列同宽嵌入 · 大区块间 48px 统一节奏 */}
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '24px clamp(20px,5vw,48px) 64px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 48 }}>
        <HomeHero navigate={navigate} />
        {/* 方案 A：欢迎语统一由 Hero 覆盖层呈现，移除重复的 HomeHeader */}
        {profile.skipped && !profile.onboarded && (
          <button onClick={() => navigate('onboarding')} className="btn-press" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer', background: 'var(--card-2)', border: '1px solid rgba(14,140,122,0.3)', borderRadius: 14, boxShadow: 'var(--card-shadow-sm)', padding: '13px 16px', marginTop: -24 }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--teal-bg)', color: 'var(--teal-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>
            </span>
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>完成定级，解锁个性化今日包</span>
              <span style={{ display: 'block', fontSize: 12.5, color: 'var(--ink-sub)' }}>你先逛着 — 30 秒测一下水平，选词就更准</span>
            </span>
            <span style={{ color: 'var(--teal-ink)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
              去定级
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </span>
          </button>
        )}
        {needsRecalibration && (
          <button onClick={() => navigate('onboarding')} className="btn-press" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer', background: 'var(--card-2)', border: '1px solid rgba(179,120,31,0.3)', borderRadius: 14, boxShadow: 'var(--card-shadow-sm)', padding: '13px 16px', marginTop: -24 }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(179,120,31,0.1)', color: 'var(--gold-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </span>
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>水平可能升级了，重新测一下？</span>
              <span style={{ display: 'block', fontSize: 12.5, color: 'var(--ink-sub)' }}>定级会随你进步而过时 — 30 秒重新校准选词难度</span>
            </span>
            <span style={{ color: 'var(--gold-ink)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
              去重测
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </span>
          </button>
        )}
        <ContinueCard navigate={navigate} />
        <MasterySection navigate={navigate} />
        {/* F1-2：双栏 — 继续上次 1.4fr + 未来7天 1fr（移动单列；无可继续项时单列） */}
        <div className="home-duo">
          <ResumeCard />
          <ForecastCard />
        </div>
        <ToolsGrid />
      </div>
    </div>
  )
}
