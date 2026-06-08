'use client'

import Link from 'next/link'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { useLearningStore } from '@/store/learningStore'

interface MissionProgress {
  litCount: number
  reviewCount: number
  pronunciationCount: number
}

interface Props {
  progress: MissionProgress
}

function getTargets(level: string | null) {
  switch (level) {
    case 'beginner':
    case 'elementary':
      return { light: 3, review: 1, pronunciation: 3 }
    case 'advanced':
    case 'exam-prep':
      return { light: 8, review: 3, pronunciation: 8 }
    default: // intermediate + null
      return { light: 5, review: 2, pronunciation: 5 }
  }
}

export function TodayMissionPanel({ progress }: Props) {
  const { userLevel } = useLearningStore()
  const t = getTargets(userLevel)

  const MISSIONS = [
    {
      id: 'light',
      label: `Light ${t.light} word nodes`,
      labelZh: `点亮 ${t.light} 个词汇节点`,
      current: (p: MissionProgress) => Math.min(p.litCount, t.light),
      target: t.light,
      reward: 15,
      href: '/lexigraph',
      icon: '✦',
      color: 'var(--teal-ink)',
      colorRaw: '#0e8c7a',
    },
    {
      id: 'review',
      label: `Add ${t.review} word${t.review > 1 ? 's' : ''} to review`,
      labelZh: `加入 ${t.review} 个单词到复习`,
      current: (p: MissionProgress) => Math.min(p.reviewCount, t.review),
      target: t.review,
      reward: 10,
      href: '/dictionary',
      icon: '+',
      color: '#34D399',
      colorRaw: '#34D399',
    },
    {
      id: 'pronunciation',
      label: `Play pronunciation ${t.pronunciation}×`,
      labelZh: `播放 ${t.pronunciation} 次发音`,
      current: (p: MissionProgress) => Math.min(p.pronunciationCount, t.pronunciation),
      target: t.pronunciation,
      reward: 8,
      href: '/lexigraph',
      icon: '🔊',
      color: 'var(--teal-ink)',
      colorRaw: '#0e8c7a',
    },
  ]

  const completedCount = MISSIONS.filter(m => m.current(progress) >= m.target).length
  const allDone = completedCount === MISSIONS.length

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: 'var(--card-shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <SectionHeader label="TODAY'S MISSIONS" labelZh="每日任务" theme="light" style={{ margin: 0 }} />
        {allDone && (
          <span style={{ fontSize: '11px', color: '#34D399', fontFamily: 'var(--font-mono)' }}>
            ✓ All done! 全部完成!
          </span>
        )}
        {!allDone && (
          <span style={{ fontSize: '11px', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
            {completedCount}/{MISSIONS.length}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
        {MISSIONS.map(m => {
          const cur = m.current(progress)
          const done = cur >= m.target
          const pct = Math.min(100, (cur / m.target) * 100)
          return (
            <Link
              key={m.id}
              href={m.href}
              style={{
                textDecoration: 'none',
                display: 'block',
                padding: '12px 14px',
                borderRadius: '8px',
                background: done ? `${m.colorRaw}08` : 'var(--card-2)',
                border: `1px solid ${done ? m.colorRaw + '30' : 'var(--line)'}`,
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ fontSize: '14px' }}>{m.icon}</span>
                  <span style={{ fontSize: '13px', color: done ? m.color : 'var(--ink)', fontWeight: done ? 600 : 400 }}>
                    {m.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--gold-ink)', fontFamily: 'var(--font-mono)', opacity: 0.8 }}>
                    +{m.reward}★
                  </span>
                  <span style={{ fontSize: '11px', color: done ? m.color : 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
                    {cur}/{m.target}
                  </span>
                </div>
              </div>
              {/* Progress bar — animated via CSS on mount */}
              <div style={{ height: '3px', background: 'var(--line)', borderRadius: '2px', overflow: 'hidden', position: 'relative' }}>
                <div
                  className={`mission-bar-fill${done ? ' mission-sweep' : ''}`}
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: done ? m.color : `${m.colorRaw}80`,
                    borderRadius: '2px',
                    position: 'relative',
                  }}
                />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ink-muted)', marginTop: '4px' }}>
                {m.labelZh}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
