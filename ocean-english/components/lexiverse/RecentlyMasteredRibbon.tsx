'use client'
// components/lexiverse/RecentlyMasteredRibbon.tsx
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 · Stage D — top-right ribbon listing the last few lit words.
//
// Each entry shows the word + the galaxy it was lit in + a "replay" button
// that flies the camera into that planet again. Displays up to 5 most
// recent entries with a 10-second TTL each.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import { LiquidGlassCard } from './liquid-ui'

const TTL_MS = 10_000

export interface MasteredEntry {
  /** display word */
  word: string
  /** galaxy id where this happened (for jump-back) */
  galaxyId: string
  /** planet id (for jump-back to the exact planet) */
  planetId: string
  /** timestamp ms */
  bornAt: number
  /** signature color */
  color?: string
}

export interface RecentlyMasteredRibbonProps {
  /** ids in trigger order — newest at the end (typically from useRecentlyMasteredIds) */
  recentlyMasteredIds: string[]
  /** id → {word, galaxyId, color} resolver (PlanetNode owner provides this) */
  resolve: (planetId: string) => { word: string; galaxyId: string; color?: string } | null
  /** click handler — usually router.push to ?galaxy=X&planet=Y */
  onReplay: (galaxyId: string, planetId: string) => void
}

export function RecentlyMasteredRibbon({ recentlyMasteredIds, resolve, onReplay }: RecentlyMasteredRibbonProps) {
  const seen = useRef<Set<string>>(new Set())
  const [entries, setEntries] = useState<MasteredEntry[]>([])

  // merge new ids
  useEffect(() => {
    const additions: MasteredEntry[] = []
    const now = performance.now()
    for (const id of recentlyMasteredIds) {
      if (seen.current.has(id)) continue
      seen.current.add(id)
      const meta = resolve(id)
      if (!meta) continue
      additions.push({ planetId: id, word: meta.word, galaxyId: meta.galaxyId, color: meta.color, bornAt: now })
    }
    if (additions.length > 0) {
      setEntries(prev => [...prev, ...additions].slice(-5))
    }
  }, [recentlyMasteredIds, resolve])

  // expiry sweeper
  useEffect(() => {
    if (entries.length === 0) return
    const t = setTimeout(() => {
      const now = performance.now()
      setEntries(prev => prev.filter(e => now - e.bornAt < TTL_MS))
    }, 1000)
    return () => clearTimeout(t)
  }, [entries])

  if (entries.length === 0) return null

  return (
    <div
      role="status"
      aria-live="polite"
      style={{ position: 'absolute', top: 110, right: 20, zIndex: 7, display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      {entries.map((e, i) => {
        const age = (performance.now() - e.bornAt) / TTL_MS
        const opacity = Math.max(0.2, 1 - age)
        return (
          <LiquidGlassCard
            key={`${e.planetId}-${i}`}
            accent={e.color ?? '#7EF9FF'}
            style={{ minWidth: 220, opacity, transition: 'opacity 0.3s ease', padding: '8px 12px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: e.color ?? '#7EF9FF', boxShadow: `0 0 6px ${e.color ?? '#7EF9FF'}` }} />
              <span style={{ fontSize: 11, color: 'rgba(126,249,255,0.65)', fontFamily: "'Space Mono', monospace", letterSpacing: '0.06em' }}>LIT · 点亮</span>
              <strong style={{ fontSize: 14, color: '#ECFBFF', fontWeight: 700 }}>{e.word}</strong>
              <button
                type="button"
                onClick={() => onReplay(e.galaxyId, e.planetId)}
                style={{
                  marginLeft: 'auto', background: 'transparent', border: 'none', color: '#9FB6C6',
                  fontFamily: 'inherit', fontSize: 11.5, cursor: 'pointer', textDecoration: 'underline',
                }}
              >
                Replay · 回看
              </button>
            </div>
          </LiquidGlassCard>
        )
      })}
    </div>
  )
}
