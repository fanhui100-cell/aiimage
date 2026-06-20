'use client'
/* DrillShared.tsx — 共享组件（移植自原型 ui.jsx，JSX 一字不改，仅加类型 + import/export） */
import { useState, useRef, useEffect, type Dispatch, type SetStateAction, type ReactNode } from 'react'
import { LEVELS, FAMILIES, TYPE_BY_KEY, typeAvail, typeCount, famAll, fmt } from './drill-data'

// ── 图标 ──
function Ic({ name, s = 18, sw = 1.7 }: { name: string; s?: number; sw?: number }) {
  const p: Record<string, ReactNode> = {
    eye: <><circle cx="12" cy="12" r="3" /><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /></>,
    pen: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
    ear: <><path d="M6 8.5a6 6 0 0 1 12 0c0 3-2 4-3 5.5s-1 3.5-3 3.5a3 3 0 0 1-3-3" /><path d="M9 8.5a3 3 0 0 1 5 2" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></>,
    check: <path d="M20 6 9 17l-5-5" />,
    bolt: <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />,
    inf: <path d="M6 8c-2.5 0-4 1.8-4 4s1.5 4 4 4c3 0 4-4 6-4s3 1.8 3 4-1.5 4-4 4c-3 0-4-4-6-4" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" /></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></>,
    star: <path d="m12 2 3 6.5 7 .8-5 4.8 1.3 7L12 18l-6.6 3.1L6.7 14l-5-4.8 7-.8Z" />,
    play: <path d="M7 4v16l13-8Z" />,
    today: <><rect x="3" y="4.5" width="18" height="17" rx="2.5" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    mic: <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0M12 19v3M8 22h8" /></>,
    sprout: <><path d="M7 20h10M12 20v-9" /><path d="M12 11C12 7 9 5 5 5c0 4 3 6 7 6Z" /><path d="M12 13c0-3 2.5-5 6-5 0 3-2.5 5-6 5Z" /></>,
    planet: <><circle cx="12" cy="12" r="6.5" /><ellipse cx="12" cy="12" rx="11" ry="4" transform="rotate(-22 12 12)" /></>,
    layers: <><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /></>,
    cone: <><path d="M3 21h18M7 21l5-16 5 16M9.5 13h5" /></>,
    wrench: <path d="M14.7 6.3a4 4 0 0 0-5.4 5l-6 6 2.4 2.4 6-6a4 4 0 0 0 5-5.4l-2.6 2.6-2-2 2.6-2.6Z" />,
    arrowright: <path d="M5 12h14M13 6l6 6-6 6" />,
    chev: <path d="m9 6 6 6-6 6" />,
  }
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{p[name]}</svg>
}

function Aurora() {
  return <div className="lx-aurora"><b className="b1" /><b className="b2" /><b className="b3" /></div>
}

// ── 模式开关 练习 / 试炼 ──
function ModeSwitch({ mode, setMode, size = 'lg' }: { mode: 'practice' | 'trial'; setMode: (m: 'practice' | 'trial') => void; size?: 'lg' | 'sm' }) {
  const ref = useRef<HTMLDivElement>(null)
  const [thumb, setThumb] = useState({ left: 5, width: 0 })
  useEffect(() => {
    const root = ref.current; if (!root) return
    const btn = root.querySelector(`button[data-m="${mode}"]`) as HTMLElement | null
    if (btn) setThumb({ left: btn.offsetLeft, width: btn.offsetWidth })
  }, [mode])
  return (
    <div className="lx-modesw" ref={ref} style={size === 'sm' ? { padding: 4 } : undefined}>
      <span className={`thumb ${mode === 'practice' ? 'practice' : 'trial'}`} style={{ left: thumb.left, width: thumb.width }} />
      <button data-m="practice" className={mode === 'practice' ? 'on' : ''} onClick={() => setMode('practice')}>
        <span className="mi"><Ic name="inf" s={16} sw={2} /></span>练习
      </button>
      <button data-m="trial" className={mode === 'trial' ? 'on' : ''} onClick={() => setMode('trial')}>
        <span className="mi"><Ic name="bolt" s={15} sw={2} /></span>试炼
      </button>
    </div>
  )
}

// ── 等级网格 ──
function LevelGrid({ value, onPick, mob }: { value: string | null; onPick: (k: string) => void; mob?: boolean }) {
  return (
    <div className={`lx-lvgrid ${mob ? 'mob' : ''}`}>
      {LEVELS.map(l => (
        <button key={l.key} className={`lx-lv ${value === l.key ? 'on' : ''}`} onClick={() => onPick(l.key)}>
          {l.rec && <span className="lx-lv-rec">推荐</span>}
          <div className="lx-lv-top">
            <span className="lx-lv-zh">{l.zh}</span>
            <span className="lx-lv-cefr">{l.cefr}</span>
          </div>
          <div className="lx-lv-meta">{fmt(l.total)} 题</div>
        </button>
      ))}
    </div>
  )
}

