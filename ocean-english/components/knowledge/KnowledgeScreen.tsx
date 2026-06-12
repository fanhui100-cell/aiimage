'use client'
/* ============================================================================
   KnowledgeScreen — F5 知识库真实化
   照 LexiVault 信息架构（Feed / 词脊 / 复习 / 统计）重建，数据全真：
   feed=log+history 学习事件流；词脊=words[]（学过自动长出）；
   复习=真实到期队列（reviewGrade 与 /memory 同源）；统计=daily/streak/掌握度。
   原 17MB bundle 为加密构建产物（lv-data.jsx 源未随包提供，无外部数据钩子），
   保留为「原型预览」入口（/lexivault.html），本组件承接全部真实功能。
   ============================================================================ */

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLexiStore, type WordEntry } from '@/store/lexiStore'
import { STATE_META, type WordState } from '@/lib/state-meta'
import { NumberRoll } from '@/components/ui/NumberRoll'

type Tab = 'feed' | 'spine' | 'review' | 'stats'

const TABS: { id: Tab; zh: string; en: string }[] = [
  { id: 'feed', zh: '动态', en: 'Feed' },
  { id: 'spine', zh: '词脊', en: 'Spines' },
  { id: 'review', zh: '复习', en: 'Review' },
  { id: 'stats', zh: '统计', en: 'Stats' },
]

const relTime = (t: number) => {
  const d = Date.now() - t
  if (d < 3600_000) return `${Math.max(1, Math.floor(d / 60000))} 分钟前`
  if (d < 86_400_000) return `${Math.floor(d / 3600_000)} 小时前`
  return `${Math.floor(d / 86_400_000)} 天前`
}

