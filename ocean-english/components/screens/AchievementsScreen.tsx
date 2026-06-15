'use client'
/* ============================================================================
   AchievementsScreen.tsx — D11 成就墙 Achievements
   里程碑勋章（连续/词汇/积累复习/技能多维），已解锁高亮、未解锁带真实进度条。
   全部数据从 lexiStore 真实派生（见 lib/analytics/achievements.ts）。
   点已解锁勋章 → 庆祝动画（展示真实已得勋章，不发放虚假 XP）。
   ============================================================================ */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useLexiStore } from '@/store/lexiStore'
import { buildAchievements, type Badge } from '@/lib/analytics/achievements'
import './screen-kit.css'
import './achievements.css'

const LockIc = () => (
  <span className="lockic">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
  </span>
)
const CheckIc = () => (
  <span className="ac-done-tag">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
  </span>
)

function Medal({ b, big }: { b: Badge; big?: boolean }) {
  return (
    <div className={big ? 'ac-cele-medal' : 'ac-medal'} style={{ background: b.bg }}>
      <span className="em">{b.em}</span>
      {!big && !b.done && <LockIc />}
    </div>
  )
}

const CONF_COLORS = ['#f1c879', '#4fe6ce', '#3b5bd9', '#d4477e', '#0e8c7a']

export function AchievementsScreen() {
  const words = useLexiStore(s => s.words)
  const streakData = useLexiStore(s => s.streakData)
  const history = useLexiStore(s => s.history)
  const daily = useLexiStore(s => s.daily)
  const xp = useLexiStore(s => s.xp)
  const counts = useLexiStore(s => s.counts)

  const report = useMemo(() => {
    const reviewedTotal = Object.values(history).reduce((a, d) => a + (d.reviewed ?? 0), 0) + (daily.reviewed ?? 0)
    return buildAchievements({
      streak: Math.max(streakData.longest, streakData.current),
      mastered: counts().mastered,
      total: words.length,
      reviewedTotal,
      pronOk: words.filter(w => (w.pronScore ?? 0) >= 80).length,
      gold: words.filter(w => w.state === 'mastered' && (w.dims?.length ?? 0) >= 2).length,
      xp,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, streakData, history, daily, xp])

  const [cele, setCele] = useState<Badge | null>(null)
  const confetti = useMemo(
    () => Array.from({ length: 26 }, (_, k) => ({
      left: 20 + Math.random() * 60, bg: CONF_COLORS[k % CONF_COLORS.length],
      delay: Math.random() * 0.3, tx: Math.random() * 120 - 60,
    })),
    [cele],
  )

  return (
    <div className="scr theme-light">
      <div className="wrap ac-wrap">
        <div className="eyebrow">成就 · Achievements</div>
        <h1 className="h1">你的高光时刻</h1>
        <p className="sub">每解锁一枚勋章，都是坚持的勋记。还有 {report.total - report.unlocked} 枚等你点亮。</p>

        <div className="ac-top">
          <div className="ac-stat"><span className="fig" style={{ color: 'var(--gold-ink)' }}>{report.unlocked}<small style={{ fontSize: 14, color: 'var(--ink-muted)' }}>/{report.total}</small></span><span className="lab">已解锁勋章</span></div>
          <div className="ac-stat"><span className="fig" style={{ color: 'var(--teal-ink)' }}>{Math.max(streakData.longest, streakData.current)}</span><span className="lab">连续学习天数</span></div>
          <div className="ac-stat"><span className="fig" style={{ color: 'var(--ink)' }}>Lv.{report.level}</span><span className="lab">成就等级</span></div>
        </div>

        {report.recent ? (
          <div className="ac-recent">
            <Medal b={report.recent} />
            <div className="t">
              <div className="k">最近解锁</div>
              <div className="n">{report.recent.nm}</div>
              <div className="d">{report.recent.d} · 继续保持，下一枚就在前方</div>
            </div>
          </div>
        ) : (
          <div className="ac-recent">
            <div className="medal"><div className="ac-medal" style={{ background: 'var(--paper-2)' }}><span style={{ opacity: .5 }}>✦</span></div></div>
            <div className="t">
              <div className="k">尚未解锁</div>
              <div className="n">点亮第一枚勋章</div>
              <div className="d">去 <Link href="/today" style={{ color: 'var(--gold-ink)' }}>今日</Link> 学词、连续打卡，勋章会陆续点亮。</div>
            </div>
          </div>
        )}

        {report.categories.map(c => (
          <div key={c.cat}>
            <div className="ac-cat">{c.cat}</div>
            <div className="ac-grid">
              {c.items.map(b => (
                <div
                  key={b.nm}
                  className={`ac-badge${b.done ? '' : ' locked'}`}
                  onClick={() => b.done && setCele(b)}
                >
                  {b.done && <CheckIc />}
                  <Medal b={b} />
                  <div className="ac-nm">{b.nm}</div>
                  <div className="ac-ds">{b.d}</div>
                  {!b.done && (
                    <>
                      <div className="ac-pbar"><i style={{ width: `${b.prog}%` }} /></div>
                      <div className="ac-pt">{b.value.toLocaleString()}/{b.total.toLocaleString()}{b.near ? ' · 就差一点' : ''}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {cele && (
        <div className="ac-cele" onClick={() => setCele(null)}>
          <div className="ac-cele-card" onClick={e => e.stopPropagation()}>
            {confetti.map((c, i) => (
              <span key={i} className="ac-conf" style={{ left: `${c.left}%`, top: '28%', background: c.bg, animationDelay: `${c.delay}s`, transform: `translateX(${c.tx}px)` }} />
            ))}
            <Medal b={cele} big />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--gold-ink)' }}>已解锁</div>
            <div style={{ fontFamily: 'var(--font-serif-zh)', fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: '6px 0 4px' }}>{cele.nm}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-sub)', marginBottom: 20 }}>{cele.d} · 你太强了！</div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setCele(null)}>继续前进</button>
          </div>
        </div>
      )}
    </div>
  )
}
