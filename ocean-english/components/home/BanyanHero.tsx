'use client'

import { useRef, useEffect } from 'react'
import { HeroOverlay } from './HeroOverlay'

export const NAVIGATE_MAP: Record<string, string> = {
  today:         '/today',
  words:         '/dictionary',
  drill:         '/drill',
  reading:       '/reading',
  quiz:          '/quiz',
  review:        '/memory',
  exam:          '/drill',
  pronunciation: '/pronunciation',
  scan:          '/scan',
  chat:          '/chat',
  universe:      '/lexiverse',
  lexigraph:     '/lexigraph',
  knowledge:     '/dictionary',
  me:            '/profile',
  onboarding:    '/onboarding',
}

type Particle = {
  bx: number; by: number
  amp: number; ph: number; sp: number; sz: number; tw: number; white: boolean
}

/* fix2-A：预渲染发光 sprite（teal/白各一张离屏 canvas，radial gradient 画一次）。
   draw 循环 drawImage 取代逐粒子 shadowBlur —— Canvas2D 的 shadowBlur 是
   逐次高斯模糊，600+ 粒子每帧重算是首页卡顿的最大头。 */
const SPRITE_BASE = 32   // sprite 基准尺寸（中心点半径 8px + 光晕）

function makeGlowSprite(r: number, g: number, b: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = SPRITE_BASE
  c.height = SPRITE_BASE
  const sctx = c.getContext('2d')!
  const half = SPRITE_BASE / 2
  const grad = sctx.createRadialGradient(half, half, 0, half, half, half)
  grad.addColorStop(0, `rgba(${r},${g},${b},1)`)
  grad.addColorStop(0.25, `rgba(${r},${g},${b},0.85)`)
  grad.addColorStop(0.55, `rgba(${r},${g},${b},0.25)`)
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
  sctx.fillStyle = grad
  sctx.fillRect(0, 0, SPRITE_BASE, SPRITE_BASE)
  return c
}

