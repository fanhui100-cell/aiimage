import { cn } from '@/lib/utils'

interface BilingualTextProps {
  en: string
  zh: string
  enClassName?: string
  zhClassName?: string
  className?: string
  layout?: 'stacked' | 'inline'
}

export function BilingualText({
  en,
  zh,
  enClassName,
  zhClassName,
  className,
  layout = 'stacked',
}: BilingualTextProps) {
  if (layout === 'inline') {
    return (
      <span className={cn('inline-flex items-baseline gap-2', className)}>
        <span className={cn('font-medium', enClassName)}>{en}</span>
        <span
          className={cn('text-sm opacity-70', zhClassName)}
          style={{ color: 'var(--text-secondary)' }}
        >
          {zh}
        </span>
      </span>
    )
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <span className={cn('leading-tight', enClassName)}>{en}</span>
      <span
        className={cn('text-sm opacity-70', zhClassName)}
        style={{ color: 'var(--text-secondary)' }}
      >
        {zh}
      </span>
    </div>
  )
}
