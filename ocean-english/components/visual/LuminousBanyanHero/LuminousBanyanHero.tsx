'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState } from 'react'
import { siteConfig } from '@/config/site'
import { LuminousControlsPanel } from './LuminousControlsPanel'

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

      <div
        style={{
          position: 'absolute',
          bottom: 'clamp(64px, 10vh, 100px)',
          left: 'clamp(20px, 5vw, 48px)',
          zIndex: 10,
          maxWidth: 'min(480px, calc(100vw - 40px))',
          pointerEvents: 'none',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(22px, 3.5vw, 46px)',
            fontWeight: 700,
            lineHeight: 1.25,
            color: '#ECFBFF',
            letterSpacing: '0.02em',
            textShadow: '0 0 24px rgba(127,249,255,0.18)',
          }}
        >
          {siteConfig.slogan}
        </h1>
        <p
          style={{
            margin: '6px 0 0',
            fontSize: 'clamp(12px, 1.6vw, 16px)',
            color: '#9BBFCA',
          }}
        >
          {siteConfig.sloganZh}
        </p>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginTop: '20px',
            pointerEvents: 'auto',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/onboarding"
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.6)',
              color: '#38BDF8',
              fontSize: 'clamp(12px, 1.3vw, 14px)',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textDecoration: 'none',
              backdropFilter: 'blur(8px)',
              whiteSpace: 'nowrap',
            }}
          >
            {siteConfig.ctaPrimary} / {siteConfig.ctaPrimaryZh}
          </Link>
          <Link
            href="/onboarding"
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: 'transparent',
              border: '1px solid rgba(155, 191, 202, 0.4)',
              color: '#9BBFCA',
              fontSize: 'clamp(12px, 1.3vw, 14px)',
              letterSpacing: '0.04em',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {siteConfig.ctaSecondary} / {siteConfig.ctaSecondaryZh}
          </Link>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '82px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 10,
          width: 'max-content',
          maxWidth: 'calc(100vw - 120px)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '11px',
            letterSpacing: '0.2em',
            color: 'rgba(190, 215, 230, 0.7)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          LIVING BANYAN ECOSYSTEM CONSTRUCTED
        </p>
        <p
          style={{
            margin: '2px 0 0',
            fontSize: '10px',
            letterSpacing: '0.08em',
            color: 'rgba(155,191,202,0.35)',
          }}
        >
          移动鼠标，扰动这棵动态知识树。
        </p>
      </div>
    </section>
  )
}
