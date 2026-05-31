'use client'

import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { useLearningStore } from '@/store/learningStore'

function ProgressBar({ value, max, color = '#38BDF8' }: { value: number; max: number; color?: string }) {
  const pct = max === 0 ? 0 : Math.min((value / max) * 100, 100)
  return (
    <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: '3px',
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  )
}

const learningPaths = [
  { label: 'Vocabulary Builder', labelZh: '词汇构建', href: '/dictionary', icon: '🌱', color: '#38BDF8' },
  { label: 'Voice Sonar', labelZh: '发音训练', href: '/study#pronunciation', icon: '🔊', color: '#7EF9FF' },
  { label: 'Reading Canopy', labelZh: '阅读训练', href: '/study#reading', icon: '📖', color: '#B8FFB2' },
  { label: 'AI Navigator', labelZh: 'AI 导学', href: '/chat', icon: '🤖', color: '#8B5CF6' },
  { label: 'Exam Branch', labelZh: '考试备考', href: '/exam', icon: '📝', color: '#F97316' },
  { label: 'Memory Roots', labelZh: '记忆复习', href: '/memory', icon: '🧠', color: '#34D399' },
]

export default function StudyPage() {
  const { dailyTasks, studyProgress, completeTaskUnit } = useLearningStore()

  const completedTasks = dailyTasks.filter(t => t.completedCount >= t.targetCount).length
  const totalXpToday = dailyTasks
    .filter(t => t.completedCount >= t.targetCount)
    .reduce((sum, t) => sum + t.xp, 0)

  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px' }}>
          <h1 style={{ margin: '0 0 6px', fontSize: '32px', fontWeight: 700, color: '#ECFBFF' }}>
            Study Mode <span style={{ fontSize: '18px', color: '#9BBFCA' }}>学习模式</span>
          </h1>
          <p style={{ margin: '0 0 32px', color: '#9BBFCA', fontSize: '14px' }}>
            Daily tasks, learning paths, and progress tracking.
            <span style={{ marginLeft: '8px', color: 'rgba(155,191,202,0.6)', fontSize: '13px' }}>
              今日任务、学习路径与进度追踪。
            </span>
          </p>

          {/* Stats row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '12px',
              marginBottom: '32px',
            }}
          >
            {[
              { label: 'Total XP', labelZh: '总经验值', value: studyProgress.totalXp, color: '#FFD76A', icon: '⚡' },
              { label: 'Streak', labelZh: '连续天数', value: `${studyProgress.currentStreak}d`, color: '#F97316', icon: '🔥' },
              { label: "Today's XP", labelZh: '今日获得', value: totalXpToday, color: '#34D399', icon: '✓' },
              { label: 'Words Learned', labelZh: '已学单词', value: studyProgress.totalWordsLearned, color: '#38BDF8', icon: '📚' },
            ].map(stat => (
              <div
                key={stat.label}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(155,191,202,0.12)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>{stat.icon}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: stat.color, marginBottom: '4px' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '11px', color: '#9BBFCA' }}>{stat.label}</div>
                <div style={{ fontSize: '10px', color: 'rgba(155,191,202,0.5)' }}>{stat.labelZh}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Daily Tasks */}
            <div>
              <div
                style={{
                  fontSize: '12px',
                  letterSpacing: '0.1em',
                  color: 'rgba(56,189,248,0.6)',
                  fontFamily: 'ui-monospace, monospace',
                  marginBottom: '14px',
                }}
              >
                DAILY TASKS / 今日任务 — {completedTasks}/{dailyTasks.length} complete
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dailyTasks.map(task => {
                  const done = task.completedCount >= task.targetCount
                  return (
                    <div
                      key={task.id}
                      style={{
                        background: done ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${done ? 'rgba(52,211,153,0.3)' : 'rgba(155,191,202,0.12)'}`,
                        borderRadius: '10px',
                        padding: '14px 16px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: done ? '#34D399' : '#ECFBFF', marginBottom: '2px' }}>
                            {done ? '✓ ' : ''}{task.title}
                          </div>
                          <div style={{ fontSize: '11px', color: '#9BBFCA' }}>{task.titleZh}</div>
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#FFD76A',
                            fontFamily: 'ui-monospace, monospace',
                            padding: '2px 6px',
                            border: '1px solid rgba(255,215,106,0.3)',
                            borderRadius: '4px',
                            height: 'fit-content',
                          }}
                        >
                          +{task.xp} XP
                        </div>
                      </div>
                      <ProgressBar value={task.completedCount} max={task.targetCount} color={done ? '#34D399' : '#38BDF8'} />
                      <div style={{ fontSize: '11px', color: 'rgba(155,191,202,0.5)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{task.completedCount} / {task.targetCount}</span>
                        {!done && (
                          <button
                            onClick={() => completeTaskUnit(task.id, 1)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'rgba(56,189,248,0.6)',
                              cursor: 'pointer',
                              fontSize: '11px',
                              padding: 0,
                            }}
                          >
                            +1 (mock)
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Learning Paths */}
            <div>
              <div
                style={{
                  fontSize: '12px',
                  letterSpacing: '0.1em',
                  color: 'rgba(56,189,248,0.6)',
                  fontFamily: 'ui-monospace, monospace',
                  marginBottom: '14px',
                }}
              >
                LEARNING PATHS / 学习路径
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {learningPaths.map(path => (
                  <Link
                    key={path.label}
                    href={path.href}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '16px 12px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(155,191,202,0.12)',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.borderColor = `${path.color}50`)}
                    onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(155,191,202,0.12)')}
                  >
                    <span style={{ fontSize: '22px' }}>{path.icon}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: path.color, textAlign: 'center' }}>
                      {path.label}
                    </span>
                    <span style={{ fontSize: '10px', color: '#9BBFCA' }}>{path.labelZh}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
