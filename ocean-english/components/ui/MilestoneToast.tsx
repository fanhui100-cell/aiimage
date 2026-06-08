'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMotivationStore } from '@/store/useMotivationStore'
import { checkMilestoneCrossed, type Milestone } from '@/lib/motivation/starfield'

export function MilestoneToast() {
  const litNodeCount = useMotivationStore(s => s.litNodeCount)
  const [active, setActive] = useState<Milestone | null>(null)
  const prevCount = useRef(litNodeCount)

  useEffect(() => {
    const crossed = checkMilestoneCrossed(prevCount.current, litNodeCount)
    prevCount.current = litNodeCount
    if (crossed) {
      setActive(crossed)
      const t = setTimeout(() => setActive(null), 3500)
      return () => clearTimeout(t)
    }
  }, [litNodeCount])

  return (
    <AnimatePresence>
      {active && (
        /* Wrapper handles centering; motion.div only handles enter/exit transforms */
        <div style={{ position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)', zIndex: 300 }}>
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 40, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            style={{
              background: 'var(--card, rgba(8,15,24,0.96))',
              border: `1px solid ${active.color}55`,
              borderRadius: '16px',
              padding: '14px 24px',
              boxShadow: `0 0 32px ${active.color}33, 0 8px 24px rgba(0,0,0,0.25)`,
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              minWidth: '260px',
              maxWidth: '90vw',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            {/* 星光爆发图标 */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ flexShrink: 0 }}>
              <motion.circle cx="16" cy="16" r="6" fill={active.color}
                animate={{ r: [6, 9, 6], opacity: [1, 0.6, 1] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
              />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
                const rad = (deg * Math.PI) / 180
                const x1 = 16 + Math.cos(rad) * 9
                const y1 = 16 + Math.sin(rad) * 9
                const x2 = 16 + Math.cos(rad) * 14
                const y2 = 16 + Math.sin(rad) * 14
                return (
                  <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={active.color} strokeWidth="1.6" strokeLinecap="round"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.05, ease: 'easeInOut' }}
                  />
                )
              })}
            </svg>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-serif-zh)',
                fontWeight: 600,
                fontSize: '15px',
                color: active.color,
                marginBottom: '2px',
              }}>
                {active.labelZh}
              </div>
              <div style={{
                fontFamily: 'var(--font-news)',
                fontStyle: 'italic',
                fontSize: '12px',
                color: 'var(--text-secondary, #9fb6c6)',
              }}>
                {active.labelEn}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
