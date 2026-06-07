'use client'
// components/lexiverse/GalaxyNode.tsx
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 · Stage D — galaxy outer-view node with mastery glow + echo flash.
//
// Deltas over Stage A:
//   · `masteryRatio` (0..1) prop → halo brightness scales with progress
//   · `echoing` prop → brief outer flash when a word in this galaxy was lit
// ─────────────────────────────────────────────────────────────────────────

import { useState, useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Html } from '@react-three/drei'
import * as THREE from 'three'

import type { LexiverseGalaxy } from '@/lib/lexiverse/lexiverse-types'

export interface GalaxyNodeProps {
  galaxy: LexiverseGalaxy
  opacity?: number
  isSelected?: boolean
  isMuted?: boolean
  onClick?: () => void
  onHoverChange?: (galaxy: LexiverseGalaxy | null) => void
  /** STAGE D · 0..1 brightens the halo (1 = fully mastered galaxy) */
  masteryRatio?: number
  /** STAGE D · transient cross-galaxy echo flash */
  echoing?: boolean
}

const haloTex = (() => {
  if (typeof document === 'undefined') return null as unknown as THREE.Texture
  const s = 128, c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.3, 'rgba(255,255,255,0.6)')
  g.addColorStop(0.55, 'rgba(255,255,255,0.18)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
})()

export function GalaxyNode({ galaxy, opacity = 1, isSelected, isMuted, onClick, onHoverChange, masteryRatio = 0, echoing }: GalaxyNodeProps) {
  const [hover, setHover] = useState(false)
  const haloRef = useRef<THREE.Sprite>(null)
  const coreRef = useRef<THREE.Mesh>(null)

  const color = galaxy.colorTheme ?? '#7EF9FF'
  const baseHalo = 22
  const breath = useMemo(() => ({
    phase: hash(galaxy.id) % 1000 / 1000 * Math.PI * 2,
    speed: 0.5 + (hash(galaxy.id + '_s') % 1000) / 1000 * 0.6,
  }), [galaxy.id])

  useFrame(state => {
    const t = state.clock.elapsedTime
    if (haloRef.current) {
      const s = 0.5 + 0.5 * Math.sin(t * breath.speed + breath.phase)
      const mat = haloRef.current.material as THREE.SpriteMaterial
      // STAGE D · mastery glow — halo base opacity scales 0.45..0.95 with progress
      const masteryBoost = 0.45 + masteryRatio * 0.50
      const baseAlpha = isSelected ? 0.95 : hover ? 0.85 : masteryBoost
      const echoBoost = echoing ? 0.25 : 0
      mat.opacity = (baseAlpha + (s - 0.5) * 0.3 + echoBoost) * opacity * (isMuted ? 0.55 : 1)
      const scaleFactor = isSelected ? 1.5 : hover ? 1.2 : 1.0
      const breathScale = 1 + s * 0.08
      // STAGE D · mastery glow — halo size grows up to 1.25× when galaxy is fully lit
      const masteryScale = 1 + masteryRatio * 0.25
      const echoScale = echoing ? 1.1 : 1
      const sc = baseHalo * scaleFactor * breathScale * masteryScale * echoScale
      haloRef.current.scale.set(sc, sc, 1)
    }
    if (coreRef.current) {
      coreRef.current.rotation.y += 0.005
      coreRef.current.rotation.x += 0.002
    }
  })

  return (
    <group position={[galaxy.visualPosition.x, galaxy.visualPosition.y, galaxy.visualPosition.z]}>
      <sprite ref={haloRef}>
        <spriteMaterial
          map={haloTex}
          color={color}
          transparent
          opacity={0.55 * opacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      <mesh
        ref={coreRef}
        onPointerOver={e => { e.stopPropagation(); setHover(true); onHoverChange?.(galaxy); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHover(false); onHoverChange?.(null); document.body.style.cursor = 'auto' }}
        onClick={e => { e.stopPropagation(); onClick?.() }}
      >
        {coreGeometryFor(galaxy.visualType)}
        <meshBasicMaterial color={color} transparent opacity={(isMuted ? 0.6 : 1) * opacity} wireframe={galaxy.visualType === 'wireframe'} />
      </mesh>

      {(hover || isSelected) && (
        <Billboard>
          <Html
            center
            distanceFactor={120}
            style={{
              pointerEvents: 'none',
              transform: 'translateY(-36px)',
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontSize: 12,
              color: '#ECFBFF',
              whiteSpace: 'nowrap',
              textShadow: '0 0 8px rgba(0,0,0,0.95), 0 1px 3px rgba(0,0,0,0.95)',
            }}
          >
            <div style={{ fontWeight: 700, color }}>{galaxy.title}</div>
            <div style={{ fontSize: 10, opacity: 0.75 }}>{galaxy.titleZh}</div>
            {masteryRatio > 0 && (
              <div style={{ fontSize: 10, marginTop: 2, color: '#7EF9FF', opacity: 0.85 }}>
                {Math.round(masteryRatio * 100)}% mastered
              </div>
            )}
          </Html>
        </Billboard>
      )}
    </group>
  )
}

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

function coreGeometryFor(visualType?: string) {
  switch (visualType) {
    case 'wireframe': return <icosahedronGeometry args={[5, 1]} />
    case 'spiral':    return <sphereGeometry args={[5, 24, 24]} />
    case 'nebula':    return <sphereGeometry args={[4.5, 16, 16]} />
    case 'binary':    return <octahedronGeometry args={[5, 0]} />
    case 'cluster':
    default:          return <sphereGeometry args={[4, 20, 20]} />
  }
}
