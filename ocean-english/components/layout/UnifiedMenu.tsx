'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { siteConfig } from '@/config/site'
import { isDarkRoute } from '@/lib/theme-route'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

/**
 * 统一菜单 ☰ — 取代 Navbar 旧的「更多」下拉 + 桌面端空汉堡。
 * 桌面：右上角 300px 下拉面板；移动：全屏 sheet 从底部滑入。
 * 主题感知：深色沉浸页深色面板，米白页浅色面板。
 *
 * 可选受控模式（移动端 Navbar 汉堡控制）：
 *   传入 controlledOpen + onControlledClose 时外部驱动开关；
 *   不传时内部自管（桌面下拉按钮）。
 */

interface UnifiedMenuProps {
  /** 受控：外部（Navbar 汉堡）驱动 sheet 开关 */
  controlledOpen?: boolean
  onControlledClose?: () => void
}

const MENU_ICON = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

export function UnifiedMenu({ controlledOpen, onControlledClose }: UnifiedMenuProps) {
  const pathname = usePathname()
  const dark = isDarkRoute(pathname)
  const [open, setOpen] = useState(false)
  const [night, setNight] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Detect mobile breakpoint
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Night mode state (same source as NightModeToggle)
  useEffect(() => {
    const stored = localStorage.getItem('lexiocean-night-mode')
    setNight(stored === 'true')
  }, [])

  // Supabase auth state
  useEffect(() => {
    if (!isSupabaseConfigured) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Esc + click-outside close (desktop dropdown only)
  useEffect(() => {
    if (!open || isMobile) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, isMobile])

  // Esc close for mobile sheet
  useEffect(() => {
    if (!isMobile) return
    const effectiveOpen = controlledOpen !== undefined ? controlledOpen : open
    if (!effectiveOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        controlledOpen !== undefined ? onControlledClose?.() : setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isMobile, open, controlledOpen, onControlledClose])

  function close() {
    if (controlledOpen !== undefined) onControlledClose?.()
    else setOpen(false)
  }

  function toggleNight() {
    const next = !night
    setNight(next)
    if (next) document.documentElement.setAttribute('data-theme', 'night')
    else document.documentElement.removeAttribute('data-theme')
    localStorage.setItem('lexiocean-night-mode', String(next))
  }

  async function handleSignOut() {
    close()
    if (!isSupabaseConfigured) return
    const supabase = createClient()
    await supabase.auth.signOut()
  }

  // Theme tokens
  const panelBg = dark ? 'rgba(8,19,32,0.97)' : 'var(--card-2)'
  const panelBorder = dark ? 'var(--glass-border)' : 'var(--line)'
  const text = dark ? 'var(--text-primary)' : 'var(--ink)'
  const sub = dark ? 'var(--text-secondary)' : 'var(--ink-muted)'
  const accent = dark ? 'var(--teal)' : 'var(--teal-ink)'
  const hoverBg = dark ? 'rgba(255,255,255,0.04)' : 'var(--card)'

  const items = siteConfig.navigationMore.filter(i => !('comingSoon' in i && i.comingSoon))
  const desktopOpen = !isMobile && open
  const sheetOpen = isMobile && (controlledOpen !== undefined ? controlledOpen : open)
  const btnActive = desktopOpen
  const btnColor = btnActive ? accent : (dark ? 'var(--text-secondary)' : 'var(--ink-sub)')

  return (
    <>
      {/* Desktop trigger button (hidden on mobile) */}
      <div ref={ref} className="hidden md:block" style={{ position: 'relative' }}>
        <button
          type="button"
          aria-label="菜单"
          aria-expanded={desktopOpen}
          aria-haspopup="menu"
          onClick={() => setOpen(o => !o)}
          style={{
            width: 36, height: 36, borderRadius: 9,
            border: `1px solid ${btnActive ? accent : (dark ? 'var(--glass-border)' : 'var(--line-strong)')}`,
            background: btnActive ? (dark ? 'rgba(79,230,206,0.08)' : 'var(--teal-bg)') : 'transparent',
            color: btnColor, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'color .15s, border-color .15s, background .15s',
          }}
        >
          {MENU_ICON}
        </button>

        {/* Desktop dropdown */}
        {desktopOpen && (
          <div
            role="menu"
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: 300, background: panelBg, border: `1px solid ${panelBorder}`,
              borderRadius: 14, overflow: 'hidden', zIndex: 60,
              boxShadow: dark ? '0 18px 50px rgba(0,0,0,0.5)' : '0 18px 50px -16px rgba(20,30,40,0.4)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <MenuContent
              items={items} user={user} night={night} dark={dark}
              text={text} sub={sub} accent={accent} hoverBg={hoverBg}
              panelBorder={panelBorder}
              onClose={() => setOpen(false)}
              onToggleNight={toggleNight}
              onSignOut={handleSignOut}
            />
          </div>
        )}
      </div>

      {/* Mobile full-screen sheet */}
      {sheetOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(2px)',
          }}
          onClick={close}
        >
          <div
            role="dialog"
            aria-label="菜单"
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: dark ? 'rgba(5,9,15,0.98)' : 'var(--paper)',
              borderTop: `1px solid ${panelBorder}`,
              borderRadius: '20px 20px 0 0',
              maxHeight: '90vh',
              overflowY: 'auto',
              animation: 'sheetSlideUp .34s cubic-bezier(.2,.8,.2,1)',
            }}
          >
            {/* Sheet header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '18px 20px 12px',
              borderBottom: `1px solid ${panelBorder}`,
            }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, color: text }}>
                菜单 <span style={{ fontStyle: 'italic', fontFamily: 'var(--font-news)', opacity: 0.6, fontWeight: 400 }}>Menu</span>
              </span>
              <button type="button" onClick={close}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: sub, padding: 6 }}
                aria-label="关闭菜单"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Primary navigation */}
            <div style={{ padding: 8, borderBottom: `1px solid ${panelBorder}` }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: sub, padding: '8px 12px 4px' }}>
                导航 · Navigation
              </div>
              {siteConfig.navigation.map(item => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <MobileNavLink key={item.href} href={item.href} text={active ? accent : text}
                    hoverBg={hoverBg} active={active} onClick={close}
                    label={item.labelZh} en={item.label}
                  />
                )
              })}
            </div>

            {/* Rest of content */}
            <MenuContent
              items={items} user={user} night={night} dark={dark}
              text={text} sub={sub} accent={accent} hoverBg={hoverBg}
              panelBorder={panelBorder}
              onClose={close}
              onToggleNight={toggleNight}
              onSignOut={handleSignOut}
            />

            {/* Safe area bottom padding */}
            <div style={{ height: 24 }} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes sheetSlideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes sheetSlideUp {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
        }
      `}</style>
    </>
  )
}

/* ── Shared inner content (desktop + mobile) ── */
function MenuContent({
  items, user, night, dark, text, sub, accent, hoverBg, panelBorder,
  onClose, onToggleNight, onSignOut,
}: {
  items: { label: string; labelZh: string; href: string }[]
  user: User | null
  night: boolean
  dark: boolean
  text: string; sub: string; accent: string; hoverBg: string; panelBorder: string
  onClose: () => void
  onToggleNight: () => void
  onSignOut: () => void
}) {
  return (
    <>
      {/* 学习模块 */}
      <Group label="学习模块 · Modules" sub={sub} border={panelBorder}>
        {items.map(item => (
          <MenuLink key={item.href} href={item.href} text={text} hoverBg={hoverBg}
            label={item.labelZh} en={item.label} onClick={onClose} />
        ))}
      </Group>

      {/* 设置 */}
      <Group label="设置 · Settings" sub={sub} border={panelBorder}>
        <Row text={text} hoverBg={hoverBg}>
          <span>夜间模式</span>
          <button
            type="button" role="switch" aria-checked={night} aria-label="夜间模式"
            onClick={onToggleNight}
            style={{
              width: 38, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
              background: night ? accent : (dark ? 'rgba(255,255,255,0.15)' : 'var(--line-strong)'),
              position: 'relative', flexShrink: 0, transition: 'background .2s',
            }}
          >
            <span style={{ position: 'absolute', top: 3, left: night ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
          </button>
        </Row>
        <Row text={text} hoverBg={hoverBg}>
          <span>发音口音</span>
          <AccentSeg accent={accent} sub={sub} dark={dark} />
        </Row>
      </Group>

      {/* 账户 */}
      <Group label="账户 · Account" sub={sub} border={panelBorder}>
        {user ? (
          <>
            <MenuLink href="/profile" text={text} hoverBg={hoverBg} label="个人中心" en="Profile" onClick={onClose} />
            <MenuLink href="/onboarding" text={text} hoverBg={hoverBg} label="我的等级" en="Level" onClick={onClose} />
            <Row text="var(--rose-ink)" hoverBg={hoverBg} as="button" onClick={onSignOut}>
              <span>登出 · Sign out</span>
            </Row>
          </>
        ) : (
          <MenuLink href="/auth/login" text={accent} hoverBg={hoverBg} label="登录 / 注册" en="Sign in" onClick={onClose} />
        )}
      </Group>
    </>
  )
}

/* ── Sub-components ── */
function Group({ label, sub, border, children }: { label: string; sub: string; border: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: 8, borderTop: `1px solid ${border}` }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: sub, padding: '8px 12px 6px' }}>{label}</div>
      {children}
    </div>
  )
}

function MenuLink({ href, label, en, text, hoverBg, onClick }: {
  href: string; label: string; en: string; text: string; hoverBg: string; onClick: () => void
}) {
  return (
    <Link href={href} role="menuitem" onClick={onClick}
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 9, textDecoration: 'none', color: text, fontSize: 13.5 }}
      onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <span>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-muted)' }}>{en}</span>
    </Link>
  )
}

function MobileNavLink({ href, label, en, text, hoverBg, active, onClick }: {
  href: string; label: string; en: string; text: string; hoverBg: string; active: boolean; onClick: () => void
}) {
  return (
    <Link href={href} onClick={onClick}
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 12px', borderRadius: 9, textDecoration: 'none', color: text, fontSize: 14.5, borderLeft: active ? '2px solid currentColor' : '2px solid transparent', marginLeft: 2 }}
      onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ fontWeight: active ? 600 : 400 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.5 }}>{en}</span>
    </Link>
  )
}

function Row({ children, text, hoverBg, as = 'div', onClick }: {
  children: React.ReactNode; text: string; hoverBg: string; as?: 'div' | 'button'; onClick?: () => void
}) {
  const Tag = as as 'div'
  return (
    <Tag onClick={onClick}
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '10px 12px', borderRadius: 9, color: text, fontSize: 13.5, background: 'none', border: 'none', cursor: as === 'button' ? 'pointer' : 'default', textAlign: 'left', fontFamily: 'var(--font-sans)' }}
      onMouseEnter={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = hoverBg)}
      onMouseLeave={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </Tag>
  )
}

function AccentSeg({ accent, sub, dark }: { accent: string; sub: string; dark: boolean }) {
  const [val, setVal] = useState('US')
  useEffect(() => { setVal(localStorage.getItem('lexiocean-accent') ?? 'US') }, [])
  function pick(v: string) { setVal(v); localStorage.setItem('lexiocean-accent', v) }
  return (
    <span style={{ display: 'flex', gap: 4 }}>
      {['US', 'UK', 'AU'].map(v => (
        <button key={v} type="button" onClick={() => pick(v)}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, padding: '3px 9px', borderRadius: 7, cursor: 'pointer',
            border: `1px solid ${val === v ? accent : (dark ? 'var(--glass-border)' : 'var(--line-strong)')}`,
            background: val === v ? (dark ? 'rgba(79,230,206,0.08)' : 'var(--teal-bg)') : 'transparent',
            color: val === v ? accent : sub,
          }}>{v}</button>
      ))}
    </span>
  )
}
