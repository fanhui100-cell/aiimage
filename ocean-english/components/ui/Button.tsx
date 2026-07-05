import { cn } from '@/lib/utils'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'

// +++ 接入改动：Variant 增加 'shimmer'（配套 .lx-btn--shimmer 在 globals.additions.css）
type Variant = 'primary' | 'ghost' | 'dark-ghost' | 'success' | 'secondary' | 'danger' | 'shimmer'
type Size = 'sm' | 'md' | 'lg'

interface ButtonBaseProps {
  variant?: Variant
  size?: Size
  className?: string
}

type ButtonProps = ButtonBaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { as?: 'button' }
type AnchorProps = ButtonBaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { as: 'a' }
type Props = ButtonProps | AnchorProps

export function Button({ variant = 'primary', size = 'md', className, as: Tag = 'button', ...rest }: Props) {
  const classes = cn(
    'lx-btn',
    `lx-btn--${variant}`,
    `lx-btn--${size}`,
    className,
  )

  if (Tag === 'a') {
    return (
      <a className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)} />
    )
  }

  return (
    <button className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)} />
  )
}
