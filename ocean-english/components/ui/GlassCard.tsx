'use client'

import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  /** Accent glow color — applied to border tint when hovered */
  accentColor?: string
  onClick?: () => void
  style?: React.CSSProperties
}

/**
 * Standard transparent glass card.
 * Lighter than GlassPanel — no backdrop-blur, optimized for lists/grids.
 * Use GlassPanel for featured/hero panels that need the full blur effect.
 */
export function GlassCard({ children, className, accentColor, onClick, style }: GlassCardProps) {
  return (
    <div
      className={cn('rounded-[10px]', onClick && 'cursor-pointer', className)}
      onClick={onClick}
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        padding: '16px 20px',
        transition: 'border-color 0.2s, background 0.2s',
        ...style,
      }}
      onMouseEnter={accentColor ? (e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = `${accentColor}40`
        el.style.background = `${accentColor}08`
      } : undefined}
      onMouseLeave={accentColor ? (e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'var(--glass-border)'
        el.style.background = 'var(--glass-bg)'
      } : undefined}
    >
      {children}
    </div>
  )
}
