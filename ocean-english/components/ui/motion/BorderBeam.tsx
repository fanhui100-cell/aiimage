'use client'

/**
 * §B9 BorderBeam · 卡片流光描边
 * ----------------------------------------------------------------------------
 * 克制使用：仅战绩卡（ShareScreen）/ 里程碑 / 单张主 CTA 卡。
 * 落点全在米白面 → 默认 --teal-ink / --gold-ink；如需用在暗色面，传 dark。
 * 包在任意卡片外层即可，不改卡片内部结构。
 */
interface BorderBeamProps {
  children: React.ReactNode
  className?: string
  /** 暗色宇宙面传 true（切到 --teal / --gold 亮色）*/
  dark?: boolean
  /** 一圈秒数，默认 4s */
  speed?: number
  /** 圆角，默认继承 --r-card */
  radius?: number | string
  style?: React.CSSProperties
}

export function BorderBeam({ children, className, dark = false, speed = 4, radius = 'var(--r-card)', style }: BorderBeamProps) {
  return (
    <div
      className={`border-beam${className ? ` ${className}` : ''}`}
      style={{
        borderRadius: radius,
        // @ts-expect-error CSS custom props
        '--beam-c': dark ? 'var(--teal)' : 'var(--teal-ink)',
        '--beam-c2': dark ? 'var(--gold)' : 'var(--gold-ink)',
        '--beam-speed': `${speed}s`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
