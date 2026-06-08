'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { siteConfig } from '@/config/site'
import { UserMenu } from '@/components/auth/UserMenu'
import { UnifiedMenu } from '@/components/layout/UnifiedMenu'
import { isDarkRoute } from '@/lib/theme-route'

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const dark = isDarkRoute(pathname)

  /* ── 颜色 token ── */
  const navBg = dark
    ? 'linear-gradient(to bottom, rgba(5,9,15,0.92), transparent)'
    : 'var(--paper)'
  const navBorder = dark ? 'none' : '1px solid var(--line)'
  const textColor = dark ? 'var(--text-secondary)' : 'var(--ink-sub)'
  const activeColor = dark ? 'var(--teal)' : 'var(--teal-ink)'

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: navBg,
          borderBottom: navBorder,
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          gap: '24px',
        }}
      >
        {/* ── Logo ── */}
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          style={{ textDecoration: 'none', flexShrink: 0 }}
        >
          <div style={{ lineHeight: 1.15 }}>
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '18px',
                fontWeight: 400,
                color: dark ? 'var(--text-primary)' : 'var(--ink)',
                letterSpacing: '0.01em',
              }}
            >
              Lexi<em style={{ fontStyle: 'italic', color: activeColor }}>Ocean</em>
            </span>
          </div>
          <div
            className="hidden sm:block"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.12em',
              color: textColor,
              marginTop: '2px',
            }}
          >
            {siteConfig.projectNameZh}
          </div>
        </Link>

        {/* ── 桌面端主导航 ── */}
        <div
          className="hidden md:flex"
          style={{
            flex: 1,
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            gap: '0',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            justifyContent: 'center',
            alignItems: 'stretch',
          }}
        >
          {siteConfig.navigation.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  textDecoration: 'none',
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 14px',
                  height: '64px',
                  gap: '2px',
                  borderBottom: active ? `2px solid ${activeColor}` : '2px solid transparent',
                  transition: 'border-color 0.15s',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    fontFamily: 'var(--font-sans)',
                    color: active ? activeColor : textColor,
                    transition: 'color 0.15s',
                  }}
                >
                  {item.labelZh}
                </span>
              </Link>
            )
          })}
        </div>

        {/* ── 右侧: 我的等级 + UserMenu + UnifiedMenu ── */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/onboarding"
            className="hidden sm:inline-flex items-center"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.08em',
              padding: '6px 14px',
              borderRadius: 'var(--r-pill)',
              border: `1px solid ${dark ? 'rgba(79,230,206,0.3)' : 'var(--line-strong)'}`,
              color: activeColor,
              textDecoration: 'none',
              background: dark ? 'rgba(79,230,206,0.06)' : 'var(--card)',
              transition: 'border-color 0.15s',
            }}
          >
            我的等级
          </Link>

          <UserMenu />

          {/* Desktop: UnifiedMenu (renders its own ☰ button via hidden md:block) */}
          <UnifiedMenu
            controlledOpen={mobileOpen}
            onControlledClose={() => setMobileOpen(false)}
          />

          {/* Mobile hamburger — triggers UnifiedMenu sheet */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(p => !p)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: mobileOpen ? activeColor : textColor,
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>
    </>
  )
}
