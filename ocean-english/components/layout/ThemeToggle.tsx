'use client'

import { useEffect, useState } from 'react'
import { getThemeMode, toggleThemeMode, type ThemeMode } from '@/lib/theme-mode'

const SUN = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)
const MOON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
)

/** Navbar 右侧 日光/夜间 切换按钮（跨页/跨标签同步）。 */
export function ThemeToggle({ dark, compact = false }: { dark?: boolean; compact?: boolean }) {
  const [mode, setMode] = useState<ThemeMode>('light')
  useEffect(() => {
    setMode(getThemeMode())
    const onTheme = (e: Event) => setMode((e as CustomEvent).detail as ThemeMode)
    const onStorage = () => setMode(getThemeMode())
    window.addEventListener('lexiverse-theme', onTheme)
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener('lexiverse-theme', onTheme); window.removeEventListener('storage', onStorage) }
  }, [])
  const isDark = mode === 'dark'
  const border = dark ? 'var(--glass-border)' : 'var(--line-strong)'
  const color = dark ? 'var(--text-secondary)' : 'var(--ink-sub)'
  if (compact) {
    return (
      <button type="button" aria-label="切换日光/夜间" aria-pressed={isDark} onClick={() => toggleThemeMode()}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color, fontFamily: 'var(--font-sans)', fontSize: 13.5, padding: 0 }}>
        {isDark ? MOON : SUN}<span>{isDark ? '夜间' : '日光'}</span>
      </button>
    )
  }
  return (
    <button type="button" aria-label="切换日光/夜间模式" aria-pressed={isDark} title="切换 日光 / 夜间" onClick={() => toggleThemeMode()}
      style={{
        width: 36, height: 36, borderRadius: 9, border: `1px solid ${border}`, background: 'transparent',
        color, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'color .15s, border-color .15s, background .15s', flexShrink: 0,
      }}>
      {isDark ? MOON : SUN}
    </button>
  )
}
