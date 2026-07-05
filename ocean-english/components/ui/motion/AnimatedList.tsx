'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface AnimatedListProps {
  children: React.ReactNode
  /** 每项间隔秒，默认 0.06 */
  stagger?: number
  /** 单项时长秒，默认 0.4 */
  duration?: number
  className?: string
  style?: React.CSSProperties
}

/**
 * 子项错峰淡入上移。用于：词典结果、复习队列、近期活动流。
 * 尊重 prefers-reduced-motion：直接显示，无位移。
 * 注意：children 需为可枚举的元素数组（list items）。
 *
 * 用法：
 *   <AnimatedList style={{ display:'grid', gap:12 }}>
 *     {results.map(w => <WordCard key={w.id} word={w} />)}
 *   </AnimatedList>
 */
export function AnimatedList({
  children,
  stagger = 0.06,
  duration = 0.4,
  className,
  style,
}: AnimatedListProps) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: reduce ? 0 : stagger } },
      }}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div
              key={(child as { key?: React.Key })?.key ?? i}
              variants={{
                hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 10 },
                show: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: reduce ? 0 : duration, ease: [0.2, 0.7, 0.3, 1] },
                },
              }}
            >
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  )
}
