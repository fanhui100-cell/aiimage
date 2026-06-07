'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { siteConfig, levelOptions } from '@/config/site'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { useLearningStore } from '@/store/learningStore'
import type { LearningLevel } from '@/types/learning'

export default function OnboardingPage() {
  const router = useRouter()
  const { userLevel, setUserLevel } = useLearningStore()
  const [selected, setSelected] = useState<LearningLevel | null>(userLevel)

  function handleConfirm() {
    if (!selected) return
    setUserLevel(selected)
    router.push('/')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-deep)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{ textAlign: 'center', marginBottom: '40px' }}
      >
        <div style={{ fontSize: '11px', letterSpacing: '0.2em', color: 'var(--teal)', opacity: 0.6, marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>
          {siteConfig.projectName} · {siteConfig.projectNameZh}
        </div>
        <h1 style={{ margin: '0 0 4px', fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 'clamp(24px, 4vw, 38px)', color: 'var(--text-primary)', letterSpacing: '0.01em' }}>
          选择你的等级
        </h1>
        <p style={{ margin: '6px 0 0', fontFamily: 'var(--font-news)', fontStyle: 'italic', fontSize: '15px', color: 'var(--teal)' }}>
          Choose Your Level
        </p>
      </motion.div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '12px',
        maxWidth: '860px',
        width: '100%',
        marginBottom: '36px',
      }}>
        {levelOptions.map((level, i) => {
          const isSelected = selected === level.id
          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.25 }}
              whileHover={{ y: -2 }}
            >
              <GlassCard
                onClick={() => setSelected(level.id)}
                style={{
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: `1px solid ${isSelected ? 'rgba(79,230,206,0.55)' : 'var(--glass-border)'}`,
                  background: isSelected ? 'rgba(79,230,206,0.08)' : undefined,
                  boxShadow: isSelected ? '0 0 20px rgba(79,230,206,0.1)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontFamily: 'var(--font-serif-zh)', fontSize: '16px', fontWeight: 600, color: isSelected ? 'var(--teal)' : 'var(--text-primary)', marginBottom: '2px' }}>
                  {level.nameZh}
                </div>
                <div style={{ fontSize: '12px', color: isSelected ? 'var(--teal-deep)' : 'var(--text-muted)', marginBottom: '10px', fontFamily: 'var(--font-news)', fontStyle: 'italic' }}>
                  {level.name}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{level.descriptionZh}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>{level.description}</div>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>

      <Button
        onClick={handleConfirm}
        disabled={!selected}
        size="lg"
        style={{ opacity: selected ? 1 : 0.45, cursor: selected ? 'pointer' : 'not-allowed', letterSpacing: '0.06em' }}
      >
        确认进入
      </Button>
    </div>
  )
}
