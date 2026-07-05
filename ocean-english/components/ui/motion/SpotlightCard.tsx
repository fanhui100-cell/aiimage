'use client'

import { useRef } from 'react'

interface SpotlightCardBaseProps {
  children: React.ReactNode
  /** 光斑颜色，默认品牌青绿 */
  glow?: string
  /** 光斑直径 px，默认 300 */
  size?: number
  className?: string
  style?: React.CSSProperties
}

type SpotlightCardProps =
  | (SpotlightCardBaseProps & { as?: 'div'; href?: never })
  | (SpotlightCardBaseProps & { as: 'a'; href?: string })

/**
 * 光标跟随的柔和光斑卡片。克制使用：仅首页两张大模块卡。
 * 通过 CSS 变量 --mx / --my 定位光斑，避免每帧 setState。
 * 尊重 prefers-reduced-motion：仍可用（仅光斑位置，不含位移动画）。
 */
export function SpotlightCard({
  children,
  glow = 'rgba(14,140,122,0.14)',
  size = 300,
  className,
  style,
  as = 'div',
  href,
}: SpotlightCardProps) {
  const ref = useRef<HTMLElement>(null)

  function onMove(e: React.MouseEvent) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  const glowEl = (
    <span
      aria-hidden
      style={{
        position: 'absolute',
        left: 'var(--mx, 50%)',
        top: 'var(--my, 0px)',
        width: size,
        height: size,
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${glow}, transparent 65%)`,
        opacity: 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none',
      }}
      className="spotlight-glow"
    />
  )

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    ...style,
  }

  if (as === 'a') {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        onMouseMove={onMove}
        className={className}
        style={containerStyle}
      >
        {glowEl}
        {children}
      </a>
    )
  }

  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      onMouseMove={onMove}
      className={className}
      style={containerStyle}
    >
      {glowEl}
      {children}
    </div>
  )
}
