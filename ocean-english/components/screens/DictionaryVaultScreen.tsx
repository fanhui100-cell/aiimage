'use client'

/* ════════════════════════════════════════════════════════════════════════
   界面优化5 · 词库 LexiVault 合并页（1:1 自 词库.html）—— 词库 + 词详情 + 知识库 三合一
   · ?word=<slug> 定位该词；无参数按风险排序默认选第一个；切词 router.replace(scroll:false)
   · 数据真实：词条 /api/dictionary/word + relations；学习态/SRS/遗忘曲线/记忆面板/出处 接 lexiStore
   · 顶栏由 AppShell 提供；浮动工具条（找词→词脊面板 / 词库目录抽屉）+ 底部放大坞
   ════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLexiStore, type WordEntry } from '@/store/lexiStore'
import { STATE_META, type WordState } from '@/lib/state-meta'
import { speakSmart } from '@/lib/pronunciation/word-audio'
import type { DictionaryWord } from '@/lib/dictionary/dictionary-types'
import { LEVEL_NAMES, MAX_LEVEL } from '@/lib/levels'
import './dictionary-vault.css'

const DAY = 86_400_000
// LEVEL_NAMES / MAX_LEVEL 由 lib/levels.ts 单源派生（含第 8 档雅思）；按等级 chips/计数随数据自动扩
const LEVELS_ALL = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1)
const speak = (t: string, accent: 'US' | 'UK' = 'US') => { void speakSmart(t, accent === 'UK' ? 'uk' : 'us') }
const isFav = (id: string) => { try { return localStorage.getItem('lv-fav-' + id) === '1' } catch { return false } }

// ── 真实 SRS 推导（艾宾浩斯 R=e^(−t/S)）──
function masteryOf(e?: WordEntry): number {
  if (!e) return 0.05
  if (e.state === 'mastered') return 1
  if (e.state === 'unknown' || e.state === 'recommended' || e.state === 'locked') return 0.05
  const interval = e.interval ?? 0, streak = e.streak ?? 0
  if (e.state === 'weak') return Math.min(0.45, 0.2 + streak * 0.08)
  if (e.state === 'review') return Math.min(0.92, 0.5 + interval * 0.04)
  return Math.min(0.8, 0.3 + streak * 0.12)
}
function stabilityOf(e?: WordEntry): number { return Math.max(0.6, (e?.interval ?? 1) * (e?.ease ?? 2.5) * 0.5) }
function retentionOf(e?: WordEntry): number | null {
  if (!e || e.lastReviewedAt == null) return null
  return Math.exp(-Math.max(0, (Date.now() - e.lastReviewedAt) / DAY) / stabilityOf(e))
}
function riskOf(e?: WordEntry): number {
  const ms = masteryOf(e), R = retentionOf(e)
  return Math.max(0.02, Math.min(0.99, Math.max(R === null ? (1 - ms * 0.55) : (1 - R), (1 - ms) * 0.6)))
}
function riskColor(r: number): string { return r > 0.6 ? 'var(--rose-ink)' : r > 0.4 ? 'var(--gold-ink)' : 'var(--teal-ink)' }
function isDue(e?: WordEntry): boolean { return !!(e && e.nextReviewAt != null && e.nextReviewAt <= Date.now()) }
function reviewLabel(ts?: number | null): string {
  if (ts == null) return '未排期'
  const now = Date.now()
  if (ts <= now) return '已到期'
  const d = Math.ceil((ts - now) / DAY)
  return d === 1 ? '明天到期' : `${d} 天后`
}
const SOURCE_META: Record<string, { zh: string; accent: string }> = {
  dictionary: { zh: '词典', accent: '#2f6db0' }, memory: { zh: '复习', accent: '#2f9bd6' },
  wrong: { zh: '错题', accent: '#bf4a30' }, scan: { zh: '扫描', accent: '#b3781f' }, reading: { zh: '阅读', accent: '#6d4bc4' },
}

const FORM_ZH: Record<string, string> = { plural: '复数', past: '过去式', pastParticiple: '过去分词', presentParticiple: '现在分词', third: '三单', comparative: '比较级', superlative: '最高级', gerund: '动名词' }
function ruleForms(word: string, pos: string): [string, string][] {
  const b = word, p = (pos || '').toLowerCase()
  if (/^v|vt|vi|v\./.test(p)) {
    const third = /(s|x|z|ch|sh)$/.test(b) ? b + 'es' : /[^aeiou]y$/.test(b) ? b.slice(0, -1) + 'ies' : b + 's'
    const past = /e$/.test(b) ? b + 'd' : /[^aeiou]y$/.test(b) ? b.slice(0, -1) + 'ied' : b + 'ed'
    const ing = /e$/.test(b) && !/ee$/.test(b) ? b.slice(0, -1) + 'ing' : b + 'ing'
    return [['三单', third], ['过去式', past], ['现在分词', ing]]
  }
  if (/^n|n\./.test(p)) return [['复数', /(s|x|z|ch|sh)$/.test(b) ? b + 'es' : /[^aeiou]y$/.test(b) ? b.slice(0, -1) + 'ies' : b + 's']]
  if (/adj/.test(p)) {
    if (b.length <= 7 && !/(ous|ful|ive|ic|al|able|ent|ant)$/.test(b)) {
      const c = /e$/.test(b) ? b + 'r' : /[^aeiou]y$/.test(b) ? b.slice(0, -1) + 'ier' : b + 'er'
      const s = /e$/.test(b) ? b + 'st' : /[^aeiou]y$/.test(b) ? b.slice(0, -1) + 'iest' : b + 'est'
      return [['比较级', c], ['最高级', s]]
    }
    return [['比较级', 'more ' + b], ['最高级', 'most ' + b]]
  }
  return []
}

function hl(sentence: string, word: string): ReactNode[] {
  if (!sentence) return [sentence]
  const re = new RegExp('(' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\w*)', 'ig')
  const parts: ReactNode[] = []; let last = 0; let m: RegExpExecArray | null; let k = 0
  while ((m = re.exec(sentence))) { parts.push(sentence.slice(last, m.index)); parts.push(<b key={k++}>{m[0]}</b>); last = m.index + m[0].length }
  parts.push(sentence.slice(last)); return parts
}

const I = {
  speak: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /></svg>,
  bolt: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z" /></svg>,
  arrow: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>,
  link: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8" /></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  grid: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  vault: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M9 4v16" /></svg>,
  chev: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18" /></svg>,
  play: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>,
  review: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v5h-5" /></svg>,
  quiz: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4h6v2H9z" /><path d="M8.5 13l2.2 2.2L15.5 11" /></svg>,
  graph: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6.5" r="2.2" /><circle cx="18" cy="7.5" r="2.2" /><circle cx="12" cy="17.5" r="2.2" /><path d="M8 7.4l3 8.4M15.9 9l-2.7 6.8" /></svg>,
  pilot: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1 5.1-2.1z" /></svg>,
  cosmos: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4.6" /><path d="M5.5 6.5C3.4 8.6 2.4 10.7 3 11.7c1 1.7 6 .4 11-2.7s8-7 7-8.2c-.6-.8-2.6-.4-5 .8" /></svg>,
  add: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>,
}

type RelNode = { id: string | null; label: string; sub: string; rel: 'syn' | 'ant' | 'confused' | 'form' }

export function DictionaryVaultScreen() {
  const router = useRouter()
  const params = useSearchParams()
  const words = useLexiStore(s => s.words)
  const wrongAnswers = useLexiStore(s => s.wrongAnswers)
  const ensureWord = useLexiStore(s => s.ensureWord)
  const recordActivity = useLexiStore(s => s.recordActivity)
  const addToReview = useLexiStore(s => s.addToReview)
  const getDue = useLexiStore(s => s.getDue)

  const defaultSlug = useMemo(() => {
    const sorted = [...words].sort((a, b) => riskOf(b) - riskOf(a))
    return sorted[0]?.word?.toLowerCase() ?? 'serendipity'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const slug = (params.get('word') || defaultSlug).toLowerCase()

  const [word, setWord] = useState<DictionaryWord | null>(null)
  const [loading, setLoading] = useState(true)
  const [accent, setAccent] = useState<'US' | 'UK'>('US')
  const [drawer, setDrawer] = useState(false)
  const [palette, setPalette] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [rels, setRels] = useState<RelNode[]>([])
  const [note, setNoteState] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)
  const [fav, setFav] = useState(false)
  const [dictTotal, setDictTotal] = useState(0)
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2000) }

  const entry = words.find(w => w.id === slug || w.word.toLowerCase() === slug)
  const wrongSet = useMemo(() => new Set(wrongAnswers.map(w => (w.word || '').toLowerCase())), [wrongAnswers])

  // 全部词库真实总数（整本字典；best-effort，失败回退到本地库数）
  useEffect(() => {
    let cancelled = false
    fetch('/api/dictionary/search?q=&limit=1')
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (!cancelled && typeof j?.total === 'number' && j.total > 0) setDictTotal(j.total) })
      .catch(() => { /* 回退本地库数 */ })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/dictionary/word/${encodeURIComponent(slug)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(j => { if (!cancelled) { setWord((j?.data as DictionaryWord) ?? null); setLoading(false) } })
      .catch(() => { if (!cancelled) { setWord(null); setLoading(false) } })
    setFav(isFav(slug))
    try { setNoteState(localStorage.getItem('lv-note-' + slug) || '') } catch { setNoteState('') }
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return () => { cancelled = true }
  }, [slug])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/dictionary/relations?word=${encodeURIComponent(slug)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (cancelled) return
        const wmap = (j?.data?.words ?? {}) as Record<string, { word: string; zh: string }>
        const rel = (j?.data?.relations ?? []) as { a: string; b: string; type?: string }[]
        const relKind = (t: string): RelNode['rel'] => /ant/i.test(t) ? 'ant' : /confus/i.test(t) ? 'confused' : 'syn'
        const out: RelNode[] = []
        for (const r of rel) {
          const other = r.a === slug ? r.b : r.b === slug ? r.a : null
          if (!other || out.some(n => n.id === other)) continue
          out.push({ id: other, label: wmap[other]?.word ?? other, sub: (wmap[other]?.zh ?? '').split('；')[0], rel: relKind(r.type ?? '') })
        }
        setRels(out.slice(0, 5))
      })
      .catch(() => { /* none */ })
    return () => { cancelled = true }
  }, [slug])

  const setCur = (id: string) => { router.replace(`/dictionary?word=${encodeURIComponent(id.toLowerCase())}`, { scroll: false }); setDrawer(false); setPalette(false) }
  const jump = (label: string) => setCur(label.toLowerCase().trim())

  const onNote = (v: string) => {
    setNoteState(v)
    try { if (v) localStorage.setItem('lv-note-' + slug, v); else localStorage.removeItem('lv-note-' + slug) } catch { /* ignore */ }
    setNoteSaved(true)
    if (noteTimer.current) clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(() => setNoteSaved(false), 1200)
  }
  const toggleFav = () => { const v = !fav; setFav(v); try { localStorage.setItem('lv-fav-' + slug, v ? '1' : '') } catch { /* ignore */ }; flash(v ? '已收藏' : '已取消收藏') }

  // 派生视图字段
  const state: WordState = entry?.state ?? 'unknown'
  const stMeta = STATE_META[state]
  const inLib = state !== 'unknown' && state !== 'recommended' && state !== 'locked'
  const ms = Math.round(masteryOf(entry) * 100)
  const risk = riskOf(entry)
  const wordStr = word?.word ?? slug
  const pos = word?.partOfSpeech ?? word?.definitions?.[0]?.partOfSpeech ?? ''
  const defZh = word?.definitions?.[0]?.definitionZh ?? ''
  const synonyms = word?.synonyms ?? []
  const antonyms = word?.antonyms ?? []
  const collocations = (word?.collocations ?? []).map(c => c.phrase).filter(Boolean)
  const mnemonic = word?.mnemonics?.find(m => m.style === 'standard')?.mnemonicZh ?? word?.mnemonics?.[0]?.mnemonicZh ?? word?.mnemonics?.[0]?.mnemonicEn ?? ''
  const etymology = word?.etymology ? (word.etymology.explanationZh || word.etymology.explanationEn || word.etymology.roots || '') : ''
  const examTags = word?.examTags ?? []
  const lvName = LEVEL_NAMES[word?.primaryLevel ?? 0] || ''
  const tags = [lvName, word?.cefrLevel ?? '', ...examTags.slice(0, 2)].filter(Boolean)
  const ex0 = (word?.examples ?? []).find(e => e.sentenceEn)
  const formEntries = word ? (Object.entries(word.inflections ?? {}).filter(([, v]) => v) as [string, string][]).map(([k, v]) => [FORM_ZH[k] ?? k, v] as [string, string]) : []
  const forms = formEntries.length ? formEntries : (word ? ruleForms(wordStr, pos) : [])
  const nuance = (word?.nuance ?? []).filter(n => n.member && n.nuanceZh)

  // 出处（记忆面板热度 + 链接提及）—— 真实信号派生（直接计算，避免对可变 entry 做 memo）
  const backlinks = (() => {
    const out: { src: string; note: string }[] = []
    out.push({ src: 'dictionary', note: fav ? '词典收藏 · 已收藏' : '词典词条 · 已收录' })
    if (entry?.source === 'scan') out.push({ src: 'scan', note: '扫描导入' })
    if (entry?.source === 'reading') out.push({ src: 'reading', note: '阅读收藏' })
    if (entry?.nextReviewAt != null) out.push({ src: 'memory', note: `复习队列 · ${reviewLabel(entry.nextReviewAt)} · 第 ${entry.streak ?? 0} 次` })
    if (wrongSet.has(slug)) out.push({ src: 'wrong', note: `错题本 · 「${wordStr}」` })
    return out
  })()
  const heat = (() => {
    const c: Record<string, number> = {}
    backlinks.forEach(b => { c[b.src] = (c[b.src] || 0) + 1 })
    const max = Math.max(1, ...Object.values(c))
    return { entries: Object.entries(c).sort((a, b) => b[1] - a[1]), max }
  })()

  // 词图节点：关系 API（带中文，含易混）+ 词条自身近义/反义 + 词形变化，最多 5 个
  const graphNodes = (() => {
    const list: RelNode[] = []
    const seen = new Set<string>()
    for (const r of rels) { const key = (r.id || r.label).toLowerCase(); if (!seen.has(key)) { seen.add(key); list.push(r) } }
    for (const s of synonyms) { const id = s.toLowerCase(); if (!seen.has(id) && list.length < 4) { seen.add(id); list.push({ id, label: s, sub: '近义词', rel: 'syn' }) } }
    for (const a of antonyms) { const id = a.toLowerCase(); if (!seen.has(id) && list.length < 4) { seen.add(id); list.push({ id, label: a, sub: '反义词', rel: 'ant' }) } }
    forms.slice(0, 2).forEach(f => list.push({ id: null, label: f[1], sub: f[0], rel: 'form' }))
    return list.slice(0, 5)
  })()

  const onAdd = () => { if (word) { ensureWord(word, 'lookup'); recordActivity('learned'); flash('已加入学习 · ' + wordStr) } }
  const onReview = () => { if (entry) { addToReview(entry.id); flash('已加入今日复习') } else onAdd() }
  const dock = (k: string) => {
    const back = encodeURIComponent(`/dictionary?word=${slug}`)
    switch (k) {
      case 'review': return onReview()
      case 'quiz': return router.push(`/quiz?word=${encodeURIComponent(slug)}&returnTo=${back}`)
      case 'graph': return router.push(`/lexigraph?word=${encodeURIComponent(slug)}&returnTo=${back}`)
      case 'pilot': return router.push(`/chat?word=${encodeURIComponent(slug)}&returnTo=${back}`)
      case 'cosmos': return router.push(`/lexiverse?word=${encodeURIComponent(slug)}&returnTo=${back}`)
    }
  }

  const GW = 344, GH = 300, gcx = GW / 2, gcy = GH / 2, gR = Math.min(GW * 0.34, GH * 0.40)
  const RC: Record<string, string> = { syn: 'var(--teal-ink)', ant: 'var(--rose-ink)', confused: 'var(--gold-ink)', form: 'var(--gold-ink)' }
  const gpoints = graphNodes.map((n, i) => {
    const a = -Math.PI / 2 + (i + 0.5) / Math.max(1, graphNodes.length) * 6.283
    const x = gcx + Math.cos(a) * gR, y = gcy + Math.sin(a) * gR * 0.96
    return { n, x, y, mx: (gcx + x) / 2, my: (gcy + y) / 2, col: RC[n.rel] }
  })

  const curve = (() => {
    const W = 300, H = 110, pad = 8, S = stabilityOf(entry)
    const span = Math.max(3, Math.min(60, Math.round(S * 2.2)))
    const pts: [number, number][] = []
    for (let i = 0; i <= 40; i++) { const t = i / 40 * span; const R = Math.exp(-t / S); pts.push([pad + t / span * (W - 2 * pad), pad + (1 - R) * (H - 2 * pad)]) }
    const d = 'M' + pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L')
    const area = d + ` L${W - pad},${H - pad} L${pad},${H - pad} Z`
    const elapsed = entry?.lastReviewedAt ? Math.max(0, (Date.now() - entry.lastReviewedAt) / DAY) : 0
    const nx = pad + Math.min(span, elapsed) / span * (W - 2 * pad)
    const R0 = retentionOf(entry) ?? (1 - (entry ? 0.4 : 0.6))
    const ny = pad + (1 - Math.max(0, Math.min(1, R0))) * (H - 2 * pad)
    return { W, H, pad, span, d, area, nx, ny }
  })()

  const FK = (label: string, ex?: ReactNode) => <div className="fk"><span>{label}</span>{ex}</div>

  if (loading && !word) {
    return <div className="lvault"><div className="aurora"><b className="b1" /><b className="b2" /><b className="b3" /></div><div className="canvas"><div className="lv-muted" style={{ padding: 60, textAlign: 'center' }}>载入词条…</div></div></div>
  }

  return (
    <div className="lvault">
      <div className="aurora"><b className="b1" /><b className="b2" /><b className="b3" /></div>

      <div className="pagebar">
        <button className="fb-btn" onClick={() => setPalette(true)} title="在本页词库中找词">{I.search}找词<kbd>⌘K</kbd></button>
        <button className="fb-btn" onClick={() => setDrawer(true)} title="词库目录">{I.grid}词库目录</button>
      </div>

      <div className="canvas">
        {/* Hero */}
        <div className="hero glass">
          <div className="hero-l">
            <div className="hero-top">
              <h1 className="hero-w">{wordStr}</h1>
              <button className={`fav${fav ? ' on' : ''}`} onClick={toggleFav} title="收藏">{fav ? '★' : '☆'}</button>
            </div>
            <div className="hero-ipa">
              {word?.phoneticIpa || ''} {pos && `· ${pos}`}
              <span className="accent-tog"><button className={accent === 'US' ? 'on' : ''} onClick={() => { setAccent('US'); speak(wordStr, 'US') }}>US</button><button className={accent === 'UK' ? 'on' : ''} onClick={() => { setAccent('UK'); speak(wordStr, 'UK') }}>UK</button></span>
              <button className="speak" onClick={() => speak(wordStr, accent)} title="发音">{I.speak}</button>
              <span style={{ color: stMeta.light }}>● {stMeta.zh}</span>
            </div>
            <div className="hero-badges">{tags.map(t => <span key={t}>{t}</span>)}<span>下次 {reviewLabel(entry?.nextReviewAt)}</span></div>
          </div>
          <div className="hero-r">
            <div className="hero-ring">
              <svg width="120" height="120"><circle cx="60" cy="60" r="52" fill="none" stroke="var(--line)" strokeWidth="8" /><circle cx="60" cy="60" r="52" fill="none" stroke={stMeta.light} strokeWidth="8" strokeLinecap="round" strokeDasharray={2 * Math.PI * 52} strokeDashoffset={2 * Math.PI * 52 * (1 - ms / 100)} style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.34,1.56,.64,1)' }} /></svg>
              <div className="pct"><b>{ms}%</b><small>掌握度</small></div>
            </div>
            <button className="hero-cta" onClick={inLib ? onReview : onAdd}>{inLib ? '加入今日复习' : '加入学习库'}</button>
          </div>
        </div>

        {/* 散布卡片（顺序对齐原型：释义 / 词形 / 例句 / 词图 / 遗忘曲线 / 派生词族 / 同义辨析 / 记忆法 / 笔记 / 记忆面板 / 词源 / 链接提及 / AI） */}
        <div className="flow">
          {/* 释义 */}
          <div className="fcard glass">{FK('释义 · Definition')}
            <div className="lv-body"><span className="lv-pos">{pos}</span> <b>{defZh || '该词暂未单独收录，可加入学习库或问领航。'}</b>{synonyms.length > 0 && <> · 近义于 {synonyms.slice(0, 2).join(' / ')}</>}</div>
            {(word?.definitions ?? []).length > 1 && <div className="lv-senses">{word!.definitions.slice(1).map((d, i) => <div className="lv-sense" key={i}><span className="lv-pos">{d.partOfSpeech || pos}</span> {d.definitionZh}</div>)}</div>}
            {ex0 && <div className="lv-callout" style={{ marginTop: 12 }}>{I.bolt}<div>{hl(ex0.sentenceEn, wordStr)}{ex0.sentenceZh && <small>{ex0.sentenceZh}</small>}<button className="lv-exspeak" onClick={() => speak(ex0.sentenceEn, accent)}>{I.speak} 朗读例句</button></div></div>}
          </div>

          {/* 词形变化 */}
          {forms.length > 0 && <div className="fcard glass">{FK('词形变化 · Forms')}<div className="lv-forms">{forms.map(([k, v]) => <span key={k}><i>{k}</i> {v}</span>)}</div></div>}

          {/* 例句 */}
          {ex0 && <div className="fcard glass example">{FK('例句 · In Context')}<div style={{ fontFamily: 'var(--font-news)', fontStyle: 'italic', fontSize: 18, lineHeight: 1.5, color: 'var(--ink)' }}>“{hl(ex0.sentenceEn, wordStr)}”{ex0.sentenceZh && <span style={{ display: 'block', fontStyle: 'normal', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-muted)', marginTop: 8 }}>{ex0.sentenceZh}</span>}</div><button className="lv-exspeak" style={{ marginTop: 8 }} onClick={() => speak(ex0.sentenceEn, accent)}>{I.speak} 朗读例句</button></div>}

          {/* 词图小视角 */}
          <div className="fcard glass graph">{FK('词汇关系图 · LexiGraph', <span className="ex" onClick={() => dock('graph')}>展开完整词图 {I.arrow}</span>)}
            <div className="gp" style={{ height: GH }}>
              <svg className="gp-svg" viewBox={`0 0 ${GW} ${GH}`} preserveAspectRatio="none">
                {gpoints.map((p, i) => <g key={i}><line x1={gcx} y1={gcy} x2={p.x.toFixed(0)} y2={p.y.toFixed(0)} stroke={p.col} strokeWidth="1.6" strokeOpacity="0.7" strokeDasharray={p.n.rel === 'form' ? '3 4' : undefined} /><circle cx={p.mx.toFixed(0)} cy={p.my.toFixed(0)} r="3.4" fill={p.col} /></g>)}
              </svg>
              <div className="gp-brand">⬡ <b>LexiGraph</b> · 词图</div>
              <button className="gp-core" style={{ left: '50%', top: '50%' }}><b>{wordStr}</b><span>{defZh.split('；')[0]}</span></button>
              {gpoints.map((p, i) => <button key={i} className={`gp-card${p.n.rel === 'form' ? ' gp-form' : ''}`} style={{ left: `${(p.x / GW * 100).toFixed(1)}%`, top: `${(p.y / GH * 100).toFixed(1)}%` }} onClick={() => p.n.id && setCur(p.n.id)}><b>{p.n.label}</b><span>{p.n.sub}</span></button>)}
              <div className="gp-legend"><span><i style={{ background: 'var(--teal-ink)' }} />近义</span><span><i style={{ background: 'var(--gold-ink)' }} />词形/派生</span><span><i style={{ background: 'var(--rose-ink)' }} />反义</span></div>
              <button className="gp-open" onClick={() => dock('graph')}>{I.link} 展开完整词图</button>
            </div>
          </div>

          {/* 遗忘曲线 */}
          <div className="fcard glass">{FK('遗忘曲线 · Ebbinghaus', <span style={{ color: riskColor(risk) }}>风险 {Math.round(risk * 100)}%</span>)}
            <div className="lv-curve"><svg viewBox={`0 0 ${curve.W} ${curve.H}`} preserveAspectRatio="none" style={{ width: '100%', height: curve.H }}>
              {[0.25, 0.5, 0.75].map(g => { const y = curve.pad + g * (curve.H - 2 * curve.pad); return <line key={g} x1={curve.pad} y1={y.toFixed(1)} x2={curve.W - curve.pad} y2={y.toFixed(1)} stroke="var(--line)" strokeWidth="1" strokeDasharray="2 4" /> })}
              <path d={curve.area} fill="var(--teal-bg)" /><path d={curve.d} fill="none" stroke="var(--teal-ink)" strokeWidth="2" />
              <line x1={curve.nx.toFixed(1)} y1={curve.pad} x2={curve.nx.toFixed(1)} y2={curve.H - curve.pad} stroke={riskColor(risk)} strokeWidth="1.5" strokeDasharray="3 3" /><circle cx={curve.nx.toFixed(1)} cy={curve.ny.toFixed(1)} r="4" fill={riskColor(risk)} />
            </svg><div className="lv-curve-x"><span>上次复习</span><span>{curve.span} 天后</span></div></div>
            <div className="lv-muted" style={{ fontSize: 11.5, marginTop: 8 }}>保持率随时间衰减；复习一次曲线上提、间隔拉长。</div>
          </div>

          {/* 派生词族 */}
          {(collocations.length > 0 || synonyms.length > 0) && <div className="fcard glass">{FK('派生词族 · Family')}
            {synonyms.length > 0 && <div className="lv-rels" style={{ marginBottom: collocations.length ? 10 : 0 }}>{synonyms.slice(0, 6).map(s => <button key={s} className="lv-wlink" onClick={() => jump(s)}>{I.link}{s}</button>)}</div>}
            {collocations.length > 0 && <div className="lv-collo">{collocations.map(c => <span key={c}>{hl(c, wordStr)}</span>)}</div>}
          </div>}

          {/* 同义辨析 */}
          {(synonyms.length > 0 || nuance.length > 0) && <div className="fcard glass">{FK('同义辨析 · Nuance')}
            <div className="lv-rels">{synonyms.slice(0, 6).map(s => <button key={s} className="lv-wlink" onClick={() => jump(s)}>{s}</button>)}</div>
            {nuance.length > 0 && <div className="lv-nuances">{nuance.map((n, i) => <div className="lv-nuance" key={i}><button className="lv-wlink" onClick={() => jump(n.member)}>{n.member}</button><span>{n.nuanceZh}</span></div>)}</div>}
          </div>}

          {/* 记忆法 */}
          <div className="fcard glass">{FK('记忆法 · Mnemonic')}<div className="lv-callout" style={{ borderColor: 'var(--gold-ink)', background: 'var(--gold-bg)' }}><span style={{ color: 'var(--gold-ink)', width: 14, flexShrink: 0 }}>{I.bolt}</span><div style={{ fontFamily: 'var(--font-sans)' }}><span className="lv-memtag">{etymology ? '词根记忆' : '联想记忆'}</span>{mnemonic || `把 ${wordStr} 拆成熟悉的音节或词根，联想一个画面帮助记忆。`}</div></div></div>

          {/* 我的笔记 */}
          <div className="fcard glass note">{FK('我的笔记 · Note', <span className="note-status">{noteSaved ? '已保存' : ''}</span>)}<textarea className="note-area" value={note} onChange={e => onNote(e.target.value)} placeholder={`写下你对 ${wordStr} 的记忆点、语境或联想…自动保存`} /></div>

          {/* 记忆面板 */}
          <div className="fcard glass">{FK('记忆面板 · Memory')}
            <div className="lv-mem">
              <svg className="lv-gauge" width="92" height="92" viewBox="0 0 92 92"><circle cx="46" cy="46" r="34" fill="none" stroke="var(--line)" strokeWidth="8" /><circle cx="46" cy="46" r="34" fill="none" stroke={riskColor(risk)} strokeWidth="8" strokeLinecap="round" strokeDasharray={2 * Math.PI * 34} strokeDashoffset={2 * Math.PI * 34 * (1 - risk)} transform="rotate(-90 46 46)" /><text x="46" y="43" textAnchor="middle" fontSize="20" fontWeight="700" fill={riskColor(risk)} fontFamily="var(--font-mono)">{Math.round(risk * 100)}%</text><text x="46" y="58" textAnchor="middle" fontSize="8" fill="var(--ink-muted)" fontFamily="var(--font-mono)">遗忘风险</text></svg>
              <div className="lv-memstats">
                <div className="lv-memrow"><span>状态</span><span className="lv-chip" style={{ color: stMeta.light, borderColor: stMeta.light }}><i style={{ background: stMeta.light }} />{stMeta.zh}</span></div>
                <div className="lv-memrow"><span>连对</span><b>{entry?.streak ?? 0} 次</b></div>
                <div className="lv-memrow"><span>间隔</span><b>{entry?.interval ? entry.interval + ' 天' : '—'}</b></div>
                <div className="lv-memrow"><span>下次</span><b style={{ color: reviewLabel(entry?.nextReviewAt) === '已到期' ? 'var(--rose-ink)' : 'var(--ink)' }}>{reviewLabel(entry?.nextReviewAt)}</b></div>
              </div>
            </div>
            <div className="lv-aside-h">出处热度 · 跨 {backlinks.length} 处</div>
            <div className="lv-srcheat">
              {heat.entries.map(([src, cnt]) => { const sm = SOURCE_META[src] ?? SOURCE_META.dictionary; return (
                <div className="lv-srcrow" key={src}><span className="lv-srcbadge" style={{ color: sm.accent, borderColor: sm.accent }}>{sm.zh}</span><div className="lv-srcbar"><i style={{ width: `${cnt / heat.max * 100}%`, background: sm.accent }} /></div><b>{cnt}</b></div>
              ) })}
            </div>
            <div className="lv-aside-h">快捷</div>
            <div className="lv-asideacts">
              <button className="lv-act primary" onClick={onReview}>{I.play} 加入今日复习</button>
              <button className="lv-act" onClick={() => dock('quiz')}>{I.bolt} 考一考这个词</button>
              <button className="lv-act" onClick={() => dock('pilot')}>{I.pilot} 问领航</button>
            </div>
          </div>

          {/* 词源 */}
          <div className="fcard glass">{FK('词根 · 词源')}<div className="lv-body"><span className="lv-root">{etymology ? '词源' : wordStr}</span> {etymology || `${wordStr} 的词源信息将逐步补全。`}</div></div>

          {/* 链接提及 */}
          <div className="fcard glass">{FK('链接提及 · Backlinks')}
            {backlinks.map((b, i) => { const sm = SOURCE_META[b.src] ?? SOURCE_META.dictionary; return (
              <div className="lv-mention" key={i}><span className="lv-srcbadge" style={{ color: sm.accent, borderColor: sm.accent }}>{sm.zh}</span><span>{b.note}</span></div>
            ) })}
            <div className="lv-cnt" style={{ marginTop: 6 }}>跨 {backlinks.length} 处</div>
          </div>

          {/* AI 解析 */}
          <div className="fcard glass">{FK('AI 解析')}<div className="lv-body">{defZh ? `${wordStr}${pos ? ' ' + pos : ''} — ${defZh}。${synonyms.length ? `近义：${synonyms.slice(0, 3).join('、')}。` : ''}` : `${wordStr} 的用法解析将由 AI 按你的水平生成。`}</div><button className="lv-act" style={{ marginTop: 12 }} onClick={() => dock('pilot')}>{I.pilot} 继续向 AI 追问 {I.arrow}</button></div>
        </div>
      </div>

      {/* 底部放大坞 */}
      <div className="dock">
        <ul className="dock-ul">
          {([[inLib ? 'review' : 'add', inLib ? I.review : I.add, inLib ? '复习' : '学习'], ['quiz', I.quiz, '考一考'], ['graph', I.graph, '词图'], ['pilot', I.pilot, '问领航'], ['cosmos', I.cosmos, '宇宙']] as [string, ReactNode, string][]).map(([k, icon, label]) => (
            <li className="dicon" key={k}><button className="dtile" onClick={() => k === 'add' ? onAdd() : dock(k)}>{icon}</button><span className="dlabel">{label}</span></li>
          ))}
        </ul>
      </div>

      {/* 词库目录抽屉 */}
      <div className={`lvault-scrim${drawer ? ' open' : ''}`} onClick={() => setDrawer(false)} />
      <aside className={`lvault-drawer${drawer ? ' open' : ''}`}>
        <VaultRail words={words} wrongSet={wrongSet} dictTotal={dictTotal} current={slug} due={getDue().length + wrongAnswers.length} onPick={setCur} onReview={() => { router.push('/memory'); setDrawer(false) }} />
      </aside>

      {/* 找词 · 词脊面板 */}
      {palette && <WordPalette words={words} onPick={setCur} onClose={() => setPalette(false)} />}

      {/* 纯 React 文本渲染（toast 均为纯文案），移除 dangerouslySetInnerHTML 的 XSS 隐患 */}
      {toast && <div className="lvault-toast">{toast}</div>}
    </div>
  )
}

// ── 找词 · 词脊命令面板（本页词条搜索/跳转）──
function WordPalette({ words, onPick, onClose }: { words: WordEntry[]; onPick: (id: string) => void; onClose: () => void }) {
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { const t = setTimeout(() => inputRef.current?.focus(), 40); const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }; window.addEventListener('keydown', k); return () => { clearTimeout(t); window.removeEventListener('keydown', k) } }, [onClose])
  const list = useMemo(() => {
    const s = q.toLowerCase().trim()
    const base = [...words].sort((a, b) => riskOf(b) - riskOf(a))
    return (s ? base.filter(w => w.word.toLowerCase().includes(s) || (w.zh || '').includes(s)) : base).slice(0, 50)
  }, [q, words])
  return (
    <div className="lvault-pal" onMouseDown={onClose}>
      <div className="lvault-pal-box" onMouseDown={e => e.stopPropagation()}>
        <div className="lvault-pal-input">{I.search}<input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="搜索词脊 / 跳转…" /><button className="lvault-pal-esc" onClick={onClose}>esc</button></div>
        <div className="lvault-pal-list">
          {list.length === 0 && <div className="lv-muted" style={{ padding: 24, textAlign: 'center' }}>没有匹配的词</div>}
          {list.map(w => { const st = STATE_META[w.state] ?? STATE_META.learning; return (
            <button key={w.id} className="lvault-pal-item" onClick={() => onPick(w.word.toLowerCase())}>
              <span className="pal-w">{w.word}</span><span className="pal-zh">{w.zh}</span>
              <span className="lv-chip" style={{ color: st.light, borderColor: st.light }}><i style={{ background: st.light }} />{st.zh}</span>
            </button>
          ) })}
        </div>
      </div>
    </div>
  )
}

