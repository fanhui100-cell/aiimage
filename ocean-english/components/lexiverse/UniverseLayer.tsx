'use client'
// components/lexiverse/UniverseLayer.tsx
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 · Stage D — outer universe layer with mastery + echo plumbing.
//
// Deltas: forwards `masteryByGalaxyId` and `echoGalaxyIds` to GalaxyNode.
// ─────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react'
import * as THREE from 'three'

import type { LexiverseGalaxy } from '@/lib/lexiverse/lexiverse-types'
import { CONSTELLATIONS } from '@/config/lexiverse-galaxies'
import { GalaxyNode } from './GalaxyNode'
import type { GalaxyMasteryRow } from './useGalaxyMastery'

export interface UniverseLayerProps {
  galaxies: LexiverseGalaxy[]
  currentGalaxyId: string | null
  onSelectGalaxy: (id: string) => void
  onHoverGalaxy?: (galaxy: LexiverseGalaxy | null) => void
  /** STAGE D · per-galaxy mastery rows */
  masteryByGalaxyId?: Record<string, GalaxyMasteryRow>
  /** STAGE D · galaxy ids currently echoing */
  echoGalaxyIds?: Set<string>
}

export function UniverseLayer({ galaxies, currentGalaxyId, onSelectGalaxy, onHoverGalaxy, masteryByGalaxyId, echoGalaxyIds }: UniverseLayerProps) {
  const layerOpacity = currentGalaxyId ? 0.35 : 1.0
  return (
    <group>
      <ConstellationHulls opacity={layerOpacity} />
      {galaxies.map(g => (
        <GalaxyNode
          key={g.id}
          galaxy={g}
          opacity={layerOpacity}
          isSelected={g.id === currentGalaxyId}
          isMuted={currentGalaxyId !== null && g.id !== currentGalaxyId}
          onClick={() => onSelectGalaxy(g.id)}
          onHoverChange={onHoverGalaxy}
          masteryRatio={masteryByGalaxyId?.[g.id]?.ratio ?? 0}
          echoing={echoGalaxyIds?.has(g.id) ?? false}
        />
      ))}
    </group>
  )
}

function ConstellationHulls({ opacity }: { opacity: number }) {
  const hullTex = useMemo(() => makeRadialGradientTexture(), [])
  return (
    <group>
      {CONSTELLATIONS.map(c => (
        <sprite key={c.id} position={[c.centroid.x, c.centroid.y, c.centroid.z]} scale={[260, 260, 1]}>
          <spriteMaterial map={hullTex} color={c.color} transparent opacity={0.10 * opacity}
            blending={THREE.AdditiveBlending} depthWrite={false} />
        </sprite>
      ))}
    </group>
  )
}

function makeRadialGradientTexture() {
  if (typeof document === 'undefined') return null as unknown as THREE.Texture
  const s = 256, c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2)
  g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(0.5, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
