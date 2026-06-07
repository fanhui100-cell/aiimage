'use client'
// components/lexiverse/LexiverseScene.tsx
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 · Stage D + Sector Model
//
// Camera states (3 levels):
//   Universe view   → position (0,40,480), target origin
//   Galaxy overview → position galaxy_pos + offset×380, target galaxy_pos
//   Sector focus    → position sector_world + offset×200, target sector_world
// ─────────────────────────────────────────────────────────────────────────

import { useRef, useEffect, useMemo } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'

import type { BuiltGalaxy, LexiverseGalaxy, LexiverseStoreSlices } from '@/lib/lexiverse/lexiverse-types'
import type { EchoesAPI } from './useCrossGalaxyEchoes'
import type { GalaxyMasteryRow } from './useGalaxyMastery'
import { UniverseLayer } from './UniverseLayer'
import { GalaxyLayer } from './GalaxyLayer'

export interface LexiverseSceneProps {
  galaxies: LexiverseGalaxy[]
  currentGalaxyId: string | null
  selectedPlanetId: string | null
  onSelectGalaxy: (id: string) => void
  onSelectPlanet: (id: string | null) => void
  slices?: LexiverseStoreSlices
  recentlyMasteredIds?: string[]
  /** STAGE D */
  masteryByGalaxyId?: Record<string, GalaxyMasteryRow>
  echoes?: EchoesAPI
  overdueWordIds?: string[]
  /** Sector model */
  focusSectorId: string | null
  onFocusSector: (id: string | null) => void
  builtGalaxy: BuiltGalaxy | null
}

export function LexiverseScene({
  galaxies, currentGalaxyId, selectedPlanetId, onSelectGalaxy, onSelectPlanet,
  slices, recentlyMasteredIds, masteryByGalaxyId, echoes, overdueWordIds,
  focusSectorId, onFocusSector, builtGalaxy,
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

      <CameraTween
        galaxies={galaxies}
        currentGalaxyId={currentGalaxyId}
        focusSectorId={focusSectorId}
        builtGalaxy={builtGalaxy}
      />

      <UniverseLayer
        galaxies={galaxies}
        currentGalaxyId={currentGalaxyId}
        onSelectGalaxy={onSelectGalaxy}
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
          prebuilt={builtGalaxy}
          focusSectorId={focusSectorId}
          onFocusSector={onFocusSector}
        />
      )}

      <OrbitControls
        enableDamping dampingFactor={0.06} rotateSpeed={0.6}
        autoRotate={!currentGalaxyId} autoRotateSpeed={0.16}
        minDistance={20} maxDistance={800} enablePan={false}
      />
    </Canvas>
  )
}

interface CameraTweenProps {
  galaxies: LexiverseGalaxy[]
  currentGalaxyId: string | null
  focusSectorId: string | null
  builtGalaxy: BuiltGalaxy | null
}

function CameraTween({ galaxies, currentGalaxyId, focusSectorId, builtGalaxy }: CameraTweenProps) {
  const { camera, controls } = useThree() as {
    camera: THREE.PerspectiveCamera
    controls: { target: THREE.Vector3 } | null
  }
  const desired = useRef({
    target: new THREE.Vector3(0, 0, 0),
    camera: new THREE.Vector3(0, 40, 480),
  })

  const targetGalaxy = useMemo(
    () => (currentGalaxyId ? galaxies.find(g => g.id === currentGalaxyId) ?? null : null),
    [galaxies, currentGalaxyId],
  )

  useEffect(() => {
    if (!targetGalaxy) {
      // Universe view
      desired.current.target.set(0, 0, 0)
      desired.current.camera.set(0, 40, 480)
      return
    }

    const p = targetGalaxy.visualPosition

    if (focusSectorId && builtGalaxy) {
      // Sector focus — fly to sector center in world space
      const sector = builtGalaxy.sectors.find(s => s.id === focusSectorId)
      if (sector) {
        const sc = sector.center
        const worldTarget = new THREE.Vector3(p.x + sc.x, p.y + sc.y, p.z + sc.z)
        desired.current.target.copy(worldTarget)

        // offset = direction from world target toward current camera, distance 200
        const dir = new THREE.Vector3().subVectors(camera.position, worldTarget)
        if (dir.length() < 50) dir.set(0, 60, 200)
        dir.normalize().multiplyScalar(200)
        desired.current.camera.copy(worldTarget).add(dir)
        return
      }
    }

    // Galaxy overview — pull back to show all sectors
    const galaxyCenter = new THREE.Vector3(p.x, p.y, p.z)
    desired.current.target.copy(galaxyCenter)
    const offset = new THREE.Vector3().subVectors(camera.position, galaxyCenter)
    if (offset.length() < 80) offset.set(0, 0, 380)
    offset.normalize().multiplyScalar(380)
    desired.current.camera.copy(galaxyCenter).add(offset)
  }, [targetGalaxy, focusSectorId, builtGalaxy, camera])

  useFrame(() => {
    camera.position.lerp(desired.current.camera, 0.04)
    if (controls && 'target' in controls) {
      controls.target.lerp(desired.current.target, 0.06)
    }
  })

  return null
}
