'use client'

import { forwardRef, useImperativeHandle, useRef } from 'react'

interface SparkBurstProps {
  children: React.ReactNode
  /** 粒子颜色，默认成就金 */
  color?: string
  /** 粒子数量，默认 10 */
  count?: number
  /** 半径 px，默认 30 */
  radius?: number
  className?: string
  style?: React.CSSProperties
}

export interface SparkBurstHandle {
  /** 从元素中心触发一次粒子爆发 */
  fire: () => void
}

/**
 * 包裹任意可点击元素，调用 ref.fire() 时从中心放射一圈粒子。
 * 用于：收藏单词、点亮节点、任务达成。尊重 prefers-reduced-motion。
 *
 * 用法：
 *   const spark = useRef<SparkBurstHandle>(null)
 *   <SparkBurst ref={spark}>
 *     <button onClick={() => { toggleSave(); if (!saved) spark.current?.fire() }}>
 *       <StarIcon filled={saved} />
 *     </button>
 *   </SparkBurst>
 */
export const SparkBurst = forwardRef<SparkBurstHandle, SparkBurstProps>(function SparkBurst(
  { children, color = 'var(--gold)', count = 10, radius = 30, className, style },
  ref,
) {
  const hostRef = useRef<HTMLSpanElement>(null)

  useImperativeHandle(ref, () => ({
    fire() {
      const host = hostRef.current
      if (!host) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      for (let i = 0; i < count; i++) {
        const s = document.createElement('span')
        s.style.cssText =
          `position:absolute;left:50%;top:50%;width:5px;height:5px;` +
          `border-radius:50%;background:${color};pointer-events:none;z-index:5;`
        host.appendChild(s)
        const ang = ((Math.PI * 2) / count) * i + Math.random() * 0.3
        const dist = radius + Math.random() * (radius * 0.6)
        const dx = Math.cos(ang) * dist
        const dy = Math.sin(ang) * dist
        s.animate(
          [
            { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
            { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(0)`, opacity: 0 },
          ],
          { duration: 520, easing: 'cubic-bezier(.2,.7,.3,1)' },
        )
        setTimeout(() => s.remove(), 540)
      }
    },
  }))

  return (
    <span
      ref={hostRef}
      className={className}
      style={{ position: 'relative', display: 'inline-flex', ...style }}
    >
      {children}
    </span>
  )
})
