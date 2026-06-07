'use client'
// components/lexiverse/GalaxyLayer.tsx
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 · Stage D + Sector Model
//
// LOD behaviour (discrete, camera-driven via focusSectorId):
//   Overview (focusSectorId = null):  SectorGlows visible, no planets
//   Sector focus (focusSectorId set): focused SectorGlow hidden → planets shown;
//                                     other SectorGlows dimmed to 0.5 opacity
//
// Accepts `prebuilt` to skip internal buildGalaxy() call when the Shell
// has already materialised the galaxy (avoids double build).
// ─────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react'

import { getGalaxyById } from '@/config/lexiverse-galaxies'
import { buildGalaxy } from '@/lib/lexiverse/lexiverse-galaxy-builder'
import { resolveLearningState } from '@/lib/lexiverse/lexiverse-learning-state'
import { useLexiverseDictionary } from '@/lib/lexiverse/useLexiverseDictionary'
import type { BuiltGalaxy, LexiversePlanet, LexiverseStoreSlices } from '@/lib/lexiverse/lexiverse-types'
import type { EchoesAPI } from './useCrossGalaxyEchoes'
import { PlanetNode } from './PlanetNode'
import { GalaxyEdges } from './GalaxyEdges'
import { EnergyPulses } from './EnergyPulses'
import { BurstPool } from './BurstPool'
import { SectorGlow } from './SectorGlow'

export interface GalaxyLayerProps {
  galaxyId: string
  slices?: LexiverseStoreSlices
  selectedPlanetId?: string | null
  onSelectPlanet: (planetId: string | null) => void
  recentlyMasteredIds?: string[]
  /** STAGE D · cross-galaxy echo API */
  echoes?: EchoesAPI
  /** STAGE D · review-overdue word ids */
  overdueWordIds?: string[]
  /** Sector model · pre-built galaxy from Shell (avoids double build) */
  prebuilt?: BuiltGalaxy | null
  /** Sector model · currently focused sector id (null = galaxy overview) */
  focusSectorId: string | null
  /** Sector model · called when user clicks a SectorGlow */
  onFocusSector: (id: string | null) => void
}

const EMPTY_SLICES: LexiverseStoreSlices = { savedWords: [], litWords: [], reviewWordIds: [], weakWordIds: [] }

export function GalaxyLayer({
  galaxyId,
  slices = EMPTY_SLICES,
  selectedPlanetId,
  onSelectPlanet,
  recentlyMasteredIds = [],
  echoes,
  overdueWordIds = [],
  prebuilt,
  focusSectorId,
  onFocusSector,
}: GalaxyLayerProps) {
  const galaxy = getGalaxyById(galaxyId)
  const { words: dictWords } = useLexiverseDictionary()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Use prebuilt from Shell when available; only call buildGalaxy as fallback
  const built = useMemo<BuiltGalaxy | null>(() => {
    if (prebuilt != null) return prebuilt
    if (!galaxy || dictWords.length === 0) return null
    return buildGalaxy(galaxy, dictWords)
  }, [prebuilt, galaxy, dictWords])

  const overdueSet = useMemo(() => new Set(overdueWordIds), [overdueWordIds])

  // Planets for the FOCUSED sector only (with learning states applied)
  const focusedPlanets = useMemo<LexiversePlanet[]>(() => {
    if (!built || !focusSectorId) return []
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
    const inSector = built.planets.filter(p => p.sectorId === focusSectorId)
    const trimmed = isMobile ? inSector.slice(0, Math.ceil(inSector.length / 2)) : inSector
    return trimmed.map(p => ({
      ...p,
      learningState: resolveLearningState({ wordId: p.wordId, normalizedWord: p.normalizedWord, slices }),
    }))
  }, [built, focusSectorId, slices])

  // Edges within the focused sector only
  const focusedEdges = useMemo(() => {
    if (!built || !focusSectorId) return []
    const ids = new Set(focusedPlanets.map(p => p.id))
    return built.edges.filter(e => ids.has(e.source) && ids.has(e.target))
  }, [built, focusSectorId, focusedPlanets])

  if (!galaxy || !built) return null
  const pos = galaxy.visualPosition

  return (
    <group position={[pos.x, pos.y, pos.z]}>
      {/* ── Sector glows (always rendered; dimmed when another sector is focused) ── */}
      {built.sectors.map(s => {
        if (focusSectorId === s.id) return null   // hide glow for the focused sector
        const opacity = focusSectorId ? 0.5 : 1.0
        return (
          <SectorGlow
            key={s.id}
            sector={s}
            opacity={opacity}
            onClick={() => onFocusSector(s.id)}
          />
        )
      })}

      {/* ── Planet field (only visible when a sector is focused) ─────────── */}
      {focusSectorId && (
        <>
          <GalaxyEdges planets={focusedPlanets} edges={focusedEdges} />
          <EnergyPulses planets={focusedPlanets} edges={focusedEdges} />
          {focusedPlanets.map(p => (
            <PlanetNode
              key={p.id}
              planet={p}
              isSelected={selectedPlanetId === p.id}
              isHovered={hoveredId === p.id}
              onSelect={(id) => onSelectPlanet(id)}
              onHover={setHoveredId}
              echoing={echoes?.has(galaxyId, p.wordId) ?? false}
              isReviewOverdue={overdueSet.has(p.wordId)}
            />
          ))}
          <BurstPool planets={focusedPlanets} triggerIds={recentlyMasteredIds} />
        </>
      )}
    </group>
  )
}
