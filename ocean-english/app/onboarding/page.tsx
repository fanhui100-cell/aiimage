'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { levelOptions } from '@/config/site'
import { useLearningStore } from '@/store/learningStore'
import type { LearningLevel } from '@/types/learning'
import { IconGoalExam, IconGoalDaily, IconGoalAcademic, IconGoalInterest, IconOceanWave } from '@/components/ui/icons'

/* ── Types ── */
type Goal = 'exam' | 'daily' | 'academic' | 'interest'
type Step = 1 | 2 | 3 | 4 | 'done'

const GOAL_OPTIONS: { id: Goal; labelZh: string; descZh: string; icon: React.ReactNode }[] = [
  { id: 'exam',     labelZh: '备考达标', descZh: '系统备战 CET / 考研 / IELTS / TOEFL', icon: <IconGoalExam /> },
  { id: 'daily',    labelZh: '日常积累', descZh: '每天学几个词，轻松持续提升',            icon: <IconGoalDaily /> },
  { id: 'academic', labelZh: '学术提升', descZh: '强化学术词汇与论文阅读能力',            icon: <IconGoalAcademic /> },
  { id: 'interest', labelZh: '兴趣探索', descZh: '随心所欲，探索感兴趣的话题词汇',        icon: <IconGoalInterest /> },
]

const DIRECTION_OPTIONS = [
  'CET-4', 'CET-6', '考研英语', 'IELTS', 'TOEFL', '高考英语', '商务英语', '学术英语',
]

const PACE_OPTIONS = [
  { value: 10,  label: '10 词/天', desc: '轻松模式' },
  { value: 20,  label: '20 词/天', desc: '常规节奏' },
  { value: 30,  label: '30 词/天', desc: '强化提升' },
  { value: 50,  label: '50 词/天', desc: '冲刺备考' },
]

/* ── Sub-components ── */

function ProgressBar({ step }: { step: Step }) {
  const n = step === 'done' ? 4 : (step as number)
  return (
    <div style={{ display: 'flex', gap: '6px', marginBottom: '36px' }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          flex: 1, height: '3px', borderRadius: '3px',
          background: i <= n ? 'var(--teal)' : 'rgba(255,255,255,0.12)',
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  )
}

function StepLabel({ current, label }: { current: number; label: string }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--teal)', opacity: 0.7, marginBottom: '6px' }}>
        步骤 {current} / 4
      </div>
      <h2 style={{ margin: 0, fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 'clamp(20px, 3vw, 28px)', color: 'var(--text-primary)' }}>
        {label}
      </h2>
    </div>
  )
}

function NavButtons({
  onBack, onNext, nextLabel = '下一步', disabled = false, showBack = true,
}: {
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
  disabled?: boolean
  showBack?: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
      {showBack && onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: '14px', padding: '10px 24px',
            borderRadius: '50px', border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
        >
          返回
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={disabled}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, padding: '10px 32px',
          borderRadius: '50px', border: 'none',
          background: disabled ? 'rgba(79,230,206,0.25)' : 'var(--teal)',
          color: disabled ? 'rgba(255,255,255,0.4)' : '#0a2a24',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s',
        }}
      >
        {nextLabel}
      </button>
    </div>
  )
}

/* ── Main wizard ── */

