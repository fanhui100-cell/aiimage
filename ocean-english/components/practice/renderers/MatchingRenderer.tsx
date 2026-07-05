'use client'
/* MatchingRenderer — 配对连线（一对一）。从 mock/pr-matching.jsx 忠实移植：
   交互：指针拖拽（鼠标 + 触摸）/ 点选（先点源选中 → 再点目标确认）/ 键盘
   （Enter/Space 选源 → 聚焦目标 → Enter/Space 确认；Del/Backspace 取消）。
   一对一：被占用的目标会被「消耗」不可复用。
   安全：答案（key / 解析 / 判定 / 得分）只在 submitted===true 时从 `review` 读取；
   提交前 DOM/state/payload 绝不含答案。
   令牌：mock 的 --acc/--ok/--no/--warn → 真 globals 令牌（teal/rose/gold）。
   只返回题干主体 + 本题型 review 子面板；不含 topbar/feedback/qfoot/shell。 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

// 五色配对色板（用真 globals 令牌，取代 mock 硬编码十六进制）
const PAIR_COLORS = [
  'var(--teal-ink)',
  'var(--alt, var(--teal-ink))',
  'var(--gold-ink)',
  'var(--teal-deep, var(--teal-ink))',
  'var(--rose-ink)',
]

export interface MatchingSourceItem {
  id: string
  en: string
}
export interface MatchingTargetItem {
  id: string
  zh: string
}
/** 配对题主体（题干侧，绝不含答案）。 */
export interface MatchingBody {
  ask?: string
  source: MatchingSourceItem[]
  target: MatchingTargetItem[]
}
/** 已批改结果（仅 submitted===true 时下发并读取）。 */
export interface MatchingReview {
  /** {srcId: 正确 tgtId} */
  key: Record<string, string>
  explanationZh?: string
}

interface Line {
  s: string
  t: string
  x1: number
  y1: number
  x2: number
  y2: number
  c: string
}
interface Drag {
  srcId: string
  sx: number   // source anchor (relative to wrap), captured in the pointer handler — never read refs during render
  sy: number
  x: number
  y: number
}

