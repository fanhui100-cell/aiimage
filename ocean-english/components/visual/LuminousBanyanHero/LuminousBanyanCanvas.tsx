'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { LuminousBanyanParticleSystem } from './LuminousBanyanParticleSystem'
import { LuminousDustSystem } from './LuminousDustSystem'
import { LuminousTrailSystem } from './LuminousTrailSystem'
import { LUMINOUS_BLOOM, LUMINOUS_CAMERA } from './luminous-banyan-config'

interface LuminousBanyanCanvasProps {
  pointSize: number
  tailAlpha: number
  tint: string
  animationKey: number
}

export function LuminousBanyanCanvas({
  pointSize,
  tailAlpha,
  tint,
  animationKey,
}: LuminousBanyanCanvasProps) {
  return (
    <Canvas
      camera={{
        fov: LUMINOUS_CAMERA.fov,
        position: LUMINOUS_CAMERA.position,
        near: 1,
        far: 1500,
      }}
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.NoToneMapping,
      }}
      onCreated={({ scene, gl }) => {
        scene.fog = new THREE.FogExp2(0x000000, LUMINOUS_CAMERA.fogDensity)
        gl.setClearColor(0x000000)
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <LuminousBanyanParticleSystem
        pointSize={pointSize}
        tailAlpha={tailAlpha}
        tint={tint}
        animationKey={animationKey}
      />
      <LuminousDustSystem tint={tint} />
      <LuminousTrailSystem tint={tint} />

      <OrbitControls
        autoRotate
        autoRotateSpeed={0.2}
        enableDamping
        dampingFactor={0.05}
        enablePan={false}
        target={LUMINOUS_CAMERA.target}
      />

      <EffectComposer>
        <Bloom
          intensity={LUMINOUS_BLOOM.intensity}
          luminanceThreshold={LUMINOUS_BLOOM.luminanceThreshold}
          luminanceSmoothing={LUMINOUS_BLOOM.luminanceSmoothing}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  )
}
