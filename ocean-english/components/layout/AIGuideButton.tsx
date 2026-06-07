'use client'

import Link from 'next/link'
import { useState } from 'react'

export function AIGuideButton() {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href="/chat"
      title="AI 导学 · AI Guide"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        bottom: 'clamp(80px, calc(80px + env(safe-area-inset-bottom)), 120px)',
        right: '28px',
        zIndex: 199,
        width: '46px',
        height: '46px',
        borderRadius: '50%',
        background: hovered ? 'rgba(14,140,122,0.18)' : 'rgba(14,140,122,0.10)',
        border: `1px solid rgba(14,140,122,${hovered ? '0.5' : '0.3'})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
        color: 'var(--teal-ink)',
        boxShadow: hovered
          ? '0 0 20px 4px rgba(14,140,122,0.2), 0 4px 16px rgba(0,0,0,0.15)'
          : '0 4px 16px rgba(0,0,0,0.12)',
        transform: hovered ? 'scale(1.08)' : 'scale(1)',
        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.15s',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <line x1="8" y1="10" x2="16" y2="10" />
        <line x1="8" y1="14" x2="12" y2="14" />
      </svg>
    </Link>
  )
}
