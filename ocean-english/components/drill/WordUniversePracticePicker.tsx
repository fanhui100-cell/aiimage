'use client'
/* WordUniversePracticePicker — 单词宇宙练习（Phase 6）= 原「自选练习(self)」+ 题型白名单。
   题型仅限 WORD_UNIVERSE_TYPES（识记/拼写/听辨三族），退役与考试任务题型不在此处。
   其余能力全保留：等级 / 技能族 / 自由练 / 限时试炼 / resume / 移动端坞与抽屉。 */
import { useEffect, useState } from 'react'
import { Ic, LevelGrid, levelZh, typeSummary } from '@/components/screens/drill/DrillShared'
import { TYPES, typeAvail, typeCount, fmt } from '@/components/screens/drill/drill-data'
import { isDeprecatedQuestionType, isWordUniverseType } from '@/lib/question-bank/question-type-taxonomy'
import type { DrillConfig, DrillMode } from '@/components/screens/drill/DrillScreen'

// 白名单技能族（4→3：识记/拼写/听辨）
const WU_FAMILIES = [
  { key: 'recognize', zh: '识记 · 选择', color: '#0c9b8e', bg: 'rgba(18,179,163,.12)', ic: 'eye' },
  { key: 'spell', zh: '拼写 · 词形', color: '#c08a2a', bg: 'rgba(192,138,42,.12)', ic: 'pen' },
  { key: 'listen', zh: '听辨', color: '#4b6ed6', bg: 'rgba(75,110,214,.12)', ic: 'ear' },
]
// 双过滤：只保留 word-universe 白名单题型；退役/考试任务题型一律不进单词宇宙
const WU_TYPES = TYPES.filter((t) => isWordUniverseType(t.key) && !isDeprecatedQuestionType(t.key))
const wuFamTypes = (fam: string) => WU_TYPES.filter((t) => t.fam === fam)

interface Recipe { name: string; sub: string; level: string; types: string[] }
const WU_RECIPES: Recipe[] = [
  { name: '四级核心', sub: 'CET-4 · 识记', level: 'cet4', types: ['en_to_zh', 'synonym_choice', 'cloze_choice'] },
  { name: '听辨专项', sub: 'CET-4 · 听辨', level: 'cet4', types: ['listen_to_meaning', 'dictation_spell'] },
  { name: '拼写打卡', sub: '高考 · 拼写', level: 'gaokao', types: ['zh_to_word_spell', 'word_form'] },
  { name: '辨析冲刺', sub: '中考 · 易混', level: 'zhongkao', types: ['confusable_choice', 'synonym_choice'] },
]

interface LastConfig { level: string; types: string[]; mode: DrillMode; lenLabel: string }
const LS_KEY = 'lexiB.lastConfig'
// 旧 localStorage 经白名单双过滤；为空 → 安全默认（不预选），不崩溃
function loadLast(): LastConfig | null {
  try {
    const c = JSON.parse(localStorage.getItem(LS_KEY) || 'null') as LastConfig | null
    if (c && Array.isArray(c.types)) c.types = c.types.filter((t) => isWordUniverseType(t) && !isDeprecatedQuestionType(t))
    return c
  } catch { return null }
}
function saveLast(c: LastConfig) { try { localStorage.setItem(LS_KEY, JSON.stringify(c)) } catch { /* noop */ } }

