'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { BanyanParticleSystem } from './BanyanParticleSystem'
import { BanyanModuleNodes } from './BanyanModuleNodes'
import { BANYAN_CAMERA, BANYAN_BLOOM, BANYAN_ANIMATION } from './banyan-particle-config'
import type { ModuleId } from '@/types/learning'

interface BanyanCanvasProps {
  activeModuleId: ModuleId | null
  hoveredModuleId: ModuleId | null
  animationKey: number
  onNodeClick: (id: ModuleId) => void
  onNodeHover: (id: ModuleId | null) => void
}

export function BanyanCanvas({
  activeModuleId,
  hoveredModuleId,
  animationKey,
  onNodeClick,
  onNodeHover,
}: BanyanCanvasProps) {
  return (
    <Canvas
      camera={{
        fov: BANYAN_CAMERA.fov,
        position: BANYAN_CAMERA.position,
        near: 1,
        far: 1000,
      }}
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.NoToneMapping,
      }}
      onCreated={({ scene, gl }) => {
        scene.fog = new THREE.FogExp2(0x020617, BANYAN_CAMERA.fogDensity)
        gl.setClearColor(0x020617)
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <BanyanParticleSystem animationKey={animationKey} />

      <BanyanModuleNodes
        activeModuleId={activeModuleId}
        hoveredModuleId={hoveredModuleId}
        onNodeClick={onNodeClick}
        onNodeHover={onNodeHover}
      />

      <OrbitControls
        autoRotate
        autoRotateSpeed={BANYAN_ANIMATION.autoRotateSpeed}
        enableDamping
        dampingFactor={0.05}
        enableZoom={false}
        enablePan={false}
        target={BANYAN_CAMERA.target}
      />

      <EffectComposer>
        <Bloom
          intensity={BANYAN_BLOOM.intensity}
          luminanceThreshold={BANYAN_BLOOM.luminanceThreshold}
          luminanceSmoothing={BANYAN_BLOOM.luminanceSmoothing}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  )
}
