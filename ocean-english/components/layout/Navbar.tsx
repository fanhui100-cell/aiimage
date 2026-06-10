'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { siteConfig } from '@/config/site'
import { UserMenu } from '@/components/auth/UserMenu'
import { isDarkRoute } from '@/lib/theme-route'
import { useLexiStore } from '@/store/lexiStore'
import { useLearningStore } from '@/store/learningStore'

export function Navbar() {
  const pathname = usePathname()
  const dark = isDarkRoute(pathname)
  const { streakData, getDue } = useLexiStore()
  const wrongCount = useLearningStore(s => s.wrongAnswers.length)
  const streak = streakData.current
  const dueCount = getDue().length + wrongCount

  const navBg = dark
    ? 'linear-gradient(to bottom, rgba(5,9,15,0.92), transparent)'
    : 'var(--paper)'
  const navBorder = dark ? 'none' : '1px solid var(--line)'
  const textColor = dark ? 'var(--text-secondary)' : 'var(--ink-sub)'
  const activeColor = dark ? 'var(--teal)' : 'var(--teal-ink)'

  return (
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
      <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <div style={{ lineHeight: 1.15 }}>
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '18px',
            fontWeight: 400,
            color: dark ? 'var(--text-primary)' : 'var(--ink)',
            letterSpacing: '0.01em',
          }}>
            Lexi<em style={{ fontStyle: 'italic', color: activeColor }}>verse</em>
          </span>
        </div>
        <div className="hidden sm:block" style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.12em',
          color: textColor,
          marginTop: '2px',
        }}>
          {siteConfig.projectNameZh}
        </div>
      </Link>

      {/* ── 桌面主导航：今日/词/复习/练习/宇宙 ── */}
      <div
        className="hidden md:flex"
        style={{ flex: 1, justifyContent: 'center', alignItems: 'stretch' }}
      >
        {siteConfig.navigation.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const isReview = item.href === '/memory'
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
                padding: '0 16px',
                height: '64px',
                gap: '2px',
                position: 'relative',
                borderBottom: active ? `2px solid ${activeColor}` : '2px solid transparent',
                transition: 'border-color 0.15s',
              }}
            >
              <span style={{
                fontSize: '13px',
                fontFamily: 'var(--font-sans)',
                color: active ? activeColor : textColor,
                transition: 'color 0.15s',
              }}>
                {item.labelZh}
              </span>
              {/* 复习到期红点 */}
              {isReview && dueCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: 14,
                  right: 8,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--rose-ink)',
                }} />
              )}
            </Link>
          )
        })}
      </div>

      {/* ── 右侧: streak + 头像 ── */}
      <div className="flex items-center gap-3 shrink-0">
        {/* streak 连续天数 */}
        {streak > 0 && (
          <div
            className="hidden sm:flex items-center gap-1.5"
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--r-pill)',
              background: dark ? 'rgba(241,200,121,0.08)' : 'var(--card)',
              border: `1px solid ${dark ? 'rgba(241,200,121,0.2)' : 'var(--line)'}`,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold-ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2c1 4 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3 .5 2 2 2.5 2 2.5C9 8 12 6 12 2z" />
            </svg>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', color: 'var(--ink)' }}>
              {streak}
            </span>
            <span style={{ fontSize: '11px', color: textColor }}>天</span>
          </div>
        )}
        <UserMenu />
      </div>
    </nav>
  )
}
