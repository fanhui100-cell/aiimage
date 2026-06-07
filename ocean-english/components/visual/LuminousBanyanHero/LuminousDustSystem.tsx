'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  LUMINOUS_DESKTOP_CONFIG,
  LUMINOUS_DUST_FRAGMENT_SHADER,
  LUMINOUS_DUST_VERTEX_SHADER,
  LUMINOUS_MOBILE_CONFIG,
} from './luminous-banyan-config'

interface LuminousDustSystemProps {
  tint: string
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function buildDustGeometry(count: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const phases = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    positions[i * 3] = rand(-150, 150)
    positions[i * 3 + 1] = rand(-20, 120)
    positions[i * 3 + 2] = rand(-150, 150)
    phases[i] = rand(0, Math.PI * 2)
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
  return geometry
}

export function LuminousDustSystem({ tint }: LuminousDustSystemProps) {
  const { size, pointer } = useThree()
  const activeRef = useRef(0)
  const prevPointer = useRef(new THREE.Vector2())
  const cfg = size.width < 768 ? LUMINOUS_MOBILE_CONFIG : LUMINOUS_DESKTOP_CONFIG
  const geometry = useMemo(() => buildDustGeometry(cfg.dustCount), [cfg.dustCount])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uTint: { value: new THREE.Color('#ffffff') },
          uMouse: { value: new THREE.Vector2(-10, -10) },
          uMouseActive: { value: 0 },
        },
        vertexShader: LUMINOUS_DUST_VERTEX_SHADER,
        fragmentShader: LUMINOUS_DUST_FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  useEffect(() => {
    material.uniforms.uTint.value.set(tint)
  }, [material, tint])

  useFrame(({ clock }, delta) => {
    const velocity = prevPointer.current.distanceTo(pointer)
    activeRef.current = Math.max(velocity > 0.0005 ? 1 : 0, activeRef.current - delta * 1.8)
    prevPointer.current.copy(pointer)

    material.uniforms.uTime.value = clock.elapsedTime
    material.uniforms.uMouse.value.copy(pointer)
    material.uniforms.uMouseActive.value = activeRef.current
  })

  return (
    <points geometry={geometry}>
      <primitive object={material} attach="material" />
    </points>
  )
}
