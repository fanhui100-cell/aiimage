'use client'
// DictionaryScreen — 词库页（B7，替换 WordsScreen）
// 搜索 + 双 tab：「我的词」（学习库，状态 chips，?state= 直达筛选）
//             「探索词典」（全量词典，CEFR/考试 chips，分页 30）
// 行点击进 /word/[slug]（详情页有发音/词源/助记），行尾「+ 学」快捷入库。

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLexiStore, type WordEntry } from '@/store/lexiStore'
import { STATE_META, type WordState } from '@/lib/state-meta'
import { StateChip, SoundBtn, Eyebrow } from '@/components/screens/SharedUI'
import type { CefrLevel, DictionaryWord } from '@/lib/dictionary/dictionary-types'

type Tab = 'mine' | 'explore'
type MineFilter = 'all' | 'learning' | 'review' | 'weak' | 'mastered' | 'saved'

const MINE_FILTERS: { id: MineFilter; zh: string }[] = [
  { id: 'all', zh: '全部' },
  { id: 'learning', zh: '学习中' },
  { id: 'review', zh: '待复习' },
  { id: 'weak', zh: '薄弱' },
  { id: 'mastered', zh: '已掌握' },
  { id: 'saved', zh: '已收藏' },
]

const CEFR_CHIPS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const EXAM_CHIPS = ['CET-4', 'CET-6', 'IELTS', 'TOEFL', 'KAOYAN', 'GAOKAO', 'GRE'] as const
const PAGE = 30

// ── chip 通用样式 ──────────────────────────────────────────────
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="btn-press"
      style={{
        padding: '6px 14px', borderRadius: 99, flexShrink: 0,
        border: `1.5px solid ${active ? 'var(--teal-ink)' : 'var(--line)'}`,
        background: active ? 'var(--teal-bg)' : 'var(--card)',
        color: active ? 'var(--teal-ink)' : 'var(--ink-sub)',
        fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
        fontFamily: 'var(--font-sans)',
      }}>
      {children}
    </button>
  )
}

// ── 我的词行 ───────────────────────────────────────────────────
function MineRow({ entry, onOpen }: { entry: WordEntry; onOpen: () => void }) {
  return (
    <div onClick={onOpen} className="card-hover" role="button" tabIndex={0}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-news)' }}>{entry.word}</span>
          {entry.phon && <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>{entry.phon}</span>}
          {entry.saved && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--gold-ink)" stroke="var(--gold-ink)" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          )}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-sub)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.zh || '释义加载中…'}</div>
      </div>
      <span onClick={e => e.stopPropagation()}><SoundBtn word={entry.word} size={24} /></span>
      <StateChip state={entry.state} size="xs" />
    </div>
  )
}

// ── 探索词典行 ─────────────────────────────────────────────────
function ExploreRow({ dw, onOpen }: { dw: DictionaryWord; onOpen: () => void }) {
  const inStore = useLexiStore(s => s.words.find(w => w.id === dw.id))
  function add(e: React.MouseEvent) {
    e.stopPropagation()
    const lexi = useLexiStore.getState()
    lexi.ensureWord(dw, 'lookup')
    lexi.recordActivity('learned')
    lexi.incXp(10)
  }
  return (
    <div onClick={onOpen} className="card-hover" role="button" tabIndex={0}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid var(--line)', cursor: 'pointer' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-news)' }}>{dw.word}</span>
          {dw.phoneticIpa && <span style={{ fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>{dw.phoneticIpa}</span>}
          {dw.cefrLevel && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99, background: 'var(--teal-bg)', color: 'var(--teal-ink)', fontFamily: 'var(--font-mono)' }}>{dw.cefrLevel}</span>
          )}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-sub)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {dw.definitions[0]?.definitionZh ?? dw.definitions[0]?.definitionEn ?? ''}
        </div>
      </div>
      {inStore ? (
        <StateChip state={inStore.state} size="xs" />
      ) : (
        <button onClick={add} className="btn-press"
          style={{ flexShrink: 0, padding: '6px 13px', borderRadius: 99, border: '1.5px solid var(--teal-ink)', background: 'var(--teal-bg)', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: 'var(--teal-ink)', fontFamily: 'var(--font-sans)' }}>
          + 学
        </button>
      )}
    </div>
  )
}

