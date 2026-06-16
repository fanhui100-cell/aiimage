'use client'

/* ════════════════════════════════════════════════════════════════════════
   登录 / 注册（界面优化3 · 沉浸全玻璃换皮）—— 外观 1:1 自「登录-沉浸全玻璃.html」
   逻辑沿用原 AuthClient：邮箱密码 / 验证码(60s 倒计时) / Apple·Google OAuth /
   用户名唯一性查重 / Supabase。
   · 恒为日光（外壳 .imm 锁回浅色令牌，不动全局主题）
   · 游客「先逛逛」→ /onboarding；登录/注册成功 → 未定级 /onboarding，已定级 /today
   ════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { useLexiStore } from '@/store/lexiStore'
import './auth-immersive.css'

type Tab = 'login' | 'signup'
// 用户名：2–20 位字母/数字/下划线/中文
const NAME_RE = /^[A-Za-z0-9_一-龥]{2,20}$/

export function AuthClient({ initialTab = 'login' }: { initialTab?: Tab }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>(initialTab)
  const [method, setMethod] = useState<'pw' | 'code'>('pw') // login: 密码|验证码 ; signup: 邮箱|手机
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [nameStatus, setNameStatus] = useState<'idle' | 'checking' | 'ok' | 'taken' | 'invalid'>('idle')
  const nameTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [code, setCode] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(true)
  const [terms, setTerms] = useState(false)
  const [cd, setCd] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const cdRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pwRef = useRef<HTMLInputElement>(null)
  useEffect(() => () => { if (cdRef.current) clearInterval(cdRef.current); if (nameTimer.current) clearTimeout(nameTimer.current) }, [])

  const isSignup = tab === 'signup'
  const usePhone = isSignup && method === 'code'

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2200) }
  const finishAuth = () => {
    // 方案 A：注册新用户 / 尚未定级 → 先定级；已定级老用户 → 直接今日
    const onboarded = useLexiStore.getState().profile.onboarded
    const dest = (tab === 'signup' || !onboarded) ? '/onboarding' : '/today'
    router.push(dest)
    router.refresh()
  }

  // 用户名实时查重（防抖 400ms，大小写不敏感）；无法校验时放行（DB 唯一索引兜底）
  function onNameChange(v: string) {
    setUsername(v)
    const t = v.trim()
    if (nameTimer.current) clearTimeout(nameTimer.current)
    if (!t) { setNameStatus('idle'); return }
    if (!NAME_RE.test(t)) { setNameStatus('invalid'); return }
    setNameStatus('checking')
    nameTimer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/user/username-check?name=${encodeURIComponent(t)}`)
        const j = await r.json()
        setNameStatus(j.ok ? (j.available ? 'ok' : 'taken') : 'ok')
      } catch { setNameStatus('ok') }
    }, 400)
  }
  async function persistUsername(sb: ReturnType<typeof createClient>, userId?: string) {
    const t = username.trim()
    if (!t || !userId) return
    try { await sb.from('profiles').upsert({ id: userId, username: t }) } catch { /* 唯一索引兜底 */ }
  }

  function startCd() {
    setCd(60)
    cdRef.current = setInterval(() => setCd(c => { if (c <= 1) { clearInterval(cdRef.current!); return 0 } return c - 1 }), 1000)
  }
  function validateSignupName(): boolean {
    const t = username.trim()
    if (!t) { setError('请填写用户名'); return false }
    if (!NAME_RE.test(t)) { setError('用户名为 2–20 位字母/数字/下划线/中文'); return false }
    if (nameStatus === 'taken') { setError(`「${t}」已被占用，换一个`); return false }
    return true
  }
  async function sendCode() {
    if (cd > 0) return
    setError(null)
    const target = usePhone ? phone : email
    if (!target) { setError(usePhone ? '请输入手机号' : '请输入邮箱'); return }
    if (isSignup && !validateSignupName()) return
    if (!isSupabaseConfigured) { startCd(); flash('验证码已发送（演示）'); return }
    try {
      const sb = createClient()
      const { error: e } = usePhone
        ? await sb.auth.signInWithOtp({ phone, options: { data: { username: username.trim() } } })
        : await sb.auth.signInWithOtp({ email })
      if (e) { setError(e.message); return }
      startCd(); flash('验证码已发送')
    } catch { setError('发送失败，请重试') }
  }

  async function submit() {
    setError(null); setLoading(true)
    try {
      if (!isSupabaseConfigured) { flash('鉴权未配置（演示）— 以游客继续'); setTimeout(finishAuth, 600); return }
      const sb = createClient()
      if (isSignup) {
        if (!validateSignupName()) return
        if (!terms) { setError('请先同意服务条款'); return }
      }
      if (method === 'code') {
        if (!code) { setError('请输入验证码'); return }
        const { data: vd, error: e } = usePhone
          ? await sb.auth.verifyOtp({ phone, token: code, type: 'sms' })
          : await sb.auth.verifyOtp({ email, token: code, type: 'email' })
        if (e) { setError(e.message); return }
        if (isSignup) await persistUsername(sb, vd.user?.id)
        finishAuth(); return
      }
      // 密码
      if (isSignup) {
        const { data: sd, error: e } = await sb.auth.signUp({ email, password, options: { data: { username: username.trim() } } })
        if (e) { setError(e.message); return }
        await persistUsername(sb, sd.user?.id)
        flash('注册成功，正在进入…'); setTimeout(finishAuth, 700); return
      }
      const { error: e } = await sb.auth.signInWithPassword({ email, password })
      if (e) { setError(e.message); return }
      finishAuth()
    } catch { setError('操作失败，请重试') } finally { setLoading(false) }
  }

  async function oauth(provider: 'apple' | 'google') {
    if (!isSupabaseConfigured) { flash('第三方登录未配置（演示）'); return }
    try {
      const sb = createClient()
      await sb.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/callback` } })
    } catch { flash('第三方登录失败') }
  }

  const switchTab = (t: Tab) => { setTab(t); setMethod('pw'); setError(null) }
  const nameHint = nameStatus === 'ok' ? `「${username.trim()}」可用 ✓`
    : nameStatus === 'taken' ? `「${username.trim()}」已被占用，换一个`
    : nameStatus === 'checking' ? '检查中…'
    : nameStatus === 'invalid' ? '2–20 位：字母 / 数字 / 下划线 / 中文'
    : '2–20 位：字母 / 数字 / 下划线 / 中文 · 登录后显示'
  const nameCls = nameStatus === 'ok' ? 'ok' : (nameStatus === 'taken' || nameStatus === 'invalid') ? 'taken' : nameStatus === 'checking' ? 'checking' : ''

  return (
    <div className="imm lqg">
      <div className="tint"><b className="g1" /><b className="g2 drift-b" /><b className="g3 drift-a" /></div>
      <div className="grain" />
      <div className="vig" />

      <div className="imm-top">
        <Link className="imm-brand" href="/">
          <span className="mk"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 6.5 12 19 20.5 6.5" /><path d="M7.5 6 12 13 16.5 6" opacity="0.55" /></svg></span>
          <span className="wm"><span className="z">Lexi<em>verse</em></span><span className="e">词渊</span></span>
        </Link>
      </div>

      <div className="imm-col">
        <div className="imm-mark"><svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 6.5 12 19 20.5 6.5" /><path d="M7.5 6 12 13 16.5 6" opacity="0.55" /></svg></div>
        <h1 className="imm-h">万词成海，自有光</h1>
        <p className="imm-sub">An ocean of words, lit from within.</p>

        <div className="tabs">
          <button className={!isSignup ? 'on' : ''} type="button" onClick={() => switchTab('login')}>登录</button>
          <button className={isSignup ? 'on' : ''} type="button" onClick={() => switchTab('signup')}>注册</button>
        </div>

        <div className="method-seg">
          <button type="button" className={method === 'pw' ? 'on' : ''} onClick={() => { setMethod('pw'); setError(null) }}>{isSignup ? '邮箱注册' : '密码登录'}</button>
          <button type="button" className={method === 'code' ? 'on' : ''} onClick={() => { setMethod('code'); setError(null) }}>{isSignup ? '手机注册' : '验证码登录'}</button>
        </div>

        <form className="form" onSubmit={e => e.preventDefault()}>
          {isSignup && (
            <div className="field-wrap">
              <div className="lq lq-field"><span className="lq-sheen" />
                <svg className="lead" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                <input value={username} onChange={e => onNameChange(e.target.value)} placeholder="设置用户名" maxLength={20} autoComplete="username" />
              </div>
              <div className={`uname-hint ${nameCls}`}>{nameHint}</div>
            </div>
          )}

          {/* 账号字段：手机注册用手机号，其余用邮箱 */}
          {usePhone ? (
            <div className="field-wrap">
              <div className="lq lq-field"><span className="lq-sheen" />
                <svg className="lead" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M11 18h2" /></svg>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+86 138 0000 0000" autoComplete="tel" />
              </div>
            </div>
          ) : (
            <div className="field-wrap">
              <div className="lq lq-field"><span className="lq-sheen" />
                <svg className="lead" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" autoComplete="email" />
                {!isSignup && method === 'pw' && <button className="lq-iconbtn" type="button" aria-label="继续" onClick={() => pwRef.current?.focus()}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>}
              </div>
            </div>
          )}

          {/* 凭据字段：密码 或 验证码 */}
          {method === 'pw' ? (
            <div className="field-wrap">
              <div className="lq lq-field"><span className="lq-sheen" />
                <svg className="lead" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                <input ref={pwRef} type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete={isSignup ? 'new-password' : 'current-password'} onKeyDown={e => { if (e.key === 'Enter') submit() }} />
                <button className="lq-iconbtn ghost" type="button" aria-label="显隐密码" onClick={() => setShowPw(v => !v)}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{showPw ? <><path d="M9.9 4.2A9.1 9.1 0 0 1 12 4c6 0 10 7 10 7a13.4 13.4 0 0 1-2.4 3M6.6 6.6A13.3 13.3 0 0 0 2 11s4 7 10 7a9 9 0 0 0 3.4-.7M3 3l18 18M9.5 9.5a3 3 0 0 0 4.2 4.2" /></> : <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>}</svg></button>
              </div>
            </div>
          ) : (
            <div className="field-wrap">
              <div className="lq lq-field"><span className="lq-sheen" />
                <svg className="lead" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="8" cy="15" r="4" /><path d="m10.8 12.2 8.2-8.2M17 6l2 2M15 8l1.5 1.5" /></svg>
                <input inputMode="numeric" value={code} onChange={e => setCode(e.target.value)} placeholder="6 位验证码" autoComplete="one-time-code" onKeyDown={e => { if (e.key === 'Enter') submit() }} />
                <button className="code-btn" type="button" disabled={cd > 0} onClick={sendCode}>{cd > 0 ? `${cd}s` : '发送验证码'}</button>
              </div>
            </div>
          )}

          {!isSignup && method === 'pw' ? (
            <div className="row">
              <button type="button" className={`chk ${remember ? 'on' : ''}`} onClick={() => setRemember(v => !v)}><span className="box"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg></span>记住我</button>
              <button type="button" className="lnk" onClick={() => flash('重置链接将发到你的邮箱')}>忘记密码？</button>
            </div>
          ) : isSignup ? (
            <div className="row">
              <button type="button" className={`chk ${terms ? 'on' : ''}`} onClick={() => setTerms(v => !v)}><span className="box"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg></span>我已阅读并同意服务条款</button>
            </div>
          ) : <div style={{ height: 4 }} />}

          {error && <div className="err">{error}</div>}

          <button className="lq lq-btn accent" type="button" data-magnetic="0.16" disabled={loading} onClick={submit}><span className="lq-sheen" /><span>{loading ? '处理中…' : (isSignup ? '注册 · Create account' : (method === 'code' ? '验证并登录' : '登录 · Sign in'))}</span></button>

          <div className="divider"><i /><span>或继续使用</span><i /></div>
          <div className="social">
            <button className="lq lq-btn" type="button" onClick={() => oauth('apple')}><span className="lq-sheen" /><span><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.9zM14.3 5.6c.6-.8 1.1-1.9 1-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2-.5 2.7-1.3z" /></svg>Apple</span></button>
            <button className="lq lq-btn" type="button" onClick={() => oauth('google')}><span className="lq-sheen" /><span><svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2-1.9 3.3-4.7 3.3-7.9z" /><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2v2.8A11 11 0 0 0 12 23z" /><path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2a11 11 0 0 0 0 9.8z" /><path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.7l3.1-3.1A11 11 0 0 0 2 7.1l3.7 2.8C6.6 7.3 9.1 5.4 12 5.4z" /></svg>Google</span></button>
          </div>

          <div className="guest"><button type="button" onClick={() => router.push('/onboarding')}>暂不登录，先逛逛 →</button></div>
          <p className="legal">登录即表示同意 <Link href="/">服务条款</Link> 与 <Link href="/">隐私政策</Link></p>
        </form>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
