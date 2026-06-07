'use client'

import type { ReactNode } from 'react'
import { LiquidGlassPanel } from './liquid-ui'

export interface UniverseHUDProps {
  totalGalaxies: number
  visibleGalaxies: number
  litWordsTotal?: number
  knownWordsTotal?: number
  reviewWordsTotal?: number
}

export function UniverseHUD({
  totalGalaxies,
  visibleGalaxies,
  litWordsTotal = 0,
  knownWordsTotal = 0,
  reviewWordsTotal = 0,
}: UniverseHUDProps) {
  return (
    <LiquidGlassPanel
      padding={14}
      style={{
        minWidth: 312,
        background: 'rgba(186,220,252,0.16)',
        borderColor: 'rgba(190,228,255,0.30)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.32), 0 18px 50px rgba(2,8,26,0.45)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 13 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.14em', color: 'rgba(126,249,255,0.55)', fontFamily: "'Space Mono', monospace" }}>
          YOUR LEXIVERSE · 词汇宇宙
        </div>
        <div style={{ fontSize: 10.5, color: '#FFD66B', fontFamily: "'Space Mono', monospace", whiteSpace: 'nowrap' }}>
          LexiStar · Voyager
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px 18px' }}>
        <HudStat value={`${visibleGalaxies} / ${totalGalaxies}`} label="Galaxies · 星系" color="#7EF9FF" />
        <HudStat value={Math.max(1, Math.min(12, visibleGalaxies))} label="Active · 活跃" color="#38BDF8" />
        <HudStat value={Math.max(0, litWordsTotal)} label="Lit · 点亮" color="#6BE0A0" />
        <HudStat value={knownWordsTotal} label="Known · 已知词" color="#EAF6FF" />
        <HudStat value={litWordsTotal} label="Mastered · 已掌握" color="#BFF6FF" />
        <HudStat value={reviewWordsTotal} label="Review · 待复习" color="#FF9E6B" />
      </div>
    </LiquidGlassPanel>
  )
}

function HudStat({ value, label, color }: { value: ReactNode; label: string; color: string }) {
  return (
    <div>
      <b style={{ display: 'block', fontSize: 18, fontWeight: 700, color, fontFamily: "'Space Mono', monospace", lineHeight: 1 }}>
        {value}
      </b>
      <span style={{ display: 'block', fontSize: 9.5, color: '#7791A8', marginTop: 4 }}>
        {label}
      </span>
    </div>
  )
}
