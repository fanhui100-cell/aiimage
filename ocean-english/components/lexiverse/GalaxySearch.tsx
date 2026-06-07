'use client'

import { useMemo, useState } from 'react'
import type { LexiverseGalaxy } from '@/lib/lexiverse/lexiverse-types'
import { LIQUID, LiquidGlassCard } from './liquid-ui'

export interface GalaxySearchProps {
  galaxies: LexiverseGalaxy[]
  onSelect: (galaxyId: string) => void
}

export function GalaxySearch({ galaxies, onSelect }: GalaxySearchProps) {
  const [q, setQ] = useState('')
  const lower = q.toLowerCase().trim()
  const matches = useMemo(() => {
    if (!lower) return [] as LexiverseGalaxy[]
    return galaxies
      .filter((g) => g.title.toLowerCase().includes(lower) || g.titleZh.includes(q))
      .slice(0, 6)
  }, [galaxies, lower, q])

  return (
    <div style={{ position: 'relative', width: 260, zIndex: 20, marginBottom: matches.length > 0 ? 44 : 0 }}>
      <input
        type="text"
        value={q}
        onChange={(event) => setQ(event.target.value)}
        placeholder="Search galaxy · 搜索星系"
        aria-label="Search galaxies"
        autoComplete="off"
        style={{
          width: '100%',
          padding: '9px 14px',
          borderRadius: 11,
          background: 'rgba(186,220,252,0.16)',
          border: '1px solid rgba(190,228,255,0.30)',
          color: LIQUID.text,
          fontFamily: 'inherit',
          fontSize: 13,
          outline: 'none',
          backdropFilter: 'blur(24px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
        }}
      />
      {matches.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 40 }}>
          <LiquidGlassCard accent="#7EF9FF" style={{ padding: 4, background: 'rgba(186,220,252,0.16)', borderColor: 'rgba(190,228,255,0.30)' }}>
            {matches.map((galaxy) => (
              <button
                key={galaxy.id}
                type="button"
                onClick={() => {
                  onSelect(galaxy.id)
                  setQ('')
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '7px 9px',
                  borderRadius: 7,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: LIQUID.text,
                  fontFamily: 'inherit',
                  fontSize: 12.5,
                  textAlign: 'left',
                }}
                onMouseEnter={(event) => { event.currentTarget.style.background = 'rgba(126,249,255,0.06)' }}
                onMouseLeave={(event) => { event.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: galaxy.colorTheme ?? '#7EF9FF', boxShadow: `0 0 6px ${galaxy.colorTheme ?? '#7EF9FF'}` }} />
                <span>{galaxy.title}</span>
                <span style={{ color: LIQUID.textMuted, fontSize: 11 }}>· {galaxy.titleZh}</span>
              </button>
            ))}
          </LiquidGlassCard>
        </div>
      )}
    </div>
  )
}
