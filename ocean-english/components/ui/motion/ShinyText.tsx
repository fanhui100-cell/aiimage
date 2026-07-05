'use client'

interface ShinyTextProps {
  children: React.ReactNode
  /** 基础色（成就金），默认 --gold-ink */
  baseColor?: string
  /** 高光色，默认浅金 */
  shineColor?: string
  /** 一轮流光秒数，默认 3.2 */
  speed?: number
  className?: string
  style?: React.CSSProperties
}

/**
 * 文字上缓慢扫过一道流光。**克制使用**：仅成就 / 里程碑 / 连续天数文字，普通文字勿用。
 * 默认金色，避免引入新色。尊重 prefers-reduced-motion（见配套 CSS，动画自动停）。
 *
 * 用法：
 *   <ShinyText>连续学习 7 天</ShinyText>
 *
 * 配套 CSS（加到 globals.css）：
 *   .shiny-text {
 *     background-size: 220% 100%;
 *     -webkit-background-clip: text; background-clip: text;
 *     -webkit-text-fill-color: transparent;
 *     animation: shinyTextSweep var(--shiny-speed, 3.2s) linear infinite;
 *   }
 *   @keyframes shinyTextSweep { to { background-position: -220% 0; } }
 *   @media (prefers-reduced-motion: reduce) {
 *     .shiny-text { animation: none; -webkit-text-fill-color: currentColor; color: var(--gold-ink); }
 *   }
 */
export function ShinyText({
  children,
  baseColor = 'var(--gold-ink)',
  shineColor = '#f6e2a8',
  speed = 3.2,
  className,
  style,
}: ShinyTextProps) {
  return (
    <span
      className={`shiny-text${className ? ` ${className}` : ''}`}
      style={{
        backgroundImage: `linear-gradient(110deg, ${baseColor} 35%, ${shineColor} 50%, ${baseColor} 65%)`,
        // @ts-expect-error - CSS custom property
        '--shiny-speed': `${speed}s`,
        ...style,
      }}
    >
      {children}
    </span>
  )
}
