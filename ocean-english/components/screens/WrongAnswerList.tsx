'use client'
// WrongAnswerList — 错题本列表（/memory?tab=wrong）
// 题面 / 我的答案 / 正确答案 / 解析折叠 / 重练 / 移除；同词折叠 ×N

import { useMemo } from 'react'
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

      {latest.question && (
        <div style={{ fontFamily: 'var(--font-news)', fontSize: 15, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.45, marginBottom: 12 }}>{latest.question}</div>
      )}

      {/* D12：彩色答案行（错=玫瑰底 / 对=青底 + 图标） */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: latest.explanation ? 10 : 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, padding: '8px 12px', borderRadius: 10, background: 'var(--rose-bg)', color: 'var(--ink)' }}>
          <span style={{ width: 16, flexShrink: 0, display: 'flex', color: 'var(--rose-ink)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-muted)', marginRight: 2 }}>你的答案</span>{latest.userAnswer}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, padding: '8px 12px', borderRadius: 10, background: 'var(--teal-bg)', color: 'var(--ink)' }}>
          <span style={{ width: 16, flexShrink: 0, display: 'flex', color: 'var(--teal-ink)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-muted)', marginRight: 2 }}>正确答案</span>{latest.correctAnswer}
        </div>
      </div>

      {latest.explanation && (
        <div style={{ fontFamily: 'var(--font-serif-zh)', fontSize: 12.5, color: 'var(--ink-sub)', lineHeight: 1.6, paddingLeft: 11, borderLeft: '2px solid var(--line-strong)' }}>
          {latest.explanation}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button onClick={() => onRetry(latest.wordId)} className="btn-press"
          style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1.5px solid var(--teal-ink)', background: 'var(--teal-bg)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--teal-ink)', fontFamily: 'var(--font-sans)' }}>
          重练
        </button>
        {/* P5-A4：错因是易混词（错选了另一个词）→ 词图看辨析 */}
        {/^[a-zA-Z][a-zA-Z' -]*$/.test(latest.userAnswer)
          && latest.userAnswer.toLowerCase() !== latest.correctAnswer.toLowerCase()
          && /^[a-zA-Z][a-zA-Z' -]*$/.test(latest.correctAnswer) && (
          <a href={`/lexigraph?word=${encodeURIComponent(latest.wordId)}&focus=conf`} className="btn-press"
            style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(212,71,126,0.4)', background: 'rgba(212,71,126,0.06)', fontSize: 13, fontWeight: 600, color: '#d4477e', fontFamily: 'var(--font-sans)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            词图看辨析
          </a>
        )}
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, margin: '4px 0 12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>共 <b style={{ color: 'var(--rose-ink)', fontFamily: 'var(--font-mono)' }}>{wrongAnswers.length}</b> 道错题待巩固</span>
        <button onClick={() => navigate('quiz', { word: groups[0][0].wordId })} className="btn-press"
          style={{ padding: '8px 16px', borderRadius: 999, border: 'none', background: 'var(--teal-ink)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-sans)' }}>
          全部重做 →
        </button>
      </div>
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
