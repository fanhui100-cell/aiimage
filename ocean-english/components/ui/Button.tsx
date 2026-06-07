import { cn } from '@/lib/utils'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'dark-ghost' | 'success' | 'secondary' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANT_STYLES: Record<Variant, React.CSSProperties> = {
  /* 浅色/深色通用:青绿实底,白字 */
  primary: {
    background: 'var(--teal-ink)',
    color: '#fff',
    border: 'none',
    boxShadow: '0 12px 26px -14px rgba(14,140,122,0.8)',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  /* 浅色页面 ghost */
  ghost: {
    background: 'var(--card)',
    border: '1px solid var(--line-strong)',
    color: 'var(--ink)',
  },
  /* 深色页面 ghost */
  'dark-ghost': {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(225,238,244,0.3)',
    color: '#eaf3f6',
  },
  /* 向后兼容保留 */
  success: {
    background: 'rgba(52,211,153,0.1)',
    border: '1px solid rgba(52,211,153,0.4)',
    color: '#34D399',
  },
  secondary: {
    background: 'rgba(139,92,246,0.1)',
    border: '1px solid rgba(139,92,246,0.4)',
    color: '#8B5CF6',
  },
  danger: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.35)',
    color: '#EF4444',
  },
}

const SIZE_STYLES: Record<Size, React.CSSProperties> = {
  sm: { padding: '8px 16px', fontSize: '13px', borderRadius: 'var(--r-pill)' },
  md: { padding: '12px 22px', fontSize: '14px', borderRadius: 'var(--r-pill)' },
  lg: { padding: '14px 28px', fontSize: '15px', borderRadius: 'var(--r-pill)' },
}

interface ButtonBaseProps {
  variant?: Variant
  size?: Size
  className?: string
}

type ButtonProps = ButtonBaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { as?: 'button' }
type AnchorProps = ButtonBaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { as: 'a' }
type Props = ButtonProps | AnchorProps

export function Button({ variant = 'primary', size = 'md', className, as: Tag = 'button', ...rest }: Props) {
  const style: React.CSSProperties = {
    display: 'inline-block',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    textAlign: 'center',
    transition: 'opacity 0.15s, transform 0.15s',
    lineHeight: 1.4,
    ...VARIANT_STYLES[variant],
    ...SIZE_STYLES[size],
  }

  if (Tag === 'a') {
    return (
      <a className={cn(className)} style={style} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)} />
    )
  }

  return (
    <button className={cn(className)} style={style} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)} />
  )
}
