import { cn } from '@/lib/utils'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'success' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const VARIANT_STYLES: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'rgba(56,189,248,0.1)',
    border: '1px solid rgba(56,189,248,0.4)',
    color: '#38BDF8',
  },
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
  ghost: {
    background: 'rgba(155,191,202,0.06)',
    border: '1px solid rgba(155,191,202,0.2)',
    color: '#9BBFCA',
  },
  danger: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.35)',
    color: '#EF4444',
  },
}

const SIZE_STYLES: Record<Size, React.CSSProperties> = {
  sm: { padding: '5px 12px', fontSize: '12px', borderRadius: '6px' },
  md: { padding: '9px 20px', fontSize: '13px', borderRadius: '8px' },
  lg: { padding: '12px 28px', fontSize: '14px', borderRadius: '8px' },
}

interface ButtonBaseProps {
  variant?: Variant
  size?: Size
  className?: string
}

type ButtonProps = ButtonBaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { as?: 'button' }
type AnchorProps = ButtonBaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { as: 'a' }

type Props = ButtonProps | AnchorProps

/**
 * Shared button / link component with consistent deep-sea style.
 * Use variant to select color: primary (cyan), success (green), secondary (purple),
 * ghost (neutral), danger (red).
 */
export function Button({ variant = 'primary', size = 'md', className, as: Tag = 'button', ...rest }: Props) {
  const style: React.CSSProperties = {
    display: 'inline-block',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    textAlign: 'center',
    transition: 'opacity 0.15s',
    lineHeight: 1.4,
    ...VARIANT_STYLES[variant],
    ...SIZE_STYLES[size],
  }

  if (Tag === 'a') {
    return (
      <a
        className={cn(className)}
        style={style}
        {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
      />
    )
  }

  return (
    <button
      className={cn(className)}
      style={style}
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
    />
  )
}
