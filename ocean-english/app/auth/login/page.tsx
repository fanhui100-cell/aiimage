'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isSupabaseConfigured) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#9BBFCA' }}>
          <p style={{ fontSize: '14px' }}>Auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.</p>
          <Link href="/" style={{ color: '#38BDF8', fontSize: '13px' }}>← Back to Home</Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(155,191,202,0.25)',
    color: '#ECFBFF',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ marginBottom: '32px' }}>
          <Link href="/" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>
            ← LexiOcean
          </Link>
          <h1 style={{ margin: '16px 0 4px', fontSize: '28px', fontWeight: 700, color: '#ECFBFF' }}>
            Sign In <span style={{ fontSize: '16px', color: '#9BBFCA' }}>登录</span>
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(155,191,202,0.7)' }}>
            Sign in to sync your learning data across devices.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#9BBFCA', marginBottom: '6px', fontFamily: 'ui-monospace, monospace' }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#9BBFCA', marginBottom: '6px', fontFamily: 'ui-monospace, monospace' }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '11px',
              borderRadius: '8px',
              background: loading ? 'rgba(56,189,248,0.08)' : 'rgba(56,189,248,0.15)',
              border: '1px solid rgba(56,189,248,0.4)',
              color: loading ? 'rgba(56,189,248,0.5)' : '#38BDF8',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading ? 'Signing in…' : 'Sign In / 登录'}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '13px', color: 'rgba(155,191,202,0.6)', textAlign: 'center' }}>
          No account?{' '}
          <Link href="/auth/signup" style={{ color: '#38BDF8', textDecoration: 'none' }}>
            Sign up / 注册
          </Link>
        </p>
      </div>
    </div>
  )
}
