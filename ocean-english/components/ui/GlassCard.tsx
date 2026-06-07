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
  style?: React.CSSProperties
}

export function GlassCard({ children, className, theme, accentColor, onClick, style }: GlassCardProps) {
  const isLight = theme === 'light'

  const base: React.CSSProperties = isLight
    ? {
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--r-card)',
        boxShadow: 'var(--card-shadow-sm)',
        padding: '20px 22px',
        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
      }
    : {
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--r-card)',
        boxShadow: 'var(--glass-shadow)',
        padding: '20px 22px',
        transition: 'border-color 0.2s, background 0.2s, transform 0.2s',
      }

  function onEnter(e: React.MouseEvent<HTMLDivElement>) {
    const el = e.currentTarget
    if (accentColor) {
      el.style.borderColor = `${accentColor}40`
      el.style.background = `${accentColor}08`
    } else if (isLight) {
      el.style.borderColor = 'rgba(14,140,122,0.4)'
      el.style.transform = 'translateY(-2px)'
    } else {
      el.style.borderColor = 'var(--glass-border-hover)'
      el.style.background = 'var(--glass-bg-hover)'
      el.style.transform = 'translateY(-2px)'
    }
  }

  function onLeave(e: React.MouseEvent<HTMLDivElement>) {
    const el = e.currentTarget
    if (accentColor) {
      el.style.borderColor = 'var(--glass-border)'
      el.style.background = ''
    } else if (isLight) {
      el.style.borderColor = 'var(--line)'
      el.style.transform = ''
    } else {
      el.style.borderColor = 'var(--glass-border)'
      el.style.background = ''
      el.style.transform = ''
    }
  }

  return (
    <div
      className={cn(onClick && 'cursor-pointer', className)}
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{ ...base, ...style }}
    >
      {children}
    </div>
  )
}
