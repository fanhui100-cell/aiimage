'use client'
// components/lexiverse/ReviewSatellite.tsx
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 · Stage D — small orbiting moon attached to planets whose
// spaced-repetition review is overdue.
//
// Visual: ~0.35-radius emissive moon orbiting the planet, soft warm-red
// (#FF8A6A) with a faint trailing halo. Pulses gently to draw attention
// without competing with the lit/mastered glow.
//
// Mount as a child of PlanetNode when slices say the word is overdue.
// ─────────────────────────────────────────────────────────────────────────

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export interface ReviewSatelliteProps {
  /** orbit radius (planet visual radius × ~2.2 looks right) */
  orbitRadius: number
  /** rad/sec — slower = lazier "circling" feel */
  speed?: number
  color?: string
  /** 0..2π — staggers neighbouring satellites so they don't sync up */
  phase?: number
}

export function ReviewSatellite({ orbitRadius, speed = 0.6, color = '#FF8A6A', phase = 0 }: ReviewSatelliteProps) {
  const groupRef = useRef<THREE.Group>(null)
  const haloRef = useRef<THREE.Sprite>(null)

  useFrame(state => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime * speed + phase
    const x = Math.cos(t) * orbitRadius
    const z = Math.sin(t) * orbitRadius
    // tilted orbit so it doesn't look hand-drawn on the equator
    const y = Math.sin(t * 0.5) * orbitRadius * 0.18
    groupRef.current.position.set(x, y, z)

    if (haloRef.current) {
      const s = 0.55 + 0.45 * Math.sin(state.clock.elapsedTime * 2.2 + phase)
      ;(haloRef.current.material as THREE.SpriteMaterial).opacity = 0.55 + s * 0.30
    }
  })

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <sprite ref={haloRef} scale={[1.2, 1.2, 1]}>
        <spriteMaterial color={color} transparent opacity={0.65} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
    </group>
  )
}
