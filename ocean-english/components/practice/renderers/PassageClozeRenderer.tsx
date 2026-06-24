'use client'
/* PassageClozeRenderer — 逐空四选完形。
   短文中每个编号空就地嵌一个紧凑四选项控件，逐空选择。
   安全红线：提交前不渲染正解；正解/解析只来自 review.passageCloze（submitted=true 后下发），
   逐空对错在收到 review 后于客户端计算用于着色。 */
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'

export interface ClozeOption { id: string; text: string }
/** 段落 token：字符串=文本，{ blank, options }=第 n 空（四选一） */
type ClozeSeg = string | { blank: number; options: ClozeOption[] }

export interface PassageClozeBody {
  title?: string
  ask?: string
  segments: ClozeSeg[]
}

export interface PassageClozeReview {
  /** 每空正解选项 id */
  key: Record<number, string>
  explanationZh: string
}

export interface PassageClozeRendererProps {
  body?: PassageClozeBody | null
  submitted?: boolean
  review?: { passageCloze?: PassageClozeReview } | null
  onCanSubmit?: (canSubmit: boolean) => void
  onChange?: (picks: Record<number, string>) => void
}

export function PassageClozeRenderer({
  body, submitted = false, review, onCanSubmit, onChange,
}: PassageClozeRendererProps) {
  const segments = useMemo(() => body?.segments ?? [], [body])
  const blanks = useMemo(
    () => segments.filter((s): s is { blank: number; options: ClozeOption[] } => typeof s === 'object' && s != null).map(s => s.blank),
    [segments],
  )
  const [picks, setPicks] = useState<Record<number, string>>({})

  const allPicked = blanks.length > 0 && blanks.every(b => picks[b])
  useEffect(() => { onCanSubmit?.(allPicked) }, [allPicked, onCanSubmit])
  useEffect(() => { onChange?.(picks) }, [picks, onChange])

  // 正解仅 submitted 后读取
  const key = review?.passageCloze?.key ?? {}

  const choose = (b: number, id: string) => {
    if (submitted) return
    setPicks(p => ({ ...p, [b]: id }))
  }

  if (!body || blanks.length === 0) {
    return (
      <div className="prompt muted" role="note">
        <div className="zh">该题暂无可用题体</div>
        <div className="ask">题库就绪后自动可练（逐空四选完形）</div>
      </div>
    )
  }

  // 键盘：组内方向键移动焦点，Enter/Space 选定
  const onOptKey = (e: KeyboardEvent<HTMLButtonElement>, b: number, opts: ClozeOption[], oi: number) => {
    const group = e.currentTarget.parentElement
    if (!group) return
    const btns = group.querySelectorAll<HTMLButtonElement>('button')
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault(); btns[(oi + 1) % opts.length]?.focus()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault(); btns[(oi - 1 + opts.length) % opts.length]?.focus()
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); choose(b, opts[oi].id)
    }
  }

  return (
    <div className="fade-up">
      <div className="pr-passage">
        {body.title && <div className="ptitle">{body.title}</div>}
        <div className="pr-cloze-body">
          {segments.map((seg, i) => {
            if (typeof seg === 'string') return <span key={i}>{seg}</span>
            const b = seg.blank
            const opts = seg.options
            const picked = picks[b]
            const correctId = key[b]
            const groupCls = 'pr-cloze-opts' + (submitted ? (picked === correctId ? ' is-ok' : ' is-no') : '')
            return (
              <span className="pr-cloze-gap" key={i}>
                <span className={groupCls} role="radiogroup" aria-label={`第 ${b} 空，四选一`}>
                  <span className="pr-cloze-gnum" aria-hidden="true">{b}</span>
                  {opts.map((o, oi) => {
                    const sel = picked === o.id
                    let cls = 'pr-cloze-opt'
                    if (submitted) {
                      if (o.id === correctId) cls += ' correct'
                      else if (sel) cls += ' chosen-wrong'
                      else cls += ' dim'
                    } else if (sel) cls += ' sel'
                    const rove = sel || (!picked && oi === 0)
                    return (
                      <button
                        key={o.id}
                        type="button"
                        role="radio"
                        aria-checked={sel}
                        tabIndex={submitted ? -1 : (rove ? 0 : -1)}
                        className={cls}
                        disabled={submitted}
                        onClick={() => choose(b, o.id)}
                        onKeyDown={e => onOptKey(e, b, opts, oi)}
                      >
                        <span className="ok-key">{o.id}</span>{o.text}
                      </button>
                    )
                  })}
                </span>
              </span>
            )
          })}
        </div>
      </div>

      {submitted && review?.passageCloze && (() => {
        const wrong = blanks.filter(b => picks[b] !== key[b])
        const allOk = wrong.length === 0
        const optText = (b: number, id: string | undefined) => {
          const seg = segments.find((s): s is { blank: number; options: ClozeOption[] } => typeof s === 'object' && s.blank === b)
          const o = seg?.options.find(x => x.id === id)
          return o ? `${id}. ${o.text}` : '（未选）'
        }
        return (
          <div className={'explain ' + (allOk ? 'ok' : 'no')} role="status" aria-live="polite">
            <div className="ex-head">
              {allOk ? '全部正确' : '逐空判定'}
              <span className={'scorepill ' + (allOk ? 'ok' : 'partial')} style={{ marginLeft: 'auto' }}>
                {blanks.length - wrong.length}/{blanks.length}
              </span>
            </div>
            {!allOk && (
              <div className="pr-cloze-fixes">
                {blanks.map(b => {
                  const ok = picks[b] === key[b]
                  return (
                    <div key={b} className={'pr-cloze-fix ' + (ok ? 'ok' : 'no')}>
                      <span className="fn">{b}</span>
                      <span className="you">{optText(b, picks[b])}</span>
                      {!ok && <span className="arr">→</span>}
                      {!ok && <span className="right">{optText(b, key[b])}</span>}
                    </div>
                  )
                })}
              </div>
            )}
            <div className="ex-body"><b>解析：</b>{review.passageCloze.explanationZh}</div>
          </div>
        )
      })()}
    </div>
  )
}
