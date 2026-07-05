'use client'
// components/lexiverse/SectorGlow.tsx
// ─────────────────────────────────────────────────────────────────────────
// Renders a single sector in galaxy-overview mode:
//   · soft glowing sphere (nebula cloud)
//   · faint outer halo on the back face
//   · point light for scene ambience
//   · Html overlay label (disabled at low opacity to avoid click-through)
//
// Opacity is controlled by the parent (GalaxyLayer):
//   1.0 → galaxy overview (no sector focused)
//   0.5 → another sector is focused
//   0.0 → this sector is focused (GalaxyLayer simply omits the element)
// ─────────────────────────────────────────────────────────────────────────

import { useRef } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { LexiverseSector } from '@/lib/lexiverse/lexiverse-types'

interface SectorGlowProps {
  sector: LexiverseSector
  /** 0..1 — driven by LOD state. Parent omits the element entirely at 0. */
  opacity: number
  onClick: () => void
}

export function SectorGlow({ sector, opacity, onClick }: SectorGlowProps) {
  const coreRef = useRef<THREE.Mesh>(null)
  const { x, y, z } = sector.center

  useFrame((_, dt) => {
    if (coreRef.current) coreRef.current.rotation.y += dt * 0.04
  })

  return (
    <group position={[x, y, z]}>
      <pointLight
        color={sector.color}
        intensity={opacity * 1.2}
        distance={sector.radius * 3.5}
        decay={2}
      />

      {/* core nebula sphere */}
      <mesh ref={coreRef} onClick={onClick}>
        <sphereGeometry args={[35, 16, 16]} />
        <meshBasicMaterial
          color={sector.color}
          transparent
          opacity={opacity * 0.10}
          depthWrite={false}
        />
      </mesh>

      {/* outer halo — back-face for additive depth */}
      <mesh onClick={onClick}>
        <sphereGeometry args={[50, 12, 12]} />
        <meshBasicMaterial
          color={sector.color}
          transparent
          opacity={opacity * 0.04}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* HTML label — only interactive when sufficiently opaque */}
      {opacity > 0.25 && (
        <Html
          center
          distanceFactor={42}
          style={{ pointerEvents: opacity > 0.5 ? 'auto' : 'none', userSelect: 'none' }}
        >
          <div onClick={onClick} style={{ textAlign: 'center', cursor: 'pointer' }}>
            <div style={{
              fontSize: 12, fontWeight: 700, color: sector.color,
              opacity, whiteSpace: 'nowrap',
              textShadow: `0 0 12px ${sector.color}`,
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              letterSpacing: '-0.01em',
            }}>
              {sector.name}
            </div>
            <div style={{
              fontSize: 9, color: 'rgba(159,182,198,0.80)', marginTop: 2,
              opacity: opacity * 0.85, whiteSpace: 'nowrap',
              fontFamily: "'Space Mono', monospace",
            }}>
              {sector.nameZh} · {sector.wordCount}
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}
