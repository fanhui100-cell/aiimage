'use client'
// components/lexiverse/liquid-ui/index.tsx
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 · Liquid UI — the surface primitives used across Lexiverse.
//
// All 9 primitives in one file so the visual system (blur · thin border ·
// signature glow · 12px radius) stays trivially consistent. They are pure
// presentational components — no router / no store coupling.
//
// Exports:
//   LiquidGlassPanel       — large frosted panel (HUD, detail drawer)
//   LiquidGlassCard        — smaller card (galaxy preview tooltip)
//   LiquidIconButton       — round 32px icon button (close, settings, mute)
//   LiquidActionButton     — full pill primary CTA (Mark as Learned, Quiz)
//   LiquidSegmentedControl — tab-style switch (filter by sourceType)
//   LiquidBadge            — chip (CEFR level, exam tag, "Mastered")
//   LiquidStatPill         — number + label (HUD stats: 12 / 42 lit)
//   LiquidDrawer           — slide-from-right detail drawer shell
//   LiquidTooltip          — hover tooltip wrapper
// ─────────────────────────────────────────────────────────────────────────

import { useState, type CSSProperties, type ReactNode, type MouseEvent } from 'react'

// ── shared tokens ─────────────────────────────────────────────────────────
export const LIQUID = {
  bg: 'rgba(10,14,24,0.62)',
  border: 'rgba(126,249,255,0.14)',
  borderHover: 'rgba(126,249,255,0.32)',
  glow: 'rgba(126,249,255,0.10)',
  text: '#ECFBFF',
  textDim: '#9FB6C6',
  textMuted: '#6F8AA0',
  radius: 14,
  radiusSmall: 10,
  blur: 'blur(18px) saturate(1.15)',
  elevation: '0 18px 50px rgba(0,0,0,0.45)',
} as const

