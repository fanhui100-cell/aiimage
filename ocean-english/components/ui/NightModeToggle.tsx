'use client'

import { useEffect, useState } from 'react'

export function NightModeToggle() {
  const [night, setNight] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('lexiocean-night-mode')
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial = stored !== null ? stored === 'true' : system
    apply(initial)
    setNight(initial)
  }, [])

  function apply(on: boolean) {
    if (on) {
      document.documentElement.setAttribute('data-theme', 'night')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }

  function toggle() {
    const next = !night
    setNight(next)
    apply(next)
    localStorage.setItem('lexiocean-night-mode', String(next))
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={night ? '切换日间模式 · Light mode' : '切换夜间模式 · Night mode'}
      style={{
        position: 'fixed',
        bottom: 'clamp(28px, calc(28px + env(safe-area-inset-bottom)), 68px)',
        right: '28px',
        zIndex: 200,
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        border: '1px solid var(--line-strong, rgba(255,255,255,0.15))',
        background: 'var(--card, rgba(255,255,255,0.08))',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        transition: 'background 0.25s, border-color 0.25s, transform 0.15s',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {night ? (
        /* 日间：太阳 */
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        /* 夜间：月亮 */
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}
