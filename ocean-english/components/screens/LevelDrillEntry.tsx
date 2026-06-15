'use client'
/* ════════════════════════════════════════════════════════════════════════
   D4 按档刷词 — 选档入口（DrillEntryScreen）+ 单档会话小结（DrillSummary）
   界面优化17「按档刷词 LevelDrill」移植。入口跳 /learn?level=N&drill=1（不改定级）。
   ════════════════════════════════════════════════════════════════════════ */
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLexiStore } from '@/store/lexiStore'
import './drill.css'

const fmt = (n: number) => n.toLocaleString('en-US')

// 界面优化1·阶段5：7 能力档 + 每级专属题型（结构化专练）
const DR_LEVELS = [
  { level: 1, zh: '初中', cefr: 'A2', desc: '基础词汇起步，覆盖日常表达', n: 3223 },
  { level: 2, zh: '高中', cefr: 'B1', desc: '高考核心词，读写听说打底', n: 6008 },
  { level: 3, zh: '四级', cefr: 'B1', desc: '大学英语四级，应试与应用并重', n: 7508 },
  { level: 4, zh: '六级', cefr: 'B2', desc: '六级进阶词汇，学术阅读起点', n: 5651 },
  { level: 5, zh: '考研', cefr: 'B2', desc: '考研大纲词，长难句的基石', n: 9602 },
  { level: 6, zh: '托福', cefr: 'C1', desc: '留学学术词汇，听说读写四项', n: 13477 },
  { level: 7, zh: 'SAT', cefr: 'C1', desc: '北美学术顶配，精确与文雅', n: 8887 },
]
const TYPE_META: Record<string, { t: string; s: string }> = {
  meaning: { t: '看词选义', s: '英文 → 选中文释义' }, listen: { t: '听音选词', s: '听发音 → 选对应词' },
  pic: { t: '看图选词', s: '图片 → 配单词' }, cloze: { t: '选词填空', s: '句子挖空 → 选词' },
  sentence: { t: '例句填空', s: '语境里补全' }, listenVocab: { t: '听力词汇', s: '听句子 → 抓关键词' },
  translate: { t: '翻译词块', s: '中英词块互译' }, longSent: { t: '长难句', s: '拆句 → 抓词义' },
  discern: { t: '词义辨析', s: '近义词精确区分' }, fullCloze: { t: '完形填空', s: '整段挖空选词' },
  inferRead: { t: '阅读词义推断', s: '据上下文猜义' }, acadListen: { t: '学术听力', s: '讲座听词' },
  readVocab: { t: '阅读词汇题', s: '同义替换' }, speakUse: { t: '口语综合', s: '跟读 + 应用' },
  writeWord: { t: '学术写作词', s: '高级替换词' }, hardDiscern: { t: '难词辨析', s: '高阶近义辨析' },
  equiv: { t: '等价填空', s: '句子等价选项' }, synant: { t: '近反义', s: '近义 / 反义匹配' },
  ctxInfer: { t: '语境推断', s: '据语境定义' },
}
const LEVEL_TYPES: Record<number, string[]> = {
  1: ['meaning', 'listen', 'pic'], 2: ['meaning', 'cloze', 'listen', 'sentence'],
  3: ['meaning', 'cloze', 'listenVocab', 'translate'], 4: ['meaning', 'cloze', 'listenVocab', 'translate', 'longSent'],
  5: ['discern', 'fullCloze', 'inferRead', 'longSent'], 6: ['acadListen', 'readVocab', 'speakUse', 'writeWord'],
  7: ['hardDiscern', 'equiv', 'synant', 'ctxInfer'],
}
type LenMode = 'inf' | 'count' | 'time' | 'mock'
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