// ── LiquidGlassPanel ──────────────────────────────────────────────────────
export interface LiquidGlassPanelProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  /** signature accent (top border gradient + faint header glow) */
  accent?: string
  padding?: number | string
}
export function LiquidGlassPanel({ children, className, style, accent = '#7EF9FF', padding = 18 }: LiquidGlassPanelProps) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        background: LIQUID.bg,
        border: `1px solid ${LIQUID.border}`,
        borderRadius: LIQUID.radius,
        backdropFilter: LIQUID.blur,
        WebkitBackdropFilter: LIQUID.blur,
        boxShadow: LIQUID.elevation,
        padding,
        color: LIQUID.text,
        overflow: 'hidden',
        ...style,
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${accent}AA, transparent)`,
          pointerEvents: 'none',
        }}
      />
      {children}
    </div>
  )
}

// ── LiquidGlassCard ───────────────────────────────────────────────────────
export interface LiquidGlassCardProps {
  children: ReactNode
  accent?: string
  width?: number | string
  className?: string
  style?: CSSProperties
}
export function LiquidGlassCard({ children, accent = '#7EF9FF', width, className, style }: LiquidGlassCardProps) {
  return (
    <div
      className={className}
      style={{
        background: LIQUID.bg,
        border: `1px solid ${LIQUID.border}`,
        borderRadius: LIQUID.radiusSmall,
        backdropFilter: 'blur(12px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(12px) saturate(1.1)',
        padding: 12,
        color: LIQUID.text,
        boxShadow: `0 8px 24px rgba(0,0,0,0.35), inset 0 0 0 1px ${accent}11`,
        width,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ── LiquidIconButton ──────────────────────────────────────────────────────
export interface LiquidIconButtonProps {
  children: ReactNode
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  label: string
  size?: number
  accent?: string
}
export function LiquidIconButton({ children, onClick, label, size = 32, accent = '#7EF9FF' }: LiquidIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `1px solid ${LIQUID.border}`,
        background: 'rgba(255,255,255,0.04)',
        color: LIQUID.textDim,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 15,
        transition: 'all 0.18s ease',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `${accent}88`
        e.currentTarget.style.color = accent
        e.currentTarget.style.background = `${accent}14`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = LIQUID.border
        e.currentTarget.style.color = LIQUID.textDim
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
      }}
    >
      {children}
    </button>
  )
}

// ── LiquidActionButton ────────────────────────────────────────────────────
export interface LiquidActionButtonProps {
  children: ReactNode
  onClick?: () => void
  /** primary fills with accent gradient; secondary is a ghost outline */
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  accent?: string
  fullWidth?: boolean
  iconStart?: ReactNode
}
export function LiquidActionButton({ children, onClick, variant = 'primary', disabled, accent = '#7EF9FF', fullWidth, iconStart }: LiquidActionButtonProps) {
  const primary = variant === 'primary'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: fullWidth ? '100%' : undefined,
        padding: '12px 18px',
        borderRadius: 12,
        border: primary ? 'none' : `1px solid ${LIQUID.border}`,
        background: primary
          ? `linear-gradient(135deg, ${accent}, ${accent}CC)`
          : 'rgba(255,255,255,0.03)',
        color: primary ? '#04202B' : LIQUID.textDim,
        fontSize: 14,
        fontWeight: 700,
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        boxShadow: primary ? `0 8px 26px ${accent}44` : 'none',
        transition: 'transform 0.16s ease, box-shadow 0.16s ease',
      }}
      onMouseEnter={e => {
        if (disabled) return
        e.currentTarget.style.transform = 'translateY(-2px)'
        if (primary) e.currentTarget.style.boxShadow = `0 12px 34px ${accent}66`
        else { e.currentTarget.style.borderColor = `${accent}66`; e.currentTarget.style.color = LIQUID.text }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        if (primary) e.currentTarget.style.boxShadow = `0 8px 26px ${accent}44`
        else { e.currentTarget.style.borderColor = LIQUID.border; e.currentTarget.style.color = LIQUID.textDim }
      }}
    >
      {iconStart}
      {children}
    </button>
  )
}

// ── LiquidSegmentedControl ────────────────────────────────────────────────
export interface LiquidSegmentedControlProps<T extends string> {
  options: { value: T; label: ReactNode }[]
  value: T
  onChange: (v: T) => void
  accent?: string
}
export function LiquidSegmentedControl<T extends string>({ options, value, onChange, accent = '#7EF9FF' }: LiquidSegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      style={{
        display: 'inline-flex',
        background: LIQUID.bg,
        border: `1px solid ${LIQUID.border}`,
        borderRadius: 10,
        padding: 3,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {options.map(opt => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '5px 11px',
              borderRadius: 7,
              fontSize: 11.5,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              border: 'none',
              background: active ? `${accent}22` : 'transparent',
              color: active ? accent : LIQUID.textMuted,
              transition: 'all 0.16s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ── LiquidBadge ───────────────────────────────────────────────────────────
export interface LiquidBadgeProps {
  children: ReactNode
  color?: string
  size?: 'sm' | 'md'
}
export function LiquidBadge({ children, color = '#7EF9FF', size = 'md' }: LiquidBadgeProps) {
  const sm = size === 'sm'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: sm ? 10 : 11,
        fontWeight: 600,
        padding: sm ? '2px 7px' : '3px 9px',
        borderRadius: 6,
        background: `${color}1E`,
        color,
        border: `1px solid ${color}40`,
        whiteSpace: 'nowrap',
        lineHeight: 1.3,
      }}
    >
      {children}
    </span>
  )
}

// ── LiquidStatPill ────────────────────────────────────────────────────────
export interface LiquidStatPillProps {
  value: ReactNode
  label: ReactNode
  color?: string
}
export function LiquidStatPill({ value, label, color = '#7EF9FF' }: LiquidStatPillProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
      <span style={{ fontSize: 17, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontSize: 10, color: LIQUID.textMuted, letterSpacing: '0.02em' }}>{label}</span>
    </div>
  )
}

// ── LiquidDrawer (slides in from right) ───────────────────────────────────
export interface LiquidDrawerProps {
  open: boolean
  onClose: () => void
  width?: number | string
  accent?: string
  children: ReactNode
  /** optional close-button label (a11y) */
  closeLabel?: string
}
export function LiquidDrawer({ open, onClose, width = 380, accent = '#7EF9FF', children, closeLabel = 'Close panel' }: LiquidDrawerProps) {
  return (
    <aside
      aria-hidden={!open}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width,
        maxWidth: '100vw',
        background: 'linear-gradient(180deg, rgba(9,12,22,0.86), rgba(6,9,16,0.94))',
        borderLeft: `1px solid ${LIQUID.border}`,
        backdropFilter: 'blur(22px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(22px) saturate(1.2)',
        boxShadow: open ? '-30px 0 80px rgba(0,0,0,0.6)' : 'none',
        transform: open ? 'translateX(0)' : 'translateX(102%)',
        transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        color: LIQUID.text,
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${accent}88, transparent)`,
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'absolute', top: 14, right: 14 }}>
        <LiquidIconButton onClick={onClose} label={closeLabel}>✕</LiquidIconButton>
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>{children}</div>
    </aside>
  )
}

// ── LiquidTooltip ─────────────────────────────────────────────────────────
export interface LiquidTooltipProps {
  content: ReactNode
  children: ReactNode
  placement?: 'top' | 'bottom'
}
export function LiquidTooltip({ content, children, placement = 'top' }: LiquidTooltipProps) {
  const [open, setOpen] = useState(false)
  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            [placement]: '100%',
            marginTop: placement === 'top' ? 0 : 6,
            marginBottom: placement === 'top' ? 6 : 0,
            background: 'rgba(8,12,20,0.95)',
            border: `1px solid ${LIQUID.border}`,
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: 11.5,
            color: LIQUID.text,
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            zIndex: 40,
          }}
        >
          {content}
        </span>
      )}
    </span>
  )
}
