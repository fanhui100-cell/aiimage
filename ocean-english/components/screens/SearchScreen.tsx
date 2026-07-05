'use client'
/* ============================================================================
   SearchScreen.tsx — D18 全局搜索 Search
   一个入口搜 单词 / 文章 / 词族，带最近搜索 + 最近在学，输入即出结果。
   数据源全部真实：
     单词 → /api/dictionary/search   文章 → /api/reading   词族 → /api/roots
   空结果可「加入想学」→ addWord 真入库（释义由 hydrateMissingEntries 补全）。
   ============================================================================ */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useLexiStore } from '@/store/lexiStore'
import './screen-kit.css'
import './search.css'

type Tab = 'all' | 'word' | 'article' | 'family'
interface WordHit { id: string; word: string; zh: string; phon: string; pos: string }
interface ArticleHit { id: string; title: string; titleZh?: string; level: number; minutes: number }
interface FamilyHit { root: string; count: number }
interface SearchWordRow {
  id?: string
  word?: string
  definitions?: { definitionZh?: string | null }[]
  phoneticIpa?: string | null
  partOfSpeech?: string | null
}
interface RootRow { root?: string; members?: unknown[] }
interface ReadingRow { id?: string; title?: string; titleZh?: string; level?: number; minutes?: number }

const RECENT_KEY = 'lexi-recent-search'

function readRecent(): string[] {
  if (typeof localStorage === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, 8) } catch { return [] }
}

