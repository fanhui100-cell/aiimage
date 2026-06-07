'use client'

import Link from 'next/link'
import { SectionHeader } from '@/components/ui/SectionHeader'

interface MissionProgress {
  litCount: number
  reviewCount: number
  pronunciationCount: number
}

interface Props {
  progress: MissionProgress
}

const MISSIONS = [
  {
    id: 'light',
    label: 'Light 3 word nodes',
    labelZh: '点亮 3 个词汇节点',
    current: (p: MissionProgress) => Math.min(p.litCount, 3),
    target: 3,
    reward: 15,
    href: '/lexigraph',
    icon: '✦',
    color: '#7EF9FF',
  },
  {
    id: 'review',
    label: 'Add 1 word to review',
    labelZh: '加入 1 个单词到复习',
    current: (p: MissionProgress) => Math.min(p.reviewCount, 1),
    target: 1,
    reward: 10,
    href: '/dictionary',
    icon: '+',
    color: '#34D399',
  },
  {
    id: 'pronunciation',
    label: 'Play pronunciation 3×',
    labelZh: '播放 3 次发音',
    current: (p: MissionProgress) => Math.min(p.pronunciationCount, 3),
    target: 3,
    reward: 8,
    href: '/lexigraph',
    icon: '🔊',
    color: '#38BDF8',
  },
]

export function TodayMissionPanel({ progress }: Props) {
  const completedCount = MISSIONS.filter(m => m.current(progress) >= m.target).length
  const allDone = completedCount === MISSIONS.length

  return (
    <div
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        padding: '20px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <SectionHeader label="TODAY'S MISSIONS" labelZh="每日任务" style={{ margin: 0 }} />
        {allDone && (
          <span style={{ fontSize: '11px', color: '#34D399', fontFamily: 'var(--font-mono)' }}>
            ✓ All done! 全部完成!
          </span>
        )}
        {!allDone && (
          <span style={{ fontSize: '11px', color: 'rgba(155,191,202,0.4)', fontFamily: 'var(--font-mono)' }}>
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
                background: done ? `${m.color}08` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${done ? m.color + '30' : 'rgba(155,191,202,0.1)'}`,
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ fontSize: '14px' }}>{m.icon}</span>
                  <span style={{ fontSize: '13px', color: done ? m.color : '#ECFBFF', fontWeight: done ? 600 : 400 }}>
                    {m.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,215,106,0.7)', fontFamily: 'var(--font-mono)' }}>
                    +{m.reward}★
                  </span>
                  <span style={{ fontSize: '11px', color: done ? m.color : 'rgba(155,191,202,0.4)', fontFamily: 'var(--font-mono)' }}>
                    {cur}/{m.target}
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: done ? m.color : `${m.color}80`,
                    borderRadius: '2px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(155,191,202,0.4)', marginTop: '4px' }}>
                {m.labelZh}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
