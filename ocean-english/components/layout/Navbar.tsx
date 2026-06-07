'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { siteConfig } from '@/config/site'
import { UserMenu } from '@/components/auth/UserMenu'
import { MoreMenu } from '@/components/navigation/MoreMenu'

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: 'linear-gradient(to bottom, rgba(2,6,23,0.95), transparent)' }}
      >
        {/* Logo */}
        <Link href="/" className="flex flex-col leading-none shrink-0" onClick={() => setMobileOpen(false)}>
          <span className="text-lg font-bold tracking-widest" style={{ color: 'var(--particle-cyan)' }}>
            {siteConfig.projectName}
          </span>
          <span className="text-[10px] tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            {siteConfig.projectNameZh}
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-5">
          {siteConfig.navigation.map(item => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center leading-none group">
                <span
                  className="text-sm tracking-wide transition-colors group-hover:text-[#38bdf8]"
                  style={{ color: active ? '#38bdf8' : 'var(--text-secondary)' }}
                >
                  {item.label}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
                  {item.labelZh}
                </span>
              </Link>
            )
          })}
          <MoreMenu />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/onboarding"
            className="hidden sm:block text-xs tracking-widest px-3 py-2 rounded border transition-colors"
            style={{ borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}
          >
            Level / 等级
          </Link>
          <UserMenu />
          {/* Mobile hamburger */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(p => !p)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: mobileOpen ? '#38BDF8' : 'var(--text-secondary)',
              fontSize: '20px', padding: '4px', lineHeight: 1,
            }}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile nav panel */}
      {mobileOpen && (
        <div
          className="md:hidden fixed top-[64px] left-0 right-0 z-40"
          style={{
            background: 'rgba(2,6,23,0.97)',
            borderBottom: '1px solid rgba(56,189,248,0.15)',
            backdropFilter: 'blur(12px)',
            padding: '12px 0 16px',
          }}
        >
          {[...siteConfig.navigation, ...siteConfig.navigationMore].map(item => {
            const isComing = 'comingSoon' in item && item.comingSoon
            const active = !isComing && (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href))

            if (isComing) {
              return (
                <div
                  key={item.href}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '11px 24px',
                    opacity: 0.35,
                    cursor: 'default',
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span>{item.label}</span>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>soon</span>
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '11px 24px',
                  textDecoration: 'none',
                  color: active ? '#38BDF8' : 'var(--text-secondary)',
                  fontSize: '14px',
                  borderLeft: active ? '2px solid #38BDF8' : '2px solid transparent',
                }}
              >
                <span>{item.label}</span>
                <span style={{ fontSize: '12px', opacity: 0.55 }}>{item.labelZh}</span>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
