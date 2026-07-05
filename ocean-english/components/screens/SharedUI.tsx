'use client'
// Shared UI primitives — 1:1 port of prototype/ui.jsx

import React, { useState, useEffect, useRef } from 'react'
import { toast as sonnerToast } from 'sonner'
import { STATE_META, type WordState } from '@/lib/state-meta'
import { hexA } from '@/lib/utils'

// ── StateChip（Demo02：颜色 morph 450ms + 换色 7% 弹跳）─────────
export function StateChip({ state, size = 'sm' }: { state: WordState; size?: 'xs' | 'sm' | 'md' }) {
  const m = STATE_META[state]
  const [pop, setPop] = useState(false)
  const prevState = useRef(state)
  useEffect(() => {
    if (prevState.current !== state) {
      prevState.current = state
      setPop(true)
      const t = setTimeout(() => setPop(false), 420)
      return () => clearTimeout(t)
    }
  }, [state])
  const style: React.CSSProperties =
    size === 'xs' ? { fontSize: 10, padding: '2px 6px' } :
    size === 'sm' ? { fontSize: 11.5, padding: '3px 9px' } :
                   { fontSize: 13, padding: '4px 12px' }
  return (
    <span className={`chip-morph${pop ? ' chip-pop' : ''}`} style={{
      display: 'inline-flex', alignItems: 'center', borderRadius: 999, fontWeight: 600,
      background: hexA(m.light, 0.12), color: m.light,
      border: `1px solid ${hexA(m.light, 0.28)}`,
      fontFamily: 'var(--font-sans)',
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {m.zh}
    </span>
  )
}

// ── ProgressRing（B11：0% 画 2% 最小弧；Demo03：100% 粒子迸发）──
export function ProgressRing({
  pct, size = 64, stroke = 5, color, label,
}: {
  pct: number; size?: number; stroke?: number; color?: string; label?: React.ReactNode
}) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  // 0% 也画 2% 最小弧（仅作用于绘制，不影响数值显示）
  const drawPct = Math.max(Math.min(Math.max(pct, 0), 100), 2)
  const offset = circ * (1 - drawPct / 100)

  const circleRef = useRef<SVGCircleElement>(null)
  const [burst, setBurst] = useState<{ x: number; y: number }[] | null>(null)
  const burstedRef = useRef(false)

  // Demo03：填充 transition 结束（transitionend）后触发 12 粒粒子
  useEffect(() => {
    const el = circleRef.current
    if (!el) return
    const onEnd = () => {
      if (pct >= 100 && !burstedRef.current) {
        burstedRef.current = true
        setBurst(Array.from({ length: 12 }, (_, i) => {
          const ang = (i / 12) * Math.PI * 2 + Math.random() * 0.4
          const dist = 36 + Math.random() * 28
          return { x: Math.cos(ang) * dist, y: Math.sin(ang) * dist }
        }))
        setTimeout(() => setBurst(null), 800)
      }
    }
    el.addEventListener('transitionend', onEnd)
    return () => el.removeEventListener('transitionend', onEnd)
  }, [pct])
  useEffect(() => { if (pct < 100) burstedRef.current = false }, [pct])

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ display: 'block' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          ref={circleRef}
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color ?? 'var(--teal-ink)'}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(.34,1.56,.64,1)' }}
        />
      </svg>
      {burst && burst.map((p, i) => (
        <span key={i} className="ring-burst-p" style={{
          left: '50%', top: '50%', marginLeft: -2.5, marginTop: -2.5,
          background: i % 2 ? 'var(--gold-ink)' : 'var(--teal-ink)',
          ['--burst-t' as string]: `translate(${p.x}px, ${p.y}px)`,
        } as React.CSSProperties} />
      ))}
      {label && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {label}
        </div>
      )}
    </div>
  )
}

// ── SoundBtn ───────────────────────────────────────────────────
export function SoundBtn({ word, size = 28 }: { word: string; size?: number }) {
  const [active, setActive] = useState(false)
  function play() {
    if (typeof window === 'undefined') return
    try {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(word)
      u.lang = 'en-US'
      u.onend = () => setActive(false)
      window.speechSynthesis.speak(u)
      setActive(true)
    } catch {}
  }
  return (
    <button
      onClick={play}
      title={`Read "${word}"`}
      className="hit-44"
      style={{
        width: size, height: size, borderRadius: '50%', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'var(--teal-bg)' : 'var(--card-2)',
        color: active ? 'var(--teal-ink)' : 'var(--ink-sub)',
        transition: 'all 0.15s', flexShrink: 0,
      }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    </button>
  )
}

// ── 状态流转 toast（B11：迁 sonner，toast.custom 渲染原样式，自动队列）──
export function showStateToast(word: string, from: WordState, to: WordState) {
  sonnerToast.custom(() => (
    <div style={{
      background: 'var(--card)', borderRadius: 999,
      padding: '8px 18px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
      border: '1px solid var(--line-strong)',
      display: 'inline-flex', alignItems: 'center', gap: 8,
      whiteSpace: 'nowrap',
      fontFamily: 'var(--font-sans)',
    }}>
      <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 14 }}>{word}</span>
      <StateChip state={from} size="xs" />
      <span style={{ color: 'var(--ink-muted)', fontSize: 12 }}>→</span>
      <StateChip state={to} size="xs" />
    </div>
  ), { duration: 1800 })
}

