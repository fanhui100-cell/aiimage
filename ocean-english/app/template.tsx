'use client'

import { motion, useReducedMotion } from 'framer-motion'

export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      initial={reduce ? {} : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? {} : { opacity: 0, y: -8 }}
      transition={{ duration: reduce ? 0 : 0.22, ease: [0.2, 0.7, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
