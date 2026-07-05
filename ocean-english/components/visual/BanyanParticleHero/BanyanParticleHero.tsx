'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { useBanyanInteraction } from './useBanyanInteraction'
import { BanyanModulePanel } from './BanyanModulePanel'

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

      {/* Hero text — bottom-left, responsive margins */}
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

      {/* Hint — bottom center */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
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
            letterSpacing: '0.12em',
            color: 'rgba(56,189,248,0.5)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {siteConfig.heroHint}
        </p>
        <p
          style={{
            margin: '2px 0 0',
            fontSize: '10px',
            letterSpacing: '0.08em',
            color: 'rgba(155,191,202,0.35)',
          }}
        >
          {siteConfig.heroHintZh}
        </p>
      </div>

      {/* Replay — bottom right */}
      <button
        onClick={interaction.restartAnimation}
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '16px',
          background: 'rgba(2, 6, 23, 0.7)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '6px',
          color: 'rgba(56, 189, 248, 0.6)',
          fontSize: '11px',
          letterSpacing: '0.1em',
          padding: '7px 12px',
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
