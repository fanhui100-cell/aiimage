'use client'
/* ============================================================================
   ReadingScreen — 分级精读三视图（D1 · 界面优化16 1:1 移植）
   列表 / 阅读 / 理解题（先全选后提交）+ 错题「待复读」回流。
   交付包 reading-app.js 状态机等价翻译为 React；样式用 reading.css（.rd 作用域）。
   差异（交付说明允许）：① mock→/api/reading；② 顶部导航走主站 AppShell（不渲染 .rd-nav）；
   ③ 查词浮层接真实词典 + ensureWord('reading')；④ 演示用「视图状态开关」不带入。
   ============================================================================ */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLexiStore } from '@/store/lexiStore'
import type { DictionaryWord } from '@/lib/dictionary/dictionary-types'
import './reading.css'

const LV: Record<number, string> = { 1: '初中', 2: '高中', 3: '四级', 4: '六级', 5: '考研', 6: '托福', 7: 'SAT' }
const RESULTS_KEY = 'rd-results-v1'

interface ListItem {
  id: string; title: string; titleZh?: string; level: number; minutes: number
  questionCount: number; keyWords: string[]; keyWordCount: number
  difficulty?: number   // 后端按词频稀有度算的难度底数（0-100），拉开各篇生词率
}
interface RQuestion {
  id: string; prompt: string; promptZh?: string
  choices: { id: string; text: string }[]; answer: string; explanationZh?: string
}
interface Detail {
  id: string; title: string; titleZh?: string; level: number; minutes: number
  paragraphs: string[]; keyWords: string[]; questions: RQuestion[]
}
interface RResult { correct: number; total: number; pct: number; wrong: string[]; ts: number }
type Ui = 'ready' | 'loading' | 'empty' | 'error'

const rateColor = (r: number) => (r >= 70 ? 'var(--rose-ink)' : r >= 45 ? 'var(--gold-ink)' : 'var(--teal-ink)')
const scoreColor = (p: number) => (p >= 80 ? 'var(--teal-ink)' : p >= 60 ? 'var(--gold-ink)' : 'var(--rose-ink)')

function loadResults(): Record<string, RResult> {
  try { return JSON.parse(localStorage.getItem(RESULTS_KEY) || '{}') } catch { return {} }
}
function saveResults(r: Record<string, RResult>) {
  try { localStorage.setItem(RESULTS_KEY, JSON.stringify(r)) } catch { /* ignore */ }
}
function speak(word: string) {
  try { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(word); u.lang = 'en-US'; window.speechSynthesis.speak(u) } catch { /* ignore */ }
}

/* ── icons（取自交付包 reading-app.js）── */
const I = {
  clock: <><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
  quiz: <><circle cx="12" cy="12" r="9" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12" y2="17" /></>,
  check: <polyline points="20 6 9 17 4 12" />,
  x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
  arrow: <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>,
  arrowDown: <><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></>,
  back: <polyline points="15 18 9 12 15 6" />,
  replay: <><polyline points="1 4 1 10 7 10" /><path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10" /></>,
  sound: <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a10 10 0 0 1 0 14" /></>,
  inbox: <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.5 6h13l3.5 6v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z" /></>,
  alert: <><path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12" y2="17" /></>,
}
function Ico({ d, sz = 12, sw = 2 }: { d: React.ReactNode; sz?: number; sw?: number }) {
  return <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
}

function MiniRing({ pct, color }: { pct: number; color: string }) {
  const r = 21, C = 2 * Math.PI * r, off = C * (1 - pct / 100)
  return (
    <svg className="rd-miniring" width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="var(--line)" strokeWidth="5" />
      <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} transform="rotate(-90 28 28)" />
      <text x="28" y="32" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="15" fontWeight="700" fill={color}>{pct}</text>
    </svg>
  )
}

