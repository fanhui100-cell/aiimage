'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }

    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  if (!isSupabaseConfigured || loading) return null

  if (!user) {
    return (
      <Link
        href="/auth/login"
        style={{
          padding: '6px 14px',
          borderRadius: '6px',
          background: 'rgba(56,189,248,0.08)',
          border: '1px solid rgba(56,189,248,0.3)',
          color: '#38BDF8',
          fontSize: '12px',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Sign In / 登录
      </Link>
    )
  }

  const displayEmail = user.email
    ? user.email.length > 18
      ? user.email.slice(0, 15) + '…'
      : user.email
    : 'Account'

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setMenuOpen(v => !v)}
        style={{
          padding: '6px 12px',
          borderRadius: '6px',
          background: menuOpen ? 'rgba(56,189,248,0.15)' : 'rgba(56,189,248,0.08)',
          border: '1px solid rgba(56,189,248,0.3)',
          color: '#38BDF8',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: '14px' }}>◎</span>
        {displayEmail}
        <span style={{ fontSize: '10px', opacity: 0.7 }}>{menuOpen ? '▲' : '▾'}</span>
      </button>

      {menuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '6px',
            width: '180px',
            background: 'rgba(2,6,23,0.95)',
            border: '1px solid rgba(56,189,248,0.25)',
            borderRadius: '10px',
            padding: '6px',
            zIndex: 100,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(155,191,202,0.1)', marginBottom: '4px' }}>
            <div style={{ fontSize: '10px', color: 'rgba(155,191,202,0.5)', fontFamily: 'ui-monospace, monospace' }}>SIGNED IN AS</div>
            <div style={{ fontSize: '11px', color: '#9BBFCA', marginTop: '2px', wordBreak: 'break-all' }}>{user.email}</div>
          </div>

          <Link
            href="/profile"
            onClick={() => setMenuOpen(false)}
            style={{ display: 'block', padding: '8px 10px', borderRadius: '6px', color: '#9BBFCA', fontSize: '13px', textDecoration: 'none' }}
          >
            ◉ Profile / 个人中心
          </Link>

          <form action="/auth/logout" method="POST">
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                background: 'none',
                border: 'none',
                color: 'rgba(239,68,68,0.7)',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              ← Sign Out / 登出
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