export default function OnboardingPage() {
  const router = useRouter()
  const { userLevel, setUserLevel } = useLearningStore()

  const [step, setStep] = useState<Step>(1)
  const [goal, setGoal]           = useState<Goal | null>(null)
  const [level, setLevel]         = useState<LearningLevel | null>(userLevel)
  const [directions, setDirections] = useState<string[]>([])
  const [pace, setPace]           = useState<number>(20)
  const [reminder, setReminder]   = useState(false)

  function toggleDir(d: string) {
    setDirections(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  function handleFinish() {
    if (level) setUserLevel(level)
    try {
      localStorage.setItem('lexiocean-onboarding', JSON.stringify({ goal, directions, pace, reminder }))
    } catch { /* ignore */ }
    setStep('done')
  }

  const slideVariants = {
    enter: { opacity: 0, x: 24 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-deep)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(32px, 6vh, 60px) 24px',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--text-primary)' }}>
          Lexi<em style={{ fontStyle: 'italic', color: 'var(--teal)' }}>Ocean</em>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.16em', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>
          深海词汇学习
        </div>
      </div>

      {/* Wizard card */}
      <div style={{ width: '100%', maxWidth: '640px' }}>
        <ProgressBar step={step} />

        <AnimatePresence mode="wait">
          {/* ── Step 1: Goal ── */}
          {step === 1 && (
            <motion.div key="s1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }}>
              <StepLabel current={1} label="你的学习目标是？" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px', marginBottom: '4px' }}>
                {GOAL_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setGoal(opt.id)}
                    style={{
                      textAlign: 'left', cursor: 'pointer', padding: '18px 20px',
                      border: `1px solid ${goal === opt.id ? 'rgba(79,230,206,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '12px',
                      background: goal === opt.id ? 'rgba(79,230,206,0.07)' : 'rgba(255,255,255,0.03)',
                      transition: 'all 0.18s', outline: 'none',
                    }}
                    onMouseEnter={e => { if (goal !== opt.id) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                    onMouseLeave={e => { if (goal !== opt.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                  >
                    <div style={{ marginBottom: '8px', color: goal === opt.id ? 'var(--teal)' : 'rgba(255,255,255,0.55)' }}>{opt.icon}</div>
                    <div style={{ fontFamily: 'var(--font-serif-zh)', fontSize: '16px', fontWeight: 600, color: goal === opt.id ? 'var(--teal)' : 'var(--text-primary)', marginBottom: '4px' }}>
                      {opt.labelZh}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{opt.descZh}</div>
                  </button>
                ))}
              </div>
              <NavButtons onNext={() => setStep(2)} disabled={!goal} showBack={false} />
            </motion.div>
          )}

          {/* ── Step 2: Level ── */}
          {step === 2 && (
            <motion.div key="s2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }}>
              <StepLabel current={2} label="当前英语等级？" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                {levelOptions.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLevel(opt.id)}
                    style={{
                      textAlign: 'left', cursor: 'pointer', padding: '16px 18px',
                      border: `1px solid ${level === opt.id ? 'rgba(79,230,206,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '12px',
                      background: level === opt.id ? 'rgba(79,230,206,0.07)' : 'rgba(255,255,255,0.03)',
                      transition: 'all 0.18s', outline: 'none',
                    }}
                    onMouseEnter={e => { if (level !== opt.id) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                    onMouseLeave={e => { if (level !== opt.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                  >
                    <div style={{ fontFamily: 'var(--font-serif-zh)', fontSize: '15px', fontWeight: 600, color: level === opt.id ? 'var(--teal)' : 'var(--text-primary)', marginBottom: '2px' }}>
                      {opt.nameZh}
                    </div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-news)', fontStyle: 'italic', color: 'var(--teal)', opacity: 0.7, marginBottom: '6px' }}>{opt.name}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{opt.descriptionZh}</div>
                  </button>
                ))}
              </div>
              <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} disabled={!level} />
            </motion.div>
          )}

          {/* ── Step 3: Direction ── */}
          {step === 3 && (
            <motion.div key="s3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }}>
              <StepLabel current={3} label="学习方向（可多选）" />
              <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-sans)' }}>
                选择你关注的方向，我们会优先推荐相关词汇。
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                {DIRECTION_OPTIONS.map(d => {
                  const active = directions.includes(d)
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDir(d)}
                      style={{
                        fontFamily: 'var(--font-sans)', fontSize: '14px', padding: '8px 18px',
                        borderRadius: '50px', cursor: 'pointer', outline: 'none',
                        border: `1px solid ${active ? 'rgba(79,230,206,0.55)' : 'rgba(255,255,255,0.14)'}`,
                        background: active ? 'rgba(79,230,206,0.1)' : 'rgba(255,255,255,0.04)',
                        color: active ? 'var(--teal)' : 'rgba(255,255,255,0.7)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
              <NavButtons onBack={() => setStep(2)} onNext={() => setStep(4)} />
            </motion.div>
          )}

          {/* ── Step 4: Pace ── */}
          {step === 4 && (
            <motion.div key="s4" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }}>
              <StepLabel current={4} label="每日学习计划" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '24px' }}>
                {PACE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPace(opt.value)}
                    style={{
                      textAlign: 'left', cursor: 'pointer', padding: '18px 20px',
                      border: `1px solid ${pace === opt.value ? 'rgba(79,230,206,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '12px',
                      background: pace === opt.value ? 'rgba(79,230,206,0.08)' : 'rgba(255,255,255,0.03)',
                      transition: 'all 0.18s', outline: 'none',
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: pace === opt.value ? 'var(--teal)' : 'var(--text-primary)', marginBottom: '4px' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{opt.desc}</div>
                  </button>
                ))}
              </div>

              {/* 每日提醒开关 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', marginBottom: '4px' }}>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontWeight: 600, marginBottom: '2px' }}>每日学习提醒</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>浏览器通知（需授权）</div>
                </div>
                <button
                  type="button"
                  onClick={() => setReminder(r => !r)}
                  style={{
                    width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                    background: reminder ? 'var(--teal)' : 'rgba(255,255,255,0.15)',
                    position: 'relative', flexShrink: 0, transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '3px', width: '18px', height: '18px', borderRadius: '50%',
                    background: '#fff', transition: 'left 0.2s',
                    left: reminder ? '23px' : '3px',
                  }} />
                </button>
              </div>

              <NavButtons onBack={() => setStep(3)} onNext={handleFinish} nextLabel="完成设置" />
            </motion.div>
          )}

          {/* ── Completion ── */}
          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ marginBottom: '16px', color: 'var(--teal)', display: 'flex', justifyContent: 'center' }}><IconOceanWave /></div>
                <h2 style={{ margin: '0 0 8px', fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 'clamp(22px, 3vw, 30px)', color: 'var(--text-primary)' }}>
                  设置完成！
                </h2>
                <p style={{ margin: 0, fontFamily: 'var(--font-news)', fontStyle: 'italic', fontSize: '15px', color: 'var(--teal)' }}>
                  Your ocean awaits.
                </p>
              </div>

              {/* Summary */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                {[
                  { label: '目标', value: GOAL_OPTIONS.find(g => g.id === goal)?.labelZh ?? '—' },
                  { label: '等级', value: levelOptions.find(l => l.id === level)?.nameZh ?? '—' },
                  { label: '方向', value: directions.length > 0 ? directions.join('、') : '自主探索' },
                  { label: '每日', value: `${pace} 词/天` },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>{row.label}</span>
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => router.push('/')}
                style={{
                  width: '100%', padding: '14px', borderRadius: '50px', border: 'none',
                  background: 'var(--teal)', color: '#0a2a24',
                  fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 700,
                  cursor: 'pointer', letterSpacing: '0.04em',
                }}
              >
                进入学习 →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