/* ── 关键词高亮渲染（含简单词形后缀 + 模糊回退，移植 findKey/renderBody）── */
function findKey(token: string, keyWords: string[]): string | null {
  const w = token.toLowerCase().replace(/[^a-z]/g, '')
  if (!w) return null
  if (keyWords.includes(w)) return w
  for (const k of keyWords) {
    if (w.startsWith(k) && w.length - k.length <= 3) return k
    if (k.length >= 5 && w.startsWith(k.slice(0, -1)) && w.length - k.length <= 3) return k
  }
  return null
}
function Paragraph({ text, keyWords, seen, onPick }: { text: string; keyWords: string[]; seen: Set<string>; onPick: (s: string) => void }) {
  const nodes = useMemo(() => {
    if (!keyWords.length) return [text]
    const kws = [...keyWords].sort((x, y) => y.length - x.length)
    const alt = kws.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:s|es|ed|d|ing|ly)?').join('|')
    const re = new RegExp('\\b(' + alt + ')\\b', 'gi')
    const out: React.ReactNode[] = []
    let last = 0, m: RegExpExecArray | null, key = 0
    re.lastIndex = 0
    while ((m = re.exec(text))) {
      if (m.index > last) out.push(text.slice(last, m.index))
      const slug = findKey(m[0], keyWords)
      if (slug) {
        const s = slug
        out.push(
          <span key={key++} className={`rd-kw ${seen.has(s) ? 'seen' : ''}`} role="button" tabIndex={0} onClick={() => onPick(s)}>{m[0]}</span>
        )
      } else out.push(m[0])
      last = m.index + m[0].length
    }
    if (last < text.length) out.push(text.slice(last))
    return out
  }, [text, keyWords, seen, onPick])
  return <p>{nodes}</p>
}

