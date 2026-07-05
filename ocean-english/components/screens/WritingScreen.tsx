'use client'
/* ============================================================================
   WritingScreen.tsx — D16 造句练习 Writing
   用目标词造句 → AI 老师给中文反馈（评分 + 做得好 + 修改建议 + 润色版）。
   目标词取自用户学习库（优先在学/复习/薄弱的词）。
   批改优先 /api/ai/writing；未配置 AI / 失败时降级到本地启发式批改（仍可用）。
   提交达标即 recordDimPass(id,'spell') → 喂报告「拼/产出」维度，补「写」这一练习。
   ============================================================================ */

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useLexiStore, type WordEntry } from '@/store/lexiStore'
import './screen-kit.css'
import './writing.css'

interface Feedback { score: number; title: string; sub: string; good: string[]; fix: string[]; polished: string }
type Phase = 'edit' | 'grading' | 'result'

function wordCount(s: string) { return (s.trim().match(/\S+/g) || []).length }

// 本地启发式批改（无 AI 时降级；中文反馈，纯文本）
function localGrade(text: string, target: WordEntry): Feedback {
  const low = text.toLowerCase()
  const stem = target.word.toLowerCase().slice(0, Math.max(4, target.word.length - 2))
  const hasWord = low.includes(target.word.toLowerCase()) || low.includes(stem)
  const wc = wordCount(text)
  const missBe = /\b(it|he|she|they|this|that)\s+(very|so|really)\b/i.test(text) && !/\b(is|are|was|were|am)\b/i.test(text)
  let score = 70
  const good: string[] = [], fix: string[] = []
  if (hasWord) { score += 12; good.push(`目标词 ${target.word} 用上了，语境合适，是这次练习的核心。`) }
  else { score -= 18; fix.push(`这次的目标词是 ${target.word}，记得把它用进句子里。`) }
  if (wc >= 8) { score += 6; good.push('句子完整、信息量足，表达清楚。') }
  if (missBe) { score -= 10; fix.push('形容词前缺少系动词 be —— 如「it very important」应改为「it is very important」。') }
  if (!/[.!?]$/.test(text.trim())) fix.push('句末记得加标点（. ! ?）。')
  if (fix.length === 0) fix.push('已经很地道了，试试用更精确的搭配让句子更出彩。')
  score = Math.max(40, Math.min(98, score))
  let polished = text.trim()
  if (missBe) polished = polished.replace(/\b(it|he|she|they|this|that)\s+(very|so|really)\b/i, m => { const p = m.split(/\s+/); return `${p[0]} is ${p[1]}` })
  if (!/[.!?]$/.test(polished)) polished += '.'
  const title = score >= 85 ? '写得很地道 ✦' : (score >= 70 ? '用词准确，可再打磨' : '方向对了，继续加油')
  const sub = hasWord ? `${target.word} 用对了！${fix.length > 1 ? '有几处可以更好。' : '细节再注意一下就完美。'}` : '记得用上目标词，会更扣题。'
  return { score, title, sub, good, fix, polished }
}

