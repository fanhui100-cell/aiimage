'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

const GLOW = 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(79,230,206,0.16), transparent 60%)'

const logoLockup = (
  <div style={{ textAlign: 'center', marginBottom: 28 }}>
    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--text-primary)' }}>
      Lexi<em style={{ fontStyle: 'italic', color: 'var(--teal)' }}>Ocean</em>
    </div>
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>深海英语学习系统</div>
  </div>
)

function InputField({ label, type, value, onChange, placeholder }: {
  label: string; type: string; value: string
  onChange: (v: string) => void; placeholder: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', color: 'var(--text-secondary)', marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required
        placeholder={placeholder}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 9,
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${focused ? 'var(--teal)' : 'var(--glass-border)'}`,
          boxShadow: focused ? '0 0 0 3px rgba(79,230,206,0.18)' : 'none',
          color: 'var(--text-primary)', fontSize: 14, outline: 'none',
          boxSizing: 'border-box', transition: 'border-color .15s, box-shadow .15s',
        }}
      />
    </div>
  )
}

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isSupabaseConfigured) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          {logoLockup}
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>Auth is not configured.</p>
          <Link href="/" style={{ color: 'var(--teal)', fontSize: 13, textDecoration: 'none' }}>← 返回首页</Link>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('密码至少 6 位 · Password must be at least 6 characters'); return }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 320, background: GLOW, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 400, textAlign: 'center', position: 'relative' }}>
          {logoLockup}
          {/* Mail SVG */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h2 style={{ margin: '0 0 8px', fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 22, color: 'var(--teal)' }}>
            请查收邮件 · Check your inbox
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20, lineHeight: 1.7 }}>
            确认链接已发送至 <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>，点击链接完成注册。
          </p>
          <Link href="/auth/login" style={{ color: 'var(--teal)', fontSize: 13, textDecoration: 'none' }}>
            ← 返回登录
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 320, background: GLOW, pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        {logoLockup}

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: '0 0 4px', fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 28, color: 'var(--text-primary)' }}>
            注册 <em style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--text-secondary)', fontWeight: 400 }}>Sign up</em>
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(155,191,202,0.65)' }}>
            创建账号，将学习进度同步到云端。
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <InputField label="EMAIL" type="email" value={email} onChange={setEmail} placeholder="your@email.com" />
          <InputField label="PASSWORD (min 6)" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(191,74,48,0.08)', border: '1px solid rgba(191,74,48,0.25)', color: 'var(--rose-ink)', fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px', borderRadius: 9, border: 'none',
              background: loading ? 'rgba(79,230,206,0.25)' : 'var(--teal)',
              color: loading ? 'rgba(255,255,255,0.4)' : '#06231d',
              fontSize: 14, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
              boxShadow: loading ? 'none' : '0 12px 26px -12px rgba(79,230,206,0.5)',
              transition: 'background .15s, box-shadow .15s',
            }}
          >
            {loading ? '注册中…' : '注册 · Create Account'}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 13, color: 'rgba(155,191,202,0.55)', textAlign: 'center' }}>
          已有账号？{' '}
          <Link href="/auth/login" style={{ color: 'var(--teal)', textDecoration: 'none' }}>登录 · Sign in</Link>
        </p>
        <p style={{ marginTop: 10, fontSize: 12, textAlign: 'center' }}>
          <Link href="/" style={{ color: 'rgba(155,191,202,0.45)', textDecoration: 'none' }}>← 返回首页</Link>
        </p>
      </div>
    </div>
  )
}