export function DrillEntryScreen() {
  const router = useRouter()
  const recLevel = useLexiStore(s => s.profile.level ?? 3)
  const [level, setLevel] = useState<number | null>(null)
  const [type, setType] = useState<string | null>(null)
  const [lenMode, setLenMode] = useState<LenMode>('inf')
  const [count, setCount] = useState(20)
  const [minutes, setMinutes] = useState(10)

  const pickLevel = (l: number) => { setLevel(l); setType(null) }
  const ready = level != null && type != null
  const lenLabel = lenMode === 'inf' ? '无限连续' : lenMode === 'count' ? `${count} 题` : lenMode === 'time' ? `${minutes} 分钟` : '限时模考'
  const summary = ready ? `${DR_LEVELS.find(l => l.level === level)!.zh} · ${TYPE_META[type!].t} · ${lenLabel}` : '选择等级与题型后开始'

  function start() {
    if (!ready) return
    const qs = new URLSearchParams({ level: String(level), drill: '1', type: type! })
    if (lenMode === 'count') qs.set('count', String(count))
    else if (lenMode === 'time') qs.set('minutes', String(minutes))
    else qs.set('len', lenMode)
    // 复用现有答题屏：模考走 /exam，其余走 /quiz（题源锁定为等级+题型）
    router.push(lenMode === 'mock' ? `/exam?level=${level}` : `/quiz?${qs.toString()}`)
  }

  return (
    <div className="dr-screen theme-light">
      <div className="dr-wrap">
        <p className="dr-eyebrow">专练 · Focused Practice</p>
        <h1 className="dr-h1">自选范围，一直练下去</h1>
        <p className="dr-sub">不靠系统推荐 —— 你自己定。先选 7 个能力档之一，<b>不同等级对应不同题库与题型</b>，选完等级再挑练法，可无限连续刷。</p>

        {/* 步骤 1：选等级 */}
        <div className="dk-step">
          <div className="dk-step-h"><span className="dk-n">1</span><b>练哪个等级</b><span>· 7 个能力档</span></div>
          <div className="dk-lvgrid">
            {DR_LEVELS.map(l => (
              <button key={l.level} className={`dk-lv ${level === l.level ? 'on' : ''}`} onClick={() => pickLevel(l.level)}>
                <div className="dk-lv-top"><span className="dk-lv-zh">{l.zh}{l.level === recLevel && <span className="dr-recdot" />}</span><span className="dk-lv-cefr">{l.cefr}</span></div>
                <div className="dk-lv-desc">{l.desc}</div>
                <div className="dk-lv-meta">{fmt(l.n)} 词 · {LEVEL_TYPES[l.level].length} 种题型</div>
              </button>
            ))}
          </div>
        </div>

        {/* 步骤 2：怎么练（该级专属题型） */}
        <div className="dk-step">
          <div className="dk-step-h"><span className={`dk-n ${level ? '' : 'off'}`}>2</span><b style={level ? undefined : { color: 'var(--ink-muted)' }}>怎么练</b><span>{level ? `· ${DR_LEVELS.find(l => l.level === level)!.zh} 的题型（每级不同）` : '选完等级后弹出对应题型'}</span></div>
          {level ? (
            <div className="dk-types">
              {LEVEL_TYPES[level].map(tk => (
                <button key={tk} className={`dk-type ${type === tk ? 'on' : ''}`} onClick={() => setType(tk)}><b>{TYPE_META[tk].t}</b><span>{TYPE_META[tk].s}</span></button>
              ))}
            </div>
          ) : <div className="dk-empty">先在上方选一个等级 ↑</div>}
        </div>

        {/* 步骤 3：练多久 */}
        {ready && (
          <div className="dk-step">
            <div className="dk-step-h"><span className="dk-n">3</span><b>练多久</b><span>· 自由定量</span></div>
            <div className="dk-lenseg">
              {([['inf', '∞ 无限连续'], ['count', '按题数'], ['time', '按时间'], ['mock', '限时模考']] as [LenMode, string][]).map(([k, t]) => (
                <button key={k} className={lenMode === k ? 'on' : ''} onClick={() => setLenMode(k)}>{t}</button>
              ))}
            </div>
            {lenMode === 'count' && (
              <div className="dk-len-detail">
                <div className="dk-presets">{[10, 20, 50, 100].map(n => <button key={n} className={`dk-chip ${count === n ? 'on' : ''}`} onClick={() => setCount(n)}>{n} 题</button>)}</div>
                <div className="dk-stepper"><button onClick={() => setCount(c => clamp(c - 5, 5, 200))}>−</button><div className="dk-stp-val"><b>{count}</b><span>题</span></div><button onClick={() => setCount(c => clamp(c + 5, 5, 200))}>+</button><input type="range" min={5} max={200} step={5} value={count} onChange={e => setCount(clamp(+e.target.value, 5, 200))} /></div>
                <div className="dk-tip">想刷多少刷多少 · 拖滑块或加减自定义</div>
              </div>
            )}
            {lenMode === 'time' && (
              <div className="dk-len-detail">
                <div className="dk-presets">{[5, 10, 20, 30].map(n => <button key={n} className={`dk-chip ${minutes === n ? 'on' : ''}`} onClick={() => setMinutes(n)}>{n} 分钟</button>)}</div>
                <div className="dk-stepper"><button onClick={() => setMinutes(m => clamp(m - 5, 3, 60))}>−</button><div className="dk-stp-val"><b>{minutes}</b><span>分钟</span></div><button onClick={() => setMinutes(m => clamp(m + 5, 3, 60))}>+</button><input type="range" min={3} max={60} step={1} value={minutes} onChange={e => setMinutes(clamp(+e.target.value, 3, 60))} /></div>
                <div className="dk-tip">到点自动收尾并出小结</div>
              </div>
            )}
            {lenMode === 'mock' && <div className="dk-note">按目标考试出整套限时卷 · 计时 + 交卷评分</div>}
            {lenMode === 'inf' && <div className="dk-note">题目从所选范围循环抽取，答错加权重出，<b>不主动结束不停</b></div>}
          </div>
        )}

        <div className="dk-startbar">
          <div className="dk-summary">{summary}</div>
          <button className="dr-btn dr-btn-primary" disabled={!ready} onClick={start}>开始专练 →</button>
        </div>
        <p className="dr-sub" style={{ marginTop: 14, fontSize: 12 }}>开始后复用现有「练习 / 听力 / 模考」答题屏，题源锁定为你选的等级 + 题型；错词照常回流「今日」复习。</p>
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
