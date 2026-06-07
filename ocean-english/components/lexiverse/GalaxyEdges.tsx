'use client'
// components/lexiverse/GalaxyEdges.tsx
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 · Stage B — single LineSegments for ALL galaxy edges.
//
// Brightness is encoded per-vertex (vertexColors) so a single material
// renders 450+ edges in one draw call. Endpoint planet state drives
// brightness — mastered = 1.0, unlockable-like (learning/recommended) =
// 0.5, dim states (unknown/locked) = 0.12. Result: lit constellations
// pop while dim regions fade quietly into the background.
// ─────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react'
import * as THREE from 'three'
import type { LexiversePlanet } from '@/lib/lexiverse/lexiverse-types'

const STATE_BRIGHTNESS: Record<string, number> = {
  mastered: 1.0,
  recommended: 0.7,
  learning: 0.55,
  review: 0.5,
  weak: 0.35,
  unknown: 0.18,
  locked: 0.10,
}

export interface GalaxyEdgesProps {
  planets: LexiversePlanet[]
  edges: { source: string; target: string }[]
}

export function GalaxyEdges({ planets, edges }: GalaxyEdgesProps) {
  const { positions, colors } = useMemo(() => {
    const byId = new Map(planets.map(p => [p.id, p]))
    const pos = new Float32Array(edges.length * 6)
    const col = new Float32Array(edges.length * 6)
    const tmp = new THREE.Color()
    edges.forEach((e, i) => {
      const a = byId.get(e.source)
      const b = byId.get(e.target)
      if (!a || !b) return
      pos.set([a.position.x, a.position.y, a.position.z, b.position.x, b.position.y, b.position.z], i * 6)
      const ba = STATE_BRIGHTNESS[a.learningState] ?? 0.2
      const bb = STATE_BRIGHTNESS[b.learningState] ?? 0.2
      tmp.set(a.color ?? '#7EF9FF').multiplyScalar(ba * 0.5)
      col[i * 6 + 0] = tmp.r; col[i * 6 + 1] = tmp.g; col[i * 6 + 2] = tmp.b
      tmp.set(b.color ?? '#7EF9FF').multiplyScalar(bb * 0.5)
      col[i * 6 + 3] = tmp.r; col[i * 6 + 4] = tmp.g; col[i * 6 + 5] = tmp.b
    })
    return { positions: pos, colors: col }
  }, [planets, edges])

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <lineBasicMaterial vertexColors transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
    </lineSegments>
  )
}
