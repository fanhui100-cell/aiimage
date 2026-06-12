'use client'
/* ============================================================================
   ReadingScreen — F3-2 阅读板块真实化
   列表按「生词率」排序（keyWords ∩ 用户词状态真实计算）；
   文内词典词可点 → 浮层（真实词典释义中英 + 加入学习 ensureWord 'reading'）。
   ============================================================================ */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLexiStore } from '@/store/lexiStore'
import { READING_ARTICLES, type ReadingArticle } from '@/lib/reading/articles'
import { LV_LABEL } from '@/lib/reading/level-label'
import { BackBtn } from '@/components/screens/SharedUI'
import type { DictionaryWord } from '@/lib/dictionary/dictionary-types'

const DONE_KEY = 'reading-done-v1'

function loadDone(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(DONE_KEY) ?? '[]')) } catch { return new Set() }
}

/* ── 词浮层：真实词典数据 + 加入学习 ───────────────────────────────────────── */
function WordPopup({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [dict, setDict] = useState<DictionaryWord | null | 'loading'>('loading')
  const inStore = useLexiStore(s => s.words.find(w => w.id === slug))
  const [added, setAdded] = useState(false)

  useEffect(() => {
    let cancelled = false
    setDict('loading')
    fetch(`/api/dictionary/word/${encodeURIComponent(slug)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(json => { if (!cancelled) setDict(json?.data ?? null) })
      .catch(() => { if (!cancelled) setDict(null) })
    return () => { cancelled = true }
  }, [slug])

  const def = dict !== 'loading' && dict ? dict.definitions?.[0] : null

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(10,20,28,0.3)' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: 'min(560px, 100%)', background: 'var(--card)', borderRadius: '16px 16px 0 0', boxShadow: 'var(--shadow-hover)', padding: '20px 24px calc(20px + env(safe-area-inset-bottom))' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-news)' }}>{slug}</span>
          {dict !== 'loading' && dict?.phoneticIpa && (
            <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>{dict.phoneticIpa}</span>
          )}
          <button onClick={onClose} style={{ marginLeft: 'auto', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink-muted)', fontSize: 16 }}>✕</button>
        </div>
        {dict === 'loading' ? (
          <div style={{ fontSize: 13, color: 'var(--ink-muted)', margin: '10px 0' }}>查询词典中…</div>
        ) : dict ? (
          <>
            <div style={{ fontSize: 15, color: 'var(--teal-ink)', margin: '8px 0 2px', fontFamily: 'var(--font-serif-zh)' }}>
              {def?.definitionZh ?? def?.definitionEn ?? ''}
            </div>
            {def?.definitionEn && def.definitionZh && (
              <div style={{ fontSize: 12.5, color: 'var(--ink-sub)' }}>{def.definitionEn}</div>
            )}
            {dict.examples?.[0]?.sentenceEn && (
              <div style={{ fontSize: 12.5, color: 'var(--ink-sub)', fontStyle: 'italic', marginTop: 8, lineHeight: 1.6 }}>
                “{dict.examples[0].sentenceEn}”
                {dict.examples[0].sentenceZh && <span style={{ display: 'block', fontStyle: 'normal', color: 'var(--ink-muted)', fontSize: 12 }}>{dict.examples[0].sentenceZh}</span>}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              {inStore || added ? (
                <span style={{ padding: '9px 16px', borderRadius: 10, background: 'var(--teal-bg)', color: 'var(--teal-ink)', fontSize: 13, fontWeight: 700 }}>
                  ✓ {added ? '已加入学习' : '已在学习库'}
                </span>
              ) : (
                <button className="btn-press" onClick={() => {
                  const lexi = useLexiStore.getState()
                  lexi.ensureWord(dict, 'reading')
                  lexi.recordActivity('learned')
                  setAdded(true)
                }} style={{ padding: '9px 16px', borderRadius: 10, border: 'none', background: 'var(--teal-ink)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                  + 加入学习
                </button>
              )}
              <a href={`/word/${slug}`} style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid var(--line-strong)', color: 'var(--ink)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>词详情 →</a>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--ink-muted)', margin: '10px 0' }}>词典暂无此词。</div>
        )}
      </div>
    </div>
  )
}

/* ── 正文渲染：keyWords 命中词高亮可点（词形近似：前缀匹配 stem）──────────── */
function ArticleBody({ article, onPick }: { article: ReadingArticle; onPick: (slug: string) => void }) {
  const keySet = useMemo(() => new Set(article.keyWords), [article])
  const findKey = useCallback((token: string): string | null => {
    const w = token.toLowerCase().replace(/[^a-z]/g, '')
    if (!w) return null
    if (keySet.has(w)) return w
    // 词形近似：复数/时态等简单后缀回退（arranges→arrange / preserved→preserve）
    for (const k of article.keyWords) {
      if (w.startsWith(k) && w.length - k.length <= 3) return k
      if (k.length >= 5 && w.startsWith(k.slice(0, -1)) && w.length - k.length <= 3) return k
    }
    return null
  }, [keySet, article])

  return (
    <div style={{ fontSize: 16, lineHeight: 1.9, color: 'var(--ink)', fontFamily: 'var(--font-news)' }}>
      {article.text.split('\n\n').map((para, pi) => (
        <p key={pi} style={{ margin: '0 0 18px' }}>
          {para.split(/(\s+)/).map((token, ti) => {
            const slug = findKey(token)
            if (!slug) return <span key={ti}>{token}</span>
            return (
              <button key={ti} onClick={() => onPick(slug)}
                style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: 'var(--teal-ink)', borderBottom: '1.5px dashed rgba(14,140,122,0.4)' }}>
                {token}
              </button>
            )
          })}
        </p>
      ))}
    </div>
  )
}

/* ── 主屏 ─────────────────────────────────────────────────────────────────── */
export function ReadingScreen() {
  const words = useLexiStore(s => s.words)
  const [openId, setOpenId] = useState<string | null>(null)
  const [pickedWord, setPickedWord] = useState<string | null>(null)
  const [doneSet, setDoneSet] = useState<Set<string>>(new Set())
  useEffect(() => { setDoneSet(loadDone()) }, [])

  // 生词率 = keyWords 中未掌握比例（mastered 之外都算待学，未入库算生词）
  const ranked = useMemo(() => {
    const stateOf = new Map(words.map(w => [w.id, w.state]))
    return READING_ARTICLES.map(a => {
      const unknown = a.keyWords.filter(k => {
        const st = stateOf.get(k)
        return !st || st === 'unknown' || st === 'recommended'
      }).length
      const unmastered = a.keyWords.filter(k => stateOf.get(k) !== 'mastered').length
      return { article: a, newRate: Math.round(unknown / a.keyWords.length * 100), unmastered }
    }).sort((x, y) => y.newRate - x.newRate)
  }, [words])

  const current = openId ? READING_ARTICLES.find(a => a.id === openId) : null

  if (current) {
    const done = doneSet.has(current.id)
    return (
      <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)', paddingBottom: 80 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 20px 0' }}>
          <BackBtn onClick={() => setOpenId(null)} />
          <p style={{ margin: '18px 0 4px', fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.15em', color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
            {LV_LABEL[current.level]} · {current.minutes} min read · 点下划线词查词
          </p>
          <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-news)', color: 'var(--ink)' }}>{current.title}</h1>
          <div style={{ fontSize: 14, color: 'var(--ink-sub)', fontFamily: 'var(--font-serif-zh)', marginBottom: 24 }}>{current.titleZh}</div>
          <ArticleBody article={current} onPick={setPickedWord} />
          <button className="btn-press" onClick={() => {
            const next = new Set(doneSet)
            if (done) next.delete(current.id); else next.add(current.id)
            setDoneSet(next)
            localStorage.setItem(DONE_KEY, JSON.stringify([...next]))
          }} style={{ marginTop: 16, padding: '11px 22px', borderRadius: 99, border: done ? '1px solid var(--line-strong)' : 'none', background: done ? 'transparent' : 'var(--teal-ink)', color: done ? 'var(--ink-sub)' : '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            {done ? '✓ 已读完 · 点击取消' : '标记读完'}
          </button>
        </div>
        {pickedWord && <WordPopup slug={pickedWord} onClose={() => setPickedWord(null)} />}
      </div>
    )
  }

  return (
    <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)', paddingBottom: 100 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 20px 0' }}>
        <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--teal-ink)', opacity: 0.72 }}>精读 · Reading</p>
        <h1 style={{ margin: '4px 0 6px', fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-serif-zh)', color: 'var(--ink)' }}>边读边收生词</h1>
        <p style={{ margin: '0 0 24px', fontSize: 13.5, color: 'var(--ink-sub)' }}>按你的生词率排序 — 生词越多的文章越值得读。点文中下划线词即可查词入库。</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ranked.map(({ article: a, newRate }, i) => (
            <button key={a.id} onClick={() => setOpenId(a.id)} className="btn-press card-hover stagger-item"
              style={{ animationDelay: `${i * 30}ms`, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--shadow-rest)', padding: '18px 20px', cursor: 'pointer' }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-news)' }}>{a.title}</span>
                  {doneSet.has(a.id) && <span style={{ fontSize: 10.5, color: 'var(--teal-ink)', fontWeight: 700 }}>✓ 已读</span>}
                </span>
                <span style={{ display: 'block', fontSize: 12.5, color: 'var(--ink-sub)' }}>
                  {a.titleZh} · {LV_LABEL[a.level]} · {a.minutes} min · {a.keyWords.length} 个词典词
                </span>
              </span>
              <span style={{ flexShrink: 0, textAlign: 'center' }}>
                <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: newRate >= 50 ? 'var(--gold-ink)' : 'var(--teal-ink)' }}>{newRate}%</span>
                <span style={{ fontSize: 10, color: 'var(--ink-muted)' }}>生词率</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