/* ── Feed：log 状态变迁 + history 每日聚合 ────────────────────────────────── */
function FeedTab({ onOpenWord }: { onOpenWord: (id: string) => void }) {
  const log = useLexiStore(s => s.log)
  const history = useLexiStore(s => s.history)

  const items = useMemo(() => {
    const evts: { t: number; title: string; sub: string; wordId?: string; color: string }[] = []
    for (const e of log) {
      const m = STATE_META[e.to as WordState]
      evts.push({
        t: e.t, wordId: e.id, color: m?.light ?? 'var(--ink-muted)',
        title: `${e.word} → ${m?.zh ?? e.to}`,
        sub: `${e.note}${e.from !== 'unknown' ? ` · 自「${STATE_META[e.from as WordState]?.zh ?? e.from}」` : ''}`,
      })
    }
    // history 每日聚合（log 之外的较早日子）
    for (const [date, d] of Object.entries(history).slice(-14)) {
      const total = d.learned + d.quizzed + d.reviewed
      if (!total) continue
      evts.push({
        t: new Date(date).getTime() + 86_399_000, color: 'var(--teal-ink)',
        title: `${date} 学习日`,
        sub: `学 ${d.learned} · 练 ${d.quizzed} · 复 ${d.reviewed}`,
      })
    }
    return evts.sort((a, b) => b.t - a.t).slice(0, 40)
  }, [log, history])

  if (!items.length) {
    return <Empty text="学习行为会自动写入这里 — 先去学今天的词包" cta="去学习" href="/today" />
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {items.map((e, i) => (
        <button key={i} onClick={() => e.wordId && onOpenWord(e.wordId)}
          className={e.wordId ? 'btn-press' : undefined}
          style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', padding: '11px 14px', borderRadius: 10, border: 'none', background: 'transparent', cursor: e.wordId ? 'pointer' : 'default', borderBottom: '1px solid var(--line)' }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: e.color, flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
            <span style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-muted)' }}>{e.sub}</span>
          </span>
          <span style={{ fontSize: 10.5, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{relTime(e.t)}</span>
        </button>
      ))}
    </div>
  )
}

/* ── 词脊：words[] 学过的词自动长出 ───────────────────────────────────────── */
function SpineTab({ openId, onOpenWord }: { openId: string | null; onOpenWord: (id: string | null) => void }) {
  const router = useRouter()
  const words = useLexiStore(s => s.words)
  const addToReview = useLexiStore(s => s.addToReview)
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // ⌘K 聚焦搜索
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); inputRef.current?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const list = useMemo(() => {
    const learned = words.filter(w => w.state !== 'locked' && w.state !== 'unknown')
    const qq = q.toLowerCase().trim()
    const hit = qq ? learned.filter(w => w.word.toLowerCase().includes(qq) || w.zh.includes(qq)) : learned
    return [...hit].sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0))
  }, [words, q])

  const open = openId ? words.find(w => w.id === openId) : null

  if (open) {
    const m = STATE_META[open.state]
    const due = open.nextReviewAt != null && open.nextReviewAt <= Date.now()
    return (
      <div>
        <button onClick={() => onOpenWord(null)} className="btn-press" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--teal-ink)', fontWeight: 600, padding: 0, marginBottom: 14, fontFamily: 'var(--font-sans)' }}>← 词脊列表</button>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-news)' }}>{open.word}</span>
          {open.phon && <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>{open.phon}</span>}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: m.light, background: `${m.light}14`, border: `1px solid ${m.light}40`, borderRadius: 99, padding: '2px 10px' }}>
            <i style={{ width: 6, height: 6, borderRadius: 99, background: m.light }} />{m.zh}
          </span>
        </div>
        <div style={{ fontSize: 15, color: 'var(--teal-ink)', fontFamily: 'var(--font-serif-zh)', margin: '6px 0 14px' }}>{open.zh}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginBottom: 18 }}>
          {([['连对', String(open.streak ?? 0)], ['间隔', `${open.interval ?? 0} 天`],
            ['下次复习', open.nextReviewAt ? (due ? '已到期' : new Date(open.nextReviewAt).toLocaleDateString()) : '—'],
            ['发音最佳', open.pronScore ? `${open.pronScore} 分` : '—']] as const).map(([k, v]) => (
            <div key={k} style={{ background: 'var(--paper)', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: 10.5, color: 'var(--ink-muted)' }}>{k}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: due && k === '下次复习' ? '#d4477e' : 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{v}</div>
            </div>
          ))}
        </div>
        {/* 动作区：全部真实路由/action */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <ActionBtn primary onClick={() => { addToReview(open.id) }}>↻ 加入今日复习</ActionBtn>
          <ActionBtn onClick={() => router.push(`/quiz?word=${encodeURIComponent(open.id)}`)}>考一考</ActionBtn>
          <ActionBtn onClick={() => router.push(`/lexigraph?word=${encodeURIComponent(open.id)}`)}>◈ 词图</ActionBtn>
          <ActionBtn onClick={() => router.push(`/lexiverse?word=${encodeURIComponent(open.id)}`)}>✦ 宇宙</ActionBtn>
          <ActionBtn onClick={() => router.push(`/word/${encodeURIComponent(open.id)}`)}>词详情 →</ActionBtn>
        </div>
      </div>
    )
  }

  return (
    <div>
      <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="搜索词脊（词/中文）… ⌘K"
        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--paper)', color: 'var(--ink)', fontSize: 13.5, outline: 'none', marginBottom: 12, fontFamily: 'var(--font-sans)' }} />
      {!list.length ? (
        <Empty text={q ? '没有匹配的词脊' : '学过的词会自动在这里长出词脊'} cta={q ? undefined : '去学习'} href="/today" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {list.slice(0, 60).map(w => {
            const m = STATE_META[w.state]
            return (
              <button key={w.id} onClick={() => onOpenWord(w.id)} className="btn-press"
                style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', padding: '11px 12px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: '1px solid var(--line)' }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: m.light, flexShrink: 0 }} />
                <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-news)', flexShrink: 0 }}>{w.word}</span>
                <span style={{ flex: 1, fontSize: 12.5, color: 'var(--ink-sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.zh}</span>
                <span style={{ fontSize: 10.5, color: m.light, fontWeight: 700, flexShrink: 0 }}>{m.zh}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── 复习：真实到期队列就地闪卡（reviewGrade 与 /memory 同源）─────────────── */
function ReviewTab() {
  const words = useLexiStore(s => s.words)
  const reviewGrade = useLexiStore(s => s.reviewGrade)
  const recordActivity = useLexiStore(s => s.recordActivity)
  const [flipped, setFlipped] = useState(false)

  const due = useMemo(() => {
    const now = Date.now()
    return words.filter(w => w.nextReviewAt != null && w.nextReviewAt <= now)
  }, [words])

  const current = due[0]
  if (!current) {
    return <Empty text="没有到期的词 — 记忆状态良好 ✓" cta="看完整复习中心" href="/memory" />
  }

  const grades = [['again', '忘了', '#d4477e'], ['hard', '勉强', '#d2792f'], ['good', '记得', '#3b5bd9'], ['easy', '简单', '#0e8c7a']] as const
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 12 }}>到期队列 {due.length} 词 · 与 /memory 同一队列</div>
      <div onClick={() => setFlipped(f => !f)}
        style={{ background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 16, padding: '36px 24px', cursor: 'pointer', marginBottom: 14 }}>
        <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-news)' }}>{current.word}</div>
        {flipped
          ? <div style={{ fontSize: 16, color: 'var(--teal-ink)', marginTop: 10, fontFamily: 'var(--font-serif-zh)' }}>{current.zh}</div>
          : <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 10 }}>点击翻面 · 先回忆</div>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, opacity: flipped ? 1 : 0.4, pointerEvents: flipped ? 'auto' : 'none', transition: 'opacity .2s' }}>
        {grades.map(([g, zh, color]) => (
          <button key={g} className="btn-press"
            onClick={() => { reviewGrade(current.id, g); recordActivity('reviewed'); setFlipped(false) }}
            style={{ padding: '11px 4px', borderRadius: 10, border: `1px solid ${color}55`, background: `${color}0e`, color, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
            {zh}
          </button>
        ))}
      </div>
      <Link href="/memory" style={{ display: 'inline-block', marginTop: 14, fontSize: 12.5, color: 'var(--teal-ink)', fontWeight: 600, textDecoration: 'none' }}>进入完整复习 →</Link>
    </div>
  )
}

