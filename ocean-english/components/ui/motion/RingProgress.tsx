'use client'

/**
 * §B10 RingProgress · 环形进度
 * ----------------------------------------------------------------------------
 * 落点：GoalsScreen / TodayScreen（今日目标）/ 掌握度——全在米白面。
 * 颜色用 --teal-ink（米白）/ 传 dark 用 --teal。数字建议套现成 <CountUp/>。
 * 入场填充靠 stroke-dashoffset 过渡（见 §B10 CSS）。
 */
import { useEffect, useState } from 'react'

interface RingProgressProps {
  /** 0–100 */
  value: number
  size?: number
  stroke?: number
  dark?: boolean
  /** 环下方小标签 */
  label?: string
  /** 自定义中心内容（如 <CountUp/>）；不传则显示 {value}% */
  children?: React.ReactNode
}

export function RingProgress({ value, size = 132, stroke = 11, dark = false, label, children }: RingProgressProps) {
  const r = (size - stroke) / 2
  const C = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, value))
  const offset = C * (1 - clamped / 100)

  // 中心数字（未传 children 时内部滚动）
  const [shown, setShown] = useState(clamped)
  useEffect(() => {
    let raf = 0, start = 0
    const from = shown, to = clamped, dur = 650
    const tick = (t: number) => {
      if (!start) start = t
      const p = Math.min((t - start) / dur, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setShown(Math.round(from + (to - from) * e))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clamped])

  const track = dark ? 'rgba(255,255,255,0.08)' : 'var(--line-strong)'
  const accent = dark ? 'var(--teal)' : 'var(--teal-ink)'
  const ink = dark ? 'var(--text-primary)' : 'var(--ink)'
  const muted = dark ? 'var(--text-muted)' : 'var(--ink-muted)'

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle className="ring-fg" cx={size / 2} cy={size / 2} r={r} fill="none" stroke={accent}
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset}
          style={{ filter: dark ? 'drop-shadow(0 0 6px var(--teal-glow))' : 'none' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <b style={{ fontFamily: 'var(--font-serif)', fontSize: size * 0.27, color: ink, lineHeight: 1 }}>
          {children ?? `${shown}%`}
        </b>
        {label && <s style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: muted, textDecoration: 'none', letterSpacing: '.12em', marginTop: 5 }}>{label}</s>}
      </div>
    </div>
  )
}
