'use client'

import type { LexiverseConstellation, LexiverseGalaxy } from '@/lib/lexiverse/lexiverse-types'

export interface LexiverseBreadcrumbProps {
  constellation: LexiverseConstellation | null
  galaxy: LexiverseGalaxy | null
  onHomeClick: () => void
}

export function LexiverseBreadcrumb({ constellation, galaxy, onHomeClick }: LexiverseBreadcrumbProps) {
  return (
    <nav aria-label="Lexiverse breadcrumb" style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 13 }}>
      <button
        type="button"
        onClick={onHomeClick}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#7EF9FF',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          fontWeight: 700,
          cursor: 'pointer',
          padding: 0,
          letterSpacing: '-0.005em',
        }}
      >
        Lexiverse
      </button>
      {constellation && (
        <>
          <Separator />
          <span style={{ color: '#9FB6C6' }}>{constellation.title}</span>
        </>
      )}
      {galaxy && (
        <>
          <Separator />
          <span style={{ color: '#ECFBFF', fontWeight: 600 }}>{galaxy.title}</span>
          <span style={{ color: '#9FB6C6', marginLeft: 6 }}>· {galaxy.titleZh}</span>
        </>
      )}
    </nav>
  )
}

function Separator() {
  return <span style={{ color: 'rgba(159,182,198,0.35)', margin: '0 8px' }}>/</span>
}
