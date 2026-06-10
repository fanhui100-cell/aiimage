'use client'
// WrongAnswerList — 错题本列表（/memory?tab=wrong）
// 题面 / 我的答案 / 正确答案 / 解析折叠 / 重练 / 移除；同词折叠 ×N

import { useMemo, useState } from 'react'
import { useLexiStore, type WrongAnswer } from '@/store/lexiStore'
import { useNavigate } from '@/hooks/useNavigate'
import { SoundBtn } from '@/components/screens/SharedUI'

/** 相对时间：刚刚 / N 小时前 / N 天前 */
function relTime(t: number): string {
  const diff = Date.now() - t
  if (diff < 3_600_000) return '刚刚'
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  return `${Math.floor(diff / 86_400_000)} 天前`
}

function WrongCard({ group, onRetry, onRemove }: {
  group: WrongAnswer[]
  onRetry: (wordId: string) => void
  onRemove: (ids: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const latest = group[0]
  const count = group.length

  return (
    <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--line)', padding: '16px 18px', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-news)' }}>{latest.word}</span>
        <SoundBtn word={latest.word} size={22} />
        {count > 1 && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 99, background: 'rgba(212,71,126,0.1)', color: '#d4477e', fontFamily: 'var(--font-mono)' }}>×{count}</span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>{relTime(latest.timestamp)}</span>
      </div>

      <div style={{ fontSize: 13, color: 'var(--ink-sub)', marginBottom: 8 }}>{latest.question}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
        <div style={{ color: '#d4477e' }}>我的答案：{latest.userAnswer}</div>
        <div style={{ color: '#0e8c7a' }}>正确答案：{latest.correctAnswer}</div>
      </div>

      {latest.explanation && (
        <button onClick={() => setOpen(o => !o)}
          style={{ marginTop: 8, padding: 0, border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--teal-ink)', fontFamily: 'var(--font-sans)' }}>
          {open ? '收起解析 ▲' : '查看解析 ▼'}
        </button>
      )}
      {open && latest.explanation && (
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--ink-muted)', lineHeight: 1.6, background: 'var(--card-2)', borderRadius: 10, padding: '10px 12px' }}>
          {latest.explanation}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button onClick={() => onRetry(latest.wordId)} className="btn-press"
          style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1.5px solid var(--teal-ink)', background: 'var(--teal-bg)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--teal-ink)', fontFamily: 'var(--font-sans)' }}>
          重练
        </button>
        <button onClick={() => onRemove(group.map(g => g.id))} className="btn-press"
          style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer', fontSize: 13, color: 'var(--ink-sub)', fontFamily: 'var(--font-sans)' }}>
          移除
        </button>
      </div>
    </div>
  )
}

export function WrongAnswerList() {
  const navigate = useNavigate()
  const wrongAnswers = useLexiStore(s => s.wrongAnswers)
  const removeWrongAnswer = useLexiStore(s => s.removeWrongAnswer)

  // 按 wordId 折叠，组内按时间倒序
  const groups = useMemo(() => {
    const map = new Map<string, WrongAnswer[]>()
    for (const w of wrongAnswers) {
      const arr = map.get(w.wordId) ?? []
      arr.push(w)
      map.set(w.wordId, arr)
    }
    return [...map.values()].map(arr => arr.sort((a, b) => b.timestamp - a.timestamp))
  }, [wrongAnswers])

  if (!groups.length) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ fontSize: 44 }}>📒</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-serif-zh)' }}>错题会自动归档到这里</div>
        <div style={{ fontSize: 13, color: 'var(--ink-sub)' }}>测验或考试答错后，错题就会出现在这一栏</div>
        <button onClick={() => navigate('quiz')} className="btn-press"
          style={{ marginTop: 4, padding: '12px 24px', borderRadius: 99, border: 'none', background: 'var(--teal-ink)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-sans)' }}>
          去测验
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '4px 2px' }}>
      {groups.map((group, i) => (
        <div key={group[0].wordId} className="stagger-item" style={{ animationDelay: `${Math.min(i, 9) * 30}ms` }}>
          <WrongCard
            group={group}
            onRetry={wordId => navigate('quiz', { word: wordId })}
            onRemove={ids => ids.forEach(id => removeWrongAnswer(id))}
          />
        </div>
      ))}
    </div>
  )
}
