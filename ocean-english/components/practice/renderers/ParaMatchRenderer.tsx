'use client'
/* ParaMatchRenderer — 段落信息匹配（多对一）。
   文章按段落 A–F 标号；每条陈述指派一个段落字母，同一段落可被多条陈述选中（多对一）。
   桌面两栏：文章在左、陈述在右；窄屏单列 + select 回退。
   安全红线：提交前不渲染正解；正解/解析只来自 review.paraMatch（submitted=true 后下发）。 */
import { useEffect, useMemo, useState, type ChangeEvent } from 'react'

export interface ParaItem { label: string; text: string }
export interface StmtItem { id: string; text: string }

export interface ParaMatchBody {
  title?: string
  ask?: string
  paragraphs: ParaItem[]
  statements: StmtItem[]
}

export interface ParaMatchReview {
  /** 每条陈述正解段落字母（多对一：value 可重复） */
  key: Record<string, string>
  explanationZh: string
}

export interface ParaMatchRendererProps {
  body?: ParaMatchBody | null
  submitted?: boolean
  review?: { paraMatch?: ParaMatchReview } | null
  onCanSubmit?: (canSubmit: boolean) => void
  onChange?: (assign: Record<string, string>) => void
}

export function ParaMatchRenderer({
  body, submitted = false, review, onCanSubmit, onChange,
}: ParaMatchRendererProps) {
  const paragraphs = useMemo(() => body?.paragraphs ?? [], [body])
  const statements = useMemo(() => body?.statements ?? [], [body])
  const [assign, setAssign] = useState<Record<string, string>>({})   // {statementId: paraLabel}
  const [hl, setHl] = useState<string | null>(null)                  // 高亮段落

  const allAssigned = statements.length > 0 && statements.every(s => assign[s.id])
  useEffect(() => { onCanSubmit?.(allAssigned) }, [allAssigned, onCanSubmit])
  useEffect(() => { onChange?.(assign) }, [assign, onChange])

  const key = review?.paraMatch?.key ?? {}
  const labels = paragraphs.map(p => p.label)

  const pick = (sid: string, label: string) => {
    if (submitted) return
    setAssign(a => ({ ...a, [sid]: a[sid] === label ? '' : label }))
    setHl(label)
  }

  if (!body || paragraphs.length === 0 || statements.length === 0) {
    return (
      <div className="prompt muted" role="note">
        <div className="zh">该题暂无可用题体</div>
        <div className="ask">题库就绪后自动可练（段落信息匹配）</div>
      </div>
    )
  }

  return (
    <div className="fade-up">
      <div className="pr-split pm">
        <div className="pr-split-main">
          <div className="pr-passage" style={{ padding: '20px 18px' }}>
            {body.title && <div className="ptitle">{body.title}</div>}
            <div className="pr-pmatch-arts">
              {paragraphs.map(p => (
                <div key={p.label} className={'pr-para' + (hl === p.label ? ' hl' : '')} id={'para-' + p.label}>
                  <button type="button" className="plabel" aria-label={`段落 ${p.label}，点击高亮`}
                    onClick={() => setHl(h => (h === p.label ? null : p.label))}>{p.label}</button>
                  <div className="ptext">{p.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="pr-split-side">
          <div className="pr-stmt-wrap">
            <div className="pr-side-head">为每条信息选出对应段落（同一段落可对应多条）</div>
            <div className="pr-stmts">
              {statements.map((s, si) => {
                const cur = assign[s.id]
                const correct = key[s.id]
                const ok = submitted && cur === correct
                const cls = 'pr-stmt' + (submitted ? (ok ? ' ok' : ' no') : (cur ? ' assigned' : ''))
                return (
                  <div key={s.id} className={cls}>
                    <span className="stxt"><b className="snum">{si + 1}</b>{s.text}</span>
                    {submitted ? (
                      <span className="pr-stmt-pick">
                        <span className="smark"><span className={'pr-mark ' + (ok ? 'ok' : 'no')}>{ok ? '✓' : '✗'}</span></span>
                        <span className="scorr">{!ok && <s>{cur || '—'}</s>}{correct}</span>
                      </span>
                    ) : (
                      <span className="pr-stmt-pick">
                        <span className="pr-letters" role="radiogroup" aria-label={`第 ${si + 1} 条对应段落`}>
                          {labels.map((L, li) => (
                            <button key={L} type="button" role="radio" aria-checked={cur === L}
                              tabIndex={cur === L || (!cur && li === 0) ? 0 : -1}
                              className={'pr-letter' + (cur === L ? ' on' : '')}
                              onMouseEnter={() => setHl(L)} onMouseLeave={() => setHl(null)}
                              onClick={() => pick(s.id, L)}>{L}</button>
                          ))}
                        </span>
                        <span className="pr-letter-sel">
                          <select value={cur || ''} aria-label={`第 ${si + 1} 条对应段落`}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setAssign(a => ({ ...a, [s.id]: e.target.value }))}>
                            <option value="">选段落</option>
                            {labels.map(L => <option key={L} value={L}>{L}</option>)}
                          </select>
                        </span>
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </aside>
      </div>

      {submitted && review?.paraMatch && (() => {
        const right = statements.filter(s => assign[s.id] === key[s.id]).length
        const allOk = right === statements.length
        return (
          <div className={'explain ' + (allOk ? 'ok' : 'no')} role="status" aria-live="polite">
            <div className="ex-head">{allOk ? '全部正确' : '本题判定'}
              <span className={'scorepill ' + (allOk ? 'ok' : 'partial')} style={{ marginLeft: 'auto' }}>{right}/{statements.length}</span>
            </div>
            <div className="ex-body"><b>解析：</b>{review.paraMatch.explanationZh}</div>
          </div>
        )
      })()}
    </div>
  )
}
