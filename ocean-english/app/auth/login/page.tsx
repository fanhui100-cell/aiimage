'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isSupabaseConfigured) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          {logoLockup}
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
          </p>
          <Link href="/" style={{ color: 'var(--teal)', fontSize: 13, textDecoration: 'none' }}>← 返回首页</Link>
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Subtle teal glow at top */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 320, background: GLOW, pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        {logoLockup}

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: '0 0 4px', fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 28, color: 'var(--text-primary)' }}>
            登录 <em style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--text-secondary)', fontWeight: 400 }}>Sign in</em>
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(155,191,202,0.65)' }}>
            同步你的学习数据，随时随地继续。
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <InputField label="EMAIL" type="email" value={email} onChange={setEmail} placeholder="your@email.com" />
          <InputField label="PASSWORD" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

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
            {loading ? '登录中…' : '登录 · Sign In'}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 13, color: 'rgba(155,191,202,0.55)', textAlign: 'center' }}>
          还没有账号？{' '}
          <Link href="/auth/signup" style={{ color: 'var(--teal)', textDecoration: 'none' }}>
            注册 · Sign up
          </Link>
        </p>
        <p style={{ marginTop: 10, fontSize: 12, textAlign: 'center' }}>
          <Link href="/" style={{ color: 'rgba(155,191,202,0.45)', textDecoration: 'none', fontSize: 12 }}>← 返回首页</Link>
        </p>
      </div>
    </div>
  )
}
