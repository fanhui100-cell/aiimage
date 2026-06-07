'use client'

import { LiquidGlassPanel } from './liquid-ui'
import type { PlanetLearningState } from '@/lib/lexiverse/lexiverse-types'

const STATES: { id: PlanetLearningState; label: string; zh: string; color: string }[] = [
  { id: 'mastered', label: 'Mastered', zh: '已掌握', color: '#7EF9FF' },
  { id: 'recommended', label: 'Recommended', zh: '推荐', color: '#FFD66B' },
  { id: 'learning', label: 'Learning', zh: '学习中', color: '#38BDF8' },
  { id: 'review', label: 'Review', zh: '待复习', color: '#FFA85A' },
  { id: 'weak', label: 'Weak', zh: '薄弱', color: '#FF8FA8' },
  { id: 'unknown', label: 'Unknown', zh: '未学习', color: '#9FB6C6' },
  { id: 'locked', label: 'Locked', zh: '静默', color: '#52617A' },
]

export function LearningStateLegend() {
  return (
    <LiquidGlassPanel padding={10} style={{ display: 'flex', flexDirection: 'column', gap: 5, background: 'rgba(186,220,252,0.16)', borderColor: 'rgba(190,228,255,0.30)' }}>
      {STATES.map((state) => (
        <div key={state.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: state.color, boxShadow: `0 0 6px ${state.color}` }} />
          <span style={{ fontSize: 10.5, color: '#9FB6C6', fontFamily: "'Space Mono', monospace", whiteSpace: 'nowrap' }}>
            <span style={{ color: '#CFE6F2' }}>{state.label}</span> · {state.zh}
          </span>
        </div>
      ))}
    </LiquidGlassPanel>
  )
}
