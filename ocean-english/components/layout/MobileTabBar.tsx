'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { isDarkRoute } from '@/lib/theme-route'
import { useLexiStore } from '@/store/lexiStore'

/* 聚焦流路由 — 在这些页面隐藏底部 Tab，显示悬浮返回 */
export const FOCUS_ROUTES = ['/quiz', '/exam', '/pronunciation', '/scan', '/chat', '/learn']
/* chromeless 路由 — 不显示任何全局导航 */
export const CHROMELESS_ROUTES = ['/onboarding', '/lexiverse', '/chat']

export function MobileTabBar() {
  const pathname = usePathname()
  const router = useRouter()
  const dark = isDarkRoute(pathname)
  const { getDue } = useLexiStore()
  const dueCount = getDue().length

  // 聚焦流 or chromeless → 隐藏
  const hidden =
    FOCUS_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/')) ||
    CHROMELESS_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  if (hidden) return null

  const bg = dark ? 'rgba(5,9,15,0.95)' : 'var(--card-2)'
  const border = dark ? '1px solid rgba(79,230,206,0.12)' : '1px solid var(--line)'
  const activeColor = dark ? 'var(--teal)' : 'var(--teal-ink)'
  const inactiveColor = dark ? 'rgba(255,255,255,0.38)' : 'var(--ink-muted)'

  const tabs = [
    {
      href: '/today', labelZh: '今日',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" /><path d="M9 16l2 2 4-4" />
        </svg>
      ),
    },
    {
      href: '/memory', labelZh: '复习', badge: dueCount,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      ),
    },
  ]

  const rightTabs = [
    {
      href: '/lexiverse', labelZh: '宇宙',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <ellipse cx="12" cy="12" rx="10" ry="4.3" transform="rotate(28 12 12)" />
        </svg>
      ),
    },
    {
      href: '/profile', labelZh: '我的',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
        </svg>
      ),
    },
  ]

  function TabItem({ tab, active }: { tab: typeof tabs[0]; active: boolean }) {
    const color = active ? activeColor : inactiveColor
    return (
      <Link
        href={tab.href}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 3, padding: '10px 0 8px', textDecoration: 'none',
          color, minHeight: 56, transition: 'color 0.15s', position: 'relative',
        }}
      >
        {active && (
          <span style={{
            position: 'absolute', top: 0, left: '50%',
            transform: 'translateX(-50%)', width: 20, height: 2,
            borderRadius: 1, background: activeColor,
          }} />
        )}
        <span style={{ display: 'inline-flex', position: 'relative' }}>
          {tab.icon}
          {'badge' in tab && (tab as { badge?: number }).badge! > 0 && (
            <span style={{
              position: 'absolute', top: -3, right: -4,
              minWidth: 14, height: 14, borderRadius: 999,
              background: 'var(--rose-ink)', color: '#fff',
              fontSize: 9, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 3px', fontFamily: 'var(--font-mono)',
            }}>
              {(tab as { badge?: number }).badge}
            </span>
          )}
        </span>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.04em', opacity: active ? 1 : 0.7 }}>
          {tab.labelZh}
        </span>
      </Link>
    )
  }

  return (
    <nav
      className="mobile-tab-bar md:hidden flex"
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: bg, borderTop: border,
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {tabs.map(tab => (
        <TabItem key={tab.href} tab={tab}
          active={pathname === tab.href || pathname.startsWith(tab.href + '/')} />
      ))}

      {/* ── 中间 Learn 大按钮 ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
        <button
          onClick={() => router.push('/today')}
          style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'var(--teal-ink)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 18px -6px rgba(14,140,122,0.8)',
            transform: 'translateY(-4px)',
          }}
          aria-label="开始学习"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 7l10-4 10 4-10 4z" />
            <path d="M6 9.5V15c0 1.5 2.7 3 6 3s6-1.5 6-3V9.5" />
          </svg>
        </button>
      </div>

      {rightTabs.map(tab => (
        <TabItem key={tab.href} tab={tab}
          active={pathname === tab.href || pathname.startsWith(tab.href + '/')} />
      ))}
    </nav>
  )
}
