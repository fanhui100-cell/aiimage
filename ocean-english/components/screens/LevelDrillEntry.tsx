'use client'
/* ════════════════════════════════════════════════════════════════════════
   D4 按档刷词 — 选档入口（DrillEntryScreen）+ 单档会话小结（DrillSummary）
   界面优化17「按档刷词 LevelDrill」移植。入口跳 /learn?level=N&drill=1（不改定级）。
   ════════════════════════════════════════════════════════════════════════ */
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLexiStore } from '@/store/lexiStore'
import { levelProgress } from '@/lib/analytics/report'
import './drill.css'

const fmt = (n: number) => n.toLocaleString('en-US')

export function DrillEntryScreen() {
  const router = useRouter()
  const words = useLexiStore(s => s.words)
  const recLevel = useLexiStore(s => s.profile.level ?? 3)
  const levels = useMemo(() => levelProgress(words), [words])
  const [sel, setSel] = useState(recLevel)
  const L = levels.find(l => l.level === sel) ?? levels[2]
  const pct = L.total ? Math.round(L.mastered / L.total * 100) : 0
  const recName = levels.find(l => l.level === recLevel)?.name ?? '四级'

  return (
    <div className="dr-screen theme-light">
      <div className="dr-wrap">
        <p className="dr-eyebrow">词库 · Dictionary</p>
        <h1 className="dr-h1">按档专练</h1>
        <p className="dr-sub">不动你的主档位，单独挑一档高频新词刷一组。适合考前突击某一档。</p>
        <div className="dr-entry">
          <div className="dr-entry-top">
            <div><div className="dr-kicker">按档专练 · Level Drill</div><div className="dr-title">只刷某一档单词</div></div>
            <span className="dr-rec">今日推荐 · {recName}</span>
          </div>
          <div className="dr-chips">
            {levels.map(l => (
              <button key={l.level} className={`dr-chip ${l.level === sel ? 'on' : ''}`} onClick={() => setSel(l.level)}>
                {l.name}{l.level === recLevel && <span className="dr-recdot" />}
              </button>
            ))}
          </div>
          <div className="dr-prog">
            <div className="dr-prog-main">
              <div className="dr-prog-lab"><b>{L.name}</b> · 已掌握 {fmt(L.mastered)} / 共 {fmt(L.total)}</div>
              <div className="dr-prog-bar"><i style={{ width: `${pct}%` }} /></div>
            </div>
            <div className="dr-prog-pct">{pct}%</div>
          </div>
          <div className="dr-meta">本组约 <b>20</b> 词 · 预计 <b>6</b> 分钟</div>
          <div className="dr-entry-foot">
            <button className="dr-btn dr-btn-primary" onClick={() => router.push(`/learn?level=${sel}&drill=1`)}>开始刷这档新词 →</button>
            <button className="dr-btn dr-btn-ghost" onClick={() => router.push('/lexiverse')}>去词库</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export interface DrillSummaryData {
  level: number; name: string
  learnedThisSession: number; masteredInLevel: number; totalInLevel: number; accuracy?: number
}

export function DrillSummary({ data, empty, onAgain, onSwitch, onBack }: {
  data: DrillSummaryData; empty?: boolean; onAgain: () => void; onSwitch: () => void; onBack: () => void
}) {
  const C = 2 * Math.PI * 34
  const pct = data.totalInLevel ? Math.round(data.masteredInLevel / data.totalInLevel * 100) : 0
  const off = C * (1 - pct / 100)
  const leaf = <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c1 4 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3 .5 2 2 2.5 2 2.5C9 8 12 6 12 2z" /></svg>
  return (
    <div className="dr-overlay" onClick={e => { if (e.target === e.currentTarget) onBack() }}>
      <div className="dr-sum">
        {empty ? (
          <>
            <div className="dr-done-badge">{leaf}</div>
            <div className="dr-sum-kicker">{data.name} · Level Drill</div>
            <div className="dr-sum-h">这档新词都过了一遍 ✦</div>
            <div className="dr-sum-sub">{data.name}档的高频新词你都刷过了，接下来去复习巩固，记得更牢。</div>
            <div className="dr-sum-acts">
              <button className="dr-btn dr-btn-primary" onClick={onSwitch}>换一档</button>
              <button className="dr-btn dr-btn-ghost" onClick={onBack}>返回</button>
            </div>
          </>
        ) : (
          <>
            <div className="dr-sum-ring">
              <svg width="92" height="92">
                <circle cx="46" cy="46" r="34" fill="none" stroke="var(--line)" strokeWidth="7" />
                <circle cx="46" cy="46" r="34" fill="none" stroke="var(--teal-ink)" strokeWidth="7" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} transform="rotate(-90 46 46)" />
                <text x="46" y="50" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="17" fontWeight="700" fill="var(--teal-ink)">{pct}%</text>
              </svg>
            </div>
            <div className="dr-sum-kicker">{data.name} · Level Drill</div>
            <div className="dr-sum-h">本档今日刷了 <b>{data.learnedThisSession}</b> 词</div>
            <div className="dr-sum-sub">这一组练完了，继续保持节奏。</div>
            <div className="dr-sum-stats">
              <div className="dr-sum-stat"><div className="f teal">{fmt(data.masteredInLevel)}</div><div className="l">累计掌握</div></div>
              <div className="dr-sum-stat"><div className="f">{fmt(data.totalInLevel)}</div><div className="l">本档共</div></div>
              {data.accuracy != null && <div className="dr-sum-stat"><div className="f teal">{data.accuracy}%</div><div className="l">本组正确率</div></div>}
            </div>
            <div className="dr-sum-acts">
              <button className="dr-btn dr-btn-primary" onClick={onAgain}>再来一组</button>
              <button className="dr-btn dr-btn-ghost" onClick={onSwitch}>换一档</button>
              <button className="dr-btn dr-btn-ghost" onClick={onBack}>返回</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
