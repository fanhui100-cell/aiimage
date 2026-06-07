'use client'
// components/lexiverse/GalaxyLayer.tsx
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 · Stage D — galaxy interior with cross-galaxy echoes + SR satellites.
//
// Deltas:
//   · `echoes` prop → PlanetNode.echoing for words just lit in OTHER galaxies
//   · review-overdue map → PlanetNode.isReviewOverdue → satellite orbits
// ─────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react'

import { getGalaxyById } from '@/config/lexiverse-galaxies'
import { buildGalaxy } from '@/lib/lexiverse/lexiverse-galaxy-builder'
import { resolveLearningState } from '@/lib/lexiverse/lexiverse-learning-state'
import { useLexiverseDictionary } from '@/lib/lexiverse/useLexiverseDictionary'
import type { LexiversePlanet, LexiverseStoreSlices } from '@/lib/lexiverse/lexiverse-types'
import type { EchoesAPI } from './useCrossGalaxyEchoes'
import { PlanetNode } from './PlanetNode'
import { GalaxyEdges } from './GalaxyEdges'
import { EnergyPulses } from './EnergyPulses'
import { BurstPool } from './BurstPool'

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
}: GalaxyLayerProps) {
  const galaxy = getGalaxyById(galaxyId)
  const { words: dictWords } = useLexiverseDictionary()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const built = useMemo(() => {
    if (!galaxy || dictWords.length === 0) return null
    return buildGalaxy(galaxy, dictWords)
  }, [galaxy, dictWords])

  const overdueSet = useMemo(() => new Set(overdueWordIds), [overdueWordIds])

  const planetsRendered = useMemo<LexiversePlanet[]>(() => {
    if (!built) return []
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
    const trimmed = isMobile ? built.planets.slice(0, Math.ceil(built.planets.length / 2)) : built.planets
    return trimmed.map(p => ({
      ...p,
      learningState: resolveLearningState({ wordId: p.wordId, normalizedWord: p.normalizedWord, slices }),
    }))
  }, [built, slices])

  if (!galaxy || !built) return null
  const pos = galaxy.visualPosition

  return (
    <group position={[pos.x, pos.y, pos.z]}>
      <GalaxyEdges planets={planetsRendered} edges={built.edges} />
      <EnergyPulses planets={planetsRendered} edges={built.edges} />
      {planetsRendered.map(p => (
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
      <BurstPool planets={planetsRendered} triggerIds={recentlyMasteredIds} />
    </group>
  )
}
