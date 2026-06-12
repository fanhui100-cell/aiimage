'use client'
// F1-3：顶栏两个 popover — 火花（连续学习详情+补签）与账户（云同步/退出）。
// 共用 components/ui/Popover（点外关/Esc/focus trap/移动端底部弹层）。

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLexiStore } from '@/store/lexiStore'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { Popover } from '@/components/ui/Popover'
import type { User } from '@supabase/supabase-js'

const dayKey = (off: number) => {
  const d = new Date(); d.setDate(d.getDate() - off)
  return d.toISOString().slice(0, 10)
}

/* ── 火花 popover：当前/最长/本周 7 格/补签 ──────────────────────────────── */
export function StreakPopover({ dark }: { dark: boolean }) {
  const streakData = useLexiStore(s => s.streakData)
  const history = useLexiStore(s => s.history)
  const daily = useLexiStore(s => s.daily)
  const xp = useLexiStore(s => s.xp)
  const repairStreak = useLexiStore(s => s.repairStreak)
  const [toast, setToast] = useState('')

  // 本周 7 格（今天在最右）
  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const k = dayKey(6 - i)
    const active = !!history[k] || (daily.date === k && (daily.learned + daily.quizzed + daily.reviewed) > 0)
    return { k, active, label: '日一二三四五六'.charAt(new Date(k).getDay()) }
  }), [history, daily])

  // 断签可补：昨日无记录且 XP 够
  const canRepair = !week[5].active && xp >= 50
  const brokeYesterday = !week[5].active

  return (
    <Popover label="连续学习" trigger={() => (
      <span className="hidden sm:flex items-center gap-1.5" style={{
        padding: '6px 12px', borderRadius: 'var(--r-pill)',
        background: dark ? 'rgba(241,200,121,0.08)' : 'var(--card)',
        border: `1px solid ${dark ? 'rgba(241,200,121,0.2)' : 'var(--line)'}`,
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold-ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2c1 4 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3 .5 2 2 2.5 2 2.5C9 8 12 6 12 2z" />
        </svg>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: dark ? 'var(--text-primary)' : 'var(--ink)' }}>{streakData.current}</span>
        <span style={{ fontSize: 11, color: dark ? 'var(--text-secondary)' : 'var(--ink-sub)' }}>天</span>
      </span>
    )}>
      <div style={{ color: 'var(--ink)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.15em', color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: 8 }}>连续学习 · Streak</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 36, fontWeight: 700, color: 'var(--gold-ink)', lineHeight: 1 }}>{streakData.current}</span>
          <span style={{ fontSize: 13, color: 'var(--ink-sub)' }}>天</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-muted)' }}>最长 {streakData.longest} 天</span>
        </div>
        <div style={{ display: 'flex', gap: 5, marginTop: 14 }}>
          {week.map((d, i) => (
            <div key={d.k} title={d.k} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', height: 26, borderRadius: 7, background: d.active ? 'var(--teal-bg)' : 'var(--paper-2)', border: `1px solid ${d.active ? 'rgba(14,140,122,0.35)' : 'var(--line)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {d.active && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--teal-ink)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
              </div>
              <small style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: i === 6 ? 'var(--teal-ink)' : 'var(--ink-muted)' }}>{i === 6 ? '今' : d.label}</small>
            </div>
          ))}
        </div>
        {brokeYesterday && (
          <button
            disabled={!canRepair}
            onClick={() => {
              const ok = repairStreak()
              setToast(ok ? '已补签昨日 ✓（-50 XP）' : 'XP 不足 50，无法补签')
              setTimeout(() => setToast(''), 2200)
            }}
            className="btn-press"
            style={{ marginTop: 14, width: '100%', padding: '9px', borderRadius: 10, border: '1px solid rgba(179,120,31,0.35)', background: canRepair ? 'rgba(179,120,31,0.08)' : 'var(--paper-2)', color: canRepair ? 'var(--gold-ink)' : 'var(--ink-muted)', fontSize: 13, fontWeight: 600, cursor: canRepair ? 'pointer' : 'default', fontFamily: 'var(--font-sans)' }}>
            {canRepair ? '用 50 XP 补签昨日' : `补签需 50 XP（当前 ${xp}）`}
          </button>
        )}
        {toast && <div style={{ marginTop: 10, fontSize: 12, color: 'var(--teal-ink)', textAlign: 'center' }}>{toast}</div>}
      </div>
    </Popover>
  )
}

/* ── 账户 popover：邮箱/云同步状态/我的页/退出；未登录=登录入口 ─────────── */
export function AccountPopover({ dark }: { dark: boolean }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(!isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => { setUser(data.user ?? null); setReady(true) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  if (!isSupabaseConfigured || !ready) return null

  const accent = dark ? 'var(--teal)' : 'var(--teal-ink)'
  const accentBg = dark ? 'rgba(79,230,206,0.08)' : 'var(--teal-bg)'
  const accentBorder = dark ? 'rgba(79,230,206,0.3)' : 'rgba(14,140,122,0.25)'
  const initial = user?.email ? user.email[0].toUpperCase() : '?'

  const itemStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left',
    padding: '9px 10px', borderRadius: 8, border: 'none', background: 'transparent',
    fontSize: 13, color: 'var(--ink)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
  }

  return (
    <Popover label="账户" trigger={() => (
      user ? (
        <span style={{ width: 32, height: 32, borderRadius: '50%', background: accentBg, border: `1px solid ${accentBorder}`, color: accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{initial}</span>
      ) : (
        <span style={{ padding: '6px 13px', borderRadius: 8, background: accentBg, border: `1px solid ${accentBorder}`, color: accent, fontSize: 12, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
          Sign In / 登录
        </span>
      )
    )}>
      {close => user ? (
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--teal-ink)', marginBottom: 10 }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--teal-ink)' }} />
            云同步已启用 · 进度自动同步
          </div>
          <div style={{ height: 1, background: 'var(--line)', margin: '4px 0 8px' }} />
          <button style={itemStyle} className="btn-press" onClick={() => { close(); router.push('/me') }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            我的页
          </button>
          <button style={{ ...itemStyle, color: 'var(--rose-ink)' }} className="btn-press"
            onClick={async () => { close(); await createClient().auth.signOut(); router.refresh() }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            退出登录
          </button>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 13, color: 'var(--ink-sub)', lineHeight: 1.6, marginBottom: 12 }}>登录后学习进度云端同步，换设备无缝继续。</div>
          <button className="btn-press" onClick={() => { close(); router.push('/auth/login') }}
            style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: 'var(--teal-ink)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            登录 / 注册
          </button>
        </div>
      )}
    </Popover>
  )
}
