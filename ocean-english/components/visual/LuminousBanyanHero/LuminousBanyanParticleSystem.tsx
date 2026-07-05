'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  LUMINOUS_COLORS,
  LUMINOUS_DESKTOP_CONFIG,
  LUMINOUS_MOBILE_CONFIG,
  LUMINOUS_TREE_FRAGMENT_SHADER,
  LUMINOUS_TREE_VERTEX_SHADER,
} from './luminous-banyan-config'
import type { LuminousCurveConfig } from './luminous-banyan-config'

interface LuminousBanyanParticleSystemProps {
  pointSize: number
  tailAlpha: number
  tint: string
  animationKey: number
}

interface ParticleArrays {
  positions: number[]
  pathLengths: number[]
  delays: number[]
  durations: number[]
  colors: number[]
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function jitterVec(scale: number): THREE.Vector3 {
  return new THREE.Vector3(rand(-scale, scale), rand(-scale, scale), rand(-scale, scale))
}

function buildParticleArrays(cfg: LuminousCurveConfig): ParticleArrays {
  const positions: number[] = []
  const pathLengths: number[] = []
  const delays: number[] = []
  const durations: number[] = []
  const colors: number[] = []

  const colorBase = new THREE.Color(LUMINOUS_COLORS.base)
  const colorTip = new THREE.Color(LUMINOUS_COLORS.tip)
  const colorAlt = new THREE.Color(LUMINOUS_COLORS.alternate)
  const grassBase = new THREE.Color(LUMINOUS_COLORS.grassBase)
  const grassAlt = new THREE.Color(LUMINOUS_COLORS.grassAlt)

  function addCurveToSystem(
    curve: THREE.CatmullRomCurve3,
    pointCount: number,
    delay: number,
    duration: number,
    colorScale = 1.0,
    cBase = colorBase,
    cAlt = colorAlt,
  ) {
    const points = curve.getPoints(pointCount)
    const finalColor = new THREE.Color().copy(cBase)
    if (Math.random() > 0.7) finalColor.lerp(cAlt, 0.7)

    for (let i = 0; i <= pointCount; i++) {
      const pt = points[i]
      if (!pt) continue
      const progress = i / pointCount
      positions.push(pt.x, pt.y, pt.z)
      pathLengths.push(progress)
      delays.push(delay)
      durations.push(duration)
      const ptColor = finalColor.clone().lerp(colorTip, Math.min(1, progress * colorScale))
      colors.push(ptColor.r, ptColor.g, ptColor.b)
    }
  }

  for (let i = 0; i < cfg.rootCurves; i++) {
    const angle = rand(0, Math.PI * 2)
    const radius = rand(15, 65)
    const p0 = new THREE.Vector3(rand(-4, 4), -5, rand(-4, 4))
    const p1 = new THREE.Vector3(Math.cos(angle) * radius * 0.4, 0, Math.sin(angle) * radius * 0.4)
    const p2 = new THREE.Vector3(Math.cos(angle) * radius, rand(-3, 0), Math.sin(angle) * radius)
    addCurveToSystem(
      new THREE.CatmullRomCurve3([p0, p1, p2]),
      cfg.rootPointsPerCurve,
      rand(0, 0.5),
      rand(1.0, 1.5),
    )
  }

  for (let i = 0; i < cfg.grassCurves; i++) {
    const angle = rand(0, Math.PI * 2)
    const radius = Math.pow(Math.random(), 1.5) * 75
    const p0 = new THREE.Vector3(Math.cos(angle) * radius, -4.5 + rand(-0.5, 0.5), Math.sin(angle) * radius)
    const leanDir = rand(0.5, 3.5)
    const p1 = new THREE.Vector3(
      p0.x + Math.cos(angle) * leanDir * 0.5,
      p0.y + rand(1.0, 2.5),
      p0.z + Math.sin(angle) * leanDir * 0.5,
    )
    const p2 = new THREE.Vector3(
      p1.x + Math.cos(angle) * leanDir,
      p1.y + rand(0.5, 2.0),
      p1.z + Math.sin(angle) * leanDir,
    )
    addCurveToSystem(
      new THREE.CatmullRomCurve3([p0, p1, p2]),
      cfg.grassPointsPerCurve,
      rand(0.5, 1.5),
      rand(0.8, 1.5),
      1.0,
      grassBase,
      grassAlt,
    )
  }

  const trunkTops: THREE.Vector3[] = []
  for (let t = 0; t < cfg.mainTrunks; t++) {
    const baseAngle = (t / cfg.mainTrunks) * Math.PI * 2 + rand(-0.2, 0.2)
    const startRadius = rand(3, 7)
    const startCenter = new THREE.Vector3(
      Math.cos(baseAngle) * startRadius,
      0,
      Math.sin(baseAngle) * startRadius,
    )
    const lean = rand(15, 25)
    const endCenter = new THREE.Vector3(Math.cos(baseAngle) * lean, rand(35, 45), Math.sin(baseAngle) * lean)

    for (let i = 0; i < cfg.strandsPerTrunk; i++) {
      const rBase = rand(0, 5)
      const angle = rand(0, Math.PI * 2)
      const p0 = new THREE.Vector3(
        startCenter.x + Math.cos(angle) * rBase,
        0,
        startCenter.z + Math.sin(angle) * rBase,
      )
      const twist = angle + rand(-Math.PI, Math.PI)
      const p1 = new THREE.Vector3(
        startCenter.x + (endCenter.x - startCenter.x) * 0.5 + Math.cos(twist) * (rBase * 2),
        endCenter.y * rand(0.4, 0.6),
        startCenter.z + (endCenter.z - startCenter.z) * 0.5 + Math.sin(twist) * (rBase * 2),
      )
      const p2 = new THREE.Vector3(endCenter.x + rand(-8, 8), endCenter.y + rand(-5, 5), endCenter.z + rand(-8, 8))
      trunkTops.push(p2)
      addCurveToSystem(
        new THREE.CatmullRomCurve3([p0, p1, p2]),
        cfg.trunkPointsPerCurve,
        rand(0.5, 1.2),
        rand(1.5, 2.0),
      )
    }
  }

  const branchTops: THREE.Vector3[] = []
  trunkTops.forEach(tTop => {
    const numBranches = Math.floor(rand(1, 3))
    for (let i = 0; i < numBranches; i++) {
      const outVector = new THREE.Vector3(tTop.x, 0, tTop.z).normalize()
      const branchDir = outVector.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), rand(-1.2, 1.2))
      const bSpread = rand(40, 110)
      const bHeight = tTop.y + rand(-2, 12)
      const p1 = new THREE.Vector3(
        tTop.x + branchDir.x * bSpread * 0.4,
        tTop.y + rand(5, 12),
        tTop.z + branchDir.z * bSpread * 0.4,
      )
      const p2 = new THREE.Vector3(tTop.x + branchDir.x * bSpread, bHeight, tTop.z + branchDir.z * bSpread)
      branchTops.push(p2)
      addCurveToSystem(
        new THREE.CatmullRomCurve3([tTop, p1, p2]),
        cfg.trunkPointsPerCurve,
        rand(2.0, 3.0),
        rand(1.5, 2.5),
        1.2,
      )
    }
  })

  for (let i = 0; i < cfg.twigCurves; i++) {
    if (branchTops.length === 0) break
    const src = branchTops[Math.floor(rand(0, branchTops.length))]
    const dir = new THREE.Vector3(rand(-1, 1), rand(-0.2, 0.6), rand(-1, 1)).normalize()
    const len = rand(15, 35)
    const p0 = src.clone().add(jitterVec(5))
    const p1 = p0.clone().add(dir.clone().multiplyScalar(len * 0.5)).add(jitterVec(4))
    const p2 = p0.clone().add(dir.clone().multiplyScalar(len)).add(jitterVec(4))
    addCurveToSystem(
      new THREE.CatmullRomCurve3([p0, p1, p2]),
      cfg.twigPointsPerCurve,
      rand(3.0, 5.0),
      rand(1.2, 2.2),
      1.3,
    )
  }

  for (let i = 0; i < cfg.aerialRoots; i++) {
    if (branchTops.length === 0) break
    const src = branchTops[Math.floor(rand(0, branchTops.length))]
    const p1 = new THREE.Vector3(src.x + rand(-5, 5), src.y * 0.5, src.z + rand(-5, 5))
    const p2 = new THREE.Vector3(src.x + rand(-2, 2), rand(-5, 5), src.z + rand(-2, 2))
    addCurveToSystem(
      new THREE.CatmullRomCurve3([src, p1, p2]),
      cfg.aerialRootPointsPerCurve,
      rand(3.5, 4.5),
      rand(1.5, 2.5),
    )
  }

  return { positions, pathLengths, delays, durations, colors }
}

