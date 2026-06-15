'use client'
/* ════════════════════════════════════════════════════════════════════════
   D6 学习小组列表 /groups（界面优化18 移植）
   我的小组 + 发现公开组 + 创建弹窗；点小组进 /groups/[id]。数据：/api/groups。需登录。
   ════════════════════════════════════════════════════════════════════════ */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import './screen-kit.css'
import './groups.css'

interface Group { id: string; name: string; desc: string; inviteCode?: string; memberCount: number; joined: boolean; isOwner: boolean }
const COLORS = ['#0e8c7a', '#3b5bd9', '#b3781f', '#6d4bc4', '#d2792f', '#d4477e']
const col = (i: number) => COLORS[i % COLORS.length]
const Ico = ({ d }: { d: React.ReactNode }) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
const GRP = <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>
const ALERT = <><path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12" y2="17" /></>

export function GroupsScreen() {
  const router = useRouter()
  const [ui, setUi] = useState<'loading' | 'ready' | 'empty' | 'error' | 'guest'>('loading')
  const [groups, setGroups] = useState<Group[]>([])
  const [nonce, setNonce] = useState(0)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', desc: '', isPublic: true })

  useEffect(() => {
    let cancelled = false
    setUi('loading')
    fetch('/api/groups')
      .then(async r => {
        if (cancelled) return
        if (r.status === 401) { setUi('guest'); return }
        const j = r.ok ? await r.json() : null
        if (!j?.ok) { setUi('error'); return }
        const data = (j.data ?? []) as Group[]
        setGroups(data); setUi('ready')
      })
      .catch(() => { if (!cancelled) setUi('error') })
    return () => { cancelled = true }
  }, [nonce])

  async function join(id: string) {
    await fetch(`/api/groups/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'join' }) })
    setNonce(n => n + 1)
  }
  async function create() {
    const name = form.name.trim() || '新的小组'
    await fetch('/api/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description: form.desc.trim(), isPublic: form.isPublic }) })
    setCreating(false); setForm({ name: '', desc: '', isPublic: true }); setNonce(n => n + 1)
  }

  const Card = ({ g, i }: { g: Group; i: number }) => (
    <button className="gp-card" onClick={() => router.push(`/groups/${g.id}`)}>
      <div className="gp-card-top">
        <span className="gp-ic" style={{ background: col(i) }}>{g.name[0]}</span>
        <span style={{ flex: 1 }}><span className="gp-name">{g.name}</span></span>
        {g.joined && <span className="gp-joined">已加入</span>}
      </div>
      <div className="gp-desc">{g.desc}</div>
      <div className="gp-meta">
        <span className="gp-mc">👥 {g.memberCount} 成员</span>
        {g.joined
          ? <span className="gp-mc" style={{ color: 'var(--teal-ink)' }}>查看 →</span>
          : <span className="gp-join-btn" onClick={e => { e.stopPropagation(); void join(g.id) }}>+ 加入</span>}
      </div>
    </button>
  )

  const Header = (<><p className="eyebrow">学习小组 · Groups</p><h1 className="h1">和大家一起坚持</h1><p className="sub">加入小组、互相监督打卡 —— 有人陪着，更容易坚持下来。</p></>)

  return (
    <div className="scr theme-light">
      <div className="wrap" style={{ maxWidth: 760 }}>
        {Header}
        {ui === 'loading' && <div className="gp-grid" style={{ marginTop: 22 }}>{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skel" style={{ height: 120, borderRadius: 16 }} />)}</div>}
        {ui === 'guest' && (
          <div className="state empty" style={{ marginTop: 24 }}><div className="state-icon"><Ico d={GRP} /></div><div className="state-title">登录后加入小组</div><div className="state-desc">学习小组需要登录 —— 登录即可创建/加入，和大家互相监督。</div><div className="state-acts"><button className="btn btn-ink" onClick={() => router.push('/auth/login')}>登录 / 注册</button></div></div>
        )}
        {ui === 'error' && (
          <div className="state error" style={{ marginTop: 24 }}><div className="state-icon"><Ico d={ALERT} /></div><div className="state-title">小组加载失败</div><div className="state-desc">网络开小差，稍后重试。</div><div className="state-acts"><button className="btn btn-ink" onClick={() => setNonce(n => n + 1)}>重新加载</button></div></div>
        )}
        {ui === 'ready' && (
          <>
            <div className="gp-sech"><span className="t">我的小组</span><button className="btn btn-ink" style={{ padding: '9px 18px', fontSize: 13 }} onClick={() => setCreating(true)}>+ 创建小组</button></div>
            <div className="gp-grid">
              {groups.filter(g => g.joined).length
                ? groups.filter(g => g.joined).map((g, i) => <Card key={g.id} g={g} i={i} />)
                : <div className="gp-mc">还没加入小组</div>}
            </div>
            <div className="gp-sech"><span className="t">发现公开小组</span></div>
            <div className="gp-grid">{groups.filter(g => !g.joined).map((g, i) => <Card key={g.id} g={g} i={i + 2} />)}</div>
          </>
        )}
      </div>

      {creating && (
        <div className="gp-modal-mask" onClick={e => { if (e.target === e.currentTarget) setCreating(false) }}>
          <div className="gp-modal">
            <h3>创建小组</h3>
            <div className="gp-field"><label>小组名称</label><input value={form.name} maxLength={20} placeholder="如：六级冲刺营" onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="gp-field"><label>简介</label><textarea value={form.desc} placeholder="一句话说明你们的目标" onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} /></div>
            <label className="gp-toggle"><input type="checkbox" checked={form.isPublic} onChange={e => setForm(f => ({ ...f, isPublic: e.target.checked }))} /> 公开小组（所有人可发现并加入）</label>
            <div className="gp-modal-acts"><button className="btn btn-ghost" onClick={() => setCreating(false)}>取消</button><button className="btn btn-primary" onClick={() => void create()}>创建</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