// 润色句里高亮目标词（纯 React，无 dangerouslySetInnerHTML）
function Polished({ text, word }: { text: string; word: string }) {
  const stem = word.toLowerCase()
  const parts = text.split(new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\w*)`, 'ig'))
  return <>{parts.map((p, i) => p.toLowerCase().startsWith(stem) ? <ins key={i}>{p}</ins> : <span key={i}>{p}</span>)}</>
}

export function WritingScreen() {
  const words = useLexiStore(s => s.words)
  const level = useLexiStore(s => s.profile.level)
  const recordDimPass = useLexiStore(s => s.recordDimPass)
  const recordActivity = useLexiStore(s => s.recordActivity)
  const incXp = useLexiStore(s => s.incXp)

  // 造句词池：优先在学/复习/薄弱，其次任意有释义的词
  const pool = useMemo(() => {
    const has = words.filter(w => w.zh && w.word && w.state !== 'locked' && w.state !== 'unknown')
    const pri = has.filter(w => w.state === 'learning' || w.state === 'review' || w.state === 'weak')
    return pri.length ? pri : has
  }, [words])

  const [wi, setWi] = useState(0)
  const [text, setText] = useState('')
  const [phase, setPhase] = useState<Phase>('edit')
  const [fb, setFb] = useState<Feedback | null>(null)
  const [saved, setSaved] = useState(false)
  const [showEg, setShowEg] = useState(false)
  const taRef = useRef<HTMLTextAreaElement>(null)

  const word = pool.length ? pool[wi % pool.length] : null
  const n = wordCount(text)

  async function submit() {
    if (!word || n < 3) return
    setPhase('grading')
    let result: Feedback
    try {
      const res = await fetch('/api/ai/writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word.word, zh: word.zh, sentence: text.trim(), level }),
      })
      if (res.ok) {
        const j = await res.json()
        result = { score: j.score, title: j.title, sub: j.sub, good: j.good ?? [], fix: j.fix ?? [], polished: j.polished }
      } else {
        result = localGrade(text, word)   // 503 未配置 / 502 provider → 本地降级
      }
    } catch {
      result = localGrade(text, word)
    }
    setFb(result)
    setPhase('result')
    const used = text.toLowerCase().includes(word.word.toLowerCase())
    if (result.score >= 60 && used) {
      recordDimPass(word.id, 'spell')
      recordActivity('quizzed')
      incXp(12)
    }
  }

  function nextWord() {
    setWi(i => i + 1); setText(''); setPhase('edit'); setFb(null); setSaved(false); setShowEg(false)
    setTimeout(() => taRef.current?.focus(), 50)
  }
  function retry() { setPhase('edit'); setFb(null); setShowEg(false); setTimeout(() => taRef.current?.focus(), 50) }
  function saveSentence() {
    if (!word) return
    try {
      const key = 'lexi-my-sentences'
      const list = JSON.parse(localStorage.getItem(key) || '[]')
      list.unshift({ word: word.word, sentence: text.trim(), polished: fb?.polished ?? '', t: Date.now() })
      localStorage.setItem(key, JSON.stringify(list.slice(0, 100)))
      setSaved(true)
    } catch { /* ignore */ }
  }

  // ── 空态：无可造句词 ──
  if (!word) {
    return (
      <div className="scr theme-light">
        <div className="wrap">
          <div className="eyebrow">D16 · 造句练习</div>
          <h1 className="h1">造句练习 <em>Writing</em></h1>
          <div className="state empty">
            <div className="state-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
              </svg>
            </div>
            <div className="state-title">还没有可造句的词 ✦</div>
            <div className="state-desc">先去学一些词、加入学习库，就能用它们来练造句。</div>
            <div className="state-acts">
              <Link className="btn btn-ink" href="/today">去学词</Link>
              <Link className="btn btn-ghost" href="/dictionary">逛词库</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const C = 2 * Math.PI * 22, off = fb ? C * (1 - fb.score / 100) : C

  return (
    <div className="scr theme-light">
      <div className="wrap">
        <div className="eyebrow">造句 · Writing</div>
        <h1 className="h1">用它，才算真记住</h1>
        <p className="sub">给你一个词，写一个句子 —— AI 会像老师一样给你中文反馈。</p>

        <div className="wr-prompt">
          <div className="wr-k">今日造句词</div>
          <div className="wr-word">{word.word}</div>
          {word.phon && <div className="wr-ipa">{word.phon}</div>}
          <div className="wr-zh">{word.pos ? `${word.pos} ` : ''}{word.zh}</div>
          <div className="wr-hint">💡 试着用 {word.word} 写一句能体现它含义的话。</div>
        </div>

        <div className="wr-box">
          <textarea
            ref={taRef}
            className="wr-ta"
            placeholder={`Write a sentence using "${word.word}"…`}
            value={text}
            disabled={phase !== 'edit'}
            onChange={e => setText(e.target.value)}
            autoFocus
          />
          <div className="wr-tools">
            <span className="wr-count">{n} 词</span>
            {word.ex && <span className="wr-chip" onClick={() => setShowEg(s => !s)}>{showEg ? '收起例句' : '看个例句'}</span>}
            <button className="wr-submit" disabled={n < 3 || phase !== 'edit'} onClick={submit}>提交批改</button>
          </div>
        </div>
        {showEg && word.ex && (
          <div className="wr-fb-rev" style={{ marginTop: 10 }}><Polished text={word.ex} word={word.word} /></div>
        )}

        {phase === 'grading' && (
          <div className="wr-fb">
            <div className="wr-fb-body" style={{ textAlign: 'center', padding: 28 }}>
              <div className="wr-grading"><i /><i /><i /><i /><i /></div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-sub)', marginTop: 10 }}>AI 老师正在批改…</div>
            </div>
          </div>
        )}

        {phase === 'result' && fb && (
          <div className="wr-fb">
            <div className="wr-fb-score">
              <svg className="wr-fb-ring" width="56" height="56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="var(--line)" strokeWidth="6" />
                <circle cx="28" cy="28" r="22" fill="none" stroke="var(--teal-ink)" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={C} strokeDashoffset={off} transform="rotate(-90 28 28)" />
                <text x="28" y="33" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="16" fontWeight="700" fill="var(--teal-ink)">{fb.score}</text>
              </svg>
              <div className="wr-fb-st"><div className="t">{fb.title}</div><div className="s">{fb.sub}</div></div>
            </div>
            <div className="wr-fb-body">
              {fb.good.length > 0 && (
                <div className="wr-fb-sec">
                  <div className="wr-fb-lab good">✓ 做得好</div>
                  <div className="wr-fb-txt">{fb.good.map((g, i) => <div key={i}>{g}</div>)}</div>
                </div>
              )}
              <div className="wr-fb-sec">
                <div className="wr-fb-lab fix">✎ 修改建议</div>
                <div className="wr-fb-txt">{fb.fix.map((g, i) => <div key={i}>{g}</div>)}</div>
              </div>
              <div className="wr-fb-sec">
                <div className="wr-fb-lab good">✦ 润色版</div>
                <div className="wr-fb-rev"><Polished text={fb.polished} word={word.word} /></div>
              </div>
              <div className="wr-fb-acts">
                <button className="btn btn-primary" onClick={nextWord}>换个词再写</button>
                <button className="btn btn-ghost" onClick={retry}>改改再交</button>
                <button className="btn btn-ghost" onClick={saveSentence} disabled={saved}>{saved ? '✓ 已收藏' : '收藏这句'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
