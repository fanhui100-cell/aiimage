'use client'

import { useRef, useEffect } from 'react'
import { HeroOverlay } from './HeroOverlay'

export const NAVIGATE_MAP: Record<string, string> = {
  today:         '/today',
  words:         '/dictionary',
  reading:       '/reading',
  quiz:          '/quiz',
  review:        '/memory',
  exam:          '/exam',
  pronunciation: '/pronunciation',
  scan:          '/scan',
  chat:          '/chat',
  universe:      '/lexiverse',
  lexigraph:     '/lexigraph',
  knowledge:     '/knowledge',
  me:            '/profile',
  onboarding:    '/onboarding',
}

type Particle = {
  bx: number; by: number
  amp: number; ph: number; sp: number; sz: number; tw: number; white: boolean
}

function useBanyanCanvas(ref: React.RefObject<HTMLCanvasElement | null>, active: boolean) {
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf: number, t = 0, W = 0, H = 0
    const dpr = Math.min(window.devicePixelRatio ?? 1, 2)
    let particles: Particle[] = []

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

    function draw() {
      t += 0.012
      ctx.clearRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'lighter'
      for (const p of particles) {
        const dx = Math.sin(t * p.sp + p.ph) * p.amp
        const dy = Math.cos(t * p.sp * 0.8 + p.ph) * p.amp * 0.6
        const a = 0.35 + 0.55 * Math.abs(Math.sin(t * p.tw + p.ph))
        const col = p.white ? '255,255,255' : '79,230,206'
        ctx.beginPath()
        ctx.fillStyle = `rgba(${col},${a})`
        ctx.shadowColor = `rgba(${col},${a})`
        ctx.shadowBlur = p.sz * 3.2
        ctx.arc(p.bx + dx, p.by + dy, p.sz, 0, 6.2832)
        ctx.fill()
      }
      ctx.shadowBlur = 0
      ctx.globalCompositeOperation = 'source-over'
      raf = requestAnimationFrame(draw)
    }

    build()
    if (active) {
      draw()
    } else {
      ctx.globalCompositeOperation = 'lighter'
      for (const p of particles) {
        const col = p.white ? '255,255,255' : '79,230,206'
        ctx.beginPath()
        ctx.fillStyle = `rgba(${col},0.7)`
        ctx.shadowColor = `rgba(${col},0.7)`
        ctx.shadowBlur = p.sz * 3
        ctx.arc(p.bx, p.by, p.sz, 0, 6.28)
        ctx.fill()
      }
    }

    const onResize = () => build()
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [active])
}

// fix1：覆盖层抽至 HeroOverlay 共用；本组件保留 2D Canvas 作为
// WebGL 不可用 / prefers-reduced-motion 时的降级方案
export function BanyanHero({ navigate, animate = true }: { navigate: (go: string) => void; animate?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useBanyanCanvas(ref, animate)

  return (
    <section style={{ position: 'relative', width: '100%', height: 'min(86vh, 720px)', minHeight: 460, overflow: 'hidden', background: 'radial-gradient(120% 90% at 50% 30%, #0a1622 0%, #060b12 60%, #04070c 100%)' }}>
      <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <HeroOverlay navigate={navigate} />
    </section>
  )
}
