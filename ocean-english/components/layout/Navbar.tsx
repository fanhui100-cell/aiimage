'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { siteConfig } from '@/config/site'
import { UserMenu } from '@/components/auth/UserMenu'
import { isDarkRoute } from '@/lib/theme-route'

/* 菜单/关闭图标 SVG */
function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

/* navigationMore 中过滤掉 comingSoon 的条目 */
const moreItems = siteConfig.navigationMore.filter(
  item => !('comingSoon' in item && item.comingSoon),
)

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const dark = isDarkRoute(pathname)

  /* ── 颜色 token ── */
  const navBg = dark
    ? 'linear-gradient(to bottom, rgba(5,9,15,0.92), transparent)'
    : 'var(--paper)'
  const navBorder = dark ? 'none' : '1px solid var(--line)'
  const textColor = dark ? 'var(--text-secondary)' : 'var(--ink-sub)'
  const activeColor = dark ? 'var(--teal)' : 'var(--teal-ink)'

  /* 下拉面板颜色 */
  const dropBg = dark ? 'rgba(8,19,32,0.97)' : 'var(--card-2)'
  const dropBorder = dark ? 'var(--glass-border)' : 'var(--line)'

  function closeMore() {
    setMoreOpen(false)
  }

  /* 点击外部 + Esc 关闭下拉 */
  useEffect(() => {
    if (!moreOpen) return
    function handle(e: MouseEvent | KeyboardEvent) {
      if (e instanceof KeyboardEvent) {
        if (e.key === 'Escape') closeMore()
        return
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        closeMore()
      }
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('keydown', handle)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('keydown', handle)
    }
  }, [moreOpen])

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
          onClick={() => { setMobileOpen(false); closeMore() }}
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

        {/* ── 桌面端导航:隐藏滚动条横向滚动 ── */}
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
                onClick={closeMore}
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

        {/* ── 右侧:更多下拉 + 等级胶囊 + 头像 ── */}
        <div className="flex items-center gap-3 shrink-0">

          {/* 桌面端"更多"下拉 — click 触发，支持 Esc + 点击外部关闭 */}
          <div
            ref={moreRef}
            className="hidden md:block"
            style={{ position: 'relative' }}
          >
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              onClick={() => setMoreOpen(p => !p)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                color: moreOpen ? activeColor : textColor,
                padding: '6px 10px',
                borderRadius: '6px',
                transition: 'color 0.15s',
              }}
            >
              更多 <ChevronDown open={moreOpen} />
            </button>

            {moreOpen && (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  zIndex: 60,
                  background: dropBg,
                  border: `1px solid ${dropBorder}`,
                  borderRadius: 'var(--r-sm)',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
                  minWidth: '180px',
                  overflow: 'hidden',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {moreItems.map(item => {
                  const active = pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      onClick={closeMore}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '11px 16px',
                        textDecoration: 'none',
                        color: active ? activeColor : textColor,
                        fontSize: '13px',
                        borderLeft: active ? `2px solid ${activeColor}` : '2px solid transparent',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.04)' : 'var(--card)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontFamily: 'var(--font-sans)' }}>{item.labelZh}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', opacity: 0.45 }}>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          <Link
            href="/onboarding"
            className="hidden sm:inline-flex items-center"
            onClick={closeMore}
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
          {/* 移动端汉堡 */}
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

      {/* ── 移动端菜单面板 ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed left-0 right-0 z-40"
          style={{
            top: '64px',
            background: dark ? 'rgba(5,9,15,0.97)' : 'var(--paper)',
            borderBottom: dark ? '1px solid var(--glass-border)' : '1px solid var(--line)',
            backdropFilter: dark ? 'blur(12px)' : 'none',
            padding: '8px 0 16px',
            maxHeight: 'calc(100vh - 64px)',
            overflowY: 'auto',
          }}
        >
          {siteConfig.navigation.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '13px 24px',
                  textDecoration: 'none',
                  color: active ? activeColor : textColor,
                  fontSize: '15px',
                  borderLeft: active ? `2px solid ${activeColor}` : '2px solid transparent',
                  minHeight: '44px',
                }}
              >
                <span>{item.labelZh}</span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', opacity: 0.5 }}>
                  {item.label}
                </span>
              </Link>
            )
          })}

          {/* 分隔线 */}
          <div style={{ margin: '8px 24px', height: '1px', background: dark ? 'var(--glass-border)' : 'var(--line)' }} />

          {/* 更多导航 */}
          {moreItems.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '13px 24px',
                  textDecoration: 'none',
                  color: active ? activeColor : textColor,
                  fontSize: '15px',
                  borderLeft: active ? `2px solid ${activeColor}` : '2px solid transparent',
                  minHeight: '44px',
                  opacity: active ? 1 : 0.8,
                }}
              >
                <span>{item.labelZh}</span>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', opacity: 0.5 }}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