/* ── 统计：daily/streak/掌握度真实数字 ────────────────────────────────────── */
function StatsTab() {
  const daily = useLexiStore(s => s.daily)
  const streak = useLexiStore(s => s.streakData)
  const words = useLexiStore(s => s.words)
  const xp = useLexiStore(s => s.xp)
  const pct = useLexiStore(s => s.masteredPct())
  const learned = words.filter(w => !['locked', 'unknown'].includes(w.state)).length
  const mastered = words.filter(w => w.state === 'mastered').length

  const cells: [string, string | number][] = [
    ['今日学', daily.learned], ['今日练', daily.quizzed], ['今日复', daily.reviewed],
    ['连续天数', `${streak.current} 天`], ['最长连续', `${streak.longest} 天`], ['总 XP', xp],
    ['已学词', learned], ['已掌握', mastered],
  ]
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 34, fontWeight: 700, color: 'var(--teal-ink)', fontFamily: 'var(--font-mono)' }}><NumberRoll value={pct} />%</span>
        <span style={{ fontSize: 13, color: 'var(--ink-sub)' }}>词库掌握度</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
        {cells.map(([k, v]) => (
          <div key={k} style={{ background: 'var(--paper)', borderRadius: 12, padding: '14px', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{k}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── 公共件 ──────────────────────────────────────────────────────────────── */
function Empty({ text, cta, href }: { text: string; cta?: string; href?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 16px' }}>
      <div style={{ fontSize: 13.5, color: 'var(--ink-sub)', marginBottom: 14 }}>{text}</div>
      {cta && href && (
        <Link href={href} style={{ display: 'inline-block', padding: '9px 20px', borderRadius: 99, background: 'var(--teal-ink)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>{cta} →</Link>
      )}
    </div>
  )
}

function ActionBtn({ children, primary, onClick }: { children: React.ReactNode; primary?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="btn-press"
      style={{ padding: '9px 15px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)', border: primary ? 'none' : '1px solid var(--line-strong)', background: primary ? 'var(--teal-ink)' : 'var(--card)', color: primary ? '#fff' : 'var(--ink)' }}>
      {children}
    </button>
  )
}

/* ── 主屏 ────────────────────────────────────────────────────────────────── */
export function KnowledgeScreen() {
  const [tab, setTab] = useState<Tab>('feed')
  const [openWordId, setOpenWordId] = useState<string | null>(null)
  const log = useLexiStore(s => s.log)

  const todayNew = useMemo(() => {
    const dayStart = new Date(new Date().setHours(0, 0, 0, 0)).getTime()
    return new Set(log.filter(e => e.t >= dayStart).map(e => e.id)).size
  }, [log])

  const openWord = (id: string) => { setOpenWordId(id); setTab('spine') }

  return (
    <div className="theme-light" style={{ minHeight: '100svh', background: 'var(--paper)', paddingBottom: 100 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--teal-ink)', opacity: 0.72 }}>知识库 · LexiVault</p>
            <h1 style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-serif-zh)', color: 'var(--ink)' }}>我的学习档案馆</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {todayNew > 0 && <span style={{ fontSize: 12, color: 'var(--teal-ink)', background: 'var(--teal-bg)', borderRadius: 99, padding: '3px 12px', fontWeight: 600 }}>今日 +{todayNew} 条</span>}
            <a href="/lexivault.html" target="_blank" rel="noreferrer" style={{ fontSize: 11.5, color: 'var(--ink-muted)', textDecoration: 'none' }}>原型预览 ↗</a>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 4, margin: '18px 0', borderBottom: '1px solid var(--line)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); if (t.id !== 'spine') setOpenWordId(null) }}
              style={{ padding: '9px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, fontFamily: 'var(--font-sans)', color: tab === t.id ? 'var(--teal-ink)' : 'var(--ink-muted)', borderBottom: tab === t.id ? '2px solid var(--teal-ink)' : '2px solid transparent', marginBottom: -1 }}>
              {t.zh} <small style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, opacity: 0.7 }}>{t.en}</small>
            </button>
          ))}
        </div>

        <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, boxShadow: 'var(--shadow-rest)', padding: '18px 20px' }}>
          {tab === 'feed' && <FeedTab onOpenWord={openWord} />}
          {tab === 'spine' && <SpineTab openId={openWordId} onOpenWord={setOpenWordId} />}
          {tab === 'review' && <ReviewTab />}
          {tab === 'stats' && <StatsTab />}
        </div>
      </div>
    </div>
  )
}
