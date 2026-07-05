'use client'
/* ════════════════════════════════════════════════════════════════════════
   ForgettingCurve — 个人遗忘曲线（可选模块）
   ⚠️ 随时可回退删除：① 删除本文件；② 删 ReportScreen.tsx 中的 import 与
   `<ForgettingCurve .../>` 一处渲染。删除后报告页其余部分不受任何影响。
   依据用户平均记忆稳定性（matrix interval 均值）画艾宾浩斯衰减曲线 + 复习再拉高，
   说明 SRS/FSRS 的排程依据。自包含（仅 inline 样式 + 复用 .rp-card）。
   ════════════════════════════════════════════════════════════════════════ */
import type { LearnReport } from '@/lib/analytics/report'

const DECAY = -0.5
const FACTOR = Math.pow(0.9, 1 / DECAY) - 1   // R=0.9 时 t=S

export function ForgettingCurve({ report }: { report: LearnReport }) {
  const ivs = report.matrix.map(m => m.interval).filter(n => n > 0)
  const S = ivs.length ? Math.max(1, Math.round(ivs.reduce((a, b) => a + b, 0) / ivs.length)) : 7

  const W = 560, H = 200, pl = 42, pr = 16, pt = 16, pb = 28
  const iw = W - pl - pr, ih = H - pt - pb
  const tMax = Math.max(4, Math.round(S * 2.2))
  const x = (t: number) => pl + (t / tMax) * iw
  const y = (r: number) => pt + (1 - r) * ih
  const Rf = (t: number) => Math.pow(1 + FACTOR * t / S, DECAY)
  const decay = Array.from({ length: 61 }, (_, i) => { const t = (i / 60) * tMax; return `${x(t).toFixed(1)},${y(Rf(t)).toFixed(1)}` }).join(' ')
  // 复习后稳定性约翻倍 → 曲线更平
  const S2 = S * 2.3
  const Rf2 = (t: number) => Math.pow(1 + FACTOR * (t - S) / S2, DECAY)
  const relift = Array.from({ length: 41 }, (_, i) => { const t = S + (i / 40) * (tMax - S); return `${x(t).toFixed(1)},${y(Rf2(t)).toFixed(1)}` }).join(' ')

  // 每词真实风险散点：以「距上次复习经过天数 = interval − dueInDays」为 t、各词自己的 interval 为稳定性，
  // 算当前保持率 R 并打点（越靠右下、越红 = 越接近遗忘）。仅用现有 matrix 字段，无 store/接口改动。
  const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
  const pts = report.matrix
    .filter(m => m.interval > 0)
    .map(m => {
      const elapsed = Math.max(0, m.interval - m.dueInDays)
      const R = clamp01(Math.pow(1 + FACTOR * elapsed / m.interval, DECAY))
      return { word: m.word, cx: x(Math.min(elapsed, tMax)), cy: y(R), R, overdue: m.dueInDays < 0, weak: m.state === 'weak' }
    })
  const dotColor = (p: { R: number; weak: boolean }) => (p.weak || p.R < 0.6) ? 'var(--rose-ink)' : p.R < 0.85 ? 'var(--gold-ink)' : 'var(--teal-ink)'
  const atRisk = pts.filter(p => p.R < 0.85).length

  return (
    <div className="rp-card">
      <div className="sec-head">
        <span className="sec-title">个人遗忘曲线 · 每词风险</span>
        <span className="sec-hint">曲线=原理 · 圆点=你的 {pts.length} 个词当前位置</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {[0, 0.5, 0.9, 1].map(r => (
          <g key={r}>
            <line x1={pl} y1={y(r)} x2={pl + iw} y2={y(r)} stroke="var(--line)" strokeWidth="1" strokeDasharray={r === 0.9 ? '4 4' : undefined} />
            <text x={pl - 6} y={y(r) + 3} textAnchor="end" fontFamily="var(--font-mono)" fontSize="9" fill="var(--ink-muted)">{Math.round(r * 100)}</text>
          </g>
        ))}
        <line x1={x(S)} y1={pt} x2={x(S)} y2={pt + ih} stroke="var(--teal-ink)" strokeWidth="1" strokeDasharray="3 3" />
        <text x={x(S)} y={H - 6} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill="var(--teal-ink)">复习 · {S}天</text>
        <polyline points={decay} fill="none" stroke="var(--rose-ink)" strokeWidth="2" strokeOpacity="0.45" />
        <polyline points={relift} fill="none" stroke="var(--teal-ink)" strokeWidth="2" strokeOpacity="0.45" />
        {/* 每词真实风险散点（叠在原理曲线上）*/}
        {pts.map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r="2.6" fill={dotColor(p)} fillOpacity="0.72">
            <title>{p.word} · 保持率约 {Math.round(p.R * 100)}%{p.overdue ? ' · 已过期待复习' : ''}</title>
          </circle>
        ))}
        <text x={pl + 4} y={pt + 12} fontFamily="var(--font-sans)" fontSize="10" fill="var(--rose-ink)">不复习 → 持续遗忘</text>
      </svg>
      <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 8, lineHeight: 1.6 }}>
        曲线是遗忘原理；<b>每个圆点是你的一个词此刻所处位置</b> —— 越靠右下、越红，越接近遗忘、越该复习{atRisk > 0 ? <>（约 <b style={{ color: 'var(--rose-ink)' }}>{atRisk}</b> 个词已进入高风险区）</> : ''}。<b style={{ color: 'var(--teal-ink)' }}>在快忘的那一刻复习</b>（约 {S} 天），稳定性翻倍、曲线更平 —— 这正是 SRS/FSRS 的排程依据。
      </div>
    </div>
  )
}