// ── 题型选择器（按技能族分组 + 等级联动） ──
function TypePicker({ level, selected, onToggle, onToggleFam, compact }: { level: string | null; selected: string[]; onToggle: (k: string) => void; onToggleFam?: (f: string, on: boolean) => void; compact?: boolean; mob?: boolean }) {
  return (
    <div>
      {FAMILIES.map(fam => {
        const types = famAll(fam.key)
        const availCount = types.filter(t => typeAvail(t.key, level)).length
        const totalAt = types.reduce((s, t) => s + typeCount(t.key, level), 0)
        const allSel = types.filter(t => typeAvail(t.key, level)).every(t => selected.includes(t.key)) && availCount > 0
        return (
          <div className="lx-fam" key={fam.key}>
            <div className="lx-fam-h">
              <span className="lx-fam-ic" style={{ background: fam.bg, color: fam.color }}><Ic name={fam.ic} s={15} /></span>
              <span className="lx-fam-name">{fam.zh}</span>
              {fam.isNew && <span style={{ fontSize: 9.5, fontWeight: 700, color: fam.color, background: fam.bg, border: `1px solid ${fam.color}33`, padding: '1px 7px', borderRadius: 999, whiteSpace: 'nowrap' }}>新并入 · 原「{fam.was}」</span>}
              <span className="lx-fam-cnt">{fam.ai ? 'AI 生成' : `${fmt(totalAt)} 题`} · {availCount} 型</span>
              {onToggleFam && availCount > 0 && (
                <button className="lx-fam-all" onClick={() => onToggleFam(fam.key, !allSel)}>{allSel ? '取消' : '全选'}</button>
              )}
            </div>
            <div className="lx-chips">
              {types.map(t => {
                const avail = typeAvail(t.key, level)
                const on = selected.includes(t.key)
                const cnt = typeCount(t.key, level)
                return (
                  <button key={t.key}
                    className={`lx-chip ${on ? 'on' : ''} ${!avail ? 'dis' : ''}`}
                    disabled={!avail}
                    title={avail ? `${t.zh} · ${fmt(cnt)} 题` : `${t.zh} · 该档暂无`}
                    onClick={() => avail && onToggle(t.key)}>
                    {on && <span className="ck"><Ic name="check" s={13} sw={2.4} /></span>}
                    {t.zh}
                    {avail && !compact && !t.ai && <span className="lx-chip-n">{cnt >= 1000 ? (cnt / 1000).toFixed(1) + 'k' : cnt}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── 练习时长控件（无限 / 按题数 / 按时间） ──
function PracticeLength({ lenMode, setLenMode, count, setCount, minutes, setMinutes }: { lenMode: string; setLenMode: (v: string) => void; count: number; setCount: Dispatch<SetStateAction<number>>; minutes: number; setMinutes: Dispatch<SetStateAction<number>> }) {
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
  return (
    <div>
      <div className="lx-seg">
        {[['inf', '∞ 无限连续'], ['count', '按题数'], ['time', '按时间']].map(([k, t]) => (
          <button key={k} className={lenMode === k ? 'on' : ''} onClick={() => setLenMode(k)}>{t}</button>
        ))}
      </div>
      {lenMode === 'inf' && <div className="lx-note">题目从所选范围循环抽取，<b>答错加权重出，不主动结束不停</b>。</div>}
      {lenMode === 'count' && (
        <div className="lx-reveal">
          <div className="lx-presets">{[10, 20, 50, 100].map(n => <button key={n} className={`lx-pchip ${count === n ? 'on' : ''}`} onClick={() => setCount(n)}>{n} 题</button>)}</div>
          <div className="lx-stepper">
            <button onClick={() => setCount(c => clamp(c - 5, 5, 200))}>−</button>
            <div className="lx-stepval"><b>{count}</b><span>题</span></div>
            <button onClick={() => setCount(c => clamp(c + 5, 5, 200))}>+</button>
            <input type="range" min={5} max={200} step={5} value={count} onChange={e => setCount(clamp(+e.target.value, 5, 200))} />
          </div>
        </div>
      )}
      {lenMode === 'time' && (
        <div className="lx-reveal">
          <div className="lx-presets">{[5, 10, 20, 30].map(n => <button key={n} className={`lx-pchip ${minutes === n ? 'on' : ''}`} onClick={() => setMinutes(n)}>{n} 分</button>)}</div>
          <div className="lx-stepper">
            <button onClick={() => setMinutes(m => clamp(m - 5, 3, 60))}>−</button>
            <div className="lx-stepval"><b>{minutes}</b><span>分钟</span></div>
            <button onClick={() => setMinutes(m => clamp(m + 5, 3, 60))}>+</button>
            <input type="range" min={3} max={60} step={1} value={minutes} onChange={e => setMinutes(clamp(+e.target.value, 3, 60))} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── 试炼控件（题量 + 限时 + 过线） ──
function TrialControls({ count, setCount }: { count: number; setCount: Dispatch<SetStateAction<number>>; level?: string; selected?: string[] }) {
  const secs = Math.max(60, count * 16)
  return (
    <div>
      <div className="lx-step-d" style={{ marginBottom: 9 }}>题量 <em>count</em></div>
      <div className="lx-seg">{[6, 10, 12, 20, 30].map(c => <button key={c} className={count === c ? 'on' : ''} onClick={() => setCount(c)}>{c} 题</button>)}</div>
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <div style={{ flex: 1, padding: '13px 15px', borderRadius: 14, background: 'var(--card)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--violet-ink)' }}><Ic name="clock" s={19} /></span>
          <div><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 17 }}>{secs}s</div><div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>限时计时</div></div>
        </div>
        <div style={{ flex: 1, padding: '13px 15px', borderRadius: 14, background: 'var(--card)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--teal-ink)' }}><Ic name="target" s={19} /></span>
          <div><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 17, color: 'var(--teal-ink)' }}>80%</div><div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>过线点亮星系</div></div>
        </div>
      </div>
    </div>
  )
}

// 选中题型 → 摘要文案
function typeSummary(selected: string[]) {
  if (!selected.length) return '未选题型'
  if (selected.length <= 2) return selected.map(k => TYPE_BY_KEY[k].zh).join(' · ')
  return `${TYPE_BY_KEY[selected[0]].zh} 等 ${selected.length} 种题型`
}
function levelZh(key: string) { const l = LEVELS.find(x => x.key === key); return l ? l.zh : '' }

export { Ic, Aurora, ModeSwitch, LevelGrid, TypePicker, PracticeLength, TrialControls, typeSummary, levelZh }
