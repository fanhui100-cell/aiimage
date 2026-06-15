'use client'

/* ════════════════════════════════════════════════════════════════════════
   登录 / 注册 重设计（界面优化14 · 提示词3）—— 双栏品牌台 + 多入口
   邮箱密码 · 手机/邮箱验证码（60s 倒计时）· Apple / Google · 游客先逛逛。
   登录/注册同台 tab 切换。真实鉴权走 Supabase；成功 → /today（CloudSync 上云）。
   ════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import './auth.css'

type Tab = 'login' | 'signup'
const I = {
  mail: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>,
  lock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>,
  phone: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M11 18h2" /></svg>,
  key: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="15" r="4" /><path d="m10.8 12.2 8.2-8.2M17 6l2 2M15 8l1.5 1.5" /></svg>,
  eye: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>,
  eyeOff: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.9 4.2A9.1 9.1 0 0 1 12 4c6 0 10 7 10 7a13.4 13.4 0 0 1-2.4 3M6.6 6.6A13.3 13.3 0 0 0 2 11s4 7 10 7a9 9 0 0 0 3.4-.7M3 3l18 18M9.5 9.5a3 3 0 0 0 4.2 4.2" /></svg>,
  check: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  user: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
}
// 用户名：2–20 位字母/数字/下划线/中文
const NAME_RE = /^[A-Za-z0-9_一-龥]{2,20}$/
const FEATS: [string, string][] = [['领航 LexiPilot', '你的 AI 单词宇宙副驾'], ['LexiGraph 词图', '近义反义词根关系网'], ['云端同步', '进度随你跨设备']]

export function AuthClient({ initialTab = 'login' }: { initialTab?: Tab }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>(initialTab)
  const [method, setMethod] = useState<'pw' | 'code'>('pw') // login: pw|code ; signup: pw(邮箱)|code(手机)
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
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
  useEffect(() => () => { if (cdRef.current) clearInterval(cdRef.current); if (nameTimer.current) clearTimeout(nameTimer.current) }, [])

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2200) }
  const finishAuth = () => { router.push('/today'); router.refresh() }

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
  // 写入当前用户的 profiles.username（注册/验证成功且有 session 时，best-effort）
  async function persistUsername(sb: ReturnType<typeof createClient>, userId?: string) {
    const t = username.trim()
    if (!t || !userId) return
    try { await sb.from('profiles').upsert({ id: userId, username: t }) } catch { /* 唯一索引兜底 */ }
  }

  function startCd() {
    setCd(60)
    cdRef.current = setInterval(() => setCd(c => { if (c <= 1) { clearInterval(cdRef.current!); return 0 } return c - 1 }), 1000)
  }
  async function sendCode() {
    if (cd > 0) return
    setError(null)
    const target = tab === 'signup' ? phone : email
    if (!target) { setError(tab === 'signup' ? '请输入手机号' : '请输入邮箱'); return }
    if (tab === 'signup') {
      const t = username.trim()
      if (!t) { setError('请先填写用户名'); return }
      if (!NAME_RE.test(t)) { setError('用户名为 2–20 位字母/数字/下划线/中文'); return }
      if (nameStatus === 'taken') { setError(`「${t}」已被占用，换一个`); return }
    }
    if (!isSupabaseConfigured) { startCd(); flash('验证码已发送（演示）'); return }
    try {
      const sb = createClient()
      const { error: e } = tab === 'signup' ? await sb.auth.signInWithOtp({ phone, options: { data: { username: username.trim() } } }) : await sb.auth.signInWithOtp({ email })
      if (e) { setError(e.message); return }
      startCd(); flash('验证码已发送')
    } catch { setError('发送失败，请重试') }
  }

  async function submit() {
    setError(null); setLoading(true)
    try {
      if (!isSupabaseConfigured) { flash('鉴权未配置（演示）— 以游客继续'); setTimeout(finishAuth, 600); return }
      const sb = createClient()
      if (tab === 'signup') {
        const t = username.trim()
        if (!t) { setError('请填写用户名'); return }
        if (!NAME_RE.test(t)) { setError('用户名为 2–20 位字母/数字/下划线/中文'); return }
        if (nameStatus === 'taken') { setError(`「${t}」已被占用，换一个`); return }
      }
      if (method === 'code') {
        if (!code) { setError('请输入验证码'); return }
        const { data: vd, error: e } = tab === 'signup'
          ? await sb.auth.verifyOtp({ phone, token: code, type: 'sms' })
          : await sb.auth.verifyOtp({ email, token: code, type: 'email' })
        if (e) { setError(e.message); return }
        if (tab === 'signup') await persistUsername(sb, vd.user?.id)
        finishAuth(); return
      }
      // password
      if (tab === 'signup') {
        if (!terms) { setError('请先同意服务条款'); return }
        if (password !== confirm) { setError('两次密码不一致'); return }
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

  const isSignup = tab === 'signup'
  const usePhone = isSignup && method === 'code'
  const h = isSignup ? '创建账号' : '欢迎回来'
  const hint = isSignup ? 'Join the lexiverse' : 'Continue your journey'

  return (
    <div className="au-v2">
      {/* 左品牌台（桌面） */}
      <div className="auth-brand">
        <div className="auth-stars">{Array.from({ length: 22 }).map((_, i) => <i key={i} style={{ top: `${(i * 41 + 5) % 100}%`, left: `${(i * 67 + 11) % 100}%`, animationDelay: `${(i % 34) / 10}s` }} />)}</div>
        <div className="brand-glow" />
        <div className="brand-lockup">
          <span className="brand-mark"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><ellipse cx="12" cy="12" rx="10" ry="4.5" /><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(60 12 12)" /></svg></span>
          <div><div className="brand-zh">词渊</div><div className="brand-en">Lexiverse</div></div>
        </div>
        <div>
          <h2 className="brand-head">万词成海，<br /><em>自有光</em></h2>
          <p className="brand-sub">把单词放进一个会发光的宇宙——学、练、复习、追问，一处闭环。登录后进度随你跨设备同步。</p>
        </div>
        <div className="brand-feats">
          {FEATS.map(([t, s]) => (
            <div className="brand-feat" key={t}><span className="fi"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg></span><span><b style={{ color: '#eaf3f6', fontWeight: 600 }}>{t}</b> · {s}</span></div>
          ))}
        </div>
      </div>

      {/* 右表单台 */}
      <div className="auth-form-wrap">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <span className="brand-mark"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><ellipse cx="12" cy="12" rx="10" ry="4.5" /><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(60 12 12)" /></svg></span>
            <h1>词渊 Lexiverse</h1><p>万词成海，自有光</p>
          </div>

          <div className="tabs">
            <button className={!isSignup ? 'on' : ''} onClick={() => { setTab('login'); setMethod('pw'); setError(null) }}>登录</button>
            <button className={isSignup ? 'on' : ''} onClick={() => { setTab('signup'); setMethod('pw'); setError(null) }}>注册</button>
          </div>

          <h2 className="auth-h">{h}</h2>
          <p className="auth-hint">{hint}</p>

          <div className="method-seg">
            <button className={method === 'pw' ? 'on' : ''} onClick={() => { setMethod('pw'); setError(null) }}>{isSignup ? '邮箱注册' : '密码登录'}</button>
            <button className={method === 'code' ? 'on' : ''} onClick={() => { setMethod('code'); setError(null) }}>{isSignup ? '手机注册' : '验证码登录'}</button>
          </div>

          {/* 用户名（注册）· 唯一，登录后显示 */}
          {isSignup && (
            <div className="field">
              <label className="field-label">用户名 · 唯一，登录后显示</label>
              <div className="field-box">{I.user}<input value={username} onChange={e => onNameChange(e.target.value)} placeholder="给自己起个名字" maxLength={20} /></div>
              {nameStatus !== 'idle' && (
                <div style={{ fontSize: 12, marginTop: 6, color: nameStatus === 'ok' ? 'var(--teal-ink)' : nameStatus === 'checking' ? 'var(--ink-muted)' : '#bf4a30' }}>
                  {nameStatus === 'checking' ? '检查中…'
                    : nameStatus === 'ok' ? `「${username.trim()}」可用 ✓`
                    : nameStatus === 'invalid' ? '2–20 位：字母 / 数字 / 下划线 / 中文'
                    : `「${username.trim()}」已被占用，换一个`}
                </div>
              )}
            </div>
          )}

          {/* 账号字段 */}
          {usePhone ? (
            <div className="field">
              <label className="field-label">手机号</label>
              <div className="field-box">{I.phone}<input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+86 138 0000 0000" /></div>
            </div>
          ) : (
            <div className="field">
              <label className="field-label">邮箱</label>
              <div className="field-box">{I.mail}<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" /></div>
            </div>
          )}

          {/* 密码 或 验证码 */}
          {method === 'pw' ? (
            <>
              <div className="field">
                <label className="field-label">密码</label>
                <div className="field-box">{I.lock}<input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" /><button className="ghost-btn" type="button" onClick={() => setShowPw(v => !v)} aria-label="显隐密码">{showPw ? I.eyeOff : I.eye}</button></div>
              </div>
              {isSignup && (
                <div className="field">
                  <label className="field-label">确认密码</label>
                  <div className="field-box">{I.lock}<input type={showPw ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="再次输入密码" /></div>
                </div>
              )}
            </>
          ) : (
            <div className="field">
              <label className="field-label">验证码</label>
              <div className="field-box">{I.key}<input inputMode="numeric" value={code} onChange={e => setCode(e.target.value)} placeholder="6 位验证码" /><button className="code-btn" type="button" disabled={cd > 0} onClick={sendCode}>{cd > 0 ? `${cd}s` : '发送验证码'}</button></div>
            </div>
          )}

          {/* remember / forgot or terms */}
          {isSignup ? (
            <div className="row-between">
              <button type="button" className={`check ${terms ? 'on' : ''}`} onClick={() => setTerms(v => !v)}><span className="box">{terms && I.check}</span>我已阅读并同意服务条款</button>
            </div>
          ) : method === 'pw' ? (
            <div className="row-between">
              <button type="button" className={`check ${remember ? 'on' : ''}`} onClick={() => setRemember(v => !v)}><span className="box">{remember && I.check}</span>记住我</button>
              <button type="button" className="link" onClick={() => flash('重置链接将发到你的邮箱')}>忘记密码？</button>
            </div>
          ) : <div style={{ height: 8 }} />}

          {error && <div className="err">{error}</div>}

          <button className="submit" disabled={loading} onClick={submit}>{loading ? '处理中…' : (isSignup ? '注册 · Create account' : (method === 'code' ? '验证并登录' : '登录 · Sign in'))}</button>

          <div className="divider"><i /><span>或</span><i /></div>
          <div className="social-row">
            <button className="social" onClick={() => oauth('apple')}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.9zM14.3 5.6c.6-.8 1.1-1.9 1-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2-.5 2.7-1.3z" /></svg>Apple</button>
            <button className="social" onClick={() => oauth('google')}><svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2-1.9 3.3-4.7 3.3-7.9z" /><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2v2.8A11 11 0 0 0 12 23z" /><path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2a11 11 0 0 0 0 9.8z" /><path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.7l3.1-3.1A11 11 0 0 0 2 7.1l3.7 2.8C6.6 7.3 9.1 5.4 12 5.4z" /></svg>Google</button>
          </div>

          <div className="guest">
            <button onClick={() => router.push('/today')}>暂不登录，先逛逛 →</button>
          </div>
          <p className="legal">登录即表示同意 <Link href="/" className="link">服务条款</Link> 与 <Link href="/" className="link">隐私政策</Link></p>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
