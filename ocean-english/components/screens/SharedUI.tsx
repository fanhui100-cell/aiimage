'use client'
// Shared UI primitives — 1:1 port of prototype/ui.jsx

import React, { useState, useEffect } from 'react'
import { STATE_META, type WordState } from '@/lib/state-meta'
import { hexA } from '@/lib/utils'

// ── StateChip ──────────────────────────────────────────────────
export function StateChip({ state, size = 'sm' }: { state: WordState; size?: 'xs' | 'sm' | 'md' }) {
  const m = STATE_META[state]
  const style: React.CSSProperties =
    size === 'xs' ? { fontSize: 10, padding: '2px 6px' } :
    size === 'sm' ? { fontSize: 11.5, padding: '3px 9px' } :
                   { fontSize: 13, padding: '4px 12px' }
  return (
    <span style={{
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

// ── ProgressRing ───────────────────────────────────────────────
export function ProgressRing({
  pct, size = 64, stroke = 5, color, label,
}: {
  pct: number; size?: number; stroke?: number; color?: string; label?: React.ReactNode
}) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(Math.max(pct, 0), 100) / 100)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ display: 'block' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color ?? 'var(--teal-ink)'}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
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

// ── StateToast ─────────────────────────────────────────────────
export function StateToast({ word, from, to, visible }: {
  word: string; from: WordState; to: WordState; visible: boolean
}) {
  if (!visible) return null
  return (
    <div style={{
      position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--card)', borderRadius: 999,
      padding: '8px 18px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
      border: '1px solid var(--line-strong)',
      display: 'flex', alignItems: 'center', gap: 8,
      zIndex: 300, whiteSpace: 'nowrap',
      animation: 'toastIn 0.22s ease',
      fontFamily: 'var(--font-sans)',
    }}>
      <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 14 }}>{word}</span>
      <StateChip state={from} size="xs" />
      <span style={{ color: 'var(--ink-muted)', fontSize: 12 }}>→</span>
      <StateChip state={to} size="xs" />
    </div>
  )
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

// ── EmptyState ─────────────────────────────────────────────────
export function EmptyState({ icon = '📭', text }: { icon?: string; text: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 10, padding: '56px 24px',
      color: 'var(--ink-muted)', textAlign: 'center',
    }}>
      <span style={{ fontSize: 36 }}>{icon}</span>
      <span style={{ fontSize: 14, lineHeight: 1.5 }}>{text}</span>
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
export function useToast() {
  const [toast, setToast] = useState<{ word: string; from: WordState; to: WordState; visible: boolean } | null>(null)
  function showToast(word: string, from: WordState, to: WordState) {
    setToast({ word, from, to, visible: true })
    setTimeout(() => setToast(null), 1800)
  }
  return [toast, showToast] as const
}
