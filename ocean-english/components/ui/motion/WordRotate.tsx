'use client'

/**
 * §B12 WordRotate · 标题轮播词
 * ----------------------------------------------------------------------------
 * 配合现成 <ShinyText/> 用在 HomeHero / Onboarding 标题。落点全在米白面。
 * 用 framer-motion（已装 ^12）做上滚淡入；reduced-motion 自动降级为直接切换。
 */
import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

interface WordRotateProps {
  words: string[]
  /** 每词停留毫秒，默认 2200 */
  interval?: number
  className?: string
  style?: React.CSSProperties
}

export function WordRotate({ words, interval = 2200, className, style }: WordRotateProps) {
  const [i, setI] = useState(0)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!words.length) return
    const t = setInterval(() => setI(v => (v + 1) % words.length), interval)
    return () => clearInterval(t)
  }, [words, interval])

  return (
    <span className={className} style={{ display: 'inline-block', position: 'relative', overflow: 'hidden', verticalAlign: 'bottom', ...style }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={i}
          initial={reduce ? false : { y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: '-100%', opacity: 0 }}
          transition={{ duration: 0.42, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ display: 'inline-block', color: 'var(--teal-ink)', fontStyle: 'italic' }}
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