/* ── 查词浮层（reading.css .rd-pop；真实词典 + ensureWord('reading')）── */
function WordPopup({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [dict, setDict] = useState<DictionaryWord | null | 'loading'>('loading')
  const inStore = useLexiStore(s => s.words.find(w => w.id === slug))
  const [added, setAdded] = useState(false)
  useEffect(() => {
    let cancel = false
    speak(slug)
    fetch(`/api/dictionary/word/${encodeURIComponent(slug)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (!cancel) setDict(j?.data ?? null) })
      .catch(() => { if (!cancel) setDict(null) })
    return () => { cancel = true }
  }, [slug])
  const def = dict !== 'loading' && dict ? dict.definitions?.[0] : null
  const ex = dict !== 'loading' && dict ? dict.examples?.[0] : null
  const done = !!inStore || added
  return (
    <div className="rd-pop-mask" style={{ position: 'fixed', inset: 0, zIndex: 70 }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="rd-pop" role="dialog">
        <div className="rd-pop-grip" />
        <div className="rd-pop-head">
          <span className="rd-pop-word">{slug}</span>
          {dict !== 'loading' && dict?.phoneticIpa && <span className="rd-pop-ipa">{dict.phoneticIpa}</span>}
          {dict !== 'loading' && dict?.partOfSpeech && <span className="rd-pop-pos">{dict.partOfSpeech}</span>}
          <button className="rd-pop-sound" title="朗读" onClick={() => speak(slug)}><Ico d={I.sound} sz={15} /></button>
          <button className="rd-pop-x" onClick={onClose}>✕</button>
        </div>
        {dict === 'loading' ? (
          <div className="rd-pop-defzh">查询词典中…</div>
        ) : dict ? (
          <>
            <div className="rd-pop-defzh">{def?.definitionZh ?? def?.definitionEn ?? '（暂无释义）'}</div>
            {def?.definitionEn && def.definitionZh && <div className="rd-pop-defen">{def.definitionEn}</div>}
            {ex?.sentenceEn && (
              <div className="rd-pop-ex">
                <div className="rd-pop-ex-en">{ex.sentenceEn}</div>
                {ex.sentenceZh && <div className="rd-pop-ex-zh">{ex.sentenceZh}</div>}
              </div>
            )}
            <div className="rd-pop-acts">
              <button className={`rd-pop-add ${done ? 'done' : ''}`} onClick={() => {
                if (done) return
                const lexi = useLexiStore.getState()
                lexi.ensureWord(dict, 'reading')
                lexi.recordActivity('learned')
                lexi.markActivityDone('pick')
                setAdded(true)
              }}>{done ? <><Ico d={I.check} sz={14} /> {added ? '已加入学习' : '已在学习库'}</> : '+ 加入学习'}</button>
              <a className="rd-pop-detail" href={`/dictionary?word=${slug}`}>词详情 <Ico d={I.arrow} sz={16} /></a>
            </div>
          </>
        ) : (
          <div className="rd-pop-defzh">（词典暂无此词）</div>
        )}
      </div>
    </div>
  )
}

/* ── 状态块 ── */
function StateBlock({ icon, title, desc, actions }: { icon: React.ReactNode; title: string; desc: string; actions?: { label: string; primary?: boolean; onClick: () => void }[] }) {
  return (
    <div className="rd-state">
      <div className="rd-state-icon"><Ico d={icon} sz={24} sw={1.6} /></div>
      <div className="rd-state-title">{title}</div>
      <div className="rd-state-desc">{desc}</div>
      {actions?.length ? (
        <div className="rd-state-acts">
          {actions.map((a, i) => <button key={i} className={`rd-btn ${a.primary ? 'rd-btn-ink' : 'rd-btn-ghost'}`} onClick={a.onClick}>{a.label}</button>)}
        </div>
      ) : null}
    </div>
  )
}

export function ReadingScreen() {
  const words = useLexiStore(s => s.words)
  const [items, setItems] = useState<ListItem[]>([])
  const [listUi, setListUi] = useState<Ui>('loading')
  const [level, setLevel] = useState<'all' | number | 'review'>('all')
  const [results, setResults] = useState<Record<string, RResult>>({})

  const [view, setView] = useState<'list' | 'reading'>('list')
  const [detail, setDetail] = useState<Detail | null>(null)
  const [detailUi, setDetailUi] = useState<Ui>('ready')
  const [seen, setSeen] = useState<Set<string>>(new Set())
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [answered, setAnswered] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [popup, setPopup] = useState<string | null>(null)

  useEffect(() => { setResults(loadResults()) }, [])

  const loadList = useCallback(() => {
    setListUi('loading')
    fetch('/api/reading')
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        const data = (j?.data ?? []) as ListItem[]
        setItems(data)
        setListUi(data.length ? 'ready' : 'empty')
      })
      .catch(() => setListUi('error'))
  }, [])
  useEffect(() => { loadList() }, [loadList])

  const isDone = (id: string) => !!results[id]
  const hasWrong = (id: string) => { const r = results[id]; return !!r && r.pct < 100 }
  const reviewItems = useMemo(() => items.filter(a => hasWrong(a.id)), [items, results]) // eslint-disable-line react-hooks/exhaustive-deps

  const stateOf = useMemo(() => new Map(words.map(w => [w.id, w.state])), [words])
  // 生词率 = 难度底数（按词频稀有度，各篇不同）× (1 − 你已掌握占比)；随学习递减
  const newRateOf = (it: ListItem) => {
    const kw = it.keyWords
    if (!kw.length) return it.difficulty ?? 0
    const masteredFrac = kw.filter(k => stateOf.get(k) === 'mastered').length / kw.length
    const base = it.difficulty ?? Math.round(kw.filter(k => stateOf.get(k) !== 'mastered').length / kw.length * 100)
    return Math.round(base * (1 - masteredFrac))
  }

  const filtered = useMemo(() => {
    if (level === 'review') return reviewItems
    return items.filter(a => level === 'all' || a.level === level)
  }, [items, level, reviewItems])

  /* ── 打开文章 ── */
  const openArticle = useCallback((id: string) => {
    setView('reading'); setDetail(null); setDetailUi('loading')
    setAnswered({}); setSubmitted(false); setSeen(new Set()); setAdded(new Set())
    window.scrollTo({ top: 0 })
    fetch(`/api/reading?id=${encodeURIComponent(id)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        const d = j?.data as Detail | null
        if (!d) { setDetailUi('error'); return }
        setDetail(d); setDetailUi(d.paragraphs.length ? 'ready' : 'empty')
      })
      .catch(() => setDetailUi('error'))
  }, [])

  const backToList = () => { setView('list'); setDetail(null) }
  const pickWord = (slug: string) => { setSeen(prev => new Set(prev).add(slug)); setPopup(slug) }

  /* ── 提交理解题 ── */
  const submitQuiz = () => {
    if (!detail) return
    const total = detail.questions.length
    const correct = detail.questions.filter(q => answered[q.id] === q.answer).length
    const wrong = detail.questions.filter(q => answered[q.id] !== q.answer).map(q => q.id)
    const res: RResult = { correct, total, pct: total ? Math.round(correct / total * 100) : 0, wrong, ts: Date.now() }
    const next = { ...results, [detail.id]: res }
    setResults(next); saveResults(next); setSubmitted(true)
    const lexi = useLexiStore.getState()
    lexi.markActivityDone('reading'); lexi.markActivityDone('article')
    setTimeout(() => document.getElementById('rd-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }

  /* ════════════════ 列表视图 ════════════════ */
  function renderList() {
    const total = items.length
    const doneN = items.filter(a => isDone(a.id)).length
    const avgRate = total ? Math.round(items.reduce((s, a) => s + newRateOf(a), 0) / total) : 0
    const reviewN = reviewItems.length
    const chips: ([('all' | number | 'review'), string])[] = [['all', '全部'], ...([1, 2, 3, 4, 5, 6, 7] as number[]).map(n => [n, LV[n]] as [number, string])]

    let body: React.ReactNode
    if (listUi === 'loading') {
      body = <>{Array.from({ length: 4 }).map((_, i) => (
        <div className="rd-skel-card" key={i}>
          <div className="col"><div className="rd-skel" style={{ width: '62%', height: 18 }} /><div className="rd-skel" style={{ width: '40%', height: 13 }} /><div className="rd-skel" style={{ width: '74%', height: 11 }} /></div>
          <div className="rd-skel" style={{ width: 60, height: 46 }} />
        </div>
      ))}</>
    } else if (listUi === 'error') {
      body = <StateBlock icon={I.alert} title="没能加载文章列表" desc="网络好像开了点小差。检查连接后重试一次。" actions={[{ label: '重新加载', primary: true, onClick: loadList }]} />
    } else if (!filtered.length) {
      body = level === 'review'
        ? <StateBlock icon={I.check} title="没有待复读的篇目" desc="错题都巩固完啦。继续读新文章，做错的会自动回到这里等你复读。" actions={[{ label: '查看全部', primary: true, onClick: () => setLevel('all') }]} />
        : <StateBlock icon={I.inbox} title="这一档暂时没有文章" desc="换一个难度档试试，或回到「全部」查看所有精读篇目。" actions={[{ label: '查看全部', primary: true, onClick: () => setLevel('all') }]} />
    } else {
      body = <div className="rd-list">{filtered.map(a => {
        const done = isDone(a.id); const r = results[a.id]; const wrong = done && r.pct < 100
        const nr = newRateOf(a)
        return (
          <button className={`rd-card${wrong ? ' has-wrong' : ''}`} key={a.id} onClick={() => openArticle(a.id)}>
            <span className="rd-card-main">
              <span className="rd-card-toprow">
                <span className="rd-lvl">{LV[a.level]}</span>
                <span className="rd-card-title">{a.title}</span>
                {done && <span className="rd-card-read"><Ico d={I.check} sz={14} /> 已读</span>}
                {wrong && <span className="rd-card-redo"><Ico d={I.replay} sz={12} sw={2.2} /> 待复读</span>}
              </span>
              <span className="rd-card-meta">
                <span><Ico d={I.clock} />{a.minutes} min</span><span className="dot" />
                <span><Ico d={I.quiz} />{a.questionCount} 理解题</span>
                {wrong && <><span className="dot" /><span className="rd-card-wrongtxt">错 {r.wrong.length} 题·可复读</span></>}
              </span>
            </span>
            <span className={`rd-card-rate${done ? ' done' : ''}`}>
              {done
                ? <>{MiniRingEl(r.pct)}<span className="rd-rate-lab">正确率 {r.correct}/{r.total}</span></>
                : <>
                    <span className="rd-rate-num" style={{ color: rateColor(nr) }}>{nr}<small>%</small></span>
                    <span className="rd-rate-lab">生词率</span>
                    <span className="rd-rate-bar"><i style={{ width: `${nr}%`, background: rateColor(nr) }} /></span>
                  </>}
            </span>
          </button>
        )
      })}</div>
    }

    return (
      <div className="rd-wrap">
        <p className="rd-eyebrow">精读 · Graded Reading</p>
        <h1 className="rd-h1">分级精读</h1>
        <p className="rd-sub">按难度分档的短文精读 — 读懂、查词、做理解题，三步把生词变成掌握。点击文中下划线词即可查词入库。</p>
        <div className="rd-statbar">
          <div className="rd-stat"><span className="rd-stat-fig ink">{doneN}<small style={{ fontSize: 14, color: 'var(--ink-muted)' }}>/{total}</small></span><span className="rd-stat-lab">已完成精读</span></div>
          <button className="rd-stat rd-stat-btn" onClick={() => setLevel('review')}><span className="rd-stat-fig" style={{ color: reviewN ? 'var(--rose-ink)' : 'var(--ink-muted)' }}>{reviewN}</span><span className="rd-stat-lab">待复读·有错题{reviewN ? ' →' : ''}</span></button>
          <div className="rd-stat"><span className="rd-stat-fig gold">{avgRate}%</span><span className="rd-stat-lab">平均生词率</span></div>
        </div>
        <div className="rd-chips">
          {chips.map(([k, label]) => {
            const cnt = k === 'all' ? items.length : items.filter(a => a.level === k).length
            return <button key={String(k)} className={`rd-chip ${String(level) === String(k) ? 'on' : ''}`} onClick={() => setLevel(k)}>{label}<span className="cnt">{cnt}</span></button>
          })}
          <button className={`rd-chip review ${level === 'review' ? 'on' : ''}`} onClick={() => setLevel('review')}><Ico d={I.replay} sz={12} sw={2.2} /> 待复读<span className="cnt">{reviewN}</span></button>
        </div>
        {body}
      </div>
    )
  }

  function MiniRingEl(pct: number) { return <MiniRing pct={pct} color={scoreColor(pct)} /> }

  /* ════════════════ 阅读视图 ════════════════ */
  function renderReading() {
    if (detailUi === 'loading') {
      return <div className="rd-wrap narrow"><button className="rd-back" onClick={backToList}><Ico d={I.back} sz={16} sw={2.5} /> 返回列表</button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 30 }}>
          {['38%', '82%', '96%', '90%', '60%', '0', '88%', '94%', '70%'].map((w, i) => w === '0' ? <div key={i} style={{ height: 10 }} /> : <div key={i} className="rd-skel" style={{ height: 16, width: w }} />)}
        </div></div>
    }
    if (detailUi === 'error' || !detail) {
      return <div className="rd-wrap narrow"><button className="rd-back" onClick={backToList}><Ico d={I.back} sz={16} sw={2.5} /> 返回列表</button>
        <StateBlock icon={I.alert} title="正文加载失败" desc="这篇文章的正文没能取到。返回列表稍后再试，或重新加载。" actions={[{ label: '重新加载', primary: true, onClick: () => openArticle(detail?.id ?? '') }, { label: '返回列表', onClick: backToList }]} /></div>
    }
    const a = detail
    const prev = results[a.id]
    const seenCount = a.keyWords.filter(k => seen.has(k)).length
    const total = a.questions.length
    const nAnswered = Object.keys(answered).length
    const correct = a.questions.filter(q => answered[q.id] === q.answer).length

    return (
      <div className="rd-wrap narrow">
        <button className="rd-back" onClick={backToList}><Ico d={I.back} sz={16} sw={2.5} /> 返回列表</button>
        <p className="rd-read-meta"><span className="lv">{LV[a.level]}</span> · {a.minutes} min read · {a.keyWords.length} key words</p>
        <h1 className="rd-read-title">{a.title}</h1>
        {a.titleZh && <div className="rd-read-zh">{a.titleZh}</div>}
        {prev && prev.pct < 100 && (
          <div className="rd-redo-banner"><Ico d={I.replay} sz={12} sw={2.2} /><span>上次得分 <b>{prev.correct}/{prev.total}</b> · 重读一遍，把错的 <b>{prev.wrong.length}</b> 题巩固掉 <Ico d={I.arrowDown} sz={16} sw={2.4} /></span></div>
        )}
        {detailUi === 'empty' || !a.paragraphs.length ? (
          <StateBlock icon={I.inbox} title="正文整理中" desc="这篇短文的正文还在录入。先去读其它已就绪的篇目吧。" actions={[{ label: '返回列表', primary: true, onClick: backToList }]} />
        ) : (
          <>
            <div className="rd-read-hint"><Ico d={I.book} /><span>点击<b style={{ margin: '0 3px' }}>下划线</b>词即可查词、加入学习</span></div>
            <div className="rd-body">{a.paragraphs.map((p, i) => <Paragraph key={i} text={p} keyWords={a.keyWords} seen={seen} onPick={pickWord} />)}</div>
            <div className="rd-readcta">
              <span className="rd-readcta-info">本篇 <b>{a.keyWords.length}</b> 个词典词 · 已查 <b>{seenCount}</b></span>
              <button className="rd-btn rd-btn-primary" onClick={() => document.getElementById('rd-quizsec')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>读完，做理解题 <Ico d={I.arrowDown} sz={16} sw={2.4} /></button>
            </div>
            {/* 理解题 */}
            <div className="rd-quizsec" id="rd-quizsec">
              <div className="rd-quizsec-head">
                <span className="rd-q-kicker">理解题 · 检验理解</span>
                <span className="rd-quizsec-prog">{submitted ? <>已答 <b>{total}</b>/{total} · 答对 <b style={{ color: 'var(--teal-ink)' }}>{correct}</b></> : <>已选 <b>{nAnswered}</b>/{total}</>}</span>
              </div>
              {total === 0 ? (
                <StateBlock icon={I.inbox} title="本篇暂无理解题" desc="这篇短文还没有配套的理解题，可作为查词精读使用。" />
              ) : (
                <>
                  <div className="rd-quizsec-bar"><i style={{ width: `${Math.round((submitted ? total : nAnswered) / total * 100)}%` }} /></div>
                  {a.questions.map((item, i) => {
                    const picked = answered[item.id]
                    return (
                      <div className="rd-qcard" key={item.id}>
                        <div className="rd-qcard-idx">第 {i + 1} 题<span> / {total}</span></div>
                        <div className="rd-q-prompt">{item.prompt}</div>
                        {item.promptZh && <div className="rd-q-promptzh">{item.promptZh}</div>}
                        <div className="rd-choices">
                          {item.choices.map(c => {
                            let cls = 'rd-choice'
                            if (submitted) cls += c.id === item.answer ? ' correct' : (c.id === picked ? ' wrong' : ' dim')
                            else if (c.id === picked) cls += ' selected'
                            const mark = submitted && c.id === item.answer ? <Ico d={I.check} sz={14} /> : (submitted && c.id === picked ? <Ico d={I.x} sz={14} /> : null)
                            return (
                              <button key={c.id} className={cls} disabled={submitted} onClick={() => { if (!submitted) setAnswered(p => ({ ...p, [item.id]: c.id })) }}>
                                <span className="rd-choice-key">{c.id.toUpperCase()}</span>
                                <span className="rd-choice-txt">{c.text}</span>
                                <span className="rd-choice-mark">{mark}</span>
                              </button>
                            )
                          })}
                        </div>
                        {submitted && picked != null && (
                          <div className="rd-explain-slot"><div className="rd-explain">
                            <div className={`rd-explain-tag ${picked === item.answer ? 'ok' : 'no'}`}>{picked === item.answer ? <><Ico d={I.check} sz={14} /> 回答正确</> : <><Ico d={I.x} sz={14} /> 回答错误 · 正确答案 {item.answer.toUpperCase()}</>}</div>
                            <div className="rd-explain-txt">{item.explanationZh || ''}</div>
                          </div></div>
                        )}
                      </div>
                    )
                  })}
                  {!submitted && (
                    <div className="rd-quiz-submit"><button className="rd-btn rd-btn-primary" disabled={nAnswered < total} onClick={submitQuiz}>{nAnswered < total ? `还剩 ${total - nAnswered} 题未选` : <>提交答案 · 查看结果 <Ico d={I.arrow} sz={16} sw={2.4} /></>}</button></div>
                  )}
                  {submitted && renderSummary(a)}
                </>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  function renderSummary(a: Detail) {
    const total = a.questions.length
    const correct = a.questions.filter(q => answered[q.id] === q.answer).length
    const pct = total ? Math.round(correct / total * 100) : 0
    const mastery = pct >= 80 ? '熟练掌握' : pct >= 60 ? '基本掌握' : '需要复读'
    const mColor = scoreColor(pct)
    const idx = items.findIndex(x => x.id === a.id)
    const next = items[idx + 1]
    const C = 2 * Math.PI * 46, off = C * (1 - pct / 100)
    const addedN = added.size || a.keyWords.filter(k => seen.has(k)).length
    return (
      <div className="rd-summary" id="rd-summary">
        <div className="rd-sum-ring">
          <svg width="120" height="120">
            <circle cx="60" cy="60" r="46" fill="none" stroke="var(--line)" strokeWidth="8" />
            <circle cx="60" cy="60" r="46" fill="none" stroke={mColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} transform="rotate(-90 60 60)" />
            <text x="60" y="57" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="27" fontWeight="700" fill={mColor}>{correct}<tspan fontSize="15" fill="var(--ink-muted)">/{total}</tspan></text>
            <text x="60" y="75" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-muted)">答对</text>
          </svg>
        </div>
        <div className="rd-sum-title">{a.titleZh || a.title} · 完成</div>
        <div className="rd-sum-sub">理解题已全部作答 · 可向上滚动重读原文</div>
        <div className="rd-sum-stats">
          <div className="rd-sum-stat"><div className="fig">{pct}%</div><div className="lab">正确率</div></div>
          <div className="rd-sum-stat"><div className="fig" style={{ color: mColor }}>{mastery}</div><div className="lab">掌握度</div></div>
          <div className="rd-sum-stat"><div className="fig gold">{addedN}</div><div className="lab">{added.size ? '新加入学习' : '本篇已查词'}</div></div>
        </div>
        <div className="rd-sum-acts">
          {next && <button className="rd-btn rd-btn-primary" onClick={() => openArticle(next.id)}>下一篇：{next.titleZh || next.title} <Ico d={I.arrow} sz={16} sw={2.4} /></button>}
          <button className="rd-btn rd-btn-ghost" onClick={backToList}>回到列表</button>
        </div>
      </div>
    )
  }

  return (
    <div className="rd rd-embed theme-light">
      {view === 'list' ? renderList() : renderReading()}
      {popup && <WordPopup slug={popup} onClose={() => setPopup(null)} />}
    </div>
  )
}
