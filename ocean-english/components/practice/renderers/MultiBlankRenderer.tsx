'use client'
/* MultiBlankRenderer — 多空填空（词库选词 / 自由输入双模式）。
   安全红线：提交前不渲染正解；正解/解析只来自 review.cloze（submitted=true 后下发），
   逐空对错在收到 review 后于客户端计算用于着色，正解文本只来自 review。 */
import { useEffect, useMemo, useState } from 'react'

/** 段落 token：字符串=文本，{ blank: n }=第 n 空 */
type ClozeToken = string | { blank: number }

export interface ClozeBody {
  /** 段落标题（可选） */
  title?: string
  /** 题面提问（固定提示语，可选；runner 的 eyebrow 已给题型标签） */
  ask?: string
  segments: ClozeToken[]
  /** 词库模式可选；缺省则纯自由输入 */
  bank?: string[]
}

/** 提交回合下发的批改（只在 submitted=true 后存在） */
export interface ClozeReview {
  /** 每空正解 */
  key: Record<number, string>
  explanationZh: string
}

export interface MultiBlankReview {
  cloze?: ClozeReview
}

export interface MultiBlankRendererProps {
  /** 题体（缺省 / 无 blank → 受控空态） */
  body?: ClozeBody | null
  submitted?: boolean
  /** 提交回合下发；含 key/explanationZh，提交前必为 undefined */
  review?: MultiBlankReview | null
  /** 上报「是否填满可提交」 */
  onCanSubmit?: (canSubmit: boolean) => void
  /** 上报当前作答 {blankNum: word}，供 runner 提交 */
  onChange?: (fills: Record<number, string>) => void
}

const norm = (s: string | undefined) => (s || '').trim().toLowerCase()

