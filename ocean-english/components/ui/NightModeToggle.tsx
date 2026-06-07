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
        bottom: '28px',
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
      {night ? '☀️' : '🌙'}
    </button>
  )
}