// 白名单题型选择器
function WUTypePicker({ level, selected, onToggle, onToggleFam, compact }: { level: string | null; selected: string[]; onToggle: (k: string) => void; onToggleFam: (f: string, on: boolean) => void; compact?: boolean }) {
  return (
    <div>
      {WU_FAMILIES.map((fam) => {
        const types = wuFamTypes(fam.key)
        const availCount = types.filter((t) => typeAvail(t.key, level)).length
        const totalAt = types.reduce((s, t) => s + typeCount(t.key, level), 0)
        const allSel = availCount > 0 && types.filter((t) => typeAvail(t.key, level)).every((t) => selected.includes(t.key))
        return (
          <div className="lx-fam" key={fam.key}>
            <div className="lx-fam-h">
              <span className="lx-fam-ic" style={{ background: fam.bg, color: fam.color }}><Ic name={fam.ic} s={15} /></span>
              <span className="lx-fam-name">{fam.zh}</span>
              <span className="lx-fam-cnt">{fmt(totalAt)} 题 · {availCount} 型</span>
              {availCount > 0 && <button className="lx-fam-all" onClick={() => onToggleFam(fam.key, !allSel)}>{allSel ? '取消' : '全选'}</button>}
            </div>
            <div className="lx-chips">
              {types.map((t) => {
                const avail = typeAvail(t.key, level); const on = selected.includes(t.key); const cnt = typeCount(t.key, level)
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

export function WordUniversePracticePicker({ mob, onStart }: { mob?: boolean; onStart: (cfg: DrillConfig) => void }) {
  const [level, setLevel] = useState('cet4')
  const [sel, setSel] = useState<string[]>([])
  const [recipe, setRecipe] = useState<string | null>(null)
  const [lenMode, setLenMode] = useState('inf')
  const [count, setCount] = useState(20)
  const [minutes, setMinutes] = useState(10)
  const [tcount, setTcount] = useState(10)
  const [sheet, setSheet] = useState(false)
  const [last, setLast] = useState<LastConfig | null>(null)
  useEffect(() => { setLast(loadLast()) }, [])
  const ready = sel.length > 0

  const toggle = (k: string) => { setRecipe(null); setSel((s) => s.includes(k) ? s.filter((x) => x !== k) : [...s, k]) }
  const toggleFam = (f: string, on: boolean) => { setRecipe(null); setSel((s) => { const ks = wuFamTypes(f).filter((t) => typeAvail(t.key, level)).map((t) => t.key); return on ? [...new Set([...s, ...ks])] : s.filter((x) => !ks.includes(x)) }) }
  const pickLevel = (k: string) => { setRecipe(null); setLevel(k); setSel((s) => s.filter((x) => typeAvail(x, k))) }
  const applyRecipe = (r: Recipe) => { setRecipe(r.name); setLevel(r.level); setSel(r.types.filter((t) => typeAvail(t, r.level))) }

  const begin = (mode: DrillMode) => {
    const cfg: DrillConfig = { mode, level, types: sel, lenMode, count, minutes, tcount, difficulty: 'auto', shuffle: true }
    saveLast({ level, types: sel, mode, lenLabel: mode === 'trial' ? `${tcount} 题 · 限时` : (lenMode === 'inf' ? '∞ 无限' : lenMode === 'count' ? `${count} 题` : `${minutes} 分钟`) })
    onStart(cfg)
  }
  const resumeNow = () => { if (last) onStart({ mode: last.mode, level: last.level, types: last.types, lenMode: 'inf', count: 20, minutes: 10, tcount: 10, difficulty: 'auto', shuffle: true }) }

  return (
    <div className="lx-face">
      <p className="lx-eyebrow"><span className="dot" />单词宇宙练习 · WORD UNIVERSE</p>
      <h1 className="lx-h1" style={mob ? { fontSize: 24 } : undefined}>先圈范围，<em>再挑练法</em></h1>
      <p className="lx-sub">等级 × 题型一次选定，{mob ? '底部开练栏一键开「自由练 / 限时试炼」' : '底部两张卡选「自由练 / 限时试炼」'}。题型仅含<b>背词闭环</b>的识记 / 拼写 / 听辨，退役与考试任务题型不在此处。</p>

      {!mob && last && (last.types.length > 0) && (
        <div className="lx-resume lx-reveal" style={{ marginTop: 18 }}>
          <span className="ic"><Ic name="clock" s={18} /></span>
          <div className="body"><div className="lab">上次配方 · 一键重开</div><div className="val"><em>{levelZh(last.level)}</em> · {typeSummary(last.types)} · {last.lenLabel}</div></div>
          <button className="go" onClick={resumeNow}>继续</button>
        </div>
      )}

      <div className="lx-step" style={{ marginTop: 20 }}>
        <div className="lx-step-h"><span className="lx-step-n">·</span><span className="lx-step-t">推荐组合</span><span className="lx-step-d">· 一键带入范围与题型</span></div>
        <div className="lx-recipes">{WU_RECIPES.map((r) => <button key={r.name} className={`lx-recipe ${recipe === r.name ? 'on' : ''}`} onClick={() => applyRecipe(r)}><b>{r.name}</b><span>{r.sub}</span></button>)}</div>
      </div>

      <div className="lx-step">
        <div className="lx-step-h"><span className="lx-step-n">1</span><span className="lx-step-t">练哪个等级</span><span className="lx-step-d">· 7 个能力档，决定可用题型</span></div>
        <LevelGrid value={level} onPick={pickLevel} mob={mob} />
      </div>

      <div className="lx-step">
        <div className="lx-step-h"><span className="lx-step-n">2</span><span className="lx-step-t">练什么题型</span><span className="lx-step-d">· 识记 / 拼写 / 听辨 · {levelZh(level)} 可用项亮起</span></div>
        <WUTypePicker level={level} selected={sel} onToggle={toggle} onToggleFam={toggleFam} compact={mob} />
      </div>

      {!mob && (
        <div className="lx-step">
          <div className="lx-step-h"><span className="lx-step-n">3</span><span className="lx-step-t">选一种开练</span><span className="lx-step-d">· 同一套范围 → 两种节奏</span></div>
          <div className="lx-launch">
            <div className="lx-lcard practice">
              <div className="glow" />
              <div className="lx-lcard-tag">∞ FREE PRACTICE</div>
              <div className="lx-lcard-h">自由练 <em>Practice</em></div>
              <p className="lx-lcard-p">不计时、不评分。答错加权重出，专注把生词练熟。</p>
              <div className="lx-lcard-cfg">
                <div className="cl">练多久</div>
                <div className="lx-miniseg">{([['inf', '∞ 无限'], ['count', '按题数'], ['time', '按时间']] as [string, string][]).map(([k, t]) => <button key={k} className={lenMode === k ? 'on' : ''} onClick={() => setLenMode(k)}>{t}</button>)}</div>
                {lenMode === 'count' && <div className="lx-presets" style={{ marginTop: 10 }}>{[10, 20, 50].map((n) => <button key={n} className={`lx-pchip ${count === n ? 'on' : ''}`} onClick={() => setCount(n)}>{n} 题</button>)}</div>}
                {lenMode === 'time' && <div className="lx-presets" style={{ marginTop: 10 }}>{[5, 10, 20].map((n) => <button key={n} className={`lx-pchip ${minutes === n ? 'on' : ''}`} onClick={() => setMinutes(n)}>{n} 分</button>)}</div>}
              </div>
              <button className="lx-lbtn" disabled={!ready} style={!ready ? { opacity: .5 } : undefined} onClick={() => begin('practice')}>开始自由练 →</button>
            </div>
            <div className="lx-lcard trial">
              <div className="glow" />
              <div className="lx-lcard-tag">✦ TIMED TRIAL</div>
              <div className="lx-lcard-h">限时试炼 <em>Trial</em></div>
              <p className="lx-lcard-p">计时作答、按维度评分，过 80% 点亮星系，错词回流今日。</p>
              <div className="lx-lcard-cfg">
                <div className="cl">题量 · 限时随题量自动合成</div>
                <div className="lx-miniseg">{[6, 10, 12, 20].map((c) => <button key={c} className={tcount === c ? 'on' : ''} onClick={() => setTcount(c)}>{c} 题</button>)}</div>
                <div style={{ display: 'flex', gap: 14, marginTop: 11, fontSize: 11.5, color: 'var(--ink-muted)' }}>
                  <span>⏱ 限时 <b style={{ fontFamily: 'var(--font-mono)', color: 'var(--violet-ink)' }}>{Math.max(60, tcount * 16)}s</b></span>
                  <span>🎯 通关 <b style={{ fontFamily: 'var(--font-mono)', color: 'var(--teal-ink)' }}>80%</b></span>
                </div>
              </div>
              <button className="lx-lbtn" disabled={!ready} style={!ready ? { opacity: .5 } : undefined} onClick={() => begin('trial')}>开始试炼 ✦</button>
            </div>
          </div>
        </div>
      )}

      <div className="lx-banknote"><Ic name="check" s={15} sw={2.4} /><span>单词宇宙题型 <b>{WU_TYPES.length}</b> 种 · <b>7</b> 等级，答错的词自动回流「今日」复习。</span></div>

      {mob && (
        <>
          <div className="lx-launchdock">
            {last && last.types.length > 0 && (
              <div className="lx-dock-resume">
                <span className="ri"><Ic name="clock" s={15} /></span>
                <span className="rl">上次：<em>{levelZh(last.level)}</em> · {typeSummary(last.types)}</span>
                <button className="rg" onClick={resumeNow}><Ic name="play" s={11} sw={2.4} />重开</button>
              </div>
            )}
            <div className="lx-launchdock-sum">
              <div className="t"><em>{levelZh(level)}</em> · {typeSummary(sel)}</div>
              <button className="lx-cfgbtn" onClick={() => setSheet(true)}><Ic name="pen" s={13} />调练法</button>
            </div>
            <div className="lx-split">
              <button className="lx-splitbtn practice" disabled={!ready} onClick={() => begin('practice')}><span className="bt"><Ic name="inf" s={16} sw={2.2} />自由练</span><span className="bs">{lenMode === 'inf' ? '∞ 无限' : lenMode === 'count' ? `${count} 题` : `${minutes} 分钟`}</span></button>
              <button className="lx-splitbtn trial" disabled={!ready} onClick={() => begin('trial')}><span className="bt"><Ic name="bolt" s={15} sw={2.2} />限时试炼</span><span className="bs">{tcount} 题 · 80%过线</span></button>
            </div>
          </div>
          {sheet && (
            <div className="lx-sheet-mask" onClick={(e) => { if (e.target === e.currentTarget) setSheet(false) }}>
              <div className="lx-sheet">
                <div className="lx-sheet-grab" />
                <h3 className="lx-sheet-h">调练法</h3>
                <div className="lx-sheet-sec">
                  <div className="sl"><span className="d" style={{ background: 'var(--teal)' }} />自由练 · 练多久</div>
                  <div className="lx-seg">{([['inf', '∞ 无限'], ['count', '按题数'], ['time', '按时间']] as [string, string][]).map(([k, t]) => <button key={k} className={lenMode === k ? 'on' : ''} onClick={() => setLenMode(k)}>{t}</button>)}</div>
                  {lenMode === 'count' && <div className="lx-presets" style={{ marginTop: 11 }}>{[10, 20, 50, 100].map((n) => <button key={n} className={`lx-pchip ${count === n ? 'on' : ''}`} onClick={() => setCount(n)}>{n} 题</button>)}</div>}
                  {lenMode === 'time' && <div className="lx-presets" style={{ marginTop: 11 }}>{[5, 10, 20, 30].map((n) => <button key={n} className={`lx-pchip ${minutes === n ? 'on' : ''}`} onClick={() => setMinutes(n)}>{n} 分</button>)}</div>}
                </div>
                <div className="lx-sheet-sec">
                  <div className="sl"><span className="d" style={{ background: 'var(--violet)' }} />限时试炼 · 题量</div>
                  <div className="lx-seg">{[6, 10, 12, 20].map((c) => <button key={c} className={tcount === c ? 'on' : ''} style={tcount === c ? { background: 'var(--violet)' } : undefined} onClick={() => setTcount(c)}>{c} 题</button>)}</div>
                </div>
                <button className="lx-sheet-done" onClick={() => setSheet(false)}>完成</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
