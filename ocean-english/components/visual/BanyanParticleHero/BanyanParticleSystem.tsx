'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  BANYAN_CURVES_DESKTOP,
  BANYAN_CURVES_MOBILE,
  BANYAN_COLORS,
  BANYAN_SHADERS,
} from './banyan-particle-config'
import type { BanyanCurveConfig } from './banyan-types'

// -------------------------------------------------------
// Curve generation — ported 1:1 from HTML demo
// -------------------------------------------------------

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

interface ParticleArrays {
  positions: number[]
  pathLengths: number[]
  delays: number[]
  durations: number[]
  colors: number[]
}

function buildParticleArrays(cfg: BanyanCurveConfig): ParticleArrays {
  const positions: number[] = []
  const pathLengths: number[] = []
  const delays: number[] = []
  const durations: number[] = []
  const colors: number[] = []

  const colorBase = new THREE.Color(BANYAN_COLORS.baseCyan)
  const colorTip = new THREE.Color(BANYAN_COLORS.tipWhite)
  const colorGold = new THREE.Color(BANYAN_COLORS.accentGreen)

  function addCurve(
    curve: THREE.CatmullRomCurve3,
    pointCount: number,
    delay: number,
    duration: number,
    colorScale = 1.0,
  ) {
    const points = curve.getPoints(pointCount)
    const isVariant = Math.random() > 0.8
    const finalColor = new THREE.Color().copy(colorBase)
    if (isVariant) finalColor.lerp(colorGold, 0.6)

    for (let i = 0; i <= pointCount; i++) {
      const pt = points[i]
      const progress = i / pointCount
      positions.push(pt.x, pt.y, pt.z)
      pathLengths.push(progress)
      delays.push(delay)
      durations.push(duration)
      const ptColor = finalColor.clone().lerp(colorTip, progress * colorScale)
      colors.push(ptColor.r, ptColor.g, ptColor.b)
    }
  }

  // Stage 1: Ground roots (0–1 s)
  for (let i = 0; i < cfg.rootCurves; i++) {
    const angle = rand(0, Math.PI * 2)
    const radius = rand(15, 60)
    const p0 = new THREE.Vector3(rand(-3, 3), -5, rand(-3, 3))
    const p1 = new THREE.Vector3(Math.cos(angle) * radius * 0.4, 0, Math.sin(angle) * radius * 0.4)
    const p2 = new THREE.Vector3(Math.cos(angle) * radius, rand(-3, 0), Math.sin(angle) * radius)
    addCurve(new THREE.CatmullRomCurve3([p0, p1, p2]), cfg.rootPointsPerCurve, rand(0, 0.5), rand(1.0, 1.5))
  }

  // Stage 2: Trunk (1–2.5 s)
  const trunkTops: THREE.Vector3[] = []
  for (let i = 0; i < cfg.trunkCurves; i++) {
    const angle = rand(0, Math.PI * 2)
    const rBase = rand(3, 12)
    const p0 = new THREE.Vector3(Math.cos(angle) * rBase, 0, Math.sin(angle) * rBase)
    const twist = angle + rand(-Math.PI * 1.5, Math.PI * 1.5)
    const p1 = new THREE.Vector3(
      Math.cos(twist) * rBase * 0.6,
      rand(15, 25),
      Math.sin(twist) * rBase * 0.6,
    )
    const p2 = new THREE.Vector3(rand(-15, 15), rand(35, 45), rand(-15, 15))
    trunkTops.push(p2)
    addCurve(
      new THREE.CatmullRomCurve3([p0, p1, p2]),
      cfg.trunkPointsPerCurve,
      rand(0.5, 1.2),
      rand(1.5, 2.0),
    )
  }

  // Stage 3: Canopy branches (2–3 s)
  const branchTops: THREE.Vector3[] = []
  for (const tTop of trunkTops) {
    const numBranches = Math.floor(rand(3, 5))
    for (let i = 0; i < numBranches; i++) {
      const bAngle = rand(0, Math.PI * 2)
      const bSpread = rand(30, 100)
      const bHeight = tTop.y + rand(-5, 15)
      const p1 = new THREE.Vector3(
        tTop.x + Math.cos(bAngle) * bSpread * 0.4,
        tTop.y + rand(5, 10),
        tTop.z + Math.sin(bAngle) * bSpread * 0.4,
      )
      const p2 = new THREE.Vector3(
        tTop.x + Math.cos(bAngle) * bSpread,
        bHeight,
        tTop.z + Math.sin(bAngle) * bSpread,
      )
      branchTops.push(p2)
      addCurve(
        new THREE.CatmullRomCurve3([tTop, p1, p2]),
        cfg.branchPointsPerCurve,
        rand(2.0, 3.0),
        rand(1.5, 2.5),
        1.2,
      )
    }
  }

  // Stage 4: Aerial roots (3.5–5 s)
  for (let i = 0; i < cfg.aerialRoots; i++) {
    if (branchTops.length === 0) break
    const src = branchTops[Math.floor(rand(0, branchTops.length))]
    const p1 = new THREE.Vector3(src.x + rand(-5, 5), src.y * 0.5, src.z + rand(-5, 5))
    const p2 = new THREE.Vector3(src.x + rand(-2, 2), rand(-5, 5), src.z + rand(-2, 2))
    addCurve(
      new THREE.CatmullRomCurve3([src, p1, p2]),
      cfg.aerialRootPointsPerCurve,
      rand(3.5, 4.5),
      rand(1.5, 2.5),
    )
  }

  return { positions, pathLengths, delays, durations, colors }
}

