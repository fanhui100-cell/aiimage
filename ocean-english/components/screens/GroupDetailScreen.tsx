'use client'
/* ════════════════════════════════════════════════════════════════════════
   D6 学习小组详情 /groups/[id]（界面优化18 移植）
   组信息 + 加入/退出 + 成员打卡墙（按本周 XP 排序）。数据：/api/groups/[id]。
   ════════════════════════════════════════════════════════════════════════ */
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import './screen-kit.css'
import './groups.css'

interface Member { userId: string; name: string; avatar?: string; streak: number; weekXp: number; todayDone: boolean }
interface Detail { id: string; name: string; desc: string; inviteCode?: string; memberCount: number; joined: boolean; isOwner: boolean; members: Member[] }
const initial = (s: string) => (s || '?').trim()[0]?.toUpperCase() ?? '?'
const fmt = (n: number) => n.toLocaleString('en-US')
const Ico = ({ d }: { d: React.ReactNode }) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
const ALERT = <><path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12" y2="17" /></>

export function GroupDetailScreen() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [ui, setUi] = useState<'loading' | 'ready' | 'error'>('loading')
  const [g, setG] = useState<Detail | null>(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setUi('loading')
    fetch(`/api/groups/${id}`)
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (cancelled) return; if (!j?.ok || !j.data) { setUi('error'); return } setG(j.data as Detail); setUi('ready') })
      .catch(() => { if (!cancelled) setUi('error') })
    return () => { cancelled = true }
  }, [id, nonce])

  async function toggle() {
    if (!g) return
    await fetch(`/api/groups/${g.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: g.joined ? 'leave' : 'join' }) })
    setNonce(n => n + 1)
  }

  if (ui === 'loading') {
    return <div className="scr theme-light"><div className="wrap" style={{ maxWidth: 760 }}><button className="gp-back" onClick={() => router.push('/groups')}>‹ 返回小组列表</button><div className="skel" style={{ height: 110, borderRadius: 18, marginBottom: 18 }} /><div className="gp-wall">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skel" style={{ height: 58, borderRadius: 13 }} />)}</div></div></div>
  }
  if (ui === 'error' || !g) {
    return <div className="scr theme-light"><div className="wrap" style={{ maxWidth: 760 }}><button className="gp-back" onClick={() => router.push('/groups')}>‹ 返回小组列表</button><div className="state error" style={{ marginTop: 24 }}><div className="state-icon"><Ico d={ALERT} /></div><div className="state-title">小组加载失败</div><div className="state-desc">可能未登录或网络出错。</div><div className="state-acts"><button className="btn btn-ink" onClick={() => setNonce(n => n + 1)}>重试</button><button className="btn btn-ghost" onClick={() => router.push('/groups')}>返回</button></div></div></div></div>
  }

  const doneN = g.members.filter(m => m.todayDone).length
  return (
    <div className="scr theme-light">
      <div className="wrap" style={{ maxWidth: 760 }}>
        <button className="gp-back" onClick={() => router.push('/groups')}>‹ 返回小组列表</button>
        <div className="gp-hero">
          <span className="gp-ic" style={{ background: '#0e8c7a' }}>{g.name[0]}</span>
          <div className="gp-hero-main">
            <div className="gp-hero-name">{g.name}</div>
            <div className="gp-hero-desc">{g.desc}</div>
            <div className="gp-hero-meta"><span>👥 {g.memberCount} 成员</span>{g.inviteCode && <span className="code">邀请码 {g.inviteCode}</span>}{g.isOwner && <span>· 你是组长</span>}</div>
          </div>
          <button className={`btn ${g.joined ? 'btn-ghost' : 'btn-primary'}`} onClick={() => void toggle()}>{g.joined ? '退出小组' : '加入小组'}</button>
        </div>
        <div className="gp-sech"><span className="t">成员打卡墙</span><span className="gp-mc">按本周 XP 排序 · 今日 {doneN}/{g.members.length} 已打卡</span></div>
        <div className="gp-wall">
          {g.members.map((m, i) => (
            <div className={`gp-mem ${m.userId === 'me' ? '' : ''}`} key={m.userId}>
              <span className="gp-mem-rk">{i + 1}</span>
              <span className="gp-mem-av">{initial(m.name)}</span>
              <span className="gp-mem-nm"><span className="n">{m.name}</span><span className="s">🔥 {m.streak} 天</span></span>
              <span className={`gp-check ${m.todayDone ? 'done' : 'no'}`}>{m.todayDone ? '✓ 已打卡' : '· 未打卡'}</span>
              <span className="gp-xp">{fmt(m.weekXp)}</span>
            </div>
          ))}
          {!g.members.length && <div className="gp-mc">还没有成员打卡数据</div>}
        </div>
      </div>
    </div>
  )
}
