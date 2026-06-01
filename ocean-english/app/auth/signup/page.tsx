'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isSupabaseConfigured) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#9BBFCA' }}>
          <p style={{ fontSize: '14px' }}>Auth is not configured.</p>
          <Link href="/" style={{ color: '#38BDF8', fontSize: '13px' }}>← Back to Home</Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters / 密码至少 6 位'); return }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      setSuccess(true)
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

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
          <h2 style={{ color: '#34D399', fontSize: '22px', marginBottom: '8px' }}>Check your email / 请查收邮件</h2>
          <p style={{ color: '#9BBFCA', fontSize: '14px', marginBottom: '20px' }}>
            We sent a confirmation link to <strong style={{ color: '#ECFBFF' }}>{email}</strong>.
            Click the link to complete signup.
            <br /><br />
            <span style={{ fontSize: '12px', color: 'rgba(155,191,202,0.6)' }}>
              我们已向上方邮箱发送了确认链接，点击链接完成注册。
            </span>
          </p>
          <Link href="/auth/login" style={{ color: '#38BDF8', fontSize: '13px', textDecoration: 'none' }}>
            ← Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ marginBottom: '32px' }}>
          <Link href="/" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>← LexiOcean</Link>
          <h1 style={{ margin: '16px 0 4px', fontSize: '28px', fontWeight: 700, color: '#ECFBFF' }}>
            Sign Up <span style={{ fontSize: '16px', color: '#9BBFCA' }}>注册</span>
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(155,191,202,0.7)' }}>
            Create an account to sync your learning progress to the cloud.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#9BBFCA', marginBottom: '6px', fontFamily: 'ui-monospace, monospace' }}>EMAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="your@email.com" style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#9BBFCA', marginBottom: '6px', fontFamily: 'ui-monospace, monospace' }}>PASSWORD (min 6 chars)</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={inputStyle} />
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
            {loading ? 'Creating account…' : 'Create Account / 注册'}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '13px', color: 'rgba(155,191,202,0.6)', textAlign: 'center' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: '#38BDF8', textDecoration: 'none' }}>Sign in / 登录</Link>
        </p>
      </div>
    </div>
  )
}
