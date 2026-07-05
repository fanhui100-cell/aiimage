'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { isDarkRoute } from '@/lib/theme-route'
import type { User } from '@supabase/supabase-js'

function LoginIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  )
}

export function UserMenu() {
  const pathname = usePathname()
  const dark = isDarkRoute(pathname)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  const accent = dark ? 'var(--teal)' : 'var(--teal-ink)'
  const accentBg = dark ? 'rgba(79,230,206,0.08)' : 'var(--teal-bg)'
  const accentBorder = dark ? 'rgba(79,230,206,0.3)' : 'rgba(14,140,122,0.25)'

  useEffect(() => {
    if (!isSupabaseConfigured) return
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

  if (!isSupabaseConfigured || loading) return null

  if (!user) {
    return (
      <Link
        href="/auth/login"
        style={{
          padding: '6px 13px',
          borderRadius: '8px',
          background: accentBg,
          border: `1px solid ${accentBorder}`,
          color: accent,
          fontSize: '12px',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
        }}
      >
        <LoginIcon />
        Sign In / 登录
      </Link>
    )
  }

  const initial = user.email ? user.email[0].toUpperCase() : '?'
  const displayEmail = user.email
    ? user.email.length > 18 ? user.email.slice(0, 15) + '…' : user.email
    : 'Account'

  return (
    <div
      title={displayEmail}
      style={{
        width: 32, height: 32, borderRadius: '50%',
        background: accentBg,
        border: `1px solid ${accentBorder}`,
        color: accent,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)',
        flexShrink: 0, cursor: 'default',
      }}
    >
      {initial}
    </div>
  )
}
