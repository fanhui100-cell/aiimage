'use client'
// NumberRoll — 数字滚动（Demo04）
// 350ms · easeOutCubic · requestAnimationFrame · tabular-nums
// 适用：XP / 掌握度 % / 复习徽标数

import { useEffect, useRef, useState } from 'react'

const DURATION = 350
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

export function NumberRoll({ value }: { value: number }) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const from = fromRef.current
    if (from === value) return
    // reduced-motion：直接跳变
    if (typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      fromRef.current = value
      setDisplay(value)
      return
    }
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION)
      const v = Math.round(from + (value - from) * easeOutCubic(t))
      setDisplay(v)
      if (t < 1) rafRef.current = requestAnimationFrame(step)
      else fromRef.current = value
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      fromRef.current = value
    }
  }, [value])

  return <span className="tabular-nums">{display}</span>
}
