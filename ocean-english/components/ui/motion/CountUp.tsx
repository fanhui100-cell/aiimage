'use client'

import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  /** 目标数值 */
  to: number
  /** 起始数值，默认 0 */
  from?: number
  /** 动画时长 ms，默认 1100 */
  duration?: number
  /** 小数位，默认 0 */
  decimals?: number
  /** 前缀 / 后缀，如 prefix="Lv." suffix="d" */
  prefix?: string
  suffix?: string
  /** 是否用千分位，默认 true */
  separator?: boolean
  className?: string
  style?: React.CSSProperties
}

/**
 * 数字滚动累加。进入视口时播放一次；`to` 变化时从当前值补间到新值（用于"涨经验"）。
 * 尊重 prefers-reduced-motion：直接显示终值。
 *
 * 用法：
 *   <CountUp to={studyProgress.totalXp} />
 *   <CountUp to={streak} suffix="d" />
 *   <CountUp to={level} prefix="Lv." separator={false} />
 */
export function CountUp({
  to,
  from = 0,
  duration = 1100,
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = true,
  className,
  style,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(from)
  const startedRef = useRef(false)
  const fromRef = useRef(from)

  function format(n: number) {
    const fixed = n.toFixed(decimals)
    if (!separator) return prefix + fixed + suffix
    const [int, dec] = fixed.split('.')
    const withSep = Number(int).toLocaleString('en-US')
    return prefix + (dec ? `${withSep}.${dec}` : withSep) + suffix
  }

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function run(start: number) {
      if (prefersReduced) {
        setDisplay(to)
        return
      }
      const t0 = performance.now()
      function tick(now: number) {
        const p = Math.min(1, (now - t0) / duration)
        const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
        setDisplay(start + (to - start) * eased)
        if (p < 1) requestAnimationFrame(tick)
        else fromRef.current = to
      }
      requestAnimationFrame(tick)
    }

    // 首次：进入视口才播
    if (!startedRef.current) {
      const el = ref.current
      if (!el) return
      const io = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting) {
            startedRef.current = true
            run(from)
            io.disconnect()
          }
        },
        { threshold: 0.3 },
      )
      io.observe(el)
      return () => io.disconnect()
    }

    // 后续：to 变化，从上次终值补间
    run(fromRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to])

  return (
    <span
      ref={ref}
      className={className}
      style={{ fontVariantNumeric: 'tabular-nums', ...style }}
    >
      {format(display)}
    </span>
  )
}
