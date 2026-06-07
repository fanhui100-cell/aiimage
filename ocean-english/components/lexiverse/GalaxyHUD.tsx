'use client'
// components/lexiverse/GalaxyHUD.tsx
// Stage-B placeholder. Renders galaxy-specific progress when a galaxy is open.
import type { GalaxyProgress } from '@/lib/lexiverse/lexiverse-types'
import { LiquidGlassPanel, LiquidStatPill } from './liquid-ui'

export interface GalaxyHUDProps {
  galaxyTitle: string
  galaxyTitleZh: string
  progress: GalaxyProgress
}

export function GalaxyHUD({ galaxyTitle, galaxyTitleZh, progress }: GalaxyHUDProps) {
  const pct = Math.round(progress.masteryRatio * 100)
  return (
    <LiquidGlassPanel padding={14} style={{ minWidth: 280 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{ fontSize: 11, letterSpacing: '0.14em', color: 'rgba(126,249,255,0.55)', fontFamily: "'Space Mono', monospace" }}>
          {galaxyTitle.toUpperCase()} · {galaxyTitleZh}
        </span>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#7EF9FF', fontFamily: "'Space Mono', monospace" }}>{pct}%</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'rgba(126,249,255,0.12)', overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #38BDF8, #7EF9FF)', borderRadius: 2, transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <LiquidStatPill value={progress.learnedWords} label="Learned" color="#7EF9FF" />
        <LiquidStatPill value={progress.reviewWords} label="Review" color="#FFA85A" />
        <LiquidStatPill value={progress.weakWords} label="Weak" color="#FF8FA8" />
        <LiquidStatPill value={`${progress.learnedWords}/${progress.totalWords}`} label="Total" color="#9FB6C6" />
      </div>
    </LiquidGlassPanel>
  )
}
