'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isDarkRoute } from '@/lib/theme-route'

const TABS = [
  {
    href: '/today',
    labelZh: '今日',
    exact: false,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8"  y1="2" x2="8"  y2="6" />
        <line x1="3"  y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: '/dictionary',
    labelZh: '学习',
    exact: false,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    href: '/memory',
    labelZh: '复习',
    exact: false,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 4v6h-6" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
    ),
  },
  {
    href: '/quiz',
    labelZh: '练习',
    exact: false,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    href: '/profile',
    labelZh: '我的',
    exact: false,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export function MobileTabBar() {
  const pathname = usePathname()
  const dark = isDarkRoute(pathname)

  const bg = dark ? 'rgba(5,9,15,0.95)' : 'var(--card-2)'
  const border = dark ? '1px solid rgba(79,230,206,0.12)' : '1px solid var(--line)'
  const activeColor = dark ? 'var(--teal)' : 'var(--teal-ink)'
  const inactiveColor = dark ? 'rgba(255,255,255,0.38)' : 'var(--ink-muted)'

  return (
    <nav
      className="md:hidden"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: bg,
        borderTop: border,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map(tab => {
        const active = tab.exact ? pathname === tab.href : (pathname === tab.href || pathname.startsWith(tab.href + '/'))
        const color = active ? activeColor : inactiveColor
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '10px 0 8px',
              textDecoration: 'none',
              color,
              minHeight: '56px',
              transition: 'color 0.15s',
              position: 'relative',
            }}
          >
            {active && (
              <span style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '20px',
                height: '2px',
                borderRadius: '1px',
                background: activeColor,
              }} />
            )}
            <span style={{
              display: 'inline-flex',
              transition: 'transform 0.15s ease',
              transform: active ? 'scale(1.08)' : 'scale(1)',
            }}>
              {tab.icon}
            </span>
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              letterSpacing: '0.04em',
              opacity: active ? 1 : 0.7,
            }}>
              {tab.labelZh}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
