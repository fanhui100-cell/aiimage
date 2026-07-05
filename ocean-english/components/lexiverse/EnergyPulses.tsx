'use client'
// components/lexiverse/EnergyPulses.tsx
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 · Stage B — Knowledge energy flowing along edges.
//
// For each edge where ONE endpoint is mastered/learning and the OTHER is
// unknown/locked, a single point particle continuously travels from the
// lit side toward the dim side — visually saying "the knowledge is
// gathering, go light it up."
//
// Implementation: ONE THREE.Points geometry. Positions updated per frame
// by lerping each particle along its assigned edge with a unique phase.
// ─────────────────────────────────────────────────────────────────────────

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import type { LexiversePlanet } from '@/lib/lexiverse/lexiverse-types'

const LIT_STATES = new Set(['mastered', 'learning', 'recommended', 'review'])
const DIM_STATES = new Set(['unknown', 'locked'])

export interface EnergyPulsesProps {
  planets: LexiversePlanet[]
  edges: { source: string; target: string }[]
}

export function EnergyPulses({ planets, edges }: EnergyPulsesProps) {
  const ref = useRef<THREE.Points>(null)

  const { positions, colors, meta, geometryReady } = useMemo(() => {
    const byId = new Map(planets.map(p => [p.id, p]))
    const pulseEdges: { src: LexiversePlanet; tgt: LexiversePlanet }[] = []
    for (const e of edges) {
      const a = byId.get(e.source); const b = byId.get(e.target)
      if (!a || !b) continue
      const aLit = LIT_STATES.has(a.learningState); const aDim = DIM_STATES.has(a.learningState)
      const bLit = LIT_STATES.has(b.learningState); const bDim = DIM_STATES.has(b.learningState)
      if (aLit && bDim) pulseEdges.push({ src: a, tgt: b })
      else if (bLit && aDim) pulseEdges.push({ src: b, tgt: a })
    }
    const N = Math.min(pulseEdges.length, 180)
    const pos = new Float32Array(N * 3)
    const col = new Float32Array(N * 3)
    const m: { src: THREE.Vector3; tgt: THREE.Vector3; phase: number; speed: number }[] = []
    const tmp = new THREE.Color()
    for (let i = 0; i < N; i++) {
      const e = pulseEdges[i]
      m.push({
        src: new THREE.Vector3(e.src.position.x, e.src.position.y, e.src.position.z),
        tgt: new THREE.Vector3(e.tgt.position.x, e.tgt.position.y, e.tgt.position.z),
        phase: Math.random(),
        speed: 0.20 + Math.random() * 0.15,
      })
      pos[i*3] = e.src.position.x; pos[i*3+1] = e.src.position.y; pos[i*3+2] = e.src.position.z
      tmp.set(e.src.color ?? '#7EF9FF')
      col[i*3] = tmp.r; col[i*3+1] = tmp.g; col[i*3+2] = tmp.b
    }
    return { positions: pos, colors: col, meta: m, geometryReady: N > 0 }
  }, [planets, edges])

  useFrame(state => {
    if (!ref.current || !geometryReady) return
    const t = state.clock.elapsedTime
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < meta.length; i++) {
      const m = meta[i]
      const phase = ((t * m.speed) + m.phase) % 1
      pos[i*3]   = m.src.x + (m.tgt.x - m.src.x) * phase
      pos[i*3+1] = m.src.y + (m.tgt.y - m.src.y) * phase
      pos[i*3+2] = m.src.z + (m.tgt.z - m.src.z) * phase
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  if (!geometryReady) return null
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.9} vertexColors transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  )
}
