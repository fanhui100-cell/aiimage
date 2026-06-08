'use client'
// components/lexiverse/WebGLFallback.tsx
// Shown when WebGL is unavailable. Offers the 2D entry points so the user
// can still reach their vocabulary.
import Link from 'next/link'
import { CONSTELLATIONS, GALAXIES } from '@/config/lexiverse-galaxies'
import { LiquidGlassPanel, LiquidActionButton, LiquidBadge } from './liquid-ui'

export function WebGLFallback() {
  return (
    <div style={{ minHeight: '100vh', background: '#040407', color: '#ECFBFF', padding: '60px 24px', fontFamily: "'Space Grotesk', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.18em', color: 'rgba(126,249,255,0.55)', fontFamily: "'Space Mono', monospace", marginBottom: 8 }}>
          LEXIVERSE · 2D FALLBACK
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#7EF9FF', margin: '0 0 8px' }}>Lexiverse</h1>
        <p style={{ fontSize: 14, color: '#9FB6C6', lineHeight: 1.7, marginBottom: 28 }}>
          Your browser cannot run WebGL right now, so the 3D universe view isn’t available.
          You can still browse the catalog and jump into the existing 2D experiences below.
          <br />当前浏览器无法运行 WebGL，3D 宇宙视图不可用。你仍可浏览星系目录并使用下方的 2D 入口。
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 36 }}>
          <Link href="/dictionary" style={{ textDecoration: 'none' }}><LiquidActionButton>Open Dictionary · 词库</LiquidActionButton></Link>
          <Link href="/lexigraph" style={{ textDecoration: 'none' }}><LiquidActionButton variant="secondary">Open LexiGraph · 词图</LiquidActionButton></Link>
          <Link href="/today" style={{ textDecoration: 'none' }}><LiquidActionButton variant="secondary">Today Hub · 今日</LiquidActionButton></Link>
          <Link href="/memory" style={{ textDecoration: 'none' }}><LiquidActionButton variant="secondary">Open Memory · 复习</LiquidActionButton></Link>
        </div>

        {CONSTELLATIONS.map(c => (
          <section key={c.id} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, color: c.color, margin: 0 }}>{c.title}</h2>
              <span style={{ color: '#9FB6C6', fontSize: 14 }}>{c.titleZh}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {GALAXIES.filter(g => g.constellationId === c.id).map(g => (
                <LiquidGlassPanel key={g.id} accent={g.colorTheme ?? c.color} padding={14}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: g.colorTheme ?? c.color, marginBottom: 3 }}>{g.title}</div>
                  <div style={{ fontSize: 12, color: '#9FB6C6', marginBottom: 8 }}>{g.titleZh}</div>
                  <div style={{ fontSize: 12, color: '#CFE6F2', lineHeight: 1.55, marginBottom: 10 }}>{g.description}</div>
                  <LiquidBadge color={g.colorTheme ?? c.color} size="sm">{g.sourceType}</LiquidBadge>
                </LiquidGlassPanel>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
