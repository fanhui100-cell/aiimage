'use client'

import { useState } from 'react'
import { LumiBubble } from './LumiBubble'

const ORBIT_COUNT = 4

export function LumiCompanion() {
  const [bubbleOpen, setBubbleOpen] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '64px',
        right: '20px',
        zIndex: 45,
      }}
    >
      {bubbleOpen && <LumiBubble onClose={() => setBubbleOpen(false)} />}

      <div
        role="button"
        aria-label="Lumi companion — click for help"
        tabIndex={0}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setBubbleOpen(v => !v)}
        onKeyDown={e => e.key === 'Enter' && setBubbleOpen(v => !v)}
        style={{ position: 'relative', cursor: 'pointer', width: '52px', height: '52px' }}
      >
        {/* Orbit particles */}
        {Array.from({ length: ORBIT_COUNT }).map((_, i) => (
          <span
            key={i}
            className={`lumi-orbit lumi-orbit-${i}`}
            style={{
              position: 'absolute',
              width: '3px',
              height: '3px',
              borderRadius: '50%',
              background: '#7EF9FF',
              top: '50%',
              left: '50%',
              opacity: 0.55,
            }}
          />
        ))}

        {/* Orb */}
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 36% 36%, #C8FFFE 0%, #7EF9FF 18%, #38BDF8 48%, #0EA5E9 72%, rgba(2,6,23,0.3) 100%)',
            boxShadow: hovered
              ? '0 0 28px rgba(56,189,248,0.95), 0 0 60px rgba(56,189,248,0.55), 0 0 100px rgba(56,189,248,0.28)'
              : '0 0 18px rgba(56,189,248,0.65), 0 0 44px rgba(56,189,248,0.3)',
            animation: 'lumiFloat 3s ease-in-out infinite',
            transition: 'box-shadow 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.92)',
              boxShadow: '0 0 8px rgba(255,255,255,0.85)',
            }}
          />
        </div>

        {/* Hover tooltip */}
        {hovered && !bubbleOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: '58px',
              right: 0,
              whiteSpace: 'nowrap',
              fontSize: '11px',
              color: '#9BBFCA',
              background: 'rgba(2,6,23,0.88)',
              padding: '4px 9px',
              borderRadius: '5px',
              border: '1px solid rgba(56,189,248,0.2)',
              fontFamily: 'var(--font-mono)',
              pointerEvents: 'none',
            }}
          >
            Need help?
          </div>
        )}
      </div>
    </div>
  )
}
