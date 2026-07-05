'use client'
/* CommunityScreen — 界面优化2·导航合并：把「排行 / 小组 / 成就」合进一个社区页。
   薄封装：仅做眉标 + 标题 + 三 tab 容器，三个子屏（LeaderboardScreen / GroupsScreen /
   AchievementsScreen）一行内部代码不改、直接复用。视觉照 reference-prototype/community.jsx。 */
import { useState, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { LeaderboardScreen } from './LeaderboardScreen'
import { GroupsScreen } from './GroupsScreen'
import { AchievementsScreen } from './AchievementsScreen'

type Tab = 'rank' | 'groups' | 'badge'

const TABS: { id: Tab; zh: string; icon: ReactNode }[] = [
  { id: 'rank', zh: '排行', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg> },
  { id: 'groups', zh: '小组', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
  { id: 'badge', zh: '成就', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></svg> },
]

export function CommunityScreen() {
  const sp = useSearchParams()
  const raw = sp.get('tab')
  const [tab, setTab] = useState<Tab>(raw === 'groups' || raw === 'badge' ? raw : 'rank')

  return (
    <div className="theme-light" style={{ background: 'var(--paper)', minHeight: '100svh' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '22px 20px 0' }}>
        <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold-ink)', margin: 0 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--gold-ink)' }} />COMMUNITY · 社区
        </p>
        <h1 style={{ fontFamily: 'var(--font-serif-zh)', fontWeight: 700, fontSize: 30, lineHeight: 1.15, margin: '10px 0 6px', color: 'var(--ink)' }}>
          一起学，<em style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, color: 'var(--teal-ink)' }}>更走得远</em>
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--ink-sub)', margin: '0 0 18px' }}>排行 · 小组 · 成就——同一条激励闭环，合进<b>一个社区页</b>。</p>

        <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 14, background: 'var(--card-2)', border: '1px solid var(--line)', maxWidth: 440 }}>
          {TABS.map(t => {
            const on = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className="btn-press"
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px 8px', borderRadius: 10, border: 'none', cursor: 'pointer', background: on ? 'var(--card)' : 'transparent', boxShadow: on ? 'var(--card-shadow-sm)' : 'none', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-sans)', color: on ? 'var(--teal-ink)' : 'var(--ink-muted)' }}>
                {t.icon}{t.zh}
              </button>
            )
          })}
        </div>
      </div>

      {/* tab 内容：三块现成屏，内部零改动 */}
      <div key={tab}>
        {tab === 'rank' && <LeaderboardScreen />}
        {tab === 'groups' && <GroupsScreen />}
        {tab === 'badge' && <AchievementsScreen />}
      </div>
    </div>
  )
}
