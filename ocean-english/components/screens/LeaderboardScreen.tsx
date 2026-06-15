'use client'
/* ════════════════════════════════════════════════════════════════════════
   D5 排行榜 /leaderboard（界面优化18 移植）
   三 tab（周/总/连击）+ 前三领奖台 + 名次列表（自己高亮）+「我的名次」吸底卡。
   数据：/api/leaderboard?board=weekly|total|streak。需登录；未登录/空/错三态。
   ════════════════════════════════════════════════════════════════════════ */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import './screen-kit.css'
import './leaderboard.css'

type Board = 'weekly' | 'total' | 'streak'
interface Row { rank: number; userId: string; name: string; avatar?: string; value: number; streak: number; isMe: boolean }

const TABS: [Board, string][] = [['weekly', '周榜'], ['total', '总榜'], ['streak', '连击榜']]
const UNIT: Record<Board, string> = { weekly: 'XP', total: 'XP', streak: '天' }
const fmt = (n: number) => n.toLocaleString('en-US')
const initial = (s: string) => (s || '?').trim()[0]?.toUpperCase() ?? '?'

const Ico = ({ d }: { d: React.ReactNode }) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
const TROPHY = <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M5 4H3v2a3 3 0 0 0 3 3M19 4h2v2a3 3 0 0 1-3 3" /></>
const ALERT = <><path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12" y2="17" /></>
const CROWN = <svg className="lb-crown" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 8l4 4 5-7 5 7 4-4-1.5 11h-15z" /></svg>

export function LeaderboardScreen() {
  const router = useRouter()
  const [board, setBoard] = useState<Board>('weekly')
  const [ui, setUi] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading')
  const [rows, setRows] = useState<Row[]>([])
  const [me, setMe] = useState<Row | null>(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let cancelled = false
    setUi('loading')
    fetch(`/api/leaderboard?board=${board}&limit=30`)
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (cancelled) return
        if (!j?.ok) { setUi('error'); return }
        const rs = (j.rows ?? []) as Row[]
        setRows(rs); setMe(j.me ?? null)
        setUi(rs.length ? 'ready' : 'empty')
      })
      .catch(() => { if (!cancelled) setUi('error') })
    return () => { cancelled = true }
  }, [board, nonce])

  const Tabs = (
    <div className="lb-tabs">
      {TABS.map(([k, zh]) => <button key={k} className={`lb-tab ${board === k ? 'on' : ''}`} onClick={() => setBoard(k)}>{zh}</button>)}
    </div>
  )

  const Podium = ({ top }: { top: Row[] }) => {
    const order = [top[1], top[0], top[2]].filter(Boolean)
    return (
      <div className="lb-podium">
        {order.map(r => (
          <div key={r.userId} className={`lb-pod p${r.rank}`}>
            <div className="lb-pod-av">{r.rank === 1 && CROWN}{initial(r.name)}</div>
            <div className="lb-pod-rk">{r.rank}</div>
            <div className="lb-pod-nm">{r.name}</div>
            <div className="lb-pod-val">{fmt(r.value)}<small style={{ fontSize: 10, color: 'var(--ink-muted)' }}> {UNIT[board]}</small></div>
            <div className="lb-pod-base" />
          </div>
        ))}
      </div>
    )
  }

  const RowEl = ({ r }: { r: Row }) => (
    <div className={`lb-row ${r.isMe ? 'me' : ''}`}>
      <span className="lb-rk">{r.rank}</span>
      <span className="lb-av">{initial(r.name)}</span>
      <span className="lb-nm"><span className="n">{r.name} {r.isMe && <span className="lb-me-tag">我</span>}</span><span className="s">🔥 {r.streak} 天连击</span></span>
      <span className="lb-val">{fmt(r.value)}<small>{UNIT[board]}</small></span>
    </div>
  )

  return (
    <div className="scr theme-light">
      <div className="wrap" style={{ maxWidth: 640, paddingBottom: 96 }}>
        <p className="eyebrow">排行榜 · Leaderboard</p>
        <h1 className="h1">本周谁在领跑</h1>
        <p className="sub">和大家比一比 —— 每周一清零，凭学习赚的 XP 上榜。</p>
        {Tabs}

        {ui === 'loading' && (
          <>
            <div className="lb-podium" style={{ marginTop: 6 }}>
              {[60, 74, 60].map((h, i) => <div className="lb-pod" key={i}><div className="skel" style={{ width: h, height: h, borderRadius: 999 }} /><div className="skel" style={{ width: 50, height: 10 }} /><div className="lb-pod-base" /></div>)}
            </div>
            <div className="lb-list">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skel" style={{ height: 56, borderRadius: 14 }} />)}</div>
          </>
        )}
        {ui === 'empty' && (
          <div className="state empty" style={{ marginTop: 24 }}>
            <div className="state-icon"><Ico d={TROPHY} /></div>
            <div className="state-title">还没有排名数据</div>
            <div className="state-desc">本周还没人上榜 —— 先去学习赚 XP，第一个登顶。需登录后上榜。</div>
            <div className="state-acts"><button className="btn btn-ink" onClick={() => router.push('/today')}>去学习</button><button className="btn btn-ghost" onClick={() => router.push('/auth/login')}>登录</button></div>
          </div>
        )}
        {ui === 'error' && (
          <div className="state error" style={{ marginTop: 24 }}>
            <div className="state-icon"><Ico d={ALERT} /></div>
            <div className="state-title">排行榜加载失败</div>
            <div className="state-desc">网络开小差了，稍后重试。</div>
            <div className="state-acts"><button className="btn btn-ink" onClick={() => setNonce(n => n + 1)}>重新加载</button></div>
          </div>
        )}
        {ui === 'ready' && (
          <>
            <Podium top={rows.slice(0, 3)} />
            <div className="lb-list">{rows.slice(3, 30).map(r => <RowEl key={r.userId} r={r} />)}</div>
          </>
        )}
      </div>

      {ui === 'ready' && me && (
        <div className="lb-mecard">
          <div className="lb-mecard-inner">
            <span className="lb-rk">{me.rank}</span>
            <span className="lb-av">{initial(me.name)}</span>
            <span className="lb-nm"><span className="n">{me.name} <span className="lb-me-tag">我的名次</span></span><span className="s">🔥 {me.streak} 天连击</span></span>
            <span className="lb-val">{fmt(me.value)}<small>{UNIT[board]}</small></span>
          </div>
        </div>
      )}
    </div>
  )
}
