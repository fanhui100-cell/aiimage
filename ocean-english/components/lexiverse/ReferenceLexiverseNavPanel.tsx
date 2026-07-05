'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { GALAXIES, getGalaxyById } from '@/config/lexiverse-galaxies'
import { buildGalaxy } from '@/lib/lexiverse/lexiverse-galaxy-builder'
import { resolveLearningState } from '@/lib/lexiverse/lexiverse-learning-state'
import { useLexiverseDictionary } from '@/lib/lexiverse/useLexiverseDictionary'
import type { PlanetLearningState } from '@/lib/lexiverse/lexiverse-types'
import { useLexiverseSlices } from './useLexiverseSlices'
import { LIQUID, LiquidBadge, LiquidGlassPanel } from './liquid-ui'

type ReferenceGalaxy = {
  id: string
  title: string
  titleZh: string
  sourceType: string
  colorTheme?: string
}

const STATE_COLORS: Record<PlanetLearningState, string> = {
  mastered: '#7EF9FF',
  recommended: '#FFD66B',
  learning: '#38BDF8',
  review: '#FFA85A',
  weak: '#FF8FA8',
  unknown: '#9FB6C6',
  locked: '#52617A',
}

export function ReferenceLexiverseNavPanel({
  galaxies,
  onPreviewGalaxy,
}: {
  galaxies?: ReferenceGalaxy[]
  onPreviewGalaxy?: (id: string) => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const galaxyId = searchParams.get('galaxy')
  const [collapsed, setCollapsed] = useState(false)
  const [query, setQuery] = useState('')
  const [stateFilter, setStateFilter] = useState<'all' | PlanetLearningState>('all')
  const { words } = useLexiverseDictionary()
  const slices = useLexiverseSlices()
  const navGalaxies = galaxies?.length ? galaxies : GALAXIES

  const currentGalaxy = galaxyId ? getGalaxyById(galaxyId) : null
  const currentNavGalaxy = galaxyId ? navGalaxies.find(galaxy => galaxy.id === galaxyId) : null
  const builtGalaxy = useMemo(() => {
    if (!currentGalaxy || !words.length) return null
    return buildGalaxy(currentGalaxy, words)
  }, [currentGalaxy, words])

  const q = query.trim().toLowerCase()
  const galaxyRows = useMemo(() => {
    return navGalaxies.filter(g => {
      if (!q) return true
      return `${g.title} ${g.titleZh} ${g.sourceType}`.toLowerCase().includes(q)
    })
  }, [navGalaxies, q])

  const planetRows = useMemo(() => {
    if (!builtGalaxy) return []
    return builtGalaxy.planets
      .map(planet => ({
        ...planet,
        learningState: resolveLearningState({ wordId: planet.wordId, normalizedWord: planet.normalizedWord, slices }),
      }))
      .filter(planet => {
        if (q && !`${planet.word} ${planet.definition ?? ''} ${planet.cefrLevel ?? ''}`.toLowerCase().includes(q)) return false
        return stateFilter === 'all' || planet.learningState === stateFilter
      })
      .slice(0, 120)
  }, [builtGalaxy, q, slices, stateFilter])

  const updateSearch = (patch: Record<string, string | null>) => {
    const sp = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) sp.delete(key)
      else sp.set(key, value)
    }
    const next = sp.toString()
    router.replace(next ? `${pathname}?${next}` : pathname)
  }

  return (
    <div style={styles.root}>
      <button
        type="button"
        onClick={() => setCollapsed(v => !v)}
        aria-label={collapsed ? 'Open Lexiverse navigation' : 'Collapse Lexiverse navigation'}
        style={styles.toggle}
      >
        {collapsed ? '>' : '<'}
      </button>
      {!collapsed && (
        <LiquidGlassPanel padding={14} style={styles.panel}>
          <div style={styles.head}>
            <div>
              <div style={styles.kicker}>{galaxyId ? 'GALAXY WORDS' : 'GALAXIES'}</div>
              <strong style={styles.title}>
                {currentGalaxy?.title ?? currentNavGalaxy?.title ?? 'Lexiverse'}
              </strong>
            </div>
            <LiquidBadge color="#7EF9FF" size="sm">{galaxyId ? planetRows.length : galaxyRows.length}</LiquidBadge>
          </div>

          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={galaxyId ? 'Search words...' : 'Search galaxies...'}
            style={styles.input}
          />

          {galaxyId && (
            <div style={styles.filters}>
              {(['all', 'mastered', 'learning', 'review', 'unknown'] as const).map(value => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStateFilter(value)}
                  style={{
                    ...styles.filterButton,
                    color: stateFilter === value ? '#7EF9FF' : LIQUID.textMuted,
                    borderColor: stateFilter === value ? 'rgba(126,249,255,0.55)' : LIQUID.border,
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
          )}

          <div style={styles.list}>
            {!galaxyId && galaxyRows.map(galaxy => (
              <button
                key={galaxy.id}
                type="button"
                onClick={() => onPreviewGalaxy?.(galaxy.id)}
                style={styles.row}
              >
                <span style={{ ...styles.dot, background: galaxy.colorTheme ?? '#7EF9FF', boxShadow: `0 0 10px ${galaxy.colorTheme ?? '#7EF9FF'}` }} />
                <span style={styles.rowText}>
                  <strong>{galaxy.title}</strong>
                  <small>{galaxy.titleZh}</small>
                </span>
                <em style={styles.rowMeta}>{galaxy.sourceType}</em>
              </button>
            ))}

            {galaxyId && planetRows.map(planet => (
              <button
                key={planet.id}
                type="button"
                onClick={() => updateSearch({ planet: planet.id })}
                style={styles.row}
              >
                <span style={{ ...styles.dot, background: STATE_COLORS[planet.learningState], boxShadow: `0 0 10px ${STATE_COLORS[planet.learningState]}` }} />
                <span style={styles.rowText}>
                  <strong>{planet.word}</strong>
                  <small>{planet.definition ?? planet.learningState}</small>
                </span>
                <em style={styles.rowMeta}>{planet.cefrLevel ?? '-'}</em>
              </button>
            ))}
          </div>
        </LiquidGlassPanel>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    position: 'fixed',
    top: 72,
    left: 16,
    zIndex: 20,
    pointerEvents: 'auto',
  },
  toggle: {
    position: 'absolute',
    top: 10,
    right: -18,
    width: 22,
    height: 42,
    borderRadius: '0 10px 10px 0',
    border: `1px solid ${LIQUID.border}`,
    background: 'rgba(10,14,24,0.72)',
    color: '#7EF9FF',
    cursor: 'pointer',
    zIndex: 2,
  },
  panel: {
    width: 270,
    maxHeight: 'calc(100vh - 96px)',
    display: 'flex',
    flexDirection: 'column',
  },
  head: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  kicker: {
    color: 'rgba(126,249,255,0.62)',
    fontSize: 10,
    letterSpacing: '0.14em',
    fontFamily: "'Space Mono', monospace",
  },
  title: {
    display: 'block',
    marginTop: 4,
    color: '#ECFBFF',
    fontSize: 16,
  },
  input: {
    width: '100%',
    padding: '10px 11px',
    borderRadius: 10,
    border: `1px solid ${LIQUID.border}`,
    background: 'rgba(255,255,255,0.035)',
    color: '#ECFBFF',
    outline: 'none',
    fontSize: 13,
    marginBottom: 10,
  },
  filters: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  filterButton: {
    padding: '4px 7px',
    borderRadius: 999,
    border: '1px solid',
    background: 'rgba(255,255,255,0.025)',
    cursor: 'pointer',
    fontSize: 10.5,
    fontFamily: "'Space Mono', monospace",
  },
  list: {
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
    paddingRight: 3,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '10px minmax(0, 1fr) auto',
    gap: 9,
    alignItems: 'center',
    border: `1px solid rgba(126,249,255,0.10)`,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.03)',
    color: '#ECFBFF',
    padding: '9px 10px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  dot: { width: 8, height: 8, borderRadius: '50%' },
  rowText: { minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 },
  rowMeta: { color: '#6F8AA0', fontSize: 10, fontStyle: 'normal', fontFamily: "'Space Mono', monospace" },
}
