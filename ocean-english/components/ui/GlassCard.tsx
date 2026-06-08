'use client'

import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  /** 'dark' = 深海玻璃; 'light' = 米白卡片(默认按父级 theme-light 自适应) */
  theme?: 'dark' | 'light'
  /** @deprecated 新代码请用 theme 控制;旧组件 hover 边框颜色(向后兼容) */
  accentColor?: string
  onClick?: () => void
  tabIndex?: number
  style?: React.CSSProperties
}

export function GlassCard({ children, className, theme, accentColor, onClick, tabIndex, style }: GlassCardProps) {
  const isLight = theme === 'light'
  const isDark = !isLight

  const base: React.CSSProperties = isLight
    ? {
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--r-card)',
        boxShadow: 'var(--card-shadow-sm)',
        padding: '20px 22px',
        // accent border on hover via CSS if accentColor provided
        ...(accentColor ? { ['--accent' as string]: accentColor } : {}),
      }
    : {
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--r-card)',
        boxShadow: 'var(--glass-shadow)',
        padding: '20px 22px',
      }

  return (
    <div
      className={cn(
        'card-hover',
        isDark && 'is-dark',
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
      tabIndex={tabIndex}
      style={{ ...base, ...style }}
    >
      {children}
    </div>
  )
}