function buildGeometry(cfg: LuminousCurveConfig): THREE.BufferGeometry {
  const data = buildParticleArrays(cfg)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3))
  geometry.setAttribute('aPathLength', new THREE.Float32BufferAttribute(data.pathLengths, 1))
  geometry.setAttribute('aDelay', new THREE.Float32BufferAttribute(data.delays, 1))
  geometry.setAttribute('aDuration', new THREE.Float32BufferAttribute(data.durations, 1))
  geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(data.colors, 3))
  return geometry
}

export function LuminousBanyanParticleSystem({
  pointSize,
  tailAlpha,
  tint,
  animationKey,
}: LuminousBanyanParticleSystemProps) {
  const { size, pointer } = useThree()
  const clockRef = useRef(-0.5)
  const activeRef = useRef(0)
  const prevPointer = useRef(new THREE.Vector2())
  const isMobile = size.width < 768
  const cfg = isMobile ? LUMINOUS_MOBILE_CONFIG : LUMINOUS_DESKTOP_CONFIG

  const geometry = useMemo(() => {
    void animationKey
    return buildGeometry(cfg)
  }, [cfg, animationKey])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPointSize: { value: 3.0 },
          uTailAlpha: { value: 0.25 },
          uTint: { value: new THREE.Color('#ffffff') },
          uMouse: { value: new THREE.Vector2(-10, -10) },
          uMouseActive: { value: 0 },
        },
        vertexShader: LUMINOUS_TREE_VERTEX_SHADER,
        fragmentShader: LUMINOUS_TREE_FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  useEffect(() => {
    clockRef.current = -0.5
  }, [animationKey])

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  useEffect(() => {
    material.uniforms.uPointSize.value = pointSize
  }, [material, pointSize])

  useEffect(() => {
    material.uniforms.uTailAlpha.value = tailAlpha
  }, [material, tailAlpha])

  useEffect(() => {
    material.uniforms.uTint.value.set(tint)
  }, [material, tint])

  useFrame((_, delta) => {
    clockRef.current += delta
    const velocity = prevPointer.current.distanceTo(pointer)
    activeRef.current = Math.max(velocity > 0.0005 ? 1 : 0, activeRef.current - delta * 1.8)
    prevPointer.current.copy(pointer)

    material.uniforms.uTime.value = Math.max(0, clockRef.current)
    material.uniforms.uMouse.value.copy(pointer)
    material.uniforms.uMouseActive.value = activeRef.current
  })

  return (
    <points geometry={geometry}>
      <primitive object={material} attach="material" />
    </points>
  )
}