// ── DictionaryScreen ───────────────────────────────────────────
export function DictionaryScreen() {
  const router = useRouter()
  const sp = useSearchParams()

  const tab: Tab = sp.get('tab') === 'explore' ? 'explore' : 'mine'
  const stateParam = sp.get('state')
  const mineFilter: MineFilter = MINE_FILTERS.some(f => f.id === stateParam) ? (stateParam as MineFilter) : 'all'
  const cefrParam = sp.get('cefr')
  const examParam = sp.get('exam')

  const words = useLexiStore(s => s.words)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DictionaryWord[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const offsetRef = useRef(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // chips 写 URL（router.replace，可分享/可后退）
  const patchUrl = useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k); else next.set(k, v)
    }
    const q = next.toString()
    router.replace(q ? `/dictionary?${q}` : '/dictionary')
  }, [router, sp])

  // ── 探索 tab：搜索 + chips + 分页（防抖 300ms）─────────────────
  const fetchExplore = useCallback(async (reset: boolean) => {
    setLoading(true)
    const offset = reset ? 0 : offsetRef.current
    try {
      const params = new URLSearchParams({ q: query.trim(), limit: String(PAGE), offset: String(offset) })
      if (cefrParam) params.set('cefr', cefrParam)
      if (examParam) params.set('exam', examParam)
      const res = await fetch(`/api/dictionary/search?${params}`)
      const { data } = await res.json() as { data?: DictionaryWord[] }
      const page = Array.isArray(data) ? data : []
      setResults(prev => reset ? page : [...prev, ...page])
      setHasMore(page.length === PAGE)
      offsetRef.current = offset + page.length
    } catch {
      if (reset) setResults([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [query, cefrParam, examParam])

  useEffect(() => {
    if (tab !== 'explore') return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { void fetchExplore(true) }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [tab, fetchExplore])

  // ── 我的词 tab：本地筛选 ───────────────────────────────────────
  const mineList = useMemo(() => {
    let list = words.filter(w => w.state !== 'locked' && w.state !== 'unknown')
    if (mineFilter === 'saved') list = list.filter(w => w.saved)
    else if (mineFilter !== 'all') list = list.filter(w => w.state === mineFilter)
    const q = query.toLowerCase().trim()
    if (q) list = list.filter(w => w.word.toLowerCase().includes(q) || w.zh.includes(q))
    return list
  }, [words, mineFilter, query])

  const open = (slug: string) => router.push(`/word/${slug}`)

  return (
    <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)', paddingBottom: 100 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 20px 0' }}>

        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <Eyebrow>词库</Eyebrow>
          <h1 style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-serif-zh)', color: 'var(--ink)' }}>词汇根系</h1>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={tab === 'mine' ? '在我的词中搜索…' : '搜索全词典…'}
            style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: 14, border: '1.5px solid var(--line)', background: 'var(--card)', fontSize: 15, color: 'var(--ink)', outline: 'none', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}
          />
        </div>

        {/* 双 tab（segmented pill） */}
        <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 14, background: 'var(--card-2)', border: '1px solid var(--line)', marginBottom: 14 }}>
          {([
            { id: 'mine' as Tab, zh: '我的词', n: words.filter(w => w.state !== 'locked' && w.state !== 'unknown').length },
            { id: 'explore' as Tab, zh: '探索词典', n: null },
          ]).map(t => {
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => patchUrl({ tab: t.id === 'mine' ? null : 'explore' })} className="btn-press"
                style={{
                  flex: 1, padding: '9px 8px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: active ? 'var(--card)' : 'transparent',
                  boxShadow: active ? 'var(--card-shadow-sm)' : 'none',
                  fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-sans)',
                  color: active ? 'var(--teal-ink)' : 'var(--ink-muted)',
                }}>
                {t.zh}
                {t.n != null && <span style={{ marginLeft: 5, fontSize: 11, opacity: 0.7, fontFamily: 'var(--font-mono)' }}>{t.n}</span>}
              </button>
            )
          })}
        </div>

        {/* chips 行 */}
        {tab === 'mine' ? (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 14, scrollbarWidth: 'none' }}>
            {MINE_FILTERS.map(f => (
              <Chip key={f.id} active={mineFilter === f.id}
                onClick={() => patchUrl({ state: f.id === 'all' ? null : f.id })}>
                {f.zh}
                {f.id !== 'all' && ` · ${f.id === 'saved' ? words.filter(w => w.saved).length : words.filter(w => w.state === f.id).length}`}
              </Chip>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 14, scrollbarWidth: 'none' }}>
            {CEFR_CHIPS.map(c => (
              <Chip key={c} active={cefrParam === c}
                onClick={() => patchUrl({ cefr: cefrParam === c ? null : c })}>
                {c}
              </Chip>
            ))}
            <span style={{ width: 1, background: 'var(--line)', flexShrink: 0, margin: '4px 2px' }} />
            {EXAM_CHIPS.map(e => (
              <Chip key={e} active={examParam === e}
                onClick={() => patchUrl({ exam: examParam === e ? null : e })}>
                {e}
              </Chip>
            ))}
          </div>
        )}

        {/* 列表 */}
        <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--line)', overflow: 'hidden' }}>
          {tab === 'mine' ? (
            mineList.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 14 }}>
                {query ? '未找到匹配词汇' : '这里还空着——去「探索词典」找词加入学习'}
              </div>
            ) : (
              mineList.map(w => <MineRow key={w.id} entry={w} onOpen={() => open(w.id)} />)
            )
          ) : (
            results.length === 0 && !loading ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 14 }}>
                未找到匹配词汇 — 换个关键词或筛选试试
              </div>
            ) : (
              results.map(dw => <ExploreRow key={dw.id} dw={dw} onOpen={() => open(dw.id)} />)
            )
          )}
        </div>

        {/* 探索 tab 分页 */}
        {tab === 'explore' && (loading || hasMore) && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
            <button onClick={() => void fetchExplore(false)} disabled={loading} className="btn-press"
              style={{ padding: '10px 26px', borderRadius: 999, border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--ink-sub)', fontFamily: 'var(--font-sans)' }}>
              {loading ? '加载中…' : '加载更多'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
