'use client'
// components/lexiverse/BurstPool.tsx
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 · Stage B — particle burst when a planet is freshly mastered.
//
// 260 pooled additive-blend Sprite instances, initially hidden. Each new
// burst takes ~38 free sprites, sets velocities outward, fades over ~1.4s.
//
// Trigger: parent passes `triggerIds` (an array of planet ids whose state
// recently flipped to 'mastered'). We watch for additions and spawn a
// burst at each new planet's position.
// ─────────────────────────────────────────────────────────────────────────

import { useCallback, useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

import type { LexiversePlanet } from '@/lib/lexiverse/lexiverse-types'

const POOL_SIZE = 260
const PER_BURST = 38

interface Active { i: number; vx: number; vy: number; vz: number; ttl: number; max: number; baseSize: number }
interface Shock { mesh: THREE.Mesh; ttl: number; max: number }

export interface BurstPoolProps {
  planets: LexiversePlanet[]
  triggerIds: string[]
}

export function BurstPool({ planets, triggerIds }: BurstPoolProps) {
  const { scene, camera } = useThree()
  const sprites = useRef<THREE.Sprite[]>([])
  const active = useRef<Active[]>([])
  const shocks = useRef<Shock[]>([])
  const seenIds = useRef<Set<string>>(new Set())
  const burstTex = useMemo(() => makeBurstTex(), [])

  // ── init the pool once ──────────────────────────────────────────────────
  useEffect(() => {
    const pool: THREE.Sprite[] = []
    for (let i = 0; i < POOL_SIZE; i++) {
      const mat = new THREE.SpriteMaterial({ map: burstTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 })
      const sp = new THREE.Sprite(mat); sp.visible = false
      scene.add(sp); pool.push(sp)
    }
    sprites.current = pool
    return () => {
      for (const sp of pool) { scene.remove(sp); sp.material.dispose() }
      for (const s of shocks.current) { scene.remove(s.mesh); (s.mesh.material as THREE.Material).dispose() }
      sprites.current = []; active.current = []; shocks.current = []
    }
  }, [scene, burstTex])

  // ── react to new triggerIds ─────────────────────────────────────────────
  const spawnBurst = useCallback((pos: THREE.Vector3, color: string) => {
    const tint = new THREE.Color(color)
    let spawned = 0
    for (let i = 0; i < sprites.current.length && spawned < PER_BURST; i++) {
      const sp = sprites.current[i]; if (sp.visible) continue
      sp.position.copy(pos)
      const th = Math.random() * Math.PI * 2, el = (Math.random() - 0.5) * 1.7
      const speed = 4 + Math.random() * 10
      const vx = Math.cos(th) * Math.cos(el) * speed
      const vy = Math.sin(el) * speed
      const vz = Math.sin(th) * Math.cos(el) * speed
      const baseSize = 0.5 + Math.random() * 1.6
      sp.scale.setScalar(baseSize)
      ;(sp.material as THREE.SpriteMaterial).color.copy(tint).lerp(new THREE.Color('#ffffff'), Math.random() * 0.6)
      ;(sp.material as THREE.SpriteMaterial).opacity = 1
      sp.visible = true
      active.current.push({ i, vx, vy, vz, ttl: 1.1 + Math.random() * 0.5, max: 1.4, baseSize })
      spawned++
    }
    // shockwave ring
    const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    const ring = new THREE.Mesh(new THREE.RingGeometry(1, 1.07, 64), ringMat)
    ring.position.copy(pos); ring.lookAt(camera.position)
    scene.add(ring)
    shocks.current.push({ mesh: ring, ttl: 0.95, max: 0.95 })
  }, [camera, scene])

  useEffect(() => {
    const byId = new Map(planets.map(p => [p.id, p]))
    for (const id of triggerIds) {
      if (seenIds.current.has(id)) continue
      seenIds.current.add(id)
      const p = byId.get(id); if (!p) continue
      spawnBurst(new THREE.Vector3(p.position.x, p.position.y, p.position.z), p.color ?? '#7EF9FF')
    }
  }, [triggerIds, planets, spawnBurst])

  useFrame((_, dt) => {
    // sprite particles
    for (let j = active.current.length - 1; j >= 0; j--) {
      const a = active.current[j]; const sp = sprites.current[a.i]
      a.vx *= 0.93; a.vy *= 0.93; a.vz *= 0.93
      sp.position.x += a.vx * dt; sp.position.y += a.vy * dt; sp.position.z += a.vz * dt
      a.ttl -= dt
      const k = Math.max(0, a.ttl / a.max)
      ;(sp.material as THREE.SpriteMaterial).opacity = k
      sp.scale.setScalar(a.baseSize * (1 + (1 - k) * 0.6))
      if (a.ttl <= 0) { sp.visible = false; active.current.splice(j, 1) }
    }
    // shockwaves
    for (let j = shocks.current.length - 1; j >= 0; j--) {
      const s = shocks.current[j]; s.ttl -= dt
      const k = Math.max(0, s.ttl / s.max)
      const grow = 1 + (1 - k) * 14
      s.mesh.scale.setScalar(grow * 1.6)
      ;(s.mesh.material as THREE.MeshBasicMaterial).opacity = k * 0.85
      s.mesh.lookAt(camera.position)
      if (s.ttl <= 0) { scene.remove(s.mesh); (s.mesh.material as THREE.Material).dispose(); shocks.current.splice(j, 1) }
    }
  })

  return null
}

function makeBurstTex(): THREE.Texture {
  const s = 64, c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.6)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s)
  return new THREE.CanvasTexture(c)
}
