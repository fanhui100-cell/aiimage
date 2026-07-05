'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState } from 'react'
import { LuminousControlsPanel } from './LuminousControlsPanel'

/* §15.3 Hero 可点击节点 — 叠层 a 元素,桌面可见,移动端隐藏 */
const HERO_NODES: { href: string; labelZh: string; label: string; x: string; y: string }[] = [
  { href: '/chat',       labelZh: 'AI 导学', label: 'Guide',      x: '62%', y: '28%' },
  { href: '/dictionary', labelZh: '词典',    label: 'Dictionary', x: '78%', y: '18%' },
  { href: '/lexigraph',  labelZh: '词汇星图', label: 'LexiGraph',  x: '82%', y: '52%' },
  { href: '/memory',     labelZh: '复习',    label: 'Review',     x: '68%', y: '68%' },
  { href: '/scan',       labelZh: '文档扫描', label: 'Scan',       x: '50%', y: '42%' },
]

function HeroNode({ href, labelZh, label, x, y }: typeof HERO_NODES[number]) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href={href}
      className="hidden md:flex"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        zIndex: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        textDecoration: 'none',
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
      }}
    >
      <span style={{
        width: hovered ? '13px' : '10px',
        height: hovered ? '13px' : '10px',
        borderRadius: '50%',
        background: 'var(--teal)',
        boxShadow: hovered ? '0 0 28px 8px rgba(79,230,206,0.85)' : '0 0 14px 4px rgba(79,230,206,0.5)',
        transition: 'box-shadow 0.25s, width 0.2s, height 0.2s',
        flexShrink: 0,
        display: 'block',
      }} />
      <span style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1px',
        opacity: hovered ? 1 : 0,
        transform: hovered ? 'translateY(0)' : 'translateY(-4px)',
        transition: 'opacity 0.2s, transform 0.2s',
        pointerEvents: 'none',
      }}>
        <span style={{ fontFamily: 'var(--font-serif-zh)', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>{labelZh}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--teal)', letterSpacing: '0.1em', opacity: 0.8 }}>{label}</span>
      </span>
    </Link>
  )
}

const LuminousBanyanCanvas = dynamic(
  () => import('./LuminousBanyanCanvas').then(m => ({ default: m.LuminousBanyanCanvas })),
  { ssr: false },
)

export function LuminousBanyanHero() {
  const [pointSize, setPointSize] = useState(3.0)
  const [tailAlpha, setTailAlpha] = useState(0.25)
  const [tint, setTint] = useState('#ffffff')
  const [animationKey, setAnimationKey] = useState(0)

  return (
    <section
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      {/* WebGL 榕树粒子 — 不改模拟本身 */}
      <LuminousBanyanCanvas
        pointSize={pointSize}
        tailAlpha={tailAlpha}
        tint={tint}
        animationKey={animationKey}
      />

      <LuminousControlsPanel
        pointSize={pointSize}
        tailAlpha={tailAlpha}
        tint={tint}
        onPointSizeChange={setPointSize}
        onTailAlphaChange={setTailAlpha}
        onTintChange={setTint}
        onReplay={() => setAnimationKey(k => k + 1)}
      />

      {/* §15.3 可点击节点叠层(桌面端) */}
      {HERO_NODES.map(node => <HeroNode key={node.href} {...node} />)}

      {/* 边缘 vignette — 让黑画布融入 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 55%, rgba(5,9,15,0.72) 100%)',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      />

      {/* 底部渐变溶入米白 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '220px',
          background: 'linear-gradient(180deg, transparent, var(--paper))',
          pointerEvents: 'none',
          zIndex: 6,
        }}
      />

      {/* 主题字覆盖层 */}
      <div
        style={{
          position: 'absolute',
          bottom: 'clamp(80px, 12vh, 140px)',
          left: 'clamp(24px, 5vw, 64px)',
          zIndex: 10,
          maxWidth: 'min(520px, calc(100vw - 48px))',
          pointerEvents: 'none',
        }}
      >
        {/* 中文主标(领衔) */}
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-serif-zh)',
            fontWeight: 600,
            fontSize: 'clamp(36px, 5.5vw, 66px)',
            lineHeight: 1.2,
            letterSpacing: '0.02em',
            color: 'var(--text-primary)',
            textShadow: '0 0 40px rgba(79,230,206,0.15)',
          }}
        >
          万词成海,自有光
        </h1>
        {/* 英文斜体副标 */}
        <p
          style={{
            margin: '10px 0 0',
            fontFamily: 'var(--font-news)',
            fontStyle: 'italic',
            fontSize: 'clamp(14px, 1.8vw, 22px)',
            color: 'var(--teal)',
            opacity: 0.9,
          }}
        >
          An ocean of words, lit from within.
        </p>
        {/* lede */}
        <p
          style={{
            margin: '10px 0 0',
            fontSize: 'clamp(13px, 1.4vw, 16px)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}
        >
          AI 驱动的深海英语学习系统 — 词汇、星图、阅读、记忆,一起生长。
        </p>

        {/* CTA 按钮 */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '28px',
            pointerEvents: 'auto',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/today"
            style={{
              padding: '12px 26px',
              borderRadius: 'var(--r-pill)',
              background: 'linear-gradient(180deg,#6ff0db,#34d8c0)',
              color: '#04241f',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.02em',
              textDecoration: 'none',
              boxShadow: '0 12px 26px -14px rgba(79,230,206,0.8)',
              whiteSpace: 'nowrap',
            }}
          >
            开始学习
          </Link>
          <Link
            href="/onboarding"
            style={{
              padding: '12px 26px',
              borderRadius: 'var(--r-pill)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(225,238,244,0.3)',
              color: '#eaf3f6',
              fontSize: '14px',
              letterSpacing: '0.02em',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            选择等级
          </Link>
        </div>
      </div>
    </section>
  )
}
