'use client'

import type { GalaxyProgress } from '@/lib/lexiverse/lexiverse-types'
import { LiquidGlassPanel } from './liquid-ui'

export interface GalaxyHUDProps {
  galaxyTitle: string
  galaxyTitleZh: string
  progress: GalaxyProgress
}

export function GalaxyHUD({ galaxyTitle, galaxyTitleZh, progress }: GalaxyHUDProps) {
  const pct = Math.round(progress.masteryRatio * 100)
  const unlockable = Math.max(0, progress.learnedWords - Math.round(progress.totalWords * progress.masteryRatio))
  const locked = Math.max(0, progress.totalWords - progress.learnedWords)

  return (
    <LiquidGlassPanel
      padding="14px 16px"
      style={{
        width: 250,
        background: 'rgba(186,220,252,0.16)',
        borderColor: 'rgba(190,228,255,0.28)',
        borderRadius: 14,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{ fontSize: 11, letterSpacing: '0.12em', color: '#6F8AA0', fontFamily: "'Space Mono', monospace" }}>
          YOUR GALAXY · 词汇星系
        </span>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#7EF9FF', fontFamily: "'Space Mono', monospace" }}>
          {pct}%
        </span>
      </div>

      <div style={{ height: 4, borderRadius: 2, background: 'rgba(190,228,255,0.28)', overflow: 'hidden', marginBottom: 12 }}>
        <i style={{ display: 'block', height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #38BDF8, #7EF9FF)', borderRadius: 2, transition: 'width 0.5s cubic-bezier(0.22,1,0.36,1)' }} />
      </div>

      <div style={{ fontSize: 12, color: '#CFE6F2', marginBottom: 10 }}>
        {galaxyTitle} <span style={{ color: '#6F8AA0' }}>· {galaxyTitleZh}</span>
      </div>

      <div style={{ display: 'flex', gap: 14 }}>
        <Stat value={Math.round(progress.totalWords * progress.masteryRatio)} label="Mastered · 已掌握" color="#7EF9FF" />
        <Stat value={unlockable} label="Unlockable · 待解锁" color="#38BDF8" />
        <Stat value={locked} label="Locked · 静默" color="#7D8AA0" />
      </div>
    </LiquidGlassPanel>
  )
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <b style={{ fontSize: 16, fontWeight: 700, color, fontFamily: "'Space Mono', monospace", lineHeight: 1 }}>{value}</b>
      <span style={{ fontSize: 9.5, color: '#6F8AA0' }}>{label}</span>
    </div>
  )
}