function buildGeometry(cfg: BanyanCurveConfig): THREE.BufferGeometry {
  const data = buildParticleArrays(cfg)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3))
  geo.setAttribute('aPathLength', new THREE.Float32BufferAttribute(data.pathLengths, 1))
  geo.setAttribute('aDelay', new THREE.Float32BufferAttribute(data.delays, 1))
  geo.setAttribute('aDuration', new THREE.Float32BufferAttribute(data.durations, 1))
  geo.setAttribute('aColor', new THREE.Float32BufferAttribute(data.colors, 3))
  return geo
}

// -------------------------------------------------------
// Component
// -------------------------------------------------------

interface BanyanParticleSystemProps {
  animationKey?: number
}

export function BanyanParticleSystem({ animationKey = 0 }: BanyanParticleSystemProps) {
  const { size, pointer } = useThree()
  const clockRef = useRef(-0.5)
  const prevPointer = useRef(new THREE.Vector2())
  const mouseForce = useRef(0)

  const isMobile = size.width < 768
  const cfg = isMobile ? BANYAN_CURVES_MOBILE : BANYAN_CURVES_DESKTOP

  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ).current

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const geometry = useMemo(() => buildGeometry(cfg), [isMobile, animationKey])

  // Use ref for material so mutation inside useFrame doesn't trigger lint/immutability warnings
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  if (!materialRef.current) {
    materialRef.current = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouseNDC: { value: new THREE.Vector2(0, 0) },
        uMouseForce: { value: 0 },
      },
      vertexShader: BANYAN_SHADERS.vertex,
      fragmentShader: BANYAN_SHADERS.fragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }
  const material = materialRef.current

  useEffect(() => {
    clockRef.current = -0.5
  }, [animationKey])

  // Dispose geometry when it changes (new geometry built on restart or mobile toggle).
  // Material lives for the component lifetime — disposing it here would leave
  // materialRef pointing to a destroyed object, causing useFrame errors.
  useEffect(() => {
    const geo = geometry
    return () => { geo.dispose() }
  }, [geometry])

  // Dispose material only on component unmount.
  useEffect(() => {
    return () => { materialRef.current?.dispose() }
  }, [])

  useFrame((_, delta) => {
    const mat = materialRef.current
    if (!mat) return

    if (prefersReducedMotion) {
      mat.uniforms.uTime.value = 8.0
      mat.uniforms.uMouseNDC.value.set(0, 0)
      mat.uniforms.uMouseForce.value = 0
      return
    }

    clockRef.current += delta
    const velocity = prevPointer.current.distanceTo(pointer)
    mouseForce.current = velocity * 20 * 0.4 + mouseForce.current * 0.6
    prevPointer.current.copy(pointer)

    mat.uniforms.uTime.value = Math.max(0, clockRef.current)
    mat.uniforms.uMouseNDC.value.copy(pointer)
    mat.uniforms.uMouseForce.value = Math.min(mouseForce.current, 1.0)
  })

  return (
    <points geometry={geometry}>
      <primitive object={material} attach="material" />
    </points>
  )
}