export function MultiBlankRenderer({
  body, submitted = false, review, onCanSubmit, onChange,
}: MultiBlankRendererProps) {
  const tokens = useMemo(() => body?.segments ?? [], [body])
  const blanks = useMemo(
    () => tokens.filter((t): t is { blank: number } => typeof t === 'object' && t != null).map(t => t.blank),
    [tokens],
  )

  const [mode, setMode] = useState<'bank' | 'text'>(body?.bank?.length ? 'bank' : 'text')
  const [fills, setFills] = useState<Record<number, string>>({})
  const [focus, setFocus] = useState<number | undefined>(blanks[0])

  const usedWords = Object.values(fills).filter(Boolean)
  const allFilled = blanks.length > 0 && blanks.every(b => (fills[b] || '').trim())

  useEffect(() => { onCanSubmit?.(allFilled) }, [allFilled, onCanSubmit])
  useEffect(() => { onChange?.(fills) }, [fills, onChange])

  // 提交回合的正解（仅 submitted 后存在）
  const key = review?.cloze?.key ?? {}
  const correctCount = submitted
    ? blanks.filter(b => norm(fills[b]) === norm(key[b])).length
    : 0

  // 受控空态：缺题体 / 无 blank → 不报错、不计分（沿用「建设中」语义）
  if (!body || blanks.length === 0) {
    return (
      <div className="prompt muted" role="note">
        <div className="zh">该题暂无可用题体</div>
        <div className="ask">题库就绪后自动可练，期间不以无关题型顶替（多空填空）</div>
      </div>
    )
  }

  // 词库点选填空：填入当前聚焦空；若该词已用则忽略
  const placeChip = (w: string) => {
    if (submitted) return
    if (usedWords.includes(w)) return
    const target = focus ?? blanks.find(b => !fills[b]) ?? blanks[0]
    setFills(f => ({ ...f, [target]: w }))
    const next = blanks.find(b => b > target && !fills[b]) ?? blanks.find(b => !fills[b] && b !== target)
    if (next != null) setFocus(next)
  }
  const clearBlank = (b: number) => {
    if (submitted) return
    setFills(f => {
      const n = { ...f }
      delete n[b]
      return n
    })
    setFocus(b)
  }

  return (
    <div className="fade-up">
      {body.ask && (
        <div className="eyebrow"><span className="tag">多空填空</span><span className="ask">{body.ask}</span></div>
      )}

      {!submitted && (
        <div className="pr-modeseg" role="tablist" aria-label="作答方式">
          <button type="button" role="tab" aria-selected={mode === 'bank'} className={mode === 'bank' ? 'on' : ''} onClick={() => setMode('bank')}>词库选词</button>
          <button type="button" role="tab" aria-selected={mode === 'text'} className={mode === 'text' ? 'on' : ''} onClick={() => setMode('text')}>自由输入</button>
        </div>
      )}

      {/* 词库（仅 bank 模式 + 未提交 + 有词库） */}
      {!submitted && mode === 'bank' && (body.bank?.length ?? 0) > 0 && (
        <div className="pr-bank" aria-label="词库">
          <span className="pr-bank-lab">词库 · 点选填入聚焦空</span>
          <div className="pr-bankrow scroll" role="list">
            {body.bank!.map(w => (
              <button
                key={w}
                type="button"
                role="listitem"
                className={'pr-chip' + (usedWords.includes(w) ? ' used' : '')}
                onClick={() => placeChip(w)}
                disabled={usedWords.includes(w)}
              >{w}</button>
            ))}
          </div>
        </div>
      )}

      {/* 段落 */}
      <div className="pr-passage" aria-label="阅读短文">
        {body.title && <div className="ptitle">{body.title}</div>}
        {tokens.map((tk, i) => {
          if (typeof tk === 'string') return <span key={i}>{tk}</span>
          const b = tk.blank
          const val = fills[b] || ''
          const ok = submitted && norm(val) === norm(key[b])
          const cls =
            'pr-blank' +
            (!val ? ' empty' : '') +
            (focus === b && !submitted ? ' focus' : '') +
            (submitted ? (ok ? ' ok' : ' no') : '')

          if (submitted) {
            return (
              <span key={i} className={cls}>
                <span className="bn">{b}</span><span className="bv">{val || '—'}</span>
                {!ok && <span className="pr-blank-fix">{key[b]}</span>}
              </span>
            )
          }
          if (mode === 'text') {
            return (
              <label key={i} className={cls}>
                <span className="bn">{b}</span>
                <input
                  value={val}
                  placeholder="…"
                  aria-label={`第 ${b} 空`}
                  onFocus={() => setFocus(b)}
                  style={{ '--w': Math.max(64, val.length * 11 + 24) + 'px' } as React.CSSProperties}
                  onChange={e => setFills(f => ({ ...f, [b]: e.target.value }))}
                />
              </label>
            )
          }
          return (
            <button
              key={i}
              type="button"
              className={cls}
              onClick={() => (val ? clearBlank(b) : setFocus(b))}
              aria-label={`第 ${b} 空${val ? '：' + val + '（点击清除）' : '（点击聚焦）'}`}
            >
              <span className="bn">{b}</span>{val || '　　　'}
            </button>
          )
        })}
      </div>

      {/* 复审：单一汇总（题干内已就地标注对错，这里只汇总分数 + 待订正 + 解析） */}
      {submitted && review?.cloze && (() => {
        const wrong = blanks.filter(b => norm(fills[b]) !== norm(key[b]))
        const allOk = wrong.length === 0
        return (
          <div className={'explain ' + (allOk ? 'ok' : 'no')} role="status" aria-live="polite">
            <div className="ex-head">{allOk ? '全部正确' : '本题判定'}
              <span className={'scorepill ' + (allOk ? 'ok' : 'partial')} style={{ marginLeft: 'auto' }}>{correctCount}/{blanks.length}</span>
            </div>
            {!allOk && (
              <div className="ex-fixes">
                {wrong.map(b => (
                  <div key={b} className="ex-fix">
                    <span className="bn">{b}</span>
                    <span className="wrong">{fills[b] || '（空）'}</span>
                    <span className="arr">→</span>
                    <span className="right">{key[b]}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="ex-body"><b>解析：</b>{review.cloze.explanationZh}</div>
          </div>
        )
      })()}
    </div>
  )
}
