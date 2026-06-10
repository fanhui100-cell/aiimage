'use client'

import { useRouter } from 'next/navigation'
import { BanyanHero, NAVIGATE_MAP } from './BanyanHero'
import { useLexiStore } from '@/store/lexiStore'
import { STATE_META, STATE_ORDER } from '@/lib/state-meta'
import { hexA } from '@/lib/utils'

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

function StatusLegend({ counts, onPick, compact }: {
  counts: Record<string, number>; onPick?: () => void; compact?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {STATE_ORDER.filter(s => s !== 'locked' || counts.locked).map(s => {
        const m = STATE_META[s]
        const n = counts[s] ?? 0
        return (
          <button key={s} onClick={() => onPick?.()}
            className="btn-press"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: compact ? '5px 10px' : '7px 12px', borderRadius: 999, cursor: onPick ? 'pointer' : 'default',
              background: 'var(--card)', border: '1px solid var(--line)', transition: 'all .15s', fontFamily: 'var(--font-sans)',
            }}>
            <span style={{ width: 9, height: 9, borderRadius: 999, background: m.light, boxShadow: `0 0 0 3px ${hexA(m.light, 0.16)}` }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{m.zh}</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)' }}>{n}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Icon map ───────────────────────────────────────────────────────────────

const ICON: Record<string, (p?: { s?: number }) => React.ReactNode> = {
  today:         p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M9 16l2 2 4-4"/></svg>,
  words:         p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  reading:       p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l10-4 10 4-10 4z"/><path d="M6 9.5V15c0 1.5 2.7 3 6 3s6-1.5 6-3V9.5"/></svg>,
  quiz:          p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9.1 9a3 3 0 1 1 4 2.8c-.8.4-1.6 1-1.6 2.2"/><line x1="11.5" y1="17" x2="11.5" y2="17"/><circle cx="12" cy="12" r="10"/></svg>,
  review:        p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  exam:          p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M4 6h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><path d="M8 12h8M8 16h5"/></svg>,
  pronunciation: p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/></svg>,
  scan:          p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="3" y1="12" x2="21" y2="12"/></svg>,
  chat:          p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>,
  universe:      p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="4.3" transform="rotate(28 12 12)"/></svg>,
  lexigraph:     p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="7" r="2.4"/><circle cx="12" cy="17.5" r="2.4"/><path d="M8 7 16 16M16 8.6 13 15"/></svg>,
  knowledge:     p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v4H4zM4 8v12h16V8M9 12h6"/></svg>,
  me:            p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg>,
}

// ── Entry groups ────────────────────────────────────────────────────────────

const ENTRY_GROUPS = [
  { zh: '学', en: 'Learn', items: [
    { k: 'today',   zh: '今日', en: 'Today',   c: '#0e8c7a' },
    { k: 'words',   zh: '词库', en: 'Words',   c: '#3b5bd9' },
    { k: 'reading', zh: '阅读', en: 'Reading', c: '#b3781f' },
  ] },
  { zh: '练', en: 'Practice', items: [
    { k: 'quiz',          zh: '练习', en: 'Quiz',    c: '#1f9f8c' },
    { k: 'review',        zh: '复习', en: 'Review',  c: '#d2792f', badged: true },
    { k: 'exam',          zh: '考试', en: 'Exam',    c: '#6d4bc4' },
    { k: 'pronunciation', zh: '发音', en: 'Speak',   c: '#0e8c7a' },
  ] },
  { zh: '工具 & 探索', en: 'Tools', items: [
    { k: 'scan',      zh: '扫描',   en: 'Scan',      c: '#d4477e' },
    { k: 'chat',      zh: 'AI 导学', en: 'Tutor',   c: '#1f9f8c' },
    { k: 'universe',  zh: '词汇宇宙', en: 'Lexiverse', c: '#3b5bd9' },
    { k: 'lexigraph', zh: '词图',   en: 'LexiGraph', c: '#8b6fc7' },
    { k: 'knowledge', zh: '知识库', en: 'Vault',     c: '#0e8c7a' },
    { k: 'me',        zh: '我的',   en: 'Profile',   c: '#5b6b78' },
  ] },
]

// ── Sub-components ─────────────────────────────────────────────────────────

function HomeHeader() {
  const streak = useLexiStore(s => s.streak)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 22 }}>
      <div>
        <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--teal-ink)', opacity: 0.72 }}>欢迎回来 · Welcome back</p>
        <h1 style={{ margin: '2px 0 0', fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 'clamp(24px,3.2vw,32px)', color: 'var(--ink)' }}>
          下午好，继续你的航行
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
  const today = useLexiStore(s => s.getToday())
  const studiedToday = useLexiStore(s => s.studiedToday)
  const goalToday = useLexiStore(s => s.goalToday)
  const dueCount = useLexiStore(s => s.getDue().length)
  const weakCount = useLexiStore(s => s.getWeak().length)

  const pct = Math.round(studiedToday / goalToday * 100)
  const remaining = goalToday - studiedToday
  const bg = 'linear-gradient(160deg, #0a1722 0%, #0e2230 60%, #123042 100%)'

  return (
    <div style={{ position: 'relative', borderRadius: 'var(--r-card)', overflow: 'hidden', background: bg, color: '#eaf3f6', padding: 'clamp(22px,4vw,34px)', boxShadow: '0 30px 60px -32px rgba(8,20,30,0.7)', border: '1px solid rgba(79,230,206,0.14)' }}>
      <div style={{ position: 'absolute', top: -80, right: -60, width: 260, height: 260, borderRadius: 999, background: 'radial-gradient(circle, rgba(79,230,206,0.22), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', position: 'relative' }}>
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(79,230,206,0.8)' }}>今日学习 · Today</p>
          <h2 style={{ margin: '8px 0 6px', fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 'clamp(24px,4vw,34px)' }}>
            {remaining > 0 ? `还有 ${remaining} 个词待完成` : '今日目标已完成 🎉'}
          </h2>
          <p style={{ margin: 0, fontSize: 14.5, color: 'rgba(234,243,246,0.7)', lineHeight: 1.6 }}>
            今日包 = <b style={{ color: STATE_META.recommended.dark }}>{today.recommended.length} 推荐</b> · <b style={{ color: STATE_META.review.dark }}>{today.review.length} 待复习</b> · <b style={{ color: STATE_META.weak.dark }}>{today.weak.length} 薄弱</b>
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
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: '#eaf3f6' }}>{pct}<span style={{ fontSize: 15 }}>%</span></div>
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

function MasteryStrip({ navigate }: { navigate: (go: string) => void }) {
  const counts = useLexiStore(s => s.counts())
  const pct = useLexiStore(s => s.masteredPct())
  return (
    <div className="card-hover" style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--r-card)', boxShadow: 'var(--card-shadow-sm)', padding: '20px 22px' }}>
      <div onClick={() => navigate('universe')} className="btn-press" role="button" tabIndex={0}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, cursor: 'pointer' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 17, color: 'var(--ink)' }}>词库掌握度</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-sub)' }}>所有板块共享同一套状态 · 学一个亮一个</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--teal-ink)', fontSize: 13, fontWeight: 600 }}>
          {pct}% 已掌握
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </div>
      </div>
      <div onClick={() => navigate('universe')} style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', gap: 2, cursor: 'pointer' }}>
        {STATE_ORDER.filter(s => s !== 'locked').map(s => counts[s] > 0 && (
          <div key={s} style={{ flex: counts[s], background: STATE_META[s].light }} title={STATE_META[s].zh} />
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <StatusLegend counts={counts} onPick={() => navigate('universe')} compact />
      </div>
    </div>
  )
}

function EntriesSection({ navigate }: { navigate: (go: string) => void }) {
  const dueCount = useLexiStore(s => s.getDue().length)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 16px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>全部功能 · All entries</span>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {ENTRY_GROUPS.map(g => (
          <div key={g.en}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginBottom: 11 }}>
              <span style={{ width: 4, height: 14, borderRadius: 2, background: g.items[0].c, opacity: 0.8 }} />
              <span style={{ fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 15.5, color: 'var(--ink)' }}>{g.zh}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>{g.en}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 11 }}>
              {g.items.map(it => (
                <button key={it.k} onClick={() => navigate(it.k)} className="entry-card btn-press"
                  style={{ position: 'relative', flex: '1 1 158px', maxWidth: 220, minWidth: 150, display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left', cursor: 'pointer', background: 'var(--card-2)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: '0 1px 2px rgba(20,30,40,0.04)', padding: '15px 16px', ['--accent' as string]: it.c } as React.CSSProperties}>
                  <span style={{ width: 40, height: 40, borderRadius: 12, background: hexA(it.c, 0.11), color: it.c, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {ICON[it.k]?.({ s: 19 })}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.25 }}>{it.zh}</span>
                    <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginTop: 2 }}>{it.en}</span>
                  </span>
                  {'badged' in it && it.badged && dueCount > 0 && (
                    <span style={{ position: 'absolute', top: 11, right: 11, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, padding: '0 5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 999, background: STATE_META.review.light, color: '#fff' }}>{dueCount}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main HomeScreen ─────────────────────────────────────────────────────────

export function HomeScreen() {
  const router = useRouter()
  const profile = useLexiStore(s => s.profile)

  function navigate(go: string) {
    const href = NAVIGATE_MAP[go]
    if (href) router.push(href)
  }

  return (
    <div>
      <BanyanHero navigate={navigate} animate />
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '8px clamp(16px,4vw,32px) 40px', position: 'relative', zIndex: 2 }}>
        <HomeHeader />
        {profile.skipped && !profile.onboarded && (
          <button onClick={() => navigate('onboarding')} className="btn-press" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer', background: 'var(--card-2)', border: '1px solid rgba(14,140,122,0.3)', borderRadius: 14, boxShadow: 'var(--card-shadow-sm)', padding: '13px 16px', marginBottom: 16 }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ContinueCard navigate={navigate} />
          <MasteryStrip navigate={navigate} />
          <EntriesSection navigate={navigate} />
        </div>
      </div>
    </div>
  )
}
