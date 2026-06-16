'use client'

/* ════════════════════════════════════════════════════════════════════════
   WordDetailClient — 词汇详情「学习中枢 Hub」重设计（界面优化13，1:1 移植 app.jsx）
   Hero（随状态 CTA）+ 学习中枢 Hub（6 spoke 实时态 + 宇宙/词图缩略）+ 右栏双布局
   （标签页 / 一屏锚点）+ 相关词条。状态/进度/复习时间接 lexiStore + SRS；6 状态色
   取自 STATE_META.light。导航（Navbar/MobileTabBar）由 AppShell 提供，本屏不再实现。
   ════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLexiStore } from '@/store/lexiStore'
import { STATE_META, type WordState } from '@/lib/state-meta'
import { speakSmart } from '@/lib/pronunciation/word-audio'
import type { DictionaryWord } from '@/lib/dictionary/dictionary-types'
import './word-detail.css'

// ── helpers ──────────────────────────────────────────────────────────────
const speak = (t: string, accent: 'US' | 'UK' = 'US') => { void speakSmart(t, accent === 'UK' ? 'uk' : 'us') }
function hl(sentence: string, word: string): ReactNode[] {
  if (!sentence) return []
  const re = new RegExp('\\b(' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\w*)\\b', 'ig')
  const parts: ReactNode[] = []; let last = 0; let m: RegExpExecArray | null; let k = 0
  while ((m = re.exec(sentence))) { parts.push(sentence.slice(last, m.index)); parts.push(<b key={k++}>{m[0]}</b>); last = m.index + m[0].length }
  parts.push(sentence.slice(last))
  return parts
}
const PATHS: Record<string, string> = {
  learn: '<path d="M12 5.5C10.5 4 8 3.5 4 4v14c4-.5 6.5 0 8 1.5M12 5.5C13.5 4 16 3.5 20 4v14c-4-.5-6.5 0-8 1.5M12 5.5v14"/>',
  practice: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.7" fill="currentColor"/>',
  review: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
  universe: '<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="4.5"/><ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(60 12 12)"/>',
  graph: '<circle cx="6" cy="7" r="2.4"/><circle cx="18" cy="6" r="2.4"/><circle cx="17" cy="18" r="2.4"/><circle cx="12" cy="12" r="2.8"/><path d="M9.5 11 8 8.5M14.4 11 16 8M13.5 14l2.3 2.3"/>',
  ai: '<path d="M12 3v3M12 18v3M5 12H2M22 12h-3M6.3 6.3 4 4M18 18l2 2M17.7 6.3 20 4M6 18l-2 2"/><circle cx="12" cy="12" r="4"/>',
  speak: '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
  star: '<path d="M12 2.5l2.9 6.3 6.6.6-5 4.4 1.5 6.5L12 17l-5.5 3.3 1.5-6.5-5-4.4 6.6-.6z"/>',
  bolt: '<path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
}
const Ico = ({ d, s = 18, c = 'currentColor' }: { d: string; s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
)
const Dots = ({ level }: { level: number }) => (
  <span style={{ display: 'inline-flex', gap: 3 }}>
    {[1, 2, 3, 4, 5].map(i => <i key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i <= level ? 'var(--gold-ink)' : 'var(--line-strong)' }} />)}
  </span>
)
function Ring({ pct, color, size = 38, sw = 4, children }: { pct: number; color: string; size?: number; sw?: number; children?: ReactNode }) {
  const r = (size - sw) / 2, C = 2 * Math.PI * r, off = C * (1 - pct / 100)
  return (
    <span style={{ position: 'relative', width: size, height: size, display: 'inline-flex', flexShrink: 0 }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset .5s var(--ease)' }} />
      </svg>
      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</span>
    </span>
  )
}
const Badge = ({ children, color = 'var(--ink-sub)', mono }: { children: ReactNode; color?: string; mono?: boolean }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: mono ? 10.5 : 11.5, fontWeight: 700, fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)', padding: '3px 10px', borderRadius: 'var(--r-pill)', whiteSpace: 'nowrap', color, background: `color-mix(in srgb, ${color} 11%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 30%, transparent)` }}>
    {children}
  </span>
)

// mini galaxy / graph thumbnails
function MiniGalaxy({ accent }: { accent: string }) {
  const dots = useMemo(() => Array.from({ length: 22 }, () => ({ x: 6 + Math.random() * 88, y: 6 + Math.random() * 88, r: Math.random() * 1.4 + 0.6, o: Math.random() * 0.5 + 0.25 })), [])
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs><radialGradient id="wd-mg" cx="58%" cy="42%" r="60%"><stop offset="0%" stopColor={accent} stopOpacity="0.5" /><stop offset="60%" stopColor={accent} stopOpacity="0.06" /><stop offset="100%" stopColor="transparent" /></radialGradient></defs>
      <rect width="100" height="100" fill="#0b1530" />
      <ellipse cx="58" cy="42" rx="46" ry="20" fill="url(#wd-mg)" transform="rotate(-18 58 42)" />
      {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#dbeaff" opacity={d.o} />)}
      <circle cx="58" cy="42" r="4.2" fill={accent} />
      <circle cx="58" cy="42" r="8" fill="none" stroke={accent} strokeWidth="1" opacity="0.5" />
    </svg>
  )
}
function MiniGraph({ synonyms, antonyms, accent }: { synonyms: string[]; antonyms: string[]; accent: string }) {
  const nodes = [
    ...synonyms.slice(0, 3).map((w, i) => ({ w, kind: 'syn' as const, a: -0.55 + i * 0.42 })),
    ...antonyms.slice(0, 2).map((w, i) => ({ w, kind: 'ant' as const, a: 2.5 + i * 0.5 })),
  ]
  const cx = 50, cy = 50, R = 34
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect width="100" height="100" fill="#0c1424" />
      {nodes.map((nd, i) => {
        const x = cx + Math.cos(nd.a) * R, y = cy + Math.sin(nd.a) * R
        const col = nd.kind === 'ant' ? '#ff8fa8' : '#7ef9ff'
        return <g key={i}><line x1={cx} y1={cy} x2={x} y2={y} stroke={col} strokeWidth="0.7" opacity="0.35" /><circle cx={x} cy={y} r="3" fill={col} opacity="0.9" /></g>
      })}
      <circle cx={cx} cy={cy} r="6.5" fill={accent} />
      <circle cx={cx} cy={cy} r="10" fill="none" stroke={accent} strokeWidth="1" opacity="0.5" />
    </svg>
  )
}

// ── learn-state derivation（接 SRS / quizHistory）────────────────────────────
type LearnState = { progress: number; accuracy: number | null; reviewIn: string | null; streak: number; primary: string; primaryKind: 'add' | 'learn' | 'review' | 'weak' | 'practice' }
const CTA_BY_STATE: Record<string, { primary: string; primaryKind: LearnState['primaryKind'] }> = {
  unknown: { primary: '加入学习', primaryKind: 'add' },
  recommended: { primary: '加入学习', primaryKind: 'add' },
  learning: { primary: '继续学', primaryKind: 'learn' },
  review: { primary: '立即复习', primaryKind: 'review' },
  weak: { primary: '强化练习', primaryKind: 'weak' },
  mastered: { primary: '再巩固一次', primaryKind: 'practice' },
  locked: { primary: '加入学习', primaryKind: 'add' },
}
function reviewLabel(ts: number | undefined): string | null {
  if (ts == null) return null
  const now = Date.now(), dayMs = 86_400_000
  if (ts <= now) return '已到期'
  const startTomorrow = new Date(new Date().setHours(0, 0, 0, 0)).getTime() + dayMs
  if (ts < startTomorrow) return '今天到期'
  return `${Math.ceil((ts - now) / dayMs)} 天后`
}
function progressFor(state: WordState, e?: { interval?: number; streak?: number }): number {
  if (state === 'mastered') return 100
  if (state === 'unknown' || state === 'recommended' || state === 'locked') return 0
  const interval = e?.interval ?? 0, streak = e?.streak ?? 0
  if (state === 'weak') return Math.min(45, 25 + streak * 8)
  if (state === 'review') return Math.min(92, 50 + interval * 4)
  return Math.min(80, 30 + streak * 12)   // learning
}

// ── view-word mapping ──────────────────────────────────────────────────────
function aiNoteOf(word: DictionaryWord, defZh: string, pos: string, syn: string[], coll: string[]): string {
  const scene = word.sceneUsages?.[0]
  if (scene?.sceneZh) return `${scene.sceneZh}${scene.exampleZh ? `　例：${scene.exampleZh}` : ''}`
  if (word.nuance?.length) return word.nuance.slice(0, 2).map(n => `${n.member}：${n.nuanceZh}`).join('　')
  return [
    defZh && `${word.word}${pos ? ` ${pos}` : ''} — ${defZh}。`,
    syn.length && `近义：${syn.slice(0, 3).join('、')}。`,
    coll.length && `常见搭配：${coll.slice(0, 2).join('、')}。`,
  ].filter(Boolean).join('') || `${word.word} 的用法解析将由 AI 按你的水平生成。`
}

interface WordDetailClientProps { word: DictionaryWord }

export function WordDetailClient({ word }: WordDetailClientProps) {
  const router = useRouter()
  const ensureWord = useLexiStore(s => s.ensureWord)
  const recordActivity = useLexiStore(s => s.recordActivity)
  const inStore = useLexiStore(s => s.words.find(w => w.id === word.id))
  const quizHistory = useLexiStore(s => s.quizHistory)

  const [accent, setAccent] = useState<'US' | 'UK'>('US')
  const [layout, setLayout] = useState<'tab' | 'anchor'>('anchor')
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => { setToast(m); window.clearTimeout((window as unknown as { __wdtt?: number }).__wdtt); (window as unknown as { __wdtt?: number }).__wdtt = window.setTimeout(() => setToast(null), 2200) }

  const state: WordState = inStore?.state ?? 'unknown'
  const stMeta = STATE_META[state]
  const inStudy = state !== 'unknown' && state !== 'recommended' && state !== 'locked'
  const accentColor = 'var(--teal-ink)'

  // view fields
  const pos = word.partOfSpeech ?? word.definitions[0]?.partOfSpeech ?? ''
  const defEn = word.definitions[0]?.definitionEn ?? ''
  const defZh = word.definitions[0]?.definitionZh ?? ''
  const exampleEn = word.examples[0]?.sentenceEn ?? ''
  const exampleZh = word.examples[0]?.sentenceZh ?? ''
  const synonyms = word.synonyms ?? []
  const antonyms = word.antonyms ?? []
  const collocations = (word.collocations ?? []).map(c => c.phrase).filter(Boolean)
  const mnemonic = word.mnemonics?.find(m => m.style === 'standard')?.mnemonicZh
    ?? word.mnemonics?.[0]?.mnemonicZh ?? word.mnemonics?.[0]?.mnemonicEn ?? ''
  const etymology = word.etymology ? (word.etymology.explanationZh || word.etymology.explanationEn || word.etymology.roots || '') : ''
  const themeTags = (word.themeTags?.length ? word.themeTags : word.domainTags) ?? []
  const examTags = word.examTags ?? []
  const aiNote = aiNoteOf(word, defZh, pos, synonyms, collocations)
  const ipa = word.phoneticIpa ?? ''
  // FIX1：一屏通览补全要素
  const FORM_ZH: Record<string, string> = { plural: '复数', past: '过去式', pastParticiple: '过去分词', presentParticiple: '现在分词', third: '第三人称', comparative: '比较级', superlative: '最高级', gerund: '动名词' }
  const formEntries = Object.entries(word.inflections ?? {}).filter(([, v]) => v)
  const nuance = (word.nuance ?? []).filter(n => n.member && n.nuanceZh)
  const allDefs = word.definitions ?? []
  const allExamples = (word.examples ?? []).filter(e => e.sentenceEn)

  // learn state
  let tot = 0, cor = 0
  for (const sess of quizHistory) for (const a of sess.attempts) if (a.wordId === word.id) { tot++; if (a.correct) cor++ }
  const learn: LearnState = {
    progress: progressFor(state, inStore),
    accuracy: tot > 0 ? Math.round((cor / tot) * 100) : null,
    reviewIn: reviewLabel(inStore?.nextReviewAt),
    streak: inStore?.streak ?? 0,
    ...CTA_BY_STATE[state],
  }

  // navigation
  const go = (where: string) => {
    // 19.zip：跳地图/练习/对话时带 returnTo=当前单词页，闭环不断链（复用既有 returnTo 约定）
    const back = encodeURIComponent(`/word/${word.id}`)
    switch (where) {
      case 'practice': return router.push(`/quiz?word=${encodeURIComponent(word.id)}&returnTo=${back}`)
      case 'review': return router.push('/memory')
      case 'universe': return router.push(`/lexiverse?word=${encodeURIComponent(word.id)}&returnTo=${back}`)
      case 'graph': return router.push(`/lexigraph?word=${encodeURIComponent(word.id)}&returnTo=${back}`)
      case 'chat': return router.push(`/chat?word=${encodeURIComponent(word.id)}&returnTo=${back}`)
      case 'me': return router.push('/profile')
      case 'words': return router.push('/dictionary')
      default: return router.push(`/${where}`)
    }
  }
  const onAdd = () => { ensureWord(word, 'lookup'); recordActivity('learned'); flash('已加入学习 · 进入「学习中」，排入今日') }
  const onPrimary = () => {
    if (learn.primaryKind === 'review') return go('review')
    if (learn.primaryKind === 'weak' || learn.primaryKind === 'practice') return go('practice')
    if (learn.primaryKind === 'learn') return router.push('/learn')
    onAdd()
  }
  const jump = (label: string) => {
    if (label === '__graph') return go('graph')
    router.push(`/word/${encodeURIComponent(label.toLowerCase().trim())}`)
  }

  // related strip
  const [related, setRelated] = useState<{ slug: string; word: string; zh: string; state: WordState }[]>([])
  useEffect(() => {
    let cancelled = false
    fetch(`/api/dictionary/relations?word=${encodeURIComponent(word.id)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (cancelled || !j?.data) return
        const words = (j.data.words ?? {}) as Record<string, { word: string; zh: string }>
        const rels = (j.data.relations ?? []) as { a: string; b: string }[]
        const slugs = [...new Set(rels.flatMap(r => [r.a, r.b]).filter(s => s && s !== word.id))]
        const lexi = useLexiStore.getState()
        const out = slugs.slice(0, 8).map(slug => ({
          slug, word: words[slug]?.word ?? slug, zh: (words[slug]?.zh ?? '').split('；')[0],
          state: (lexi.words.find(w => w.id === slug)?.state ?? 'unknown') as WordState,
        })).filter(x => x.word)
        if (!out.length) {
          // 兜底：用近义/反义词（无 zh）
          const fb = [...synonyms, ...antonyms].slice(0, 6).map(w => ({ slug: w.toLowerCase(), word: w, zh: '', state: (lexi.words.find(e => e.id === w.toLowerCase())?.state ?? 'unknown') as WordState }))
          setRelated(fb)
        } else setRelated(out)
      })
      .catch(() => { /* no related */ })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.id])

  // ── sections ──────────────────────────────────────────────────────────────
  const SecDef = (
    <div className="sec">
      {allDefs.map((d, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          {(d.partOfSpeech || pos) && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--teal-ink)', marginRight: 8 }}>{d.partOfSpeech || pos}</span>}
          {d.definitionZh && <span className="def-zh" style={{ fontSize: 15 }}>{d.definitionZh}</span>}
          {d.definitionEn && <p className="def-en" style={{ margin: '2px 0 0' }}>{d.definitionEn}</p>}
        </div>
      ))}
      {allExamples.map((ex, i) => (
        <div className="example" key={i}>
          <span className="ex-bar" />
          <span>
            <span className="ex-en">{hl(ex.sentenceEn, word.word)}</span>
            {ex.sentenceZh && <span className="ex-zh">{ex.sentenceZh}</span>}
            <button className="ex-play press" onClick={() => speak(ex.sentenceEn, accent)}><Ico d={PATHS.speak} s={13} c="var(--ink-muted)" /> 朗读例句</button>
          </span>
        </div>
      ))}
    </div>
  )
  // 词形变化（取词条 inflections）
  const SecForms = formEntries.length > 0 ? (
    <div className="sec">
      <div className="chips">
        {formEntries.map(([k, v]) => (
          <span key={k} className="coll-chip" style={{ display: 'inline-flex', gap: 6, alignItems: 'baseline' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-muted)' }}>{FORM_ZH[k] ?? k}</span>
            <b style={{ fontWeight: 600, color: 'var(--ink)' }}>{v}</b>
          </span>
        ))}
      </div>
    </div>
  ) : null
  // 同义辨析（synonyms + nuance 差异说明）
  const SecSyn = (synonyms.length > 0 || nuance.length > 0) ? (
    <div className="sec">
      {synonyms.length > 0 && <div className="chips" style={{ marginBottom: nuance.length ? 12 : 0 }}>{synonyms.map(s => <button key={s} className="wchip press" onClick={() => jump(s)}>{s}</button>)}</div>}
      {nuance.map((n, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderTop: i ? '1px solid var(--line)' : 'none' }}>
          <button className="wchip press" style={{ flexShrink: 0 }} onClick={() => jump(n.member)}>{n.member}</button>
          <span style={{ fontSize: 12.5, color: 'var(--ink-sub)', lineHeight: 1.6 }}>{n.nuanceZh}</span>
        </div>
      ))}
    </div>
  ) : null
  // 反义词
  const SecAnt = antonyms.length > 0 ? (
    <div className="sec">
      <div className="chips">{antonyms.map(s => <button key={s} className="wchip neg press" onClick={() => jump(s)}>{s}</button>)}</div>
    </div>
  ) : null
  // 派生词族：常见搭配 + 词图/词族入口（同/反义已拆为独立块）
  const SecRel = (
    <div className="sec">
      {collocations.length > 0 && (
        <div>
          <div className="rel-label" style={{ color: 'var(--ink-sub)' }}>常见搭配 · Collocations</div>
          <div className="chips">{collocations.map(s => <span key={s} className="coll-chip">{hl(s, word.word)}</span>)}</div>
        </div>
      )}
      <button className="open-graph press" onClick={() => jump('__graph')} style={collocations.length ? { marginTop: 12 } : undefined}>
        <Ico d={PATHS.graph} s={15} c="var(--teal-ink)" /> 在词汇关系图中展开 <Ico d={PATHS.arrow} s={14} c="var(--teal-ink)" />
      </button>
      {/* D17：词族串记入口（与 D9 词根页双向联动） */}
      <button className="open-graph press" onClick={() => router.push(`/roots?word=${encodeURIComponent(word.id)}`)} style={{ marginTop: 8 }}>
        <Ico d={PATHS.star} s={15} c="var(--gold-ink)" /> 词族串记 · 同根词一起记 <Ico d={PATHS.arrow} s={14} c="var(--gold-ink)" />
      </button>
    </div>
  )
  const SecEty = (
    <div className="sec">
      <div className="ety-card">
        <div className="ety-line"><Ico d={PATHS.star} s={14} c="var(--violet-ink)" /> 词源 · Etymology</div>
        <p className="ety-txt">{etymology || `${word.word} 的词源信息将逐步补全。`}</p>
      </div>
      {themeTags.length > 0 && <div className="theme-row">{themeTags.map(t => <span key={t} className="theme-chip">#{t}</span>)}</div>}
    </div>
  )
  const SecAI = (
    <div className="sec">
      <div className="ai-card">
        <div className="ai-card-head"><span className="ai-dot"><Ico d={PATHS.ai} s={13} c="#fff" /></span> AI 用法解析</div>
        <p className="ai-card-txt">{aiNote}</p>
        <button className="ai-more press" onClick={() => go('chat')}>继续向 AI 追问 →</button>
      </div>
    </div>
  )
  // FIX1：一屏通览全要素，缺数据的块整块隐藏（不留空壳）。顺序固定。
  const SECTIONS: { id: string; label: string; node: ReactNode }[] = [
    { id: 'def', label: '释义', node: SecDef },
    ...(SecForms ? [{ id: 'forms', label: '词形变化', node: SecForms }] : []),
    { id: 'rel', label: '派生词族', node: SecRel },
    ...(SecSyn ? [{ id: 'syn', label: '同义辨析', node: SecSyn }] : []),
    ...(SecAnt ? [{ id: 'ant', label: '反义词', node: SecAnt }] : []),
    { id: 'ety', label: '词根·词源', node: SecEty },
    { id: 'mem', label: '记忆法', node: <SecMemBlock mnemonic={mnemonic} word={word.word} /> },
    { id: 'ai', label: 'AI 解析', node: SecAI },
  ]

  const [tab, setTab] = useState('def')
  useEffect(() => { setTab('def') }, [word.id])
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const jumpAnchor = (id: string) => { scrollRef.current?.querySelector('#wd-anc-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

  return (
    <div className="theme-light wd-v2">
      {/* Hero */}
      <div className="hero fade">
        <div className="crumbs">
          <Link href="/dictionary" className="crumb-link">词汇根系</Link>
          <span className="crumb-sep">›</span>
          <span style={{ color: 'var(--ink-sub)' }}>{word.word}</span>
        </div>
        <div className="hero-main">
          <div>
            <h1 className="word">{word.word}</h1>
            <div className="ipa-row">
              {ipa && <span className="ipa">{ipa}</span>}
              <button className="play press" onClick={() => speak(word.word, accent)} title="朗读"><Ico d={PATHS.speak} s={15} c="var(--teal-ink)" /></button>
              <span className="accent-seg">
                <span className={accent === 'US' ? 'on' : ''} onClick={() => setAccent('US')}>US</span>
                <span className={accent === 'UK' ? 'on' : ''} onClick={() => setAccent('UK')}>UK</span>
              </span>
            </div>
            <div className="meta-row">
              {pos && <Badge color="var(--violet-ink)">{pos}</Badge>}
              {word.cefrLevel && <Badge color="#c2700f">CEFR {word.cefrLevel}</Badge>}
              <span className="diff-inline">难度 <Dots level={word.difficulty ?? 3} /></span>
              {examTags.slice(0, 3).map(t => <Badge key={t} mono color="var(--teal-ink)">{t}</Badge>)}
            </div>
          </div>
          <div className="hero-right">
            <div className="state-row">
              <span className="state-pill" style={{ ['--c' as string]: stMeta.light } as React.CSSProperties}>
                <span className="state-dot" />{stMeta.zh}
              </span>
              <span className="state-sub">{inStudy ? (learn.reviewIn ? `下次复习 ${learn.reviewIn}` : '') : stMeta.desc}</span>
            </div>
            {inStudy
              ? <button className="cta press" onClick={onPrimary} style={{ ['--c' as string]: stMeta.light } as React.CSSProperties}>{learn.primary}</button>
              : <button className="cta press" onClick={onAdd} style={{ ['--c' as string]: accentColor } as React.CSSProperties}>+ 加入学习</button>}
          </div>
        </div>
      </div>

      {/* body: hub + content */}
      <div className="body-grid">
        {/* Hub */}
        <div className="hub fade">
          <div className="hub-head">
            <span className="hub-kicker">学习中枢 · Hub</span>
            <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>所有模块联动</span>
          </div>
          {/* 学习状态 */}
          <button className="spoke press" style={{ ['--c' as string]: stMeta.light } as React.CSSProperties} onClick={inStudy ? () => go('me') : onAdd}>
            <span className="sp-ic">{inStudy
              ? <Ring pct={learn.progress} color={stMeta.light} size={38} sw={4}><b style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: stMeta.light }}>{learn.progress}</b></Ring>
              : <Ico d={PATHS.learn} s={17} c={stMeta.light} />}</span>
            <span className="sp-body"><span className="sp-t">学习状态</span><span className="sp-s">{inStudy ? `${stMeta.zh} · ${stMeta.desc}` : stMeta.desc}</span></span>
            <span className="sp-status">{!inStudy && <span className="go-chip" style={{ ['--c' as string]: accentColor } as React.CSSProperties}>加入 +</span>}</span>
          </button>
          {/* 练习 */}
          <button className="spoke press" style={{ ['--c' as string]: 'var(--blue-ink)' } as React.CSSProperties} onClick={() => go('practice')}>
            <span className="sp-ic"><Ico d={PATHS.practice} s={17} c="var(--blue-ink)" /></span>
            <span className="sp-body"><span className="sp-t">练习 · 考一考</span><span className="sp-s">{learn.accuracy != null ? `历史正确率 ${learn.accuracy}% · 再练一组` : '还没练过，去测一测'}</span></span>
            <span className="sp-status">{learn.accuracy != null ? <span className="acc">{learn.accuracy}%</span> : <Ico d={PATHS.arrow} s={16} c="var(--blue-ink)" />}</span>
          </button>
          {/* 复习 */}
          <button className="spoke press" style={{ ['--c' as string]: STATE_META.review.light } as React.CSSProperties} onClick={() => go('review')}>
            <span className="sp-ic"><Ico d={PATHS.review} s={17} c={STATE_META.review.light} /></span>
            <span className="sp-body"><span className="sp-t">复习 · SRS</span><span className="sp-s">{learn.reviewIn ? (learn.reviewIn.includes('到期') ? '已到期，建议立即复习' : `下次复习 · ${learn.reviewIn}`) : '加入学习后排入复习'}</span></span>
            <span className="sp-status">{learn.reviewIn ? <span className="rev-when" style={{ color: learn.reviewIn.includes('到期') ? STATE_META.review.light : 'var(--ink-muted)' }}>{learn.reviewIn}</span> : <Ico d={PATHS.arrow} s={16} c={STATE_META.review.light} />}</span>
          </button>

          <div className="hub-split"><span>在词汇地图中查看</span></div>
          <div className="hub-maps">
            <button className="map press" onClick={() => go('universe')}>
              <span className="map-thumb"><MiniGalaxy accent={accentColor} /></span>
              <span className="map-meta"><span className="map-t"><Ico d={PATHS.universe} s={14} c="var(--ink-sub)" /> 词汇宇宙</span><span className="map-s">{themeTags[0] ?? '词汇'} 星系 · 该词为亮星</span></span>
            </button>
            <button className="map press" onClick={() => go('graph')}>
              <span className="map-thumb"><MiniGraph synonyms={synonyms} antonyms={antonyms} accent={accentColor} /></span>
              <span className="map-meta"><span className="map-t"><Ico d={PATHS.graph} s={14} c="var(--ink-sub)" /> 词汇关系图</span><span className="map-s">{synonyms.length} 近义 · {antonyms.length} 反义</span></span>
            </button>
          </div>
          <button className="ai-row press" onClick={() => go('chat')}>
            <span className="ai-ic"><Ico d={PATHS.ai} s={16} c="var(--violet-ink)" /></span>
            <span style={{ flex: 1, textAlign: 'left' }}><span className="ai-t">AI 导学</span><span className="ai-s">追问用法、辨析、造句</span></span>
            <Ico d={PATHS.arrow} s={15} c="var(--violet-ink)" />
          </button>
        </div>

        {/* Content（双布局：标签页 / 一屏锚点）*/}
        <div className="content">
          <div className="layout-toggle">
            <button className={layout === 'tab' ? 'on' : ''} onClick={() => setLayout('tab')}>标签页</button>
            <button className={layout === 'anchor' ? 'on' : ''} onClick={() => setLayout('anchor')}>一屏通览</button>
          </div>
          {layout === 'tab' ? (
            <>
              <div className="tabbar">
                {SECTIONS.map(s => <button key={s.id} className={'tab press' + (s.id === tab ? ' on' : '')} onClick={() => setTab(s.id)}>{s.label}</button>)}
              </div>
              <div className="tab-panel fade" key={tab}>{SECTIONS.find(s => s.id === tab)?.node}</div>
            </>
          ) : (
            <>
              <div className="anchorbar">
                {SECTIONS.map(s => <button key={s.id} className="anc-btn press" onClick={() => jumpAnchor(s.id)}>{s.label}</button>)}
              </div>
              <div className="scroll-sections" ref={scrollRef}>
                {SECTIONS.map(s => (
                  <div className="anc-block" id={'wd-anc-' + s.id} key={s.id}>
                    <div className="anc-h">{s.label}</div>
                    {s.node}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 相关词条 */}
      {related.length > 0 && (
        <div className="related">
          <div className="rel-strip-label">继续探索 · 相关词</div>
          <div className="rel-strip">
            {related.map(w => (
              <Link key={w.slug} href={`/word/${encodeURIComponent(w.slug)}`} className="rel-word press">
                <span className="rw-word">{w.word}</span>
                <span className="rw-dot" style={{ background: STATE_META[w.state].light }} />
                {w.zh && <span className="rw-zh">{w.zh}</span>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

// 记忆分区（含「邪修」折叠的本地状态）——单独组件以承载 useState
function SecMemBlock({ mnemonic, word }: { mnemonic: string; word: string }) {
  const [evil, setEvil] = useState(false)
  return (
    <div className="sec">
      <div className="mem-card">
        <div className="mem-tag">词根记忆</div>
        <p className="mem-txt">{mnemonic || `把 ${word} 拆成熟悉的音节或词根，联想一个画面帮助记忆。`}</p>
      </div>
      <button className="evil-toggle press" onClick={() => setEvil(v => !v)}>
        <Ico d={PATHS.bolt} s={14} c="var(--gold-ink)" /> {evil ? '收起邪修记忆法' : '试试「邪修」记忆法'}
      </button>
      {evil && (
        <div className="mem-card evil fade">
          <div className="mem-tag" style={{ color: 'var(--gold-ink)', background: 'var(--gold-bg)' }}>邪修 · 谐音联想</div>
          <p className="mem-txt">把 <b>{word}</b> 拆成熟悉的音节，编一个夸张到忘不掉的画面 —— 越离谱越好记。（AI 会按你的母语生成）</p>
        </div>
      )}
    </div>
  )
}
