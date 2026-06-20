'use client'
/* ════════════════════════════════════════════════════════════════════════
   单档会话小结（DrillSummary）—— /learn 按档刷词收尾卡片。
   旧的「按档专练入口 DrillEntryScreen」已被专练 /drill（DrillScreen）取代并删除（界面优化7）。
   ════════════════════════════════════════════════════════════════════════ */
import './drill.css'

const fmt = (n: number) => n.toLocaleString('en-US')

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
