'use client'

import { motion, useReducedMotion } from 'framer-motion'

export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()

  return (
    // Demo09：页面过场 — 出入各 160ms · fade + 4px 位移
    <motion.div
      initial={reduce ? {} : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? {} : { opacity: 0, y: -4 }}
      transition={{ duration: reduce ? 0 : 0.16, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
