'use client'
// B11-3：里程碑庆祝白名单 — 仅五类：首次闭环、streak 7/30/100、第 100/500 个掌握词。
// 高频奖励会迅速贬值（Duolingo 只在 lesson 级别庆祝）。

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLexiStore } from '@/store/lexiStore'
import { ShinyText } from '@/components/ui/motion/ShinyText'

interface Milestone {
  id: string
  labelZh: string
  labelEn: string
  color: string
}

const STREAK_MARKS = [7, 30, 100]
const MASTERED_MARKS = [100, 500]
const FIRST_LOOP_KEY = 'lexi-first-loop-celebrated'

export function MilestoneToast() {
  const streak = useLexiStore(s => s.streakData.current)
  const mastered = useLexiStore(s => s.words.filter(w => w.state === 'mastered').length)
  const daily = useLexiStore(s => s.daily)
  const dueLen = useLexiStore(s => s.getDue().length)

  const [active, setActive] = useState<Milestone | null>(null)
  const prevStreak = useRef(streak)
  const prevMastered = useRef(mastered)

  // 弹出 + 3.5s 自动收起
  function fire(m: Milestone) {
    setActive(m)
  }
  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => setActive(null), 3500)
    return () => clearTimeout(t)
  }, [active])

  // streak 7/30/100
  useEffect(() => {
    const hit = STREAK_MARKS.find(m => prevStreak.current < m && streak >= m)
    prevStreak.current = streak
    if (hit) fire({ id: `streak-${hit}`, labelZh: `连续学习 ${hit} 天`, labelEn: `${hit}-day streak`, color: '#f1c879' })
  }, [streak])

  // 第 100 / 500 个掌握词
  useEffect(() => {
    const hit = MASTERED_MARKS.find(m => prevMastered.current < m && mastered >= m)
    prevMastered.current = mastered
    if (hit) fire({ id: `mastered-${hit}`, labelZh: `第 ${hit} 个掌握词`, labelEn: `${hit} words mastered`, color: '#4fe6ce' })
  }, [mastered])

  // 首次闭环（学→练→复 全完成，仅一次）
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    if (daily.date !== today) return
    if (daily.learned > 0 && daily.quizzed >= 5 && dueLen === 0
      && !localStorage.getItem(FIRST_LOOP_KEY)) {
      localStorage.setItem(FIRST_LOOP_KEY, '1')
      fire({ id: 'first-loop', labelZh: '首次完成今日闭环', labelEn: 'First full loop', color: '#4fe6ce' })
    }
  }, [daily, dueLen])

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
                marginBottom: '2px',
              }}>
                <ShinyText baseColor={active.color} shineColor="#ffffff">{active.labelZh}</ShinyText>
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
