'use client'

import { useRef, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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

const HERO_NODES = [
  { go: 'chat',     zh: 'AI 导学',  en: 'Guide',     x: '63%', y: '30%' },
  { go: 'words',    zh: '词库',     en: 'Words',     x: '79%', y: '20%' },
  { go: 'universe', zh: '词汇宇宙', en: 'Lexiverse', x: '83%', y: '54%' },
  { go: 'review',   zh: '复习',     en: 'Review',    x: '67%', y: '70%' },
  { go: 'scan',     zh: '扫描',     en: 'Scan',      x: '48%', y: '44%' },
]

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

function HeroNode({ node, navigate }: { node: typeof HERO_NODES[0]; navigate: (go: string) => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={() => navigate(node.go)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="hero-node"
      style={{ position: 'absolute', left: node.x, top: node.y, zIndex: 8, transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      <span style={{ width: hov ? 13 : 10, height: hov ? 13 : 10, borderRadius: 999, background: 'var(--teal)', boxShadow: hov ? '0 0 28px 8px rgba(79,230,206,0.85)' : '0 0 14px 4px rgba(79,230,206,0.5)', transition: 'all .22s' }} />
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, opacity: hov ? 1 : 0, transform: hov ? 'translateY(0)' : 'translateY(-4px)', transition: 'all .2s', pointerEvents: 'none' }}>
        <span style={{ fontFamily: 'var(--font-serif-zh)', fontSize: 12, fontWeight: 600, color: '#eaf3f6', whiteSpace: 'nowrap', textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>{node.zh}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--teal)', letterSpacing: '0.1em', opacity: 0.8 }}>{node.en}</span>
      </span>
    </button>
  )
}

export function BanyanHero({ navigate, animate = true }: { navigate: (go: string) => void; animate?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useBanyanCanvas(ref, animate)

  return (
    <section style={{ position: 'relative', width: '100%', height: 'min(86vh, 720px)', minHeight: 460, overflow: 'hidden', background: 'radial-gradient(120% 90% at 50% 30%, #0a1622 0%, #060b12 60%, #04070c 100%)' }}>
      <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <div className="hero-nodes-wrap">
        {HERO_NODES.map(n => <HeroNode key={n.go} node={n} navigate={navigate} />)}
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 35%, transparent 52%, rgba(4,7,12,0.7) 100%)', pointerEvents: 'none', zIndex: 5 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, background: 'linear-gradient(180deg, transparent, var(--paper))', pointerEvents: 'none', zIndex: 6 }} />
      <div style={{ position: 'absolute', bottom: 'clamp(64px,12vh,120px)', left: 'clamp(22px,5vw,60px)', zIndex: 10, maxWidth: 'min(620px, calc(100% - 44px))' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 'clamp(32px,5vw,56px)', lineHeight: 1.18, letterSpacing: '0.02em', color: '#f3f7f8', textShadow: '0 0 40px rgba(79,230,206,0.18)', whiteSpace: 'nowrap' }}>万词成海，自有光</h1>
        <p style={{ margin: '10px 0 0', fontFamily: 'var(--font-news)', fontStyle: 'italic', fontSize: 'clamp(14px,1.8vw,21px)', color: 'var(--teal)', opacity: 0.92 }}>An ocean of words, lit from within.</p>
        <p style={{ margin: '10px 0 0', fontSize: 'clamp(13px,1.4vw,15px)', color: 'rgba(234,243,246,0.62)', lineHeight: 1.6 }}>AI 驱动的深海英语学习系统 — 词汇、星图、阅读、记忆，一起生长。</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('today')} className="btn-press" style={{ padding: '13px 28px', borderRadius: 999, background: 'linear-gradient(180deg,#6ff0db,#34d8c0)', color: '#04241f', fontSize: 14.5, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 12px 26px -14px rgba(79,230,206,0.8)', fontFamily: 'var(--font-sans)' }}>开始学习</button>
          <button onClick={() => navigate('onboarding')} className="btn-press" style={{ padding: '13px 26px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(225,238,244,0.3)', color: '#eaf3f6', fontSize: 14.5, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>选择等级</button>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 10, color: 'rgba(234,243,246,0.4)', fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, pointerEvents: 'none' }}>
        <span>SCROLL</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </section>
  )
}
