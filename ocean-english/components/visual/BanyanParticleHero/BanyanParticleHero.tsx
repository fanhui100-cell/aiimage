'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { useBanyanInteraction } from './useBanyanInteraction'
import { BanyanModulePanel } from './BanyanModulePanel'

// Canvas is WebGL-only — skip SSR
const BanyanCanvas = dynamic(
  () => import('./BanyanCanvas').then(m => ({ default: m.BanyanCanvas })),
  { ssr: false },
)

export function BanyanParticleHero() {
  const interaction = useBanyanInteraction()

  return (
    <section
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#020617',
      }}
    >
      <BanyanCanvas
        activeModuleId={interaction.activeModuleId}
        hoveredModuleId={interaction.hoveredModuleId}
        animationKey={interaction.animationKey}
        onNodeClick={interaction.handleNodeClick}
        onNodeHover={interaction.handleNodeHover}
      />

      {/* Hero text — bottom-left */}
      <div
        style={{
          position: 'absolute',
          bottom: '80px',
          left: '48px',
          zIndex: 10,
          maxWidth: '480px',
          pointerEvents: 'none',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(26px, 3.5vw, 46px)',
            fontWeight: 700,
            lineHeight: 1.25,
            color: '#ECFBFF',
            letterSpacing: '0.02em',
          }}
        >
          {siteConfig.slogan}
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 'clamp(13px, 1.6vw, 16px)', color: '#9BBFCA' }}>
          {siteConfig.sloganZh}
        </p>

        <div style={{ display: 'flex', gap: '12px', marginTop: '28px', pointerEvents: 'auto' }}>
          <Link
            href="/onboarding"
            style={{
              padding: '12px 28px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.6)',
              color: '#38BDF8',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textDecoration: 'none',
              backdropFilter: 'blur(8px)',
            }}
          >
            {siteConfig.ctaPrimary} / {siteConfig.ctaPrimaryZh}
          </Link>
          <Link
            href="/onboarding"
            style={{
              padding: '12px 28px',
              borderRadius: '8px',
              background: 'transparent',
              border: '1px solid rgba(155, 191, 202, 0.4)',
              color: '#9BBFCA',
              fontSize: '14px',
              letterSpacing: '0.06em',
              textDecoration: 'none',
            }}
          >
            {siteConfig.ctaSecondary} / {siteConfig.ctaSecondaryZh}
          </Link>
        </div>
      </div>

      {/* Hint — bottom center */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <p style={{ margin: 0, fontSize: '11px', letterSpacing: '0.15em', color: 'rgba(56,189,248,0.5)' }}>
          {siteConfig.heroHint}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(155,191,202,0.35)' }}>
          {siteConfig.heroHintZh}
        </p>
      </div>

      {/* Replay — bottom right */}
      <button
        onClick={interaction.restartAnimation}
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '24px',
          background: 'rgba(2, 6, 23, 0.7)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '6px',
          color: 'rgba(56, 189, 248, 0.6)',
          fontSize: '11px',
          letterSpacing: '0.1em',
          padding: '8px 14px',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
        }}
      >
        ↺ REPLAY
      </button>

      {/* Module detail panel */}
      <BanyanModulePanel
        activeModuleId={interaction.activeModuleId}
        isOpen={interaction.isPanelOpen}
        onClose={interaction.closePanel}
      />
    </section>
  )
}
