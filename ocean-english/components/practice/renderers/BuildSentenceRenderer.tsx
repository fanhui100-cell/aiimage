'use client'
/* BuildSentenceRenderer — 连词成句（token 排序 · scoring_not_ready）。
   点选词块在「答句区 ↔ 词库」间移动；答句区内拖拽 / ← → 重排、Del / Backspace 移回词库。
   提交后不判对错，仅展示用户语序 + 参考语序（非唯一正确答案）。参考语序/解析只来自 review，
   且仅在 submitted===true 时进入 DOM；提交前 state / DOM 不含任何答案。
   只渲染题体 + 本题复审子面板：topbar / .feedback / .qfoot 由 PracticeRunner 提供。 */
import { useEffect, useRef, useState } from 'react'

export interface BuildToken {
  id: string
  t: string
}

export interface BuildSentenceBody {
  /** 题型提示语（eyebrow ask 由 runner 渲染；此处用于中文释义旁的引导，可选） */
  ask?: string
  /** 中文母句（待还原为英文语序） */
  zh: string
  /** 待排序词块（乱序，不含正解） */
  tokens: BuildToken[]
}

/** 提交后由 session 结果下发：参考语序 + 可选解析。绝不在提交前出现。 */
export interface BuildSentenceReview {
  /** 参考语序（非唯一正确答案） */
  canonical: string[]
  explanationZh?: string
}

const Grip = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
    <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" />
    <circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" />
    <circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
  </svg>
)
const Info = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" />
  </svg>
)
const Warn = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
  </svg>
)

export function BuildSentenceRenderer({
  body,
  submitted,
  review,
  onCanSubmit,
}: {
  body?: BuildSentenceBody | null
  submitted: boolean
  /** 仅 submitted===true 时下发；提交前为 null/undefined。 */
  review?: BuildSentenceReview | null
  onCanSubmit: (can: boolean) => void
}) {
  const tokens = body?.tokens ?? []
  const order = tokens.map((t) => t.id)
  const tokenOf = (id: string) => tokens.find((t) => t.id === id)

  const [answer, setAnswer] = useState<string[]>([])
  const [dragId, setDragId] = useState<string | null>(null)
  const [over, setOver] = useState(false)
  const ansRef = useRef<HTMLDivElement | null>(null)
  const tokRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const bank = order.filter((id) => !answer.includes(id))

  useEffect(() => {
    onCanSubmit(order.length > 0 && answer.length === order.length)
  }, [answer, order.length, onCanSubmit])

  // 受控空态：缺 tokens → 不报错、不计分（沿用「建设中」语义）。
  if (order.length === 0) {
    return (
      <div className="prompt muted" role="note">
        <div className="zh">该题暂无可用题体</div>
        <div className="ask">题库就绪后自动可练，期间不以无关题型顶替</div>
      </div>
    )
  }

  const add = (id: string) => {
    if (submitted) return
    setAnswer((a) => (a.includes(id) ? a : [...a, id]))
  }
  const remove = (id: string) => {
    if (submitted) return
    setAnswer((a) => a.filter((x) => x !== id))
  }

  const moveBy = (id: string, dir: number) => {
    setAnswer((a) => {
      const i = a.indexOf(id)
      const j = i + dir
      if (j < 0 || j >= a.length) return a
      const n = [...a]
      ;[n[i], n[j]] = [n[j], n[i]]
      return n
    })
  }

  const onAnsKey = (id: string, e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); moveBy(id, -1) }
    else if (e.key === 'ArrowRight') { e.preventDefault(); moveBy(id, 1) }
    else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); remove(id) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); remove(id) }
  }

  // 答句区内指针拖拽重排
  const onTokPointerDown = (id: string, e: React.PointerEvent<HTMLButtonElement>) => {
    if (submitted) return
    e.preventDefault()
    setDragId(id)
    const move = (ev: PointerEvent) => {
      const ids = answer
      let idx = ids.length
      for (let k = 0; k < ids.length; k++) {
        const el = tokRefs.current[ids[k]]
        if (!el) continue
        const r = el.getBoundingClientRect()
        if (ev.clientX < r.left + r.width / 2) { idx = k; break }
      }
      setAnswer((a) => {
        const from = a.indexOf(id)
        if (from < 0) return a
        const n = a.filter((x) => x !== id)
        let to = idx
        if (idx > from) to = idx - 1
        n.splice(Math.min(to, n.length), 0, id)
        return n
      })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setDragId(null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div>
      <div className="pr-prompt-card" style={{ marginBottom: 14 }}>
        <div className="pq" style={{ fontFamily: 'var(--font-serif-zh)', fontWeight: 600 }}>{body!.zh}</div>
      </div>

      {/* 答句区 */}
      <div
        ref={ansRef}
        className={'pr-answerzone' + (answer.length ? '' : ' empty') + (over ? ' over' : '')}
        data-ph="点选下方词块组句，可拖拽 / ← → 重排"
        role="list"
        aria-label="你的句子"
        onPointerEnter={() => dragId && setOver(true)}
        onPointerLeave={() => setOver(false)}
      >
        {answer.map((id, i) => (
          <button
            key={id}
            type="button"
            ref={(el) => { tokRefs.current[id] = el }}
            role="listitem"
            className={'pr-tok inans' + (dragId === id ? ' dragging' : '')}
            onPointerDown={(e) => onTokPointerDown(id, e)}
            onKeyDown={(e) => onAnsKey(id, e)}
            disabled={submitted}
            aria-label={`第 ${i + 1} 个词：${tokenOf(id)?.t ?? ''}，方向键重排，回车移回词库`}
          >
            <span className="gi"><Grip /></span>{tokenOf(id)?.t}
          </button>
        ))}
      </div>

      {/* 词库 */}
      {!submitted && (
        <div className="pr-tokbank" role="list" aria-label="词块库">
          <span className="pr-tokbank-lab">词块库 · 点选加入句子</span>
          {bank.length === 0 && <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>词块已全部使用</span>}
          {bank.map((id) => (
            <button
              key={id}
              type="button"
              role="listitem"
              className="pr-tok"
              onClick={() => add(id)}
              aria-label={`词块 ${tokenOf(id)?.t ?? ''}`}
            >
              {tokenOf(id)?.t}
            </button>
          ))}
        </div>
      )}

      {/* 复审：不判分（参考语序/解析仅来自 review，submitted 后才进入 DOM） */}
      {submitted && (
        <div role="status" aria-live="polite">
          <div className="pr-yoursent">
            <span className="yl">你的语序</span>
            {answer.map((id) => tokenOf(id)?.t).join(' ')}
          </div>
          {review && (
            <div className="pr-ref">
              <div className="pr-ref-lab"><Info /> 参考语序（非唯一正确答案）</div>
              <div className="pr-ref-sent">{review.canonical.join(' ')}</div>
            </div>
          )}
          <div className="pr-noscore">
            <Warn /> 本题为开放型排序，<b style={{ color: 'var(--ink)' }}>暂不自动判分</b>；参考语序仅供对照，符合语法的其它语序同样成立。
          </div>
          {review?.explanationZh && (
            <div className="pr-noscore" style={{ marginTop: 10 }}>{review.explanationZh}</div>
          )}
        </div>
      )}
    </div>
  )
}