// ── 词库目录（LexiVault header + 搜索 + 智能文件夹 chips + 编号文件夹树 + 词行 + 复习托盘 + 全部词库浏览）──
function VaultRail({ words, wrongSet, dictTotal, current, due, onPick, onReview }: { words: WordEntry[]; wrongSet: Set<string>; dictTotal: number; current: string; due: number; onPick: (id: string) => void; onReview: () => void }) {
  const ensureWord = useLexiStore(s => s.ensureWord)
  const [filter, setFilter] = useState('all')
  const [kid, setKid] = useState<string | null>(null)
  const [openFolder, setOpenFolder] = useState<string | null>('vocab')
  const [query, setQuery] = useState('')
  // 全部词库浏览（整本字典）：lib=null 时为「我的词」视图
  const [lib, setLib] = useState<null | { mode: 'level' | 'letter'; level: number; letter: string }>(null)
  const [libWords, setLibWords] = useState<DictionaryWord[]>([])
  const [libTotal, setLibTotal] = useState(0)
  const [libBusy, setLibBusy] = useState(false)
  const [levelCounts, setLevelCounts] = useState<Record<number, number>>({})
  const inLib = (dw: DictionaryWord) => words.some(w => w.id === dw.id || w.word.toLowerCase() === dw.word.toLowerCase())
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  // 按等级 8 档计数（进入浏览时取一次，best-effort）
  useEffect(() => {
    if (!lib || Object.keys(levelCounts).length) return
    let cancelled = false
    void Promise.all(LEVELS_ALL.map(l =>
      // 按等级 = 考试大纲全量（levels 含该档）；与列表同口径，精确 count
      fetch(`/api/dictionary/search?syllabus=${l}&limit=1`).then(r => (r.ok ? r.json() : null)).then(j => [l, (j?.total as number) || 0] as [number, number]).catch(() => [l, 0] as [number, number])
    )).then(pairs => { if (!cancelled) setLevelCounts(Object.fromEntries(pairs)) })
    return () => { cancelled = true }
  }, [lib, levelCounts])

  // 列表拉取（等级/字母切换 → 复位首页）
  const fetchLib = (append: boolean) => {
    if (!lib) return
    setLibBusy(true)
    const offset = append ? libWords.length : 0
    const url = lib.mode === 'level'
      ? `/api/dictionary/search?syllabus=${lib.level}&limit=50&offset=${offset}`
      : `/api/dictionary/search?prefix=${encodeURIComponent(lib.letter)}&limit=50&offset=${offset}`
    fetch(url).then(r => (r.ok ? r.json() : null)).then(j => {
      const data = (j?.data as DictionaryWord[]) ?? []
      setLibWords(prev => append ? [...prev, ...data] : data)
      setLibTotal((j?.total as number) ?? 0)
      setLibBusy(false)
    }).catch(() => setLibBusy(false))
  }
  useEffect(() => { if (lib) fetchLib(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lib?.mode, lib?.level, lib?.letter])
  const enterLib = () => { setLib(l => l ?? { mode: 'level', level: 3, letter: 'A' }); setKid(null); setFilter('all') }
  const exitLib = (f: string, k: string | null) => { setLib(null); setFilter(f); setKid(k) }

  const FILTERS: { id: string; zh: string; q: (w: WordEntry) => boolean }[] = [
    { id: 'all', zh: '全部', q: () => true },
    { id: 'recommended', zh: '推荐', q: w => w.state === 'recommended' },
    { id: 'learning', zh: '学习中', q: w => w.state === 'learning' },
    { id: 'review', zh: '待复习', q: w => w.state === 'review' || isDue(w) },
    { id: 'weak', zh: '薄弱', q: w => w.state === 'weak' },
    { id: 'mastered', zh: '已掌握', q: w => w.state === 'mastered' },
    { id: 'saved', zh: '已收藏', q: w => isFav(w.id) || isFav(w.word.toLowerCase()) },
  ]
  // 编号文件夹树（结构对齐原型；以真实可派生信号填充）
  const KIDS: Record<string, { zh: string; q: (w: WordEntry) => boolean }[]> = {
    vocab: [
      { zh: '学习中', q: w => w.state === 'learning' },
      { zh: '待复习', q: w => w.state === 'review' || isDue(w) },
      { zh: '薄弱词', q: w => w.state === 'weak' },
      { zh: '已掌握', q: w => w.state === 'mastered' },
      { zh: '已收藏', q: w => isFav(w.id) || isFav(w.word.toLowerCase()) },
    ],
  }
  const FOLDERS: { id: string; code: string; zh: string; accent: string; q: (w: WordEntry) => boolean; kids?: { zh: string; q: (w: WordEntry) => boolean }[] }[] = [
    { id: 'all', code: '00', zh: '全部词库', accent: '#2f6db0', q: () => true },
    { id: 'vocab', code: '01', zh: '词汇库', accent: '#0e8c7a', q: () => true, kids: KIDS.vocab },
    { id: 'wrong', code: '02', zh: '错题本', accent: '#bf4a30', q: w => wrongSet.has(w.word.toLowerCase()) },
    { id: 'reading', code: '03', zh: '阅读笔记', accent: '#6d4bc4', q: w => w.source === 'reading' },
    { id: 'scan', code: '04', zh: '扫描导入', accent: '#b3781f', q: w => w.source === 'scan' },
  ]

  const activeQ = (() => {
    if (kid) { const ks = KIDS.vocab.find(k => k.zh === kid); return ks?.q ?? (() => true) }
    const fo = FOLDERS.find(f => f.id === filter && f.id !== 'all' && f.id !== 'vocab')
    if (fo) return fo.q
    return FILTERS.find(f => f.id === filter)?.q ?? (() => true)
  })()
  const list = useMemo(() => {
    const s = query.toLowerCase().trim()
    let l = words.filter(activeQ)
    if (s) l = l.filter(w => w.word.toLowerCase().includes(s) || (w.zh || '').includes(s))
    return l.sort((a, b) => riskOf(b) - riskOf(a)).slice(0, 200)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, filter, kid, query])
  const activeLabel = kid ?? (FOLDERS.find(f => f.id === filter)?.zh) ?? (FILTERS.find(f => f.id === filter)?.zh) ?? '全部'

  return (
    <div className="lvr">
      <div className="lvr-vault">
        <span className="lvr-mark">{I.vault}</span>
        <div><div className="lvr-vname">LexiVault</div><div className="lvr-vsub">词库 · 知识库</div></div>
        <span className="lvr-cnt">{words.length}</span>
      </div>
      <div className="lvr-scroll">
        <div className="lv-searchbox">{I.search}<input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索我的词…" /></div>
        <div className="lvr-filters">
          {FILTERS.map(f => { const c = words.filter(f.q).length; const on = filter === f.id && !kid && !lib; return <button key={f.id} className={`lv-fchip${on ? ' on' : ''}`} onClick={() => exitLib(f.id, null)}>{f.zh}{f.id !== 'all' ? ` · ${c}` : ''}</button> })}
        </div>
        <div className="lvr-eyebrow"><span>智能文件夹 · 实时</span></div>
        <div>
          {FOLDERS.map(f => {
            const total = f.id === 'all' ? (dictTotal || words.length) : words.filter(f.q).length
            const open = openFolder === f.id
            if (!f.kids) { const sel = f.id === 'all' ? !!lib : (filter === f.id && !kid && !lib); return (
              <div className="lvr-folder" key={f.id}><button className={`lvr-fhead${sel ? ' sel' : ''}`} onClick={() => f.id === 'all' ? enterLib() : exitLib(f.id, null)}><span className="chev ghost">{I.chev}</span><span className="lvr-fcode" style={{ color: f.accent }}>{f.code}</span><span className="lvr-fzh">{f.zh}</span><span className="lvr-fcnt">{total}</span></button></div>
            ) }
            return (
              <div className="lvr-folder" key={f.id}>
                <button className={`lvr-fhead${open ? ' open' : ''}`} onClick={() => setOpenFolder(open ? null : f.id)}><span className="chev">{I.chev}</span><span className="lvr-fcode" style={{ color: f.accent }}>{f.code}</span><span className="lvr-fzh">{f.zh}</span><span className="lvr-fcnt">{total}</span></button>
                {open && <div>{f.kids.map(k => { const c = words.filter(k.q).length; const kon = kid === k.zh && !lib; return <button key={k.zh} className={`lvr-kid${kon ? ' on' : ''}`} onClick={() => exitLib('vocab', k.zh)}><i style={{ background: c ? f.accent : 'var(--line-strong)' }} /><span>{k.zh}</span><em>{c}</em></button> })}</div>}
              </div>
            )
          })}
        </div>
        {lib ? (
          /* 全部词库 · 按等级 / 按字母 浏览整本词典 */
          <>
            <div className="lib-modebar">
              <button className={lib.mode === 'level' ? 'on' : ''} onClick={() => setLib({ ...lib, mode: 'level' })}>按等级</button>
              <button className={lib.mode === 'letter' ? 'on' : ''} onClick={() => setLib({ ...lib, mode: 'letter' })}>按字母</button>
            </div>
            {lib.mode === 'level' ? (
              <div className="lib-index">{LEVELS_ALL.map(l => <button key={l} className={`lib-ichip${lib.level === l ? ' on' : ''}`} style={{ minWidth: 'auto', padding: '5px 10px' }} onClick={() => setLib({ ...lib, level: l })}>{LEVEL_NAMES[l]} {levelCounts[l] ?? ''}</button>)}</div>
            ) : (
              <div className="lib-index">{ALPHA.map(c => <button key={c} className={`lib-ichip${lib.letter === c ? ' on' : ''}`} onClick={() => setLib({ ...lib, letter: c })}>{c}</button>)}</div>
            )}
            <div className="lib-group">
              <div className="lib-ghead"><b>{lib.mode === 'level' ? LEVEL_NAMES[lib.level] : `字母 ${lib.letter}`}</b><span className="gn">{libTotal} 词</span></div>
              {libWords.length === 0 && !libBusy && <div className="lv-muted" style={{ padding: '16px 8px' }}>暂无词条</div>}
              {libWords.map(dw => { const zh = dw.definitions?.[0]?.definitionZh ?? ''; const lemma = dw.word.toLowerCase(); const has = inLib(dw); return (
                <button key={dw.id} className={`lib-row${lemma === current ? ' on' : ''}`} onClick={() => onPick(lemma)}>
                  <span className="wdot" style={{ background: 'var(--ink-muted)', width: 7, height: 7, borderRadius: '50%', flexShrink: 0 }} />
                  <span className="lw">{dw.word}</span><span className="lz">{zh}</span>
                  {/* 按等级浏览：标签显示当前浏览档（大纲全量，避免把跨档基础词标成其 primary_level）；按字母浏览：显示词自身档 */}
                  <span className="ltag">{lib.mode === 'level' ? LEVEL_NAMES[lib.level] : (LEVEL_NAMES[dw.primaryLevel ?? 0] || dw.cefrLevel || '')}</span>
                  {has ? <span className="lin">✓ 已在库</span> : <span className="ladd" onClick={e => { e.stopPropagation(); ensureWord(dw, 'lookup') }}>+ 学</span>}
                </button>
              ) })}
              {libWords.length < libTotal && <button className="lib-more" disabled={libBusy} onClick={() => fetchLib(true)}>{libBusy ? '加载中…' : `加载更多（${libWords.length}/${libTotal}）`}</button>}
            </div>
          </>
        ) : (
          <>
            <div className="lvr-eyebrow"><span>{activeLabel} · {list.length}</span><span className="lvr-sort">风险 ↓</span></div>
            <div className="lvr-list">
              {list.length === 0 && <div className="lv-muted" style={{ padding: '14px 8px' }}>没有匹配的词</div>}
              {list.map(w => {
                const col = (STATE_META[w.state] ?? STATE_META.learning).light, r = riskOf(w), due2 = isDue(w)
                return (
                  <button key={w.id} className={`lvr-wrow${w.word.toLowerCase() === current || w.id === current ? ' on' : ''}`} onClick={() => onPick(w.word.toLowerCase())}>
                    <span className={`wdot${due2 ? ' due' : ''}`} style={{ background: col, color: col }} />
                    <span className="wmain"><span className="wl1"><span className="ww">{w.word}</span><span className="wphon">{w.phon || ''}</span></span><span className="wz">{w.zh}</span><span className="wmsbar"><i style={{ width: `${Math.round(masteryOf(w) * 100)}%`, background: col }} /></span></span>
                    <span className="wright"><span className="wrisk" style={{ color: riskColor(r) }}>{Math.round(r * 100)}%</span><span className={`wnext${due2 ? ' due' : ''}`}>{reviewLabel(w.nextReviewAt)}</span></span>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
      <div className={`review-tray${due === 0 ? ' empty' : ''}`}>
        <span className="rt-ic">{I.play}</span>
        <span className="rt-txt"><span className="rt-n">{due} <small>词待复习</small></span></span>
        <button className="rt-go" onClick={onReview}>开始复习</button>
      </div>
    </div>
  )
}
