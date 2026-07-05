/* shared.jsx — 共享组件（移植自 DrillShared / DrillFlow，JSX 沿用现有 lx-* 类） */
const { useState, useRef, useEffect } = React

function Ic({ name, s = 18, sw = 1.7 }) {
  const p = {
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

function Aurora() { return <div className="lx-aurora"><b className="b1" /><b className="b2" /><b className="b3" /></div> }

// ── 等级网格 ──
function LevelGrid({ value, onPick, mob }) {
  return (
    <div className={`lx-lvgrid ${mob ? 'mob' : ''}`}>
      {LEVELS.map(l => (
        <button key={l.key} className={`lx-lv ${value === l.key ? 'on' : ''}`} onClick={() => onPick(l.key)}>
          {l.rec && <span className="lx-lv-rec">推荐</span>}
          <div className="lx-lv-top"><span className="lx-lv-zh">{l.zh}</span><span className="lx-lv-cefr">{l.cefr}</span></div>
          <div className="lx-lv-meta">{fmt(l.total)} 题</div>
        </button>
      ))}
    </div>
  )
}

// ── 单词宇宙题型选择器（白名单族 + 等级联动） ──
function WUTypePicker({ level, selected, onToggle, onToggleFam, compact }) {
  return (
    <div>
      {WU_FAMILIES.map(fam => {
        const types = wuFamTypes(fam.key)
        const availCount = types.filter(t => typeAvail(t.key, level)).length
        const totalAt = types.reduce((s, t) => s + typeCount(t.key, level), 0)
        const allSel = types.filter(t => typeAvail(t.key, level)).every(t => selected.includes(t.key)) && availCount > 0
        return (
          <div className="lx-fam" key={fam.key}>
            <div className="lx-fam-h">
              <span className="lx-fam-ic" style={{ background: fam.bg, color: fam.color }}><Ic name={fam.ic} s={15} /></span>
              <span className="lx-fam-name">{fam.zh}</span>
              <span className="lx-fam-cnt">{fmt(totalAt)} 题 · {availCount} 型</span>
              {onToggleFam && availCount > 0 && <button className="lx-fam-all" onClick={() => onToggleFam(fam.key, !allSel)}>{allSel ? '取消' : '全选'}</button>}
            </div>
            <div className="lx-chips">
              {types.map(t => {
                const avail = typeAvail(t.key, level), on = selected.includes(t.key), cnt = typeCount(t.key, level)
                return (
                  <button key={t.key} className={`lx-chip ${on ? 'on' : ''} ${!avail ? 'dis' : ''}`} disabled={!avail}
                    title={avail ? `${t.zh} · ${fmt(cnt)} 题` : `${t.zh} · 该档暂无`} onClick={() => avail && onToggle(t.key)}>
                    {on && <span className="ck"><Ic name="check" s={13} sw={2.4} /></span>}{t.zh}
                    {avail && !compact && <span className="lx-chip-n">{cnt >= 1000 ? (cnt / 1000).toFixed(1) + 'k' : cnt}</span>}
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

// ── 统一空态组件 DrillEmptyState ──
// variant: 'build'（题库建设中·客观空池）| 'plan'（规划中·生产性任务待 v2）| 'exam'（整档建设中）
function DrillEmptyState({ variant = 'build', title, desc, compact }) {
  const cfg = {
    build: { ic: 'wrench', tone: 'gold', t: '题库建设中', d: '该任务的 active 题组数量不足，正在装配。题库就绪后这里会自动可练，期间不会用无关词汇题顶替。' },
    plan: { ic: 'cone', tone: 'violet', t: '规划中 · 待生产性任务支持', d: '写作 / 翻译 / 口语等生产性任务需要 v2 评分（rubric / 录音）支持，结构位已就绪，将随生成阶段开放。' },
    exam: { ic: 'layers', tone: 'gold', t: '该考试题库建设中', d: '官方结构已确立，产品题库仍在装配；以下为规划结构草案，就绪后即可一键接入练习。' },
  }[variant]
  return (
    <div className={`lx-empty ${cfg.tone} ${compact ? 'compact' : ''}`} role="status">
      <div className="lx-empty-ic"><Ic name={cfg.ic} s={compact ? 18 : 22} /></div>
      <div className="lx-empty-body">
        <div className="lx-empty-h">{title || cfg.t}</div>
        <div className="lx-empty-p">{desc || cfg.d}</div>
      </div>
    </div>
  )
}

// ── 轻量 toast（任务跳转/动作反馈） ──
function Toast({ msg, onDone }) {
  useEffect(() => { if (!msg) return; const t = setTimeout(onDone, 2600); return () => clearTimeout(t) }, [msg])
  if (!msg) return null
  return (
    <div className="lx-toast" role="status">
      <span className="ti"><Ic name="arrowright" s={15} sw={2.2} /></span>
      <span className="tx">{msg}</span>
    </div>
  )
}

// ── 移动端顶/底栏 ──
function MobileChrome({ active = 'drill', noTab, drillBadge = 12 }) {
  const tabs = [['today', 'today', '今日'], ['grid', 'dict', '词库'], ['bolt', 'drill', '专练'], ['star', 'verse', '宇宙'], ['user', 'me', '我的']]
  return (
    <>
      <div className="lx-mtopbar"><span className="brand">词渊 <em>Lexiverse</em></span><span style={{ color: 'var(--accent-ink)' }}><Ic name="user" s={20} /></span></div>
      {!noTab && (
        <div className="lx-mtabbar">
          {tabs.map(([ic, k, zh]) => k === 'drill' ? (
            <button key={k} className="lx-mtab center"><span className="fab"><Ic name={ic} s={25} sw={2} />{drillBadge > 0 && <span className="lx-badge">{drillBadge}</span>}</span><span className="tl">{zh}</span></button>
          ) : (
            <button key={k} className={`lx-mtab ${active === k ? 'on' : ''}`}><Ic name={ic} s={20} sw={1.8} /><span className="tl">{zh}</span></button>
          ))}
        </div>
      )}
    </>
  )
}

Object.assign(window, { Ic, Aurora, LevelGrid, WUTypePicker, DrillEmptyState, Toast, MobileChrome })
