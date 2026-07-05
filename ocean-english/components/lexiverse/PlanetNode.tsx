'use client'
// components/lexiverse/PlanetNode.tsx
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 · Stage D — planet renderer with echo pulse + review satellite.
//
// Deltas over Stage B/C:
//   · `echoing` prop → cross-galaxy echo: brief halo brightening + scale bump
//   · `isReviewOverdue` prop → mount <ReviewSatellite> orbiting the planet
//
// Other behaviour (archetype, breathing, ring overlay, label) unchanged.
// ─────────────────────────────────────────────────────────────────────────

import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Html } from '@react-three/drei'
import * as THREE from 'three'

import type { LexiversePlanet, PlanetLearningState } from '@/lib/lexiverse/lexiverse-types'
import { glowLevelFor, ringColorFor } from '@/lib/lexiverse/lexiverse-learning-state'
import { buildArchetype } from '@/lib/lexiverse/lexiverse-archetypes'
import { mulberry32, hashStr } from '@/lib/lexiverse/lexiverse-galaxy-builder'
import { ReviewSatellite } from './ReviewSatellite'

const BREATH_SPEED: Record<PlanetLearningState, number> = {
  mastered: 1.35, recommended: 1.25, learning: 1.10, review: 1.05,
  weak: 0.95, unknown: 0.75, locked: 0.45,
}

export interface PlanetNodeProps {
  planet: LexiversePlanet & { breathPhase?: number; breathSpeed?: number; seed?: number }
  isSelected?: boolean
  isHovered?: boolean
  onSelect?: (id: string) => void
  onHover?: (id: string | null) => void
  forceLabel?: boolean
  /** Stage D: cross-galaxy echo from useCrossGalaxyEchoes */
  echoing?: boolean
  /** Stage D: SR review is overdue → mount satellite */
  isReviewOverdue?: boolean
}

export function PlanetNode({ planet, isSelected, isHovered, onSelect, onHover, forceLabel, echoing, isReviewOverdue }: PlanetNodeProps) {
  const r = useMemo(() => readRadius(planet.id, planet.seed, planet.visualType), [planet.id, planet.seed, planet.visualType])
  const built = useMemo(() => {
    const seed = planet.seed ?? hashStr(planet.id)
    const rnd = mulberry32(seed)
    return buildArchetype(planet.visualType, r, planet.color ?? '#7EF9FF', rnd)
  }, [planet.id, planet.seed, planet.visualType, planet.color, r])

  useEffect(() => () => {
    built.object3D.traverse(o => {
      const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined
      if (Array.isArray(m)) m.forEach(mm => mm.dispose?.())
      else m?.dispose?.()
    })
  }, [built])

  useEffect(() => {
    const factor = glowLevelFor(planet.learningState)
    built.object3D.traverse(o => {
      const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial
      if (!m || !m.userData) return
      if (m.userData.dim) m.opacity = (m.userData.base ?? 1) * factor
    })
  }, [built, planet.learningState])

  const ringColor = ringColorFor(planet.learningState)
  const groupRef = useRef<THREE.Group>(null)
  const spinTarget = built.spinTarget ?? built.object3D

  useFrame((state, dt) => {
    if (!groupRef.current) return
    spinTarget.rotation.y += built.spin * dt

    const t = state.clock.elapsedTime
    const phase = planet.breathPhase ?? 0
    const speed = (planet.breathSpeed ?? 1) * BREATH_SPEED[planet.learningState]
    const s = 0.5 + 0.5 * Math.sin(t * speed + phase)

    // STAGE D · echo pulse — gentle scale + opacity boost while echoing
    const echoFactor = echoing ? (1 + 0.10 * Math.sin(t * 5)) : 1

    const baseScale = isSelected ? 1.18 : isHovered ? 1.08 : 1.0
    const breathAmp = planet.learningState === 'mastered' ? 0.075
                   : planet.learningState === 'learning' || planet.learningState === 'recommended' ? 0.055
                   : 0.025
    groupRef.current.scale.setScalar(baseScale * (1 + s * breathAmp) * echoFactor)
  })

  const satellitePhase = useMemo(() => (hashStr(planet.id + ':sat') % 1000) / 1000 * Math.PI * 2, [planet.id])

  return (
    <group
      ref={groupRef}
      position={[planet.position.x, planet.position.y, planet.position.z]}
      onPointerOver={e => { e.stopPropagation(); onHover?.(planet.id); document.body.style.cursor = 'pointer' }}
      onPointerOut={e => { e.stopPropagation(); onHover?.(null); document.body.style.cursor = 'auto' }}
      onClick={e => { e.stopPropagation(); onSelect?.(planet.id) }}
    >
      <primitive object={built.object3D} />

      {ringColor && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r * 1.5, r * 1.65, 48]} />
          <meshBasicMaterial color={ringColor} side={THREE.DoubleSide} transparent opacity={0.62} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      )}

      {/* STAGE D · review satellite */}
      {isReviewOverdue && <ReviewSatellite orbitRadius={r * 2.2} phase={satellitePhase} />}

      {(isSelected || isHovered || forceLabel || echoing || planet.learningState === 'mastered') && (
        <Billboard>
          <Html
            center
            distanceFactor={70}
            style={{
              pointerEvents: 'none',
              transform: `translateY(-${r * 2 + 8}px)`,
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontSize: 11,
              color: planet.learningState === 'mastered' ? '#ECFBFF' : '#CFE6F2',
              opacity: isSelected ? 1 : isHovered ? 1 : echoing ? 0.95 : planet.learningState === 'mastered' ? 0.82 : 0.55,
              whiteSpace: 'nowrap',
              textShadow: '0 0 6px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,0.95)',
              fontWeight: planet.learningState === 'mastered' ? 600 : 500,
              transition: 'opacity 0.2s ease',
            }}
          >
            {planet.word}
          </Html>
        </Billboard>
      )}
    </group>
  )
}

function readRadius(id: string, seedValue: number | undefined, visualType: LexiversePlanet['visualType']): number {
  const seed = seedValue ?? hashStr(id)
  const r = mulberry32(seed)
  r(); r(); r(); r(); r()
  switch (visualType) {
    case 'galaxy':   return 2.4 + r() * 1.4
    case 'dwarf':    return 0.6 + r() * 0.5
    case 'ringed':   return 1.5 + r() * 1.2
    case 'geodesic': return 1.6 + r() * 1.8
    default:         return 1.1 + r() * 1.7
  }
}
