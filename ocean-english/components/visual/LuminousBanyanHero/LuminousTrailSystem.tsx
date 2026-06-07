'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  LUMINOUS_DESKTOP_CONFIG,
  LUMINOUS_MOBILE_CONFIG,
  LUMINOUS_TRAIL_FRAGMENT_SHADER,
  LUMINOUS_TRAIL_VERTEX_SHADER,
} from './luminous-banyan-config'

interface LuminousTrailSystemProps {
  tint: string
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function LuminousTrailSystem({ tint }: LuminousTrailSystemProps) {
  const { size, pointer, camera } = useThree()
  const cfg = size.width < 768 ? LUMINOUS_MOBILE_CONFIG : LUMINOUS_DESKTOP_CONFIG
  const trailIndex = useRef(0)
  const prevPointer = useRef(new THREE.Vector2())
  const raycaster = useMemo(() => new THREE.Raycaster(), [])

  const { geometry, positions, ages } = useMemo(() => {
    const positions = new Float32Array(cfg.trailCount * 3)
    const ages = new Float32Array(cfg.trailCount)
    for (let i = 0; i < cfg.trailCount; i++) {
      ages[i] = 1
      positions[i * 3] = 9999
      positions[i * 3 + 1] = 9999
      positions[i * 3 + 2] = 9999
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aAge', new THREE.BufferAttribute(ages, 1))
    return { geometry, positions, ages }
  }, [cfg.trailCount])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTint: { value: new THREE.Color('#ffffff') },
        },
        vertexShader: LUMINOUS_TRAIL_VERTEX_SHADER,
        fragmentShader: LUMINOUS_TRAIL_FRAGMENT_SHADER,
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

  useFrame((_, delta) => {
    for (let i = 0; i < cfg.trailCount; i++) {
      if (ages[i] < 1) {
        ages[i] += delta * 1.2
        positions[i * 3] += rand(-0.2, 0.2)
        positions[i * 3 + 1] += rand(0.1, 0.4)
      }
    }

    if (prevPointer.current.distanceTo(pointer) > 0.0008) {
      raycaster.setFromCamera(pointer, camera)
      const planeNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(camera.quaternion)
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, new THREE.Vector3(0, 0, 0))
      const point = new THREE.Vector3()
      if (raycaster.ray.intersectPlane(plane, point)) {
        for (let k = 0; k < 2; k++) {
          const i = trailIndex.current
          positions[i * 3] = point.x + rand(-3, 3)
          positions[i * 3 + 1] = point.y + rand(-3, 3)
          positions[i * 3 + 2] = point.z + rand(-3, 3)
          ages[i] = 0
          trailIndex.current = (trailIndex.current + 1) % cfg.trailCount
        }
      }
    }

    prevPointer.current.copy(pointer)
    geometry.attributes.position.needsUpdate = true
    geometry.attributes.aAge.needsUpdate = true
  })

  return (
    <points geometry={geometry}>
      <primitive object={material} attach="material" />
    </points>
  )
}