// 高亮命中片段（大小写不敏感，转义正则）
function Highlight({ text, q }: { text: string; q: string }) {
  const ql = q.trim()
  if (!ql) return <>{text}</>
  const parts = text.split(new RegExp(`(${ql.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'))
  return <>{parts.map((p, i) => p.toLowerCase() === ql.toLowerCase() ? <b key={i}>{p}</b> : <span key={i}>{p}</span>)}</>
}

const SearchIcon = ({ s = 20 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

export function SearchScreen() {
  const words = useLexiStore(s => s.words)
  const addWord = useLexiStore(s => s.addWord)
  const level = useLexiStore(s => s.profile.level)

  const [q, setQ] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [focus, setFocus] = useState(false)
  const [loading, setLoading] = useState(false)
  const [wordHits, setWordHits] = useState<WordHit[]>([])
  const [articleHits, setArticleHits] = useState<ArticleHit[]>([])
  const [familyHits, setFamilyHits] = useState<FamilyHit[]>([])
  const [recent, setRecent] = useState<string[]>([])
  const [added, setAdded] = useState(false)

  // 文章/词族全量只拉一次，本地过滤
  const familiesRef = useRef<{ root: string; members: string[] }[] | null>(null)
  const articlesRef = useRef<ArticleHit[] | null>(null)

  useEffect(() => { setRecent(readRecent()) }, [])

  // 最近在学（store 按入库时间倒序）
  const recentLearned = useMemo(
    () => [...words].filter(w => w.zh && w.state !== 'locked')
      .sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0)).slice(0, 6),
    [words],
  )

  function pushRecent(term: string) {
    const t = term.trim()
    if (!t) return
    const next = [t, ...readRecent().filter(x => x.toLowerCase() !== t.toLowerCase())].slice(0, 8)
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)) } catch { /* ignore */ }
    setRecent(next)
  }

  // 防抖搜索
  useEffect(() => {
    const term = q.trim()
    setAdded(false)
    if (term.length < 2) { setWordHits([]); setArticleHits([]); setFamilyHits([]); setLoading(false); return }
    let alive = true
    setLoading(true)
    const timer = setTimeout(async () => {
      const ql = term.toLowerCase()
      // 单词
      const wp = fetch(`/api/dictionary/search?q=${encodeURIComponent(term)}&limit=8`)
        .then(r => r.json()).then(j => ((j?.data ?? []) as SearchWordRow[]).map((d): WordHit => ({
          id: d.id ?? '', word: d.word ?? '', zh: d.definitions?.[0]?.definitionZh ?? '',
          phon: d.phoneticIpa ?? '', pos: d.partOfSpeech ?? '',
        }))).catch(() => [])
      // 词族（缓存全量）
      const fp = (async () => {
        if (!familiesRef.current) {
          familiesRef.current = await fetch('/api/roots').then(r => r.json())
            .then(j => ((j?.data ?? []) as RootRow[]).map((f) => ({ root: String(f.root ?? ''), members: (f.members ?? []).map((m) => String(m)) })))
            .catch(() => [])
        }
        return (familiesRef.current ?? [])
          .filter(f => f.root.toLowerCase().includes(ql) || f.members.some(m => m.toLowerCase().includes(ql)))
          .slice(0, 4)
          .map((f): FamilyHit => ({ root: f.root, count: f.members.length }))
      })()
      // 文章（缓存当前档列表）
      const ap = (async () => {
        if (!articlesRef.current) {
          const lvl = level ?? 4
          articlesRef.current = await fetch(`/api/reading?level=${lvl}`).then(r => r.json())
            .then(j => ((j?.data ?? []) as ReadingRow[]).map((a): ArticleHit => ({
              id: a.id ?? '', title: a.title ?? '', titleZh: a.titleZh, level: a.level ?? lvl, minutes: a.minutes ?? 0,
            }))).catch(() => [])
        }
        return (articlesRef.current ?? [])
          .filter(a => a.title?.toLowerCase().includes(ql) || (a.titleZh ?? '').includes(term))
          .slice(0, 4)
      })()
      const [w, f, a] = await Promise.all([wp, fp, ap])
      if (!alive) return
      setWordHits(w); setFamilyHits(f); setArticleHits(a); setLoading(false)
    }, 260)
    return () => { alive = false; clearTimeout(timer) }
  }, [q, level])

  const counts = {
    all: wordHits.length + articleHits.length + familyHits.length,
    word: wordHits.length, article: articleHits.length, family: familyHits.length,
  }
  const showWords = tab === 'all' || tab === 'word'
  const showArticles = tab === 'all' || tab === 'article'
  const showFamilies = tab === 'all' || tab === 'family'
  const hasResults = counts.all > 0
  const searching = q.trim().length >= 2

  function addToWishlist() {
    const t = q.trim()
    if (!t) return
    addWord({ id: t.toLowerCase().replace(/\s+/g, '-'), word: t, zh: '' })
    pushRecent(t)
    setAdded(true)
  }

  return (
    <div className="scr theme-light">
      <div className="wrap">
        <div className="eyebrow">D18 · 全局搜索</div>
        <h1 className="h1">全局搜索 <em>Search</em></h1>

        <div className={`se-box${focus ? ' focus' : ''}`}>
          <SearchIcon />
          <input
            autoFocus
            placeholder="搜单词 / 文章 / 词族…"
            value={q}
            onChange={e => setQ(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            onKeyDown={e => { if (e.key === 'Enter') pushRecent(q) }}
          />
          {q && <button className="se-clear" onClick={() => setQ('')} aria-label="清空">✕</button>}
        </div>

        {!searching ? (
          /* ── 默认态：最近搜索 + 最近在学 ── */
          <>
            {recent.length > 0 && (
              <>
                <div className="se-sec-h">最近搜索</div>
                <div className="se-recent">
                  {recent.map(r => (
                    <span key={r} className="se-rc" onClick={() => setQ(r)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
                      {r}
                    </span>
                  ))}
                </div>
              </>
            )}
            <div className="se-sec-h">最近在学</div>
            {recentLearned.length > 0 ? (
              <div className="se-hot">
                {recentLearned.map((w, i) => (
                  <Link key={w.id} className="se-hotrow" href={`/dictionary?word=${w.id}`}>
                    <span className={`se-hotrk${i < 3 ? ' top' : ''}`}>{i + 1}</span>
                    <span className="se-hotw">{w.word}</span>
                    <span className="se-hotzh">{w.zh}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="state empty" style={{ padding: '40px 24px' }}>
                <div className="state-desc">还没有学习记录。去 <Link href="/today" style={{ color: 'var(--teal-ink)' }}>今日</Link> 学几个词，这里会列出你最近在学的。</div>
              </div>
            )}
          </>
        ) : (
          /* ── 搜索态：tabs + 结果 / 空 ── */
          <>
            <div className="se-tabs">
              {([['all', '全部'], ['word', '单词'], ['article', '文章'], ['family', '词族']] as [Tab, string][]).map(([k, zh]) => (
                <button key={k} className={`se-tab${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>
                  {zh}<span className="c">{counts[k]}</span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="se-load">
                {[0, 1, 2].map(i => <div key={i} className="skel" style={{ height: 64, borderRadius: 13 }} />)}
              </div>
            ) : hasResults ? (
              <div className="se-res">
                {showWords && wordHits.map(w => (
                  <Link key={`w-${w.id}`} className="se-r" href={`/dictionary?word=${w.id}`} onClick={() => pushRecent(q)}>
                    <span className="se-r-ic" style={{ background: '#2a7fb822' }}>📘</span>
                    <span className="se-r-main">
                      <span className="se-r-t"><Highlight text={w.word} q={q} /></span>
                      <span className="se-r-s">{[w.pos, w.zh, w.phon].filter(Boolean).join(' · ')}</span>
                    </span>
                    <span className="se-r-kind">单词</span>
                  </Link>
                ))}
                {showArticles && articleHits.map(a => (
                  <Link key={`a-${a.id}`} className="se-r" href="/reading" onClick={() => pushRecent(q)}>
                    <span className="se-r-ic" style={{ background: '#6d4bc422' }}>📖</span>
                    <span className="se-r-main">
                      <span className="se-r-t"><Highlight text={a.title} q={q} /></span>
                      <span className="se-r-s">{[a.titleZh, `Lv${a.level}`, `${a.minutes} min`].filter(Boolean).join(' · ')}</span>
                    </span>
                    <span className="se-r-kind">文章</span>
                  </Link>
                ))}
                {showFamilies && familyHits.map(f => (
                  <Link key={`f-${f.root}`} className="se-r" href="/roots" onClick={() => pushRecent(q)}>
                    <span className="se-r-ic" style={{ background: '#0e8c7a22' }}>🌿</span>
                    <span className="se-r-main">
                      <span className="se-r-t"><Highlight text={f.root} q={q} /> 词族</span>
                      <span className="se-r-s">{f.count} 个同根词</span>
                    </span>
                    <span className="se-r-kind">词族</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="state empty" style={{ marginTop: 10 }}>
                <div className="state-icon"><SearchIcon s={24} /></div>
                <div className="state-title">没找到「{q.trim()}」</div>
                <div className="state-desc">换个关键词试试，或检查拼写。也可以直接把它加入「想学的词」。</div>
                <div className="state-acts">
                  {added
                    ? <span className="se-r-kind" style={{ padding: '10px 16px' }}>✓ 已加入想学</span>
                    : <button className="btn btn-ink" onClick={addToWishlist}>+ 加入想学</button>}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
