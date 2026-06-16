'use client'
/* ============================================================================
   GoalsScreen.tsx — D13 每日目标 Goals
   今日进度环（新词/复习/测验）+ 本周完成柱 + 连续打卡日历 + 可调目标。
   全部从 lexiStore 真实派生：daily(今日) / history(历史) / streakData / profile。
   ============================================================================ */

import { useMemo, useState } from 'react'
import { useLexiStore } from '@/store/lexiStore'
import { RingProgress } from '@/components/ui/motion/RingProgress'
import './screen-kit.css'
import './goals.css'

function Ring({ size, stroke, pct, color, id }: { size: number; stroke: number; pct: number; color: string; id?: string }) {
  const r = (size - stroke * 2) / 2, C = 2 * Math.PI * r, off = C * (1 - Math.min(pct, 100) / 100)
  return (
    <svg width={size} height={size} id={id}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={C} strokeDashoffset={off} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>
  )
}

const pctOf = (cur: number, tgt: number) => tgt > 0 ? Math.round(Math.min(cur / tgt, 1) * 100) : 0
const GOAL_OPTS = [10, 20, 30, 50]
const WD = ['日', '一', '二', '三', '四', '五', '六']

export function GoalsScreen() {
  const daily = useLexiStore(s => s.daily)
  const history = useLexiStore(s => s.history)
  const streakData = useLexiStore(s => s.streakData)
  const profile = useLexiStore(s => s.profile)
  const goalToday = useLexiStore(s => s.goalToday)
  const getDue = useLexiStore(s => s.getDue)
  const setProfile = useLexiStore(s => s.setProfile)

  const dueCount = getDue().length
  const dailyGoal = goalToday || profile.dailyGoal || 12

  const data = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const isToday = daily.date === today
    const tLearned = isToday ? daily.learned : 0
    const tReviewed = isToday ? daily.reviewed : 0
    const tQuizzed = isToday ? daily.quizzed : 0
    const subs = [
      { name: '新词', cur: tLearned, tgt: dailyGoal, c: 'var(--teal-ink)' },
      { name: '复习', cur: tReviewed, tgt: Math.max(tReviewed + dueCount, 1), c: 'var(--blue-ink)' },
      { name: '测验', cur: tQuizzed, tgt: dailyGoal, c: 'var(--gold-ink)' },
    ]
    const overall = Math.round(subs.reduce((a, g) => a + pctOf(g.cur, g.tgt), 0) / subs.length)

    const sumOf = (key: string) => {
      if (key === today && isToday) return tLearned + tReviewed + tQuizzed
      const r = history[key]
      return r ? (r.learned ?? 0) + (r.reviewed ?? 0) + (r.quizzed ?? 0) : 0
    }
    const goalSumOf = (key: string) => {
      if (key === today && isToday) return tLearned + tReviewed
      const r = history[key]
      return r ? (r.learned ?? 0) + (r.reviewed ?? 0) : 0
    }
    const dstr = (off: number) => { const d = new Date(); d.setDate(d.getDate() - off); return d }

    // 本周完成柱（近 7 天，旧→新）
    const week = Array.from({ length: 7 }, (_, i) => {
      const d = dstr(6 - i), key = d.toISOString().slice(0, 10)
      const v = Math.min(100, Math.round(goalSumOf(key) / dailyGoal * 100))
      const isT = key === today
      return { d: isT ? '今' : WD[d.getDay()], v, t: isT, miss: v === 0 && !isT }
    })

    // 打卡日历（近 28 天，按周对齐）
    const start = dstr(27)
    const lead = (start.getDay() + 6) % 7
    const cal: ({ n: number; done: boolean; today: boolean } | null)[] = Array.from({ length: lead }, () => null)
    for (let i = 0; i < 28; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      cal.push({ n: d.getDate(), done: sumOf(key) > 0, today: key === today })
    }
    return { subs, overall, week, cal }
  }, [daily, history, dueCount, dailyGoal])

  const [savedMsg, setSavedMsg] = useState('')
  function setGoal(n: number) { setProfile({ dailyGoal: n }); setSavedMsg(`每日目标 → ${n} 词`); setTimeout(() => setSavedMsg(''), 2000) }

  return (
    <div className="scr theme-light">
      <div className="wrap">
        <div className="eyebrow">每日目标 · Daily Goals</div>
        <h1 className="h1">今天，再进一步</h1>
        <p className="sub">把大目标拆成每天一点点 —— 完成今日三件小事，连续记录就不会断。</p>

        <div className="gl-hero">
          <div className="gl-main-ring">
            {/* 界面优化2·P6：今日目标主环改用 RingProgress（米白·入场填充+数字滚动） */}
            <RingProgress value={data.overall} size={120} stroke={9} label="今日目标" />
          </div>
          <div className="gl-hero-txt">
            <div className="h">{data.overall >= 100 ? '今日目标已达成 ✦' : '离今日目标还差一点'}</div>
            <div className="s">完成三件小事，点亮今天的打卡。</div>
            <div className="gl-subrings">
              {data.subs.map(g => (
                <div className="gl-sr" key={g.name}>
                  <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
                    <Ring size={40} stroke={5} pct={pctOf(g.cur, g.tgt)} color={g.c} />
                  </div>
                  <div className="t"><b>{g.cur}/{g.tgt}</b><span>{g.name}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="gl-card">
          <div className="sec-head"><span className="sec-title">本周完成度</span><span className="sec-hint">每日目标达成 %</span></div>
          <div className="gl-week">
            {data.week.map((w, i) => (
              <div className="gl-wd" key={i}>
                <div className={`gl-wbar${w.t ? ' today' : ''}${w.miss ? ' miss' : ''}`} style={{ height: `${Math.max(w.v, 3)}%` }} title={`${w.v}%`} />
                <small className={w.t ? 't' : ''}>{w.d}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="gl-card">
          <div className="sec-head"><span className="sec-title">连续打卡</span><span className="sec-hint">🔥 当前 {streakData.current} 天 · 最长 {streakData.longest} 天</span></div>
          <div className="gl-cal">
            {WD.slice(1).concat(WD[0]).map(d => <div className="hh" key={d}>{d}</div>)}
            {data.cal.map((d, i) => d
              ? <div key={i} className={`gl-day${d.done ? ' done' : ''}${d.today ? ' today' : ''}`}>{d.n}</div>
              : <div key={i} />)}
          </div>
        </div>

        <div className="gl-card">
          <div className="sec-head"><span className="sec-title">调整每日目标</span></div>
          <div className="gl-set">
            <div className="gl-setrow">
              <span className="nm">每日新词</span>
              <div className="gl-seg">
                {GOAL_OPTS.map(n => (
                  <button key={n} className={n === dailyGoal ? 'on' : ''} onClick={() => setGoal(n)}>{n} 词</button>
                ))}
              </div>
            </div>
            <div className="gl-set-foot">按你的节奏来 —— 目标越稳，坚持越久。{savedMsg && <span style={{ color: 'var(--teal-ink)', fontWeight: 600 }}>{savedMsg}</span>}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
