'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { siteConfig } from '@/config/site'
import { StreakPopover, AccountPopover } from '@/components/layout/NavPopovers'
import { isDarkRoute } from '@/lib/theme-route'
import { useLexiStore } from '@/store/lexiStore'
import { PRIMARY_NAV, TOOL_NAV } from '@/lib/product-flow/nav'

export function Navbar() {
  const pathname = usePathname()
  const dark = isDarkRoute(pathname)
  const { streakData, getDue } = useLexiStore()
  const wrongCount = useLexiStore(s => s.wrongAnswers.length)
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

      {/* ── 桌面主导航（B1：PRIMARY_NAV 5 项 + 工具下拉）── */}
      <div
        className="hidden md:flex"
        style={{ flex: 1, justifyContent: 'center', alignItems: 'stretch' }}
      >
        {PRIMARY_NAV.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const isReview = item.key === 'review'
          return (
            <Link
              key={item.key}
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
                {item.zh}
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
        <ToolsDropdown textColor={textColor} activeColor={activeColor} dark={dark} pathname={pathname} />
      </div>

      {/* ── 右侧: streak popover + 账户 popover（F1-3）── */}
      <div className="flex items-center gap-3 shrink-0">
        {streak > 0 && <StreakPopover dark={dark} />}
        <AccountPopover dark={dark} />
      </div>
    </nav>
  )
}

/** B1：桌面「工具」下拉（TOOL_NAV 6 项） */
function ToolsDropdown({ textColor, activeColor, dark, pathname }: {
  textColor: string; activeColor: string; dark: boolean; pathname: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const toolActive = TOOL_NAV.some(t => pathname === t.href || pathname.startsWith(t.href + '/'))

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'stretch' }}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '0 16px', height: 64,
          borderBottom: toolActive ? `2px solid ${activeColor}` : '2px solid transparent',
          fontSize: 13, fontFamily: 'var(--font-sans)',
          color: open || toolActive ? activeColor : textColor,
          transition: 'color 0.15s',
        }}
      >
        工具
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', top: 'calc(100% - 6px)', left: '50%', transform: 'translateX(-50%)',
            minWidth: 160, padding: 6, zIndex: 60,
            background: dark ? 'rgba(8,19,32,0.97)' : 'var(--card-2)',
            border: `1px solid ${dark ? 'var(--glass-border)' : 'var(--line)'}`,
            borderRadius: 12,
            boxShadow: dark ? '0 18px 50px rgba(0,0,0,0.5)' : '0 18px 50px -16px rgba(20,30,40,0.4)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {TOOL_NAV.map(t => {
            const active = pathname === t.href || pathname.startsWith(t.href + '/')
            return (
              <Link
                key={t.key}
                href={t.href}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 12px', borderRadius: 8, textDecoration: 'none',
                  fontSize: 13, fontFamily: 'var(--font-sans)',
                  color: active ? activeColor : (dark ? 'var(--text-primary)' : 'var(--ink)'),
                }}
              >
                <span>{t.zh}</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-news)', fontStyle: 'italic', opacity: 0.5 }}>{t.en}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
