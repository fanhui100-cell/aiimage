'use client'

/**
 * §B12/B13 AnimatedBeam · 两节点间的流动光束
 * ----------------------------------------------------------------------------
 * 落点：RootsScreen 词根→派生词（米白面）/ LexiGraph 词图（暗色面）——跨面，传 dark。
 * 传入容器 ref + from/to 两个元素 ref，自动算出曲线并铺一条流动虚线。
 * 颜色：米白面 --teal-ink；暗色面 --teal。reduced-motion 自动静止（见 §B12 CSS）。
 */
import { useEffect, useId, useState } from 'react'

interface AnimatedBeamProps {
  containerRef: React.RefObject<HTMLElement | null>
  fromRef: React.RefObject<HTMLElement | null>
  toRef: React.RefObject<HTMLElement | null>
  dark?: boolean
  /** 曲率，0=直线，默认 36 */
  curvature?: number
  /** 流向反转 */
  reverse?: boolean
  delay?: number
}

export function AnimatedBeam({ containerRef, fromRef, toRef, dark = false, curvature = 36, reverse = false, delay = 0 }: AnimatedBeamProps) {
  const id = useId().replace(/:/g, '')
  const [d, setD] = useState('')
  const [box, setBox] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const compute = () => {
      const c = containerRef.current, a = fromRef.current, b = toRef.current
      if (!c || !a || !b) return
      const cr = c.getBoundingClientRect(), ar = a.getBoundingClientRect(), br = b.getBoundingClientRect()
      setBox({ w: cr.width, h: cr.height })
      const x1 = ar.left - cr.left + ar.width / 2, y1 = ar.top - cr.top + ar.height / 2
      const x2 = br.left - cr.left + br.width / 2, y2 = br.top - cr.top + br.height / 2
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - curvature
      setD(`M ${x1},${y1} Q ${mx},${my} ${x2},${y2}`)
    }
    compute()
    const ro = new ResizeObserver(compute)
    if (containerRef.current) ro.observe(containerRef.current)
    window.addEventListener('resize', compute)
    return () => { ro.disconnect(); window.removeEventListener('resize', compute) }
  }, [containerRef, fromRef, toRef, curvature])

  const base = dark ? 'rgba(255,255,255,0.10)' : 'var(--line-strong)'
  const flow = dark ? 'var(--teal)' : 'var(--teal-ink)'

  return (
    <svg fill="none" width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <path d={d} stroke={base} strokeWidth={2} />
      <path className="abeam-flow" d={d} stroke={flow} strokeWidth={2} strokeLinecap="round"
        style={{ animationDelay: `${delay}s`, animationDirection: reverse ? 'reverse' : 'normal' }} />
    </svg>
  )
}