function useBanyanCanvas(ref: React.RefObject<HTMLCanvasElement | null>, active: boolean) {
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf = 0, t = 0, W = 0, H = 0
    let running = false
    // fix2-A：dpr 上限 2 → 1.5
    const dpr = Math.min(window.devicePixelRatio ?? 1, 1.5)
    let particles: Particle[] = []
    const tealSprite = makeGlowSprite(79, 230, 206)
    const whiteSprite = makeGlowSprite(255, 255, 255)

    function push(bx: number, by: number, amp: number, sp: number, sz: number, tw: number, white: boolean) {
      particles.push({ bx, by, amp, ph: Math.random() * 6.28, sp, sz, tw, white })
    }

    function build() {
      const rect = canvas!.getBoundingClientRect()
      W = rect.width; H = rect.height
      canvas!.width = W * dpr; canvas!.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      particles = []
      const cx = W * 0.5, baseY = H * 0.92
      const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5

      const crownN = Math.floor((W * H) / 2600)
      const blobs = [
        { x: cx,           y: H * 0.34, rx: W * 0.30, ry: H * 0.17, w: 1.4 },
        { x: cx - W * 0.20, y: H * 0.40, rx: W * 0.16, ry: H * 0.12, w: 0.9 },
        { x: cx + W * 0.20, y: H * 0.40, rx: W * 0.16, ry: H * 0.12, w: 0.9 },
        { x: cx - W * 0.10, y: H * 0.26, rx: W * 0.12, ry: H * 0.10, w: 0.7 },
        { x: cx + W * 0.11, y: H * 0.27, rx: W * 0.12, ry: H * 0.10, w: 0.7 },
      ]
      const totW = blobs.reduce((s, b) => s + b.w, 0)
      for (let i = 0; i < crownN; i++) {
        let r = Math.random() * totW
        let b = blobs[0]
        for (const bl of blobs) { if (r < bl.w) { b = bl; break; } r -= bl.w; }
        push(b.x + gauss() * b.rx, b.y + gauss() * b.ry, 1.2 + Math.random() * 3.5, 0.3 + Math.random() * 0.7, 0.7 + Math.random() * 1.7, 0.5 + Math.random() * 1.6, Math.random() < 0.22)
      }
      const trunkN = Math.floor(H / 6)
      for (let i = 0; i < trunkN; i++) {
        const yy = H * 0.48 + Math.random() * (baseY - H * 0.48)
        const taper = (yy - H * 0.48) / (baseY - H * 0.48)
        push(cx + gauss() * (W * 0.012 + taper * W * 0.02), yy, 0.6 + Math.random() * 1.4, 0.3 + Math.random() * 0.5, 0.7 + Math.random() * 1.5, 0.4 + Math.random() * 1.0, Math.random() < 0.12)
      }
      const roots = [cx - W * 0.22, cx - W * 0.08, cx + W * 0.12, cx + W * 0.24]
      roots.forEach(rx => {
        const top = H * 0.42, bot = baseY - Math.random() * H * 0.12
        const n = Math.floor((bot - top) / 7)
        for (let i = 0; i < n; i++) {
          push(rx + Math.sin(i * 0.4) * 4 + gauss() * 3, top + (i / n) * (bot - top), 0.8 + Math.random() * 1.6, 0.3 + Math.random() * 0.6, 0.6 + Math.random() * 1.2, 0.5 + Math.random() * 1.2, Math.random() < 0.1)
        }
      })
    }

    // sprite 直径 ≈ 原「粒子半径 + shadowBlur 光晕」视觉等价（sz + sz*3.2 模糊半径）
    function blit(p: Particle, x: number, y: number, alpha: number) {
      const d = p.sz * 8.4
      ctx.globalAlpha = alpha
      ctx.drawImage(p.white ? whiteSprite : tealSprite, x - d / 2, y - d / 2, d, d)
    }

    function draw() {
      t += 0.012
      ctx.clearRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'lighter'
      for (const p of particles) {
        const dx = Math.sin(t * p.sp + p.ph) * p.amp
        const dy = Math.cos(t * p.sp * 0.8 + p.ph) * p.amp * 0.6
        const a = 0.35 + 0.55 * Math.abs(Math.sin(t * p.tw + p.ph))
        blit(p, p.bx + dx, p.by + dy, a)
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
      raf = requestAnimationFrame(draw)
    }

    function drawStatic() {
      ctx.clearRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'lighter'
      for (const p of particles) blit(p, p.bx, p.by, 0.7)
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }

    // fix2-A：滚出视口 / 后台标签页 → cancelAnimationFrame；回来恢复
    let inView = true
    let pageVisible = document.visibilityState === 'visible'
    function syncLoop() {
      const should = active && inView && pageVisible
      if (should && !running) { running = true; raf = requestAnimationFrame(draw) }
      else if (!should && running) { running = false; cancelAnimationFrame(raf) }
    }

    build()
    if (active) syncLoop()
    else drawStatic()

    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; syncLoop() }, { threshold: 0 })
    io.observe(canvas)
    const onVis = () => { pageVisible = document.visibilityState === 'visible'; syncLoop() }
    document.addEventListener('visibilitychange', onVis)

    const onResize = () => { build(); if (!running) drawStatic() }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('resize', onResize)
    }
  }, [active, ref])
}

// fix1：覆盖层抽至 HeroOverlay 共用；本组件保留 2D Canvas 作为
// WebGL 不可用 / prefers-reduced-motion 时的降级方案
export function BanyanHero({ navigate, animate = true, fill = false }: { navigate?: (go: string) => void; animate?: boolean; fill?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useBanyanCanvas(ref, animate)

  // F1：fill 模式 — 仅画布，由 HomeHero 的画框卡统一包裹与叠 Overlay
  if (fill) {
    return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
  }

  return (
    <section className="home-hero-frame">
      <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      {navigate && <HeroOverlay navigate={navigate} />}
    </section>
  )
}
