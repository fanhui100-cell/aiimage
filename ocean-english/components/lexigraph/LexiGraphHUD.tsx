'use client'

import { useEffect } from 'react'
import { useLearningStore } from '@/store/learningStore'
import { useMotivationStore } from '@/store/useMotivationStore'
import { calculateLevel } from '@/lib/motivation/motivation-levels'
import { deriveMissions } from '@/lib/motivation/motivation-daily-missions'

export function LexiGraphHUD() {
  const { reviewWords, studyProgress } = useLearningStore()
  const {
    lexiStar, litNodeCount, dailyMissionProgress,
    resetDailyMissionsIfNewDay, seedFromV1IfNeeded,
  } = useMotivationStore()

  // Side-effectful store operations belong in useEffect, not render
  useEffect(() => {
    resetDailyMissionsIfNewDay()
    seedFromV1IfNeeded()
  }, [resetDailyMissionsIfNewDay, seedFromV1IfNeeded])

  const dueCount = reviewWords.filter(r => r.nextReviewAt <= Date.now()).length
  const { level, progress } = calculateLevel(lexiStar)
  const missions = deriveMissions(dailyMissionProgress)
  const missionsDone = missions.filter(m => m.completed).length
  const pct = Math.round(progress * 100)

  const cellStyle = (last?: boolean): React.CSSProperties => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRight: last ? undefined : '1px solid rgba(56,189,248,0.07)',
    padding: '0 4px',
    position: 'relative',
    overflow: 'hidden',
  })

  return (
    <div style={{
      display: 'flex',
      borderTop: '1px solid rgba(56,189,248,0.1)',
      background: 'rgba(2,6,23,0.92)',
      backdropFilter: 'blur(12px)',
      height: '54px',
    }}>
      {/* Nodes Lit */}
      <div style={cellStyle()}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#38BDF8', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
          {litNodeCount}
        </div>
        <div style={{ fontSize: '9px', color: 'rgba(155,191,202,0.45)', marginTop: '3px', letterSpacing: '0.04em' }}>
          Lit / 已点亮
        </div>
      </div>

      {/* Review Queue */}
      <div style={cellStyle()}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#FB923C', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
          {dueCount}
        </div>
        <div style={{ fontSize: '9px', color: 'rgba(155,191,202,0.45)', marginTop: '3px', letterSpacing: '0.04em' }}>
          Due / 待复习
        </div>
      </div>

      {/* LexiStar + Level */}
      <div style={{ ...cellStyle(), flex: 1.4 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#FBBF24', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
            ★{lexiStar}
          </span>
          <span style={{ fontSize: '9px', color: '#FBBF24', opacity: 0.8, fontFamily: 'var(--font-mono)' }}>
            Lv.{level}
          </span>
        </div>
        {/* Progress bar */}
        <div style={{ width: '72%', height: '2px', background: 'rgba(251,191,36,0.15)', borderRadius: '1px', marginTop: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: '#FBBF24', borderRadius: '1px', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Streak */}
      <div style={cellStyle()}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#34D399', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
          {studyProgress.currentStreak}d
        </div>
        <div style={{ fontSize: '9px', color: 'rgba(155,191,202,0.45)', marginTop: '3px', letterSpacing: '0.04em' }}>
          Streak / 连学
        </div>
      </div>

      {/* Daily Missions */}
      <div style={cellStyle(true)}>
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
          {missions.map(m => (
            <span
              key={m.id}
              title={`${m.title}: ${m.progress}/${m.target}`}
              style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: m.completed ? '#34D399' : 'rgba(155,191,202,0.2)',
                border: m.completed ? 'none' : '1px solid rgba(56,189,248,0.25)',
                flexShrink: 0,
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: '9px', color: 'rgba(155,191,202,0.45)', marginTop: '3px', letterSpacing: '0.04em' }}>
          {missionsDone}/{missions.length} Mission
        </div>
      </div>
    </div>
  )
}