// ── FlowBar ────────────────────────────────────────────────────
const FLOW_STEPS = [
  { key: 'learn',  zh: '学习' },
  { key: 'quiz',   zh: '练习' },
  { key: 'review', zh: '复习' },
]

export function FlowBar({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 360, margin: '0 auto', padding: '0 4px' }}>
      {FLOW_STEPS.map((s, i) => (
        <React.Fragment key={s.key}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i <= step ? 'var(--teal)' : 'var(--line)',
              color: i <= step ? '#fff' : 'var(--ink-muted)',
              fontSize: 13, fontWeight: 700, transition: 'all 0.3s',
              flexShrink: 0,
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: 10, color: i <= step ? 'var(--teal-ink)' : 'var(--ink-muted)', transition: 'color 0.3s' }}>
              {s.zh}
            </span>
          </div>
          {i < FLOW_STEPS.length - 1 && (
            <div style={{
              flex: 1, height: 2, margin: '0 6px', marginBottom: 14,
              background: i < step ? 'var(--teal)' : 'var(--line)',
              transition: 'background 0.3s',
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// ── EmptyState（B10-3：扩展 desc + actions[]，空状态必须给下一步动作）──
export interface EmptyStateAction {
  label: string
  onClick: () => void
  primary?: boolean
}

export function EmptyState({ icon = '📭', text, desc, actions }: {
  icon?: string; text: string; desc?: string; actions?: EmptyStateAction[]
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 10, padding: '56px 24px',
      color: 'var(--ink-muted)', textAlign: 'center',
    }}>
      <span style={{ fontSize: 36 }}>{icon}</span>
      <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.5, fontFamily: 'var(--font-serif-zh)' }}>{text}</span>
      {desc && <span style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 320 }}>{desc}</span>}
      {actions && actions.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {actions.map(a => (
            <button key={a.label} onClick={a.onClick} className="btn-press"
              style={{
                padding: '10px 22px', borderRadius: 999, cursor: 'pointer',
                border: a.primary === false ? '1px solid var(--line)' : '1.5px solid var(--teal-ink)',
                background: a.primary === false ? 'var(--card)' : 'var(--teal-bg)',
                color: a.primary === false ? 'var(--ink-sub)' : 'var(--teal-ink)',
                fontSize: 13.5, fontWeight: 700, fontFamily: 'var(--font-sans)',
              }}>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Eyebrow ────────────────────────────────────────────────────
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.10em',
      textTransform: 'uppercase', color: 'var(--teal-ink)',
      fontFamily: 'var(--font-mono)',
    }}>
      {children}
    </p>
  )
}

// ── PageTitle ──────────────────────────────────────────────────
export function PageTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-serif-zh)', letterSpacing: '0.01em' }}>
        {children}
      </h2>
      {sub && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-sub)' }}>{sub}</p>}
    </div>
  )
}

// ── PrimaryBtn ─────────────────────────────────────────────────
export function PrimaryBtn({ children, onClick, disabled, style: sx }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; style?: React.CSSProperties
}) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      className="btn-press"
      style={{
        padding: '13px 32px', borderRadius: 999,
        background: disabled ? 'var(--line)' : 'linear-gradient(180deg,#6ff0db,#34d8c0)',
        color: disabled ? 'var(--ink-muted)' : '#04241f',
        fontWeight: 700, fontSize: 15, border: 'none', cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'var(--font-sans)',
        boxShadow: disabled ? 'none' : '0 8px 20px -12px rgba(79,230,206,0.7)',
        transition: 'all 0.15s',
        ...sx,
      }}
    >
      {children}
    </button>
  )
}

// ── GhostBtn ───────────────────────────────────────────────────
export function GhostBtn({ children, onClick, style: sx }: {
  children: React.ReactNode; onClick?: () => void; style?: React.CSSProperties
}) {
  return (
    <button
      onClick={onClick}
      className="btn-press"
      style={{
        padding: '12px 28px', borderRadius: 999,
        background: 'transparent',
        color: 'var(--ink-sub)',
        fontWeight: 500, fontSize: 14.5, border: '1px solid var(--line-strong)',
        cursor: 'pointer', fontFamily: 'var(--font-sans)',
        transition: 'all 0.15s',
        ...sx,
      }}
    >
      {children}
    </button>
  )
}

// ── BackBtn ────────────────────────────────────────────────────
export function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6, border: 'none',
      background: 'none', cursor: 'pointer', color: 'var(--ink-sub)',
      fontSize: 14, padding: '6px 0', fontFamily: 'var(--font-sans)',
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
      返回
    </button>
  )
}

// ── useToast ───────────────────────────────────────────────────
// Returns [toastProps, showToast] — showToast auto-dismisses after 1.8s
