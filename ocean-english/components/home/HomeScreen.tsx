'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BanyanHero, NAVIGATE_MAP } from './BanyanHero'
import { useLexiStore } from '@/store/lexiStore'
import { useScanHistoryStore } from '@/store/useScanHistoryStore'
import { STATE_META, STATE_ORDER, type WordState } from '@/lib/state-meta'
import { TOOL_NAV, type ToolNavKey } from '@/lib/product-flow/nav'
import { NumberRoll } from '@/components/ui/NumberRoll'
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
  counts: Record<string, number>; onPick?: (state: WordState) => void; compact?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {STATE_ORDER.filter(s => s !== 'locked' || counts.locked).map(s => {
        const m = STATE_META[s]
        const n = counts[s] ?? 0
        return (
          <button key={s} onClick={() => onPick?.(s)}
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

// ── Icon map（B2：仅保留工具条所需 6 个，按 TOOL_NAV key）───────────────────

const TOOL_ICON: Record<ToolNavKey, (p?: { s?: number }) => React.ReactNode> = {
  reading: p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7l10-4 10 4-10 4z"/><path d="M6 9.5V15c0 1.5 2.7 3 6 3s6-1.5 6-3V9.5"/></svg>,
  scan:    p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="3" y1="12" x2="21" y2="12"/></svg>,
  speak:   p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/></svg>,
  tutor:   p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>,
  exam:    p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M4 6h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><path d="M8 12h8M8 16h5"/></svg>,
  graph:   p => <svg width={p?.s??18} height={p?.s??18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="7" r="2.4"/><circle cx="12" cy="17.5" r="2.4"/><path d="M8 7 16 16M16 8.6 13 15"/></svg>,
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 22 }}>
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
  const today = useLexiStore(s => s.getToday())
  const progress = useLexiStore(s => s.getTodayProgress())
  const dueCount = useLexiStore(s => s.getDue().length)
  const weakCount = useLexiStore(s => s.getWeak().length)

  const studiedToday = progress.n
  const goalToday = progress.goal
  const pct = progress.pct
  const remaining = Math.max(0, goalToday - studiedToday)
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

function MasteryStrip({ navigate }: { navigate: (go: string) => void }) {
  const router = useRouter()
  const counts = useLexiStore(s => s.counts())
  const pct = useLexiStore(s => s.masteredPct())
  // B2-3：看列表去词库（按状态筛选），看星空走「查看宇宙」小链接
  const toDictionary = (s: WordState) => router.push(`/dictionary?state=${s}`)
  return (
    <div className="card-hover" style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--r-card)', boxShadow: 'var(--card-shadow-sm)', padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 17, color: 'var(--ink)' }}>词库掌握度</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-sub)' }}>所有板块共享同一套状态 · 学一个亮一个</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'var(--teal-ink)', fontSize: 13, fontWeight: 600 }}><NumberRoll value={pct} />% 已掌握</span>
          <button onClick={() => navigate('universe')} className="btn-press"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, color: 'var(--ink-sub)', fontFamily: 'var(--font-sans)', padding: 0 }}>
            查看宇宙
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', gap: 2 }}>
        {STATE_ORDER.filter(s => s !== 'locked').map(s => counts[s] > 0 && (
          <div key={s} onClick={() => toDictionary(s)} role="button" tabIndex={0}
            style={{ flex: counts[s], minWidth: 6, background: STATE_META[s].light, cursor: 'pointer' }}
            title={`${STATE_META[s].zh} · 查看列表`} />
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <StatusLegend counts={counts} onPick={toDictionary} compact />
      </div>
    </div>
  )
}

/** B2-1：13 入口宫格 → TOOL_NAV 单行工具条（横滑） */
function ToolsRow() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 12px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>工具 · Tools</span>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {TOOL_NAV.map((t, i) => (
          <Link key={t.key} href={t.href} className="btn-press stagger-item"
            style={{ animationDelay: `${i * 30}ms`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textDecoration: 'none', flexShrink: 0, minWidth: 64, padding: '10px 8px', borderRadius: 14, background: 'var(--card-2)', border: '1px solid var(--line)' }}>
            <span style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--teal-bg)', color: 'var(--teal-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {TOOL_ICON[t.key]?.({ s: 19 })}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-sub)', whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)' }}>{t.zh}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

/** B2-2：「继续上次」智能卡 — 优先级：未完成今日流程 → 最近扫描；无可继续项不渲染
 *  （偏离 spec：阅读页为建设中占位页、无进度数据，阅读级省略） */
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
      style={{ width: '100%', height: 64, display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14, boxShadow: 'var(--card-shadow-sm)', padding: '0 16px' }}>
      <span style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--teal-bg)', color: 'var(--teal-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>继续上次 · Resume</span>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      </span>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--teal-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
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
        {needsRecalibration && (
          <button onClick={() => navigate('onboarding')} className="btn-press" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer', background: 'var(--card-2)', border: '1px solid rgba(179,120,31,0.3)', borderRadius: 14, boxShadow: 'var(--card-shadow-sm)', padding: '13px 16px', marginBottom: 16 }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ContinueCard navigate={navigate} />
          <MasteryStrip navigate={navigate} />
          <ResumeCard />
          <ToolsRow />
        </div>
      </div>
    </div>
  )
}