export function MatchingRenderer({
  body,
  submitted = false,
  review,
  onCanSubmit,
  onChange,
}: {
  body?: MatchingBody | null
  submitted?: boolean
  review?: MatchingReview | null
  onCanSubmit?: (ready: boolean) => void
  onChange?: (map: Record<string, string>) => void
}) {
  const [map, setMap] = useState<Record<string, string>>({}) // {srcId: tgtId}
  const [selSrc, setSelSrc] = useState<string | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [lines, setLines] = useState<Line[]>([])
  const [over, setOver] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const nodeRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const source = useMemo(() => body?.source ?? [], [body])
  const target = useMemo(() => body?.target ?? [], [body])
  // 答案只在 submitted 时读取
  const key = submitted ? review?.key ?? {} : {}

  const colorOf = useCallback(
    (srcId: string) => PAIR_COLORS[source.findIndex((s) => s.id === srcId) % PAIR_COLORS.length],
    [source],
  )
  const tgtUsedBy = useCallback(
    (tgtId: string) => Object.keys(map).find((s) => map[s] === tgtId),
    [map],
  )
  const allMatched = source.length > 0 && source.every((s) => map[s.id])

  useEffect(() => {
    onCanSubmit?.(allMatched)
  }, [allMatched, onCanSubmit])
  useEffect(() => {
    onChange?.(map)
  }, [map, onChange])

  // 计算连线坐标
  const recompute = useCallback(() => {
    const wrap = wrapRef.current
    if (!wrap) return
    const wr = wrap.getBoundingClientRect()
    const out: Line[] = []
    Object.entries(map).forEach(([s, t]) => {
      const se = nodeRefs.current[s]
      const te = nodeRefs.current[t]
      if (!se || !te) return
      const sr = se.getBoundingClientRect()
      const tr = te.getBoundingClientRect()
      out.push({
        s,
        t,
        x1: sr.right - wr.left,
        y1: sr.top + sr.height / 2 - wr.top,
        x2: tr.left - wr.left,
        y2: tr.top + tr.height / 2 - wr.top,
        c: colorOf(s),
      })
    })
    setLines(out)
  }, [map, colorOf])
  useLayoutEffect(() => {
    recompute()
  }, [map, submitted, recompute])
  useEffect(() => {
    window.addEventListener('resize', recompute)
    return () => window.removeEventListener('resize', recompute)
  }, [recompute])

  const doMatch = useCallback(
    (srcId: string, tgtId: string) => {
      if (submitted) return
      const owner = tgtUsedBy(tgtId)
      setMap((m) => {
        const n = { ...m }
        if (owner) delete n[owner]
        n[srcId] = tgtId
        return n
      })
      setSelSrc(null)
    },
    [submitted, tgtUsedBy],
  )
  const unmatch = useCallback(
    (srcId: string) => {
      if (submitted) return
      setMap((m) => {
        const n = { ...m }
        delete n[srcId]
        return n
      })
    },
    [submitted],
  )

  // 点选：先点源（选中）→ 再点目标（确认）
  const clickSrc = (srcId: string) => {
    if (submitted) return
    if (map[srcId]) {
      unmatch(srcId)
      setSelSrc(srcId)
    } else {
      setSelSrc(selSrc === srcId ? null : srcId)
    }
  }
  const clickTgt = (tgtId: string) => {
    if (submitted || !selSrc) return
    doMatch(selSrc, tgtId)
  }

  // 指针拖拽（鼠标 + 触摸）
  const onPointerDown = (srcId: string, e: React.PointerEvent) => {
    if (submitted) return
    e.preventDefault()
    setSelSrc(srcId)
    const move = (ev: PointerEvent) => {
      const wrap = wrapRef.current
      const se = nodeRefs.current[srcId]
      if (!wrap || !se) return
      const wr = wrap.getBoundingClientRect()
      const sr = se.getBoundingClientRect()
      // capture source anchor here (event handler — refs are valid); render reads only drag state
      setDrag({ srcId, sx: sr.right - wr.left, sy: sr.top + sr.height / 2 - wr.top, x: ev.clientX - wr.left, y: ev.clientY - wr.top })
      const el = document.elementFromPoint(ev.clientX, ev.clientY)
      const node = el && (el as Element).closest('[data-tgt]')
      setOver(node ? node.getAttribute('data-tgt') : null)
    }
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      const el = document.elementFromPoint(ev.clientX, ev.clientY)
      const node = el && (el as Element).closest('[data-tgt]')
      if (node) doMatch(srcId, node.getAttribute('data-tgt') as string)
      setDrag(null)
      setOver(null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const onSrcKey = (srcId: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      clickSrc(srcId)
    }
    if ((e.key === 'Backspace' || e.key === 'Delete') && map[srcId]) {
      e.preventDefault()
      unmatch(srcId)
    }
  }
  const onTgtKey = (tgtId: string, e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && selSrc) {
      e.preventDefault()
      clickTgt(tgtId)
    }
  }

  // 受控空态：题干主体缺失 → 不报错、不计分
  if (source.length === 0 || target.length === 0) {
    return (
      <div className="prompt muted" role="note">
        <div className="zh">该题暂无内容</div>
        <div className="ask">题库建设中，先用其它题型练习（匹配）</div>
      </div>
    )
  }

  const score = submitted ? source.filter((s) => map[s.id] === key[s.id]).length : 0
  const allCorrect = score === source.length

  return (
    <div className="fade-up">
      <div className="eyebrow">
        <span className="tag">配对连线</span>
        {body?.ask ? <span className="ask">{body.ask}</span> : null}
      </div>

      <div className="pr-match" ref={wrapRef}>
        <svg className="pr-match-svg" aria-hidden="true">
          {lines.map((l, i) => {
            const mx = (l.x1 + l.x2) / 2
            const stroke = submitted
              ? map[l.s] === key[l.s]
                ? 'var(--teal-ink)'
                : 'var(--rose-ink)'
              : l.c
            return (
              <path
                key={i}
                d={`M${l.x1},${l.y1} C${mx},${l.y1} ${mx},${l.y2} ${l.x2},${l.y2}`}
                fill="none"
                stroke={stroke}
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.9"
              />
            )
          })}
          {drag && (
            <path
              d={`M${drag.sx},${drag.sy} L${drag.x},${drag.y}`}
              fill="none"
              stroke={colorOf(drag.srcId)}
              strokeWidth="2.5"
              strokeDasharray="2 7"
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* 源列 */}
        <div className="pr-col left">
          <div className="pr-col-h">单词 / Source</div>
          {source.map((s) => {
            const matched = !!map[s.id]
            const ok = submitted && map[s.id] === key[s.id]
            const cls =
              'pr-node' +
              (selSrc === s.id ? ' sel' : '') +
              (matched ? ' matched' : '') +
              (submitted ? (ok ? ' ok' : ' no') : '')
            return (
              <button
                key={s.id}
                type="button"
                ref={(el) => {
                  nodeRefs.current[s.id] = el
                }}
                className={cls}
                style={{ ['--mc' as string]: colorOf(s.id) }}
                onClick={() => clickSrc(s.id)}
                onPointerDown={(e) => onPointerDown(s.id, e)}
                onKeyDown={(e) => onSrcKey(s.id, e)}
                aria-label={`单词 ${s.en}${matched ? '，已连线' : ''}`}
              >
                {!submitted && <span className="ndot" />}
                {submitted && (
                  <span className={'pr-mark ' + (ok ? 'ok' : 'no')}>
                    {ok ? <CheckIco /> : <XIco />}
                  </span>
                )}
                <span className="ntxt">
                  <span className="nen">{s.en}</span>
                </span>
                {matched && !submitted && (
                  <span
                    className="nunmatch"
                    role="button"
                    aria-label="取消连线"
                    onClick={(e) => {
                      e.stopPropagation()
                      unmatch(s.id)
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <XIco />
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* 目标列 */}
        <div className="pr-col right">
          <div className="pr-col-h" style={{ textAlign: 'right' }}>
            释义 / Target
          </div>
          {target.map((t) => {
            const usedBy = tgtUsedBy(t.id)
            const consumed = usedBy && !submitted
            const ok = submitted && usedBy && map[usedBy] === key[usedBy]
            const cls =
              'pr-node' +
              (consumed ? ' consumed' : '') +
              (usedBy ? ' matched' : '') +
              (submitted && usedBy ? (ok ? ' ok' : ' no') : '')
            return (
              <button
                key={t.id}
                type="button"
                data-tgt={t.id}
                ref={(el) => {
                  nodeRefs.current[t.id] = el
                }}
                className={cls + (over === t.id ? ' sel' : '')}
                style={{ ['--mc' as string]: usedBy ? colorOf(usedBy) : '' }}
                onClick={() => clickTgt(t.id)}
                onKeyDown={(e) => onTgtKey(t.id, e)}
                aria-label={`释义 ${t.zh}${consumed ? '，已被占用' : ''}`}
                disabled={submitted}
              >
                <span className="ntxt">
                  <span className="nzh">{t.zh}</span>
                </span>
                {usedBy && <span className="ndot" />}
              </button>
            )
          })}
        </div>
      </div>

      {!submitted && (
        <div className="pr-match-hint">
          <InfoIco /> 拖拽连线，或<kbd>Enter</kbd>选词再<kbd>Enter</kbd>选释义 · <kbd>Del</kbd>取消
        </div>
      )}

      {submitted && (
        <div className={'explain ' + (allCorrect ? 'ok' : 'no')} role="status" aria-live="polite">
          <div className="ex-head">
            配对判定
            <span
              className={'scorepill ' + (allCorrect ? 'ok' : 'partial')}
              style={{ marginLeft: 'auto' }}
            >
              {score}/{source.length}
            </span>
          </div>
          {review?.explanationZh ? (
            <div className="ex-body">
              <b>解析：</b>
              {review.explanationZh}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

// 内联简易标记图标（不整体移植 demo 图标系统）
function CheckIco() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}
function XIco() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}
function InfoIco() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  )
}
