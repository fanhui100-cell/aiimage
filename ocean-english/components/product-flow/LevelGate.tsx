'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { levelOptions } from '@/config/site'
import { useLearningStore } from '@/store/learningStore'
import type { LearningLevel } from '@/types/learning'

/**
 * LevelGate — 学习等级「意图触发 + 轻量可跳过」(方案 C)。
 *
 * 首次进入任一学习区路由时，若未设等级则弹 2 步轻量向导；可跳过。
 * 完整 4 步向导保留在 /onboarding。
 */

const LEARNING_PREFIXES = [
  '/today', '/dictionary', '/memory', '/quiz', '/exam',
  '/scan', '/reading', '/pronunciation', '/lexigraph', '/lexiverse',
]

const GOALS: { id: string; labelZh: string; descZh: string }[] = [
  { id: 'exam',     labelZh: '备考达标',  descZh: 'CET / 考研 / IELTS / TOEFL' },
  { id: 'daily',    labelZh: '日常积累',  descZh: '每天学几个词，轻松持续' },
  { id: 'academic', labelZh: '学术提升',  descZh: '学术词汇与论文阅读' },
  { id: 'interest', labelZh: '兴趣探索',  descZh: '随心探索感兴趣的话题' },
]

const DEFAULT_LEVEL: LearningLevel = 'intermediate'
const SEEN_KEY = 'lexiocean-levelgate-seen'

export function LevelGate() {
  const pathname = usePathname()
  const reduce = useReducedMotion()
  const { userLevel, setUserLevel } = useLearningStore()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [goal, setGoal] = useState<string | null>(null)
  const [level, setLevel] = useState<LearningLevel | null>(userLevel)

  useEffect(() => {
    const inLearning = LEARNING_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
    if (!inLearning) return
    const seen = localStorage.getItem(SEEN_KEY) === 'true'
    const hasLevel = !!userLevel
    if (!seen && !hasLevel) {
      const t = setTimeout(() => setOpen(true), 350)
      return () => clearTimeout(t)
    }
  }, [pathname, userLevel])

  function finish(chosen: LearningLevel) {
    setUserLevel(chosen)
    localStorage.setItem(SEEN_KEY, 'true')
    try {
      localStorage.setItem('lexiocean-onboarding', JSON.stringify({ goal, level: chosen, source: 'levelgate' }))
    } catch { /* ignore */ }
    setOpen(false)
  }

  function skip() {
    setUserLevel(DEFAULT_LEVEL)
    localStorage.setItem(SEEN_KEY, 'true')
    setOpen(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 400,
            background: 'rgba(5,9,15,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={skip}
        >
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={e => e.stopPropagation()}
            className="theme-light"
            style={{
              width: '100%', maxWidth: 520, background: 'var(--paper)',
              border: '1px solid var(--line)', borderRadius: 20,
              padding: 'clamp(24px,4vw,34px)', boxShadow: '0 30px 80px -20px rgba(0,0,0,0.5)',
            }}
          >
            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
              {[1, 2].map(i => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: i <= step ? 'var(--teal-ink)' : 'var(--line-strong)', transition: 'background .3s' }} />
              ))}
            </div>

            {step === 1 ? (
              <>
                <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--teal-ink)' }}>步骤 1 / 2</p>
                <h2 style={{ margin: '6px 0 4px', fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 24, color: 'var(--ink)' }}>你的学习目标是？</h2>
                <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--ink-sub)' }}>用来为你定制每日任务与选词，30 秒搞定。</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                  {GOALS.map(g => (
                    <button key={g.id} type="button" onClick={() => setGoal(g.id)}
                      style={{
                        textAlign: 'left', cursor: 'pointer', padding: '14px 16px', borderRadius: 12,
                        border: `1px solid ${goal === g.id ? 'var(--teal-ink)' : 'var(--line)'}`,
                        background: goal === g.id ? 'var(--teal-bg)' : 'var(--card-2)', transition: 'all .15s',
                      }}>
                      <div style={{ fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 15, color: goal === g.id ? 'var(--teal-ink)' : 'var(--ink)' }}>{g.labelZh}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-sub)', marginTop: 3, lineHeight: 1.5 }}>{g.descZh}</div>
                    </button>
                  ))}
                </div>
                <GateFooter onSkip={skip} onNext={() => setStep(2)} nextDisabled={!goal} nextLabel="下一步" />
              </>
            ) : (
              <>
                <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--teal-ink)' }}>步骤 2 / 2</p>
                <h2 style={{ margin: '6px 0 4px', fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 24, color: 'var(--ink)' }}>当前英语等级？</h2>
                <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--ink-sub)' }}>之后可在「我的等级」里随时调整。</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, maxHeight: 280, overflowY: 'auto' }}>
                  {levelOptions.map(opt => (
                    <button key={opt.id} type="button" onClick={() => setLevel(opt.id)}
                      style={{
                        textAlign: 'left', cursor: 'pointer', padding: '13px 15px', borderRadius: 12,
                        border: `1px solid ${level === opt.id ? 'var(--teal-ink)' : 'var(--line)'}`,
                        background: level === opt.id ? 'var(--teal-bg)' : 'var(--card-2)', transition: 'all .15s',
                      }}>
                      <div style={{ fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 14, color: level === opt.id ? 'var(--teal-ink)' : 'var(--ink)' }}>{opt.nameZh}</div>
                      <div style={{ fontFamily: 'var(--font-news)', fontStyle: 'italic', fontSize: 11, color: 'var(--teal-ink)', opacity: 0.75 }}>{opt.name}</div>
                    </button>
                  ))}
                </div>
                <GateFooter onSkip={skip} onBack={() => setStep(1)} onNext={() => level && finish(level)} nextDisabled={!level} nextLabel="开始学习 →" />
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function GateFooter({ onSkip, onBack, onNext, nextDisabled, nextLabel }: {
  onSkip: () => void; onBack?: () => void; onNext: () => void; nextDisabled?: boolean; nextLabel: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
      <button type="button" onClick={onSkip} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink-muted)', fontFamily: 'var(--font-sans)' }}>跳过</button>
      <div style={{ display: 'flex', gap: 10 }}>
        {onBack && <button type="button" onClick={onBack} style={{ padding: '10px 20px', borderRadius: 999, border: '1px solid var(--line-strong)', background: 'var(--card)', color: 'var(--ink-sub)', cursor: 'pointer', fontSize: 14, fontFamily: 'var(--font-sans)' }}>返回</button>}
        <button type="button" onClick={onNext} disabled={nextDisabled}
          style={{
            padding: '10px 26px', borderRadius: 999, border: 'none', fontWeight: 600, fontSize: 14, fontFamily: 'var(--font-sans)',
            background: nextDisabled ? 'rgba(14,140,122,0.25)' : 'var(--teal-ink)', color: '#fff',
            cursor: nextDisabled ? 'not-allowed' : 'pointer',
          }}>{nextLabel}</button>
      </div>
    </div>
  )
}
