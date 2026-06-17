'use client'
/* ════════════════════════════════════════════════════════════════════════
   ReportScreen — D2 学习报告（界面优化17 1:1 移植）
   消费 lib/analytics/report.ts buildReport()（从 store 同步算，无需请求）。
   六块：到期条 / 词汇量 hero / 状态环 + 跨维雷达 / 记忆矩阵 / 强度柱 + 热力图，
   外加「个人遗忘曲线」（可选模块 ForgettingCurve，可独立删除）。
   样式 report.css（.rp-* + .rp-screen 作用域 shell 通用类）。导航走 AppShell。
   ════════════════════════════════════════════════════════════════════════ */
import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLexiStore } from '@/store/lexiStore'
import { STATE_META, type WordState } from '@/lib/state-meta'
import { buildReport, type LearnReport } from '@/lib/analytics/report'
import { ForgettingCurve } from './ForgettingCurve'
import './report.css'

const fmt = (n: number) => n.toLocaleString('en-US')
const COLOR = (k: WordState) => STATE_META[k].light
const ZH = (k: WordState) => STATE_META[k].zh
const DIMZH: Record<string, string> = { recognize: '认', spell: '拼', listen: '听' }

const SparkIcon = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></svg>
const ClockIcon = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>

function Donut({ R, filter, onFilter }: { R: LearnReport; filter: WordState | null; onFilter: (k: WordState) => void }) {
  const active: WordState[] = ['mastered', 'review', 'learning', 'weak', 'recommended']
  const totalA = active.reduce((s, k) => s + R.byState[k], 0) || 1
  const r = 52, C = 2 * Math.PI * r
  let acc = 0
  const segs = active.map(k => {
    const frac = R.byState[k] / totalA
    const seg = <circle key={k} cx="64" cy="64" r={r} fill="none" stroke={COLOR(k)} strokeWidth="16"
      strokeDasharray={`${(frac * C).toFixed(2)} ${(C - frac * C).toFixed(2)}`} strokeDashoffset={(-acc * C).toFixed(2)} transform="rotate(-90 64 64)" />
    acc += frac
    return seg
  })
  const order: WordState[] = ['mastered', 'learning', 'review', 'weak', 'recommended', 'unknown', 'locked']
  return (
    <div className="rp-donut-row">
      <svg width="128" height="128" style={{ flexShrink: 0 }}>
        {segs}
        <text x="64" y="60" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="24" fontWeight="700" fill="var(--ink)">{fmt(R.totals.active)}</text>
        <text x="64" y="78" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="11" fill="var(--ink-muted)">在学词</text>
      </svg>
      <div className="rp-legend">
        {order.filter(k => R.byState[k] > 0).map(k => {
          const muted = k === 'unknown' || k === 'locked'
          return (
            <div key={k} className={`rp-leg ${muted ? 'muted' : 'click'} ${filter && filter !== k ? 'dim' : ''}`} onClick={() => { if (!muted) onFilter(k) }}>
              <i style={{ background: COLOR(k) }} /><span className="zh">{ZH(k)}</span><span className="cnt">{fmt(R.byState[k])}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Radar({ R }: { R: LearnReport }) {
  const cx = 92, cy = 92, R0 = 66
  const ang = (i: number) => -Math.PI / 2 + i * 2 * Math.PI / 3
  const pt = (i: number, frac: number) => [cx + Math.cos(ang(i)) * R0 * frac, cy + Math.sin(ang(i)) * R0 * frac]
  const poly = (fracs: number[]) => fracs.map((f, i) => pt(i, f).map(n => n.toFixed(1)).join(',')).join(' ')
  const rings = [0.33, 0.66, 1].map((f, idx) => <polygon key={idx} points={poly([f, f, f])} fill="none" stroke="var(--line)" strokeWidth="1" />)
  const axes = [0, 1, 2].map(i => { const [px, py] = pt(i, 1); return <line key={i} x1={cx} y1={cy} x2={px.toFixed(1)} y2={py.toFixed(1)} stroke="var(--line)" strokeWidth="1" /> })
  const ratePoly = poly(R.dims.map(d => d.rate / 100))
  const goldPoly = poly(R.dims.map(d => (d.total ? d.gold / d.total : 0)))
  return (
    <div className="rp-radar-row">
      <svg width="184" height="200" viewBox="0 0 184 200">
        {rings}{axes}
        <polygon points={ratePoly} fill="rgba(14,140,122,0.18)" stroke="var(--teal-ink)" strokeWidth="2" />
        <polygon points={goldPoly} fill="none" stroke="var(--gold-ink)" strokeWidth="1.6" strokeDasharray="3 3" />
        {R.dims.map((d, i) => { const [px, py] = pt(i, 1.2); return <text key={i} x={px.toFixed(1)} y={(py + 4).toFixed(1)} textAnchor="middle" fontFamily="var(--font-serif-zh)" fontSize="13" fontWeight="700" fill="var(--ink)">{DIMZH[d.dim]}</text> })}
      </svg>
      <div className="rp-radar-legend">
        {R.dims.map(d => <div className="rp-rl" key={d.dim}><span className="nm">{DIMZH[d.dim]}</span><span className="pct">{d.rate}%</span><span className="gold">镀金 {d.gold}</span></div>)}
        <div className="rp-rl" style={{ marginTop: 4 }}><span style={{ fontSize: 11, color: 'var(--gold-ink)', fontFamily: 'var(--font-mono)' }}>- - 镀金占比</span></div>
      </div>
    </div>
  )
}

function Matrix({ R, filter, onFilter }: { R: LearnReport; filter: WordState | null; onFilter: (k: WordState) => void }) {
  const router = useRouter()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<{ text: string; left: number; top: number } | null>(null)
  const W = 860, H = 300, pl = 44, pr = 16, pt = 14, pb = 28
  const iw = W - pl - pr, ih = H - pt - pb
  const maxI = 130, minE = 1.3, maxE = 3.0
  const x = (v: number) => pl + Math.min(v, maxI) / maxI * iw
  const y = (v: number) => pt + (1 - (v - minE) / (maxE - minE)) * ih
  const gridX = [0, 7, 16, 35, 65, 100, 130]
  const gridY = [1.5, 2.0, 2.5, 3.0]
  const chips: WordState[] = ['mastered', 'review', 'learning', 'weak']
  const tipParts = tip?.text.split(' · ') ?? []
  return (
    <div className="rp-matrix-wrap" ref={wrapRef}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {gridX.map(g => <g key={`x${g}`}><line x1={x(g)} y1={pt} x2={x(g)} y2={pt + ih} stroke="var(--line)" strokeWidth="1" /><text x={x(g)} y={H - 8} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill="var(--ink-muted)">{g}</text></g>)}
        {gridY.map(g => <g key={`y${g}`}><line x1={pl} y1={y(g)} x2={pl + iw} y2={y(g)} stroke="var(--line)" strokeWidth="1" /><text x={pl - 6} y={y(g) + 3} textAnchor="end" fontFamily="var(--font-mono)" fontSize="9" fill="var(--ink-muted)">{g.toFixed(1)}</text></g>)}
        {R.matrix.map((m, i) => {
          const overdue = m.dueInDays < 0
          const dim = filter && m.state !== filter
          return (
            <circle key={i} cx={x(m.interval).toFixed(1)} cy={y(m.ease).toFixed(1)} r={overdue ? 6 : 5}
              fill={COLOR(m.state)} fillOpacity={dim ? 0.12 : (overdue ? 0.95 : 0.8)}
              stroke={overdue ? 'var(--rose-ink)' : undefined} strokeWidth={overdue ? 2 : undefined}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => {
                const wr = wrapRef.current?.getBoundingClientRect()
                const dr = (e.target as SVGCircleElement).getBoundingClientRect()
                if (wr) setTip({ text: `${m.word} · 间隔 ${m.interval}天 · 稳定 ${m.ease}${overdue ? ' · 已过期' : ''}`, left: dr.left - wr.left + dr.width / 2, top: dr.top - wr.top })
              }}
              onMouseLeave={() => setTip(null)}
              onClick={() => router.push(`/dictionary?word=${m.word}`)} />
          )
        })}
      </svg>
      <div className={`rp-tip${tip ? ' show' : ''}`} style={tip ? { left: tip.left, top: tip.top } : undefined}>
        {tip && <><b>{tipParts[0]}</b>{tipParts.length > 1 ? ` · ${tipParts.slice(1).join(' · ')}` : ''}</>}
      </div>
      <div className="rp-axis-x">间隔天数（interval）→ 越右记得越久</div>
      <div className="rp-chips">
        {chips.map(k => <span key={k} className={`rp-chip click ${filter && filter !== k ? 'dim' : ''}`} onClick={() => onFilter(k)}><i style={{ background: COLOR(k) }} />{ZH(k)}</span>)}
        <span className="rp-chip"><span className="ring" />已过期</span>
        <span className="rp-filterhint">· 点状态高亮 / 点圆点看词</span>
      </div>
    </div>
  )
}

function Bars({ R }: { R: LearnReport }) {
  const max = Math.max(...R.intervalBuckets.map(b => b.healthy + b.weak), 1)
  return (
    <>
      <div className="rp-bars">
        {R.intervalBuckets.map(b => {
          const tot = b.healthy + b.weak
          const h = tot / max * 100, wh = tot ? b.weak / tot * 100 : 0
          return (
            <div className="rp-bar-col" key={b.interval}>
              <div className="rp-bar" style={{ height: `${h}%` }}>
                <div className="weak" style={{ height: `${wh}%` }} title={`薄弱 ${b.weak}`} />
                <div className="healthy" style={{ flex: 1 }} title={`健康 ${b.healthy}`} />
              </div>
              <div className="rp-bar-lab">{b.interval}天<small>{tot} 词</small></div>
            </div>
          )
        })}
      </div>
      <div className="rp-chips" style={{ marginTop: 14 }}>
        <span className="rp-chip"><i style={{ background: 'var(--teal-deep)' }} />健康（记得牢）</span>
        <span className="rp-chip"><i style={{ background: 'var(--rose-ink)' }} />薄弱（在遗忘）</span>
      </div>
    </>
  )
}

function Heat({ R }: { R: LearnReport }) {
  const [weeks, setWeeks] = useState(16)
  const keys = Object.keys(R.heatmap).sort().slice(-weeks * 7)
  const max = Math.max(...keys.map(k => R.heatmap[k]), 1)
  const scale = ['var(--paper-2)', 'rgba(14,140,122,0.25)', 'rgba(14,140,122,0.45)', 'rgba(14,140,122,0.68)', 'var(--teal-ink)']
  const bucket = (v: number) => v === 0 ? 0 : Math.min(4, 1 + Math.floor(v / max * 3.99))
  const cols: string[][] = []
  for (let i = 0; i < keys.length; i += 7) cols.push(keys.slice(i, i + 7))
  const total = keys.reduce((s, k) => s + R.heatmap[k], 0)
  const activeDays = keys.filter(k => R.heatmap[k] > 0).length
  return (
    <>
      <div className="sec-head" style={{ marginBottom: 10 }}>
        <span className="sec-title">活动热力</span>
        <span className="rp-seg">
          <button className={weeks === 8 ? 'on' : ''} onClick={() => setWeeks(8)}>近8周</button>
          <button className={weeks === 16 ? 'on' : ''} onClick={() => setWeeks(16)}>近16周</button>
        </span>
      </div>
      <div className="rp-heat">
        {cols.map((wk, ci) => <div className="rp-heat-col" key={ci}>{wk.map(k => <div key={k} className="rp-heat-cell" style={{ background: scale[bucket(R.heatmap[k])] }} title={`${k} · ${R.heatmap[k]} 次`} />)}</div>)}
      </div>
      <div className="rp-heat-foot">
        <span>近 {weeks} 周 · 活跃 <b style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{activeDays}</b> 天 · 共 <b style={{ color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{total}</b> 次学习</span>
        <span className="rp-heat-scale">少 {scale.map((c, i) => <i key={i} style={{ background: c }} />)} 多</span>
      </div>
    </>
  )
}

export function ReportScreen() {
  const router = useRouter()
  const words = useLexiStore(s => s.words)
  const history = useLexiStore(s => s.history)
  const level = useLexiStore(s => s.profile.level ?? 5)
  const data = useMemo(() => buildReport({ words, history, level }), [words, history, level])
  const [filter, setFilter] = useState<WordState | null>(null)
  const onFilter = (k: WordState) => setFilter(f => (f === k ? null : k))

  if (data.totals.active === 0) {
    return (
      <div className="rp-screen theme-light">
        <div className="wrap">
          <div className="state empty" style={{ marginTop: 30 }}>
            <div className="state-icon">{SparkIcon}</div>
            <div className="state-title">报告还在等你的第一批词</div>
            <div className="state-desc">先学几个词、做一组练习，记忆矩阵、热力图就会一点点长出来。</div>
            <div className="state-acts">
              <button className="btn btn-ink" onClick={() => router.push('/today')}>去今日学习</button>
              <button className="btn btn-ghost" onClick={() => router.push('/lexiverse')}>浏览词库</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const R = data
  return (
    <div className="rp-screen theme-light">
      <div className="wrap">
        <p className="eyebrow">学习报告 · Learn Report</p>
        <h1 className="h1">你的记忆全景</h1>
        <p className="sub">把记忆与学习数据可视化 —— 看清你认识多少词、记得多牢、哪些正在遗忘。</p>
        <div style={{ height: 18 }} />

        {R.totals.due > 0 && (
          <div className="rp-banner">
            <span className="ic">{ClockIcon}</span>
            <span className="tx">有 <b>{fmt(R.totals.due)}</b> 词已到期、正在遗忘 —— 现在复习，记得最牢。</span>
            <button className="go" onClick={() => router.push('/memory')}>去复习 →</button>
          </div>
        )}

        <div className="rp-hero fade-up">
          <div className="rp-hero-main">
            <div className="rp-hero-kicker">估算词汇量 · Vocabulary</div>
            <div className="rp-hero-num"><span className="big">{fmt(R.vocabEstimate)}</span><span className="unit">约 词</span></div>
            <div className="rp-hero-sub">当前能力档位 <b>{R.levelName}</b></div>
            <div className="rp-trend">较上周 — 周对比数据待积累</div>
          </div>
          <div className="rp-hero-totals">
            <div className="rp-tot"><div className="fig" style={{ color: 'var(--st-mastered)' }}>{fmt(R.totals.mastered)}</div><div className="lab">已掌握</div></div>
            <div className="rp-tot"><div className="fig" style={{ color: 'var(--st-learning)' }}>{fmt(R.totals.learning)}</div><div className="lab">学习中</div></div>
            <div className="rp-tot"><div className="fig" style={{ color: 'var(--st-review)' }}>{fmt(R.totals.due)}</div><div className="lab">待复习</div></div>
          </div>
        </div>

        <div className="rp-grid2">
          <div className="rp-card"><div className="sec-head"><span className="sec-title">状态分布</span><span className="sec-hint">在学词的记忆构成</span></div><Donut R={R} filter={filter} onFilter={onFilter} /></div>
          <div className="rp-card"><div className="sec-head"><span className="sec-title">跨维掌握</span><span className="sec-hint">认 / 拼 / 听</span></div><Radar R={R} /></div>
        </div>

        <div className="rp-card"><div className="sec-head"><span className="sec-title">记忆矩阵</span><span className="sec-hint">每个点是一个词 · 越右记得越久，越上越稳</span></div><Matrix R={R} filter={filter} onFilter={onFilter} /></div>

        {/* ⬇⬇ 可选模块：个人遗忘曲线（删除本行 + ForgettingCurve.tsx 即可回退） ⬇⬇ */}
        <ForgettingCurve report={R} />
        {/* ⬆⬆ 可选模块结束 ⬆⬆ */}

        <div className="rp-grid2">
          <div className="rp-card"><div className="sec-head"><span className="sec-title">记忆强度分布</span><span className="sec-hint">各间隔档 健康 vs 薄弱</span></div><Bars R={R} /></div>
          <div className="rp-card"><Heat R={R} /></div>
        </div>
      </div>
    </div>
  )
}
