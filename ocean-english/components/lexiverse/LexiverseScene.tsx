'use client'
// components/lexiverse/LexiverseScene.tsx
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 · Stage D — Canvas threads new Stage-D props through.
// ─────────────────────────────────────────────────────────────────────────

import { useRef, useEffect, useMemo } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'

import type { LexiverseGalaxy, LexiverseStoreSlices } from '@/lib/lexiverse/lexiverse-types'
import type { EchoesAPI } from './useCrossGalaxyEchoes'
import type { GalaxyMasteryRow } from './useGalaxyMastery'
import { UniverseLayer } from './UniverseLayer'
import { GalaxyLayer } from './GalaxyLayer'

export interface LexiverseSceneProps {
  galaxies: LexiverseGalaxy[]
  currentGalaxyId: string | null
  selectedPlanetId: string | null
  onSelectGalaxy: (id: string) => void
  onHoverGalaxy?: (galaxy: LexiverseGalaxy | null) => void
  onSelectPlanet: (id: string | null) => void
  slices?: LexiverseStoreSlices
  recentlyMasteredIds?: string[]
  /** STAGE D */
  masteryByGalaxyId?: Record<string, GalaxyMasteryRow>
  echoes?: EchoesAPI
  overdueWordIds?: string[]
}

export function LexiverseScene({
  galaxies, currentGalaxyId, selectedPlanetId, onSelectGalaxy, onSelectPlanet, onHoverGalaxy,
  slices, recentlyMasteredIds, masteryByGalaxyId, echoes, overdueWordIds,
}: LexiverseSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 40, 480], fov: 55, near: 0.1, far: 4000 }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      frameloop="always"
      style={{ position: 'absolute', inset: 0 }}
    >
      <color attach="background" args={['#040407']} />
      <fogExp2 attach="fog" args={['#040407', 0.0008]} />
      <Stars radius={1400} depth={800} count={4000} factor={4} saturation={0} fade speed={0.4} />

      <CameraTween galaxies={galaxies} currentGalaxyId={currentGalaxyId} />

      <UniverseLayer
        galaxies={galaxies}
        currentGalaxyId={currentGalaxyId}
        onSelectGalaxy={onSelectGalaxy}
        onHoverGalaxy={onHoverGalaxy}
        masteryByGalaxyId={masteryByGalaxyId}
        echoGalaxyIds={echoes?.galaxyIds}
      />

      {currentGalaxyId && (
        <GalaxyLayer
          galaxyId={currentGalaxyId}
          slices={slices}
          selectedPlanetId={selectedPlanetId}
          onSelectPlanet={onSelectPlanet}
          recentlyMasteredIds={recentlyMasteredIds}
          echoes={echoes}
          overdueWordIds={overdueWordIds}
        />
      )}

      <OrbitControls
        makeDefault
        enableDamping dampingFactor={0.06} rotateSpeed={0.6}
        autoRotate={!currentGalaxyId} autoRotateSpeed={0.16}
        minDistance={20} maxDistance={800} enablePan={false}
      />
    </Canvas>
  )
}

function CameraTween({ galaxies, currentGalaxyId }: { galaxies: LexiverseGalaxy[]; currentGalaxyId: string | null }) {
  const { camera, controls } = useThree() as { camera: THREE.PerspectiveCamera; controls: { target: THREE.Vector3; update?: () => void } | null }
  const desired = useRef({ target: new THREE.Vector3(0, 0, 0), camera: new THREE.Vector3(0, 40, 480) })
  const targetGalaxy = useMemo(
    () => (currentGalaxyId ? galaxies.find(g => g.id === currentGalaxyId) ?? null : null),
    [galaxies, currentGalaxyId],
  )
  useEffect(() => {
    if (targetGalaxy) {
      const p = targetGalaxy.visualPosition
      desired.current.target.set(p.x, p.y, p.z)
      const offset = new THREE.Vector3().subVectors(camera.position, new THREE.Vector3(p.x, p.y, p.z))
      if (offset.length() < 80) offset.set(0, 0, 80)
      offset.normalize().multiplyScalar(280)
      desired.current.camera.set(p.x + offset.x, p.y + offset.y, p.z + offset.z)
    } else {
      desired.current.target.set(0, 0, 0)
      desired.current.camera.set(0, 40, 480)
    }
  }, [targetGalaxy, camera])
  useFrame(() => {
    camera.position.lerp(desired.current.camera, 0.04)
    if (controls && 'target' in controls) {
      controls.target.lerp(desired.current.target, 0.06)
      if ('update' in controls && typeof controls.update === 'function') controls.update()
    } else {
      camera.lookAt(desired.current.target)
    }
  })
  return null
}
