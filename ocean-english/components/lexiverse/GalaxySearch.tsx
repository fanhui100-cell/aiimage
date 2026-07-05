'use client'
// components/lexiverse/GalaxySearch.tsx
// Quick search across galaxy titles. Filters in-place; click jumps the
// camera. Used only in the universe view (Stage A).
import { useState, useMemo } from 'react'
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
      .filter(g => g.title.toLowerCase().includes(lower) || g.titleZh.includes(q))
      .slice(0, 6)
  }, [lower, q, galaxies])

  return (
    <div style={{ position: 'relative', width: 260 }}>
      <input
        type="text"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search galaxy · 搜索星系"
        aria-label="Search galaxies"
        style={{
          width: '100%',
          padding: '9px 14px',
          borderRadius: 11,
          background: LIQUID.bg,
          border: `1px solid ${LIQUID.border}`,
          color: LIQUID.text,
          fontFamily: 'inherit',
          fontSize: 13,
          outline: 'none',
          backdropFilter: LIQUID.blur,
          WebkitBackdropFilter: LIQUID.blur,
        }}
      />
      {matches.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 1 }}>
          <LiquidGlassCard accent="#7EF9FF" style={{ padding: 4 }}>
            {matches.map(g => (
              <button
                key={g.id}
                type="button"
                onMouseDown={e => { e.preventDefault(); onSelect(g.id); setQ('') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 9px',
                  borderRadius: 7, background: 'transparent', border: 'none', cursor: 'pointer',
                  color: LIQUID.text, fontFamily: 'inherit', fontSize: 12.5, textAlign: 'left',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(126,249,255,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: g.colorTheme ?? '#7EF9FF', boxShadow: `0 0 6px ${g.colorTheme ?? '#7EF9FF'}` }} />
                <span>{g.title}</span>
                <span style={{ color: LIQUID.textMuted, fontSize: 11 }}>· {g.titleZh}</span>
              </button>
            ))}
          </LiquidGlassCard>
        </div>
      )}
    </div>
  )
}
