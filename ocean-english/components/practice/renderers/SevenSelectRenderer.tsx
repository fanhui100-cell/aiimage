'use client'
/* SevenSelectRenderer — 七选五段落填句。
   5 个段落空 + 7 个候选句（含 2 个干扰项），一对一；拖拽 / 点选 / 键盘三模式。
   桌面两栏：短文在左、候选句在右（sticky）；窄屏单列堆叠。
   安全红线：提交前不渲染正解；正解/解析只来自 review.sevenSelect（submitted=true 后下发）。 */
import { useEffect, useMemo, useState, useCallback, type KeyboardEvent, type PointerEvent } from 'react'

export interface SevenCandidate { id: string; text: string }
type SevenSeg = string | { gap: number }

export interface SevenSelectBody {
  title?: string
  ask?: string
  segments: SevenSeg[]
  candidates: SevenCandidate[]
}

export interface SevenSelectReview {
  /** 每空正解候选句 id */
  key: Record<number, string>
  explanationZh: string
}

export interface SevenSelectRendererProps {
  body?: SevenSelectBody | null
  submitted?: boolean
  review?: { sevenSelect?: SevenSelectReview } | null
  onCanSubmit?: (canSubmit: boolean) => void
  onChange?: (placed: Record<number, string>) => void
}

export function SevenSelectRenderer({
  body, submitted = false, review, onCanSubmit, onChange,
}: SevenSelectRendererProps) {
  const segments = useMemo(() => body?.segments ?? [], [body])
  const candidates = useMemo(() => body?.candidates ?? [], [body])
  const gaps = useMemo(
    () => segments.filter((s): s is { gap: number } => typeof s === 'object' && s != null).map(s => s.gap),
    [segments],
  )
  const [placed, setPlaced] = useState<Record<number, string>>({})   // {gap: candidateId}
  const [selCand, setSelCand] = useState<string | null>(null)
  const [overGap, setOverGap] = useState<number | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)

  const usedIds = Object.values(placed)
  const allFilled = gaps.length > 0 && gaps.every(g => placed[g])
  useEffect(() => { onCanSubmit?.(allFilled) }, [allFilled, onCanSubmit])
  useEffect(() => { onChange?.(placed) }, [placed, onChange])

  const key = review?.sevenSelect?.key ?? {}
  const candText = (id: string) => candidates.find(c => c.id === id)?.text ?? ''

  const place = useCallback((gap: number, candId: string | null) => {
    if (submitted || !candId) return
    setPlaced(p => {
      const n = { ...p }
      for (const g of Object.keys(n)) if (n[+g] === candId) delete n[+g] // 一对一：先移除旧位
      n[gap] = candId
      return n
    })
    setSelCand(null)
  }, [submitted])

  const pull = useCallback((gap: number) => {
    if (submitted) return
    setPlaced(p => { const n = { ...p }; delete n[gap]; return n })
  }, [submitted])

  // 点选：先点候选句 → 再点空
  const clickCand = (id: string) => {
    if (submitted || usedIds.includes(id)) return
    setSelCand(s => (s === id ? null : id))
  }
  const clickGap = (gap: number) => {
    if (submitted) return
    if (selCand) place(gap, selCand)
    else if (placed[gap]) pull(gap)
  }

  // 指针拖拽（鼠标 + 触摸统一走 Pointer Events）
  const onCandPointerDown = (id: string, e: PointerEvent<HTMLButtonElement>) => {
    if (submitted || usedIds.includes(id)) return
    e.preventDefault()
    setSelCand(id); setDragId(id)
    const move = (ev: globalThis.PointerEvent) => {
      const el = document.elementFromPoint(ev.clientX, ev.clientY)
      const node = el?.closest('[data-gap]')
      setOverGap(node ? Number(node.getAttribute('data-gap')) : null)
    }
    const up = (ev: globalThis.PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      const el = document.elementFromPoint(ev.clientX, ev.clientY)
      const node = el?.closest('[data-gap]')
      if (node) place(Number(node.getAttribute('data-gap')), id)
      setDragId(null); setOverGap(null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const onCandKey = (id: string, e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clickCand(id) }
  }
  const onGapKey = (gap: number, e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clickGap(gap) }
    if ((e.key === 'Backspace' || e.key === 'Delete') && placed[gap]) { e.preventDefault(); pull(gap) }
  }

  if (!body || gaps.length === 0 || candidates.length === 0) {
    return (
      <div className="prompt muted" role="note">
        <div className="zh">该题暂无可用题体</div>
        <div className="ask">题库就绪后自动可练（七选五）</div>
      </div>
    )
  }

  return (
    <div className="fade-up">
      <div className="pr-split seven">
        <div className="pr-split-main">
          <div className="pr-passage">
            {body.title && <div className="ptitle">{body.title}</div>}
            <div className="pr-seven-body">
              {segments.map((seg, i) => {
                if (typeof seg === 'string') return <span key={i}>{seg}</span>
                const g = seg.gap
                const cid = placed[g]
                if (submitted) {
                  const ok = cid === key[g]
                  return (
                    <div key={i} className={'pr-gap filled ' + (ok ? 'ok' : 'no')}>
                      <span className="gnum">{g}</span>
                      <span className="gtxt">{cid ? candText(cid) : '（未填）'}</span>
                      <span className="gmark"><span className={'pr-mark ' + (ok ? 'ok' : 'no')}>{ok ? '✓' : '✗'}</span></span>
                      {!ok && <div className="gfix"><b>正确</b>{candText(key[g])}</div>}
                    </div>
                  )
                }
                if (cid) {
                  return (
                    <div key={i} data-gap={g} className={'pr-gap filled' + (overGap === g ? ' over' : '')}
                      role="button" tabIndex={0} aria-label={`第 ${g} 空，已填，按删除键取出`}
                      onClick={() => clickGap(g)} onKeyDown={e => onGapKey(g, e)}>
                      <span className="gnum">{g}</span>
                      <span className="gtxt">{candText(cid)}</span>
                      <span className="gpull" role="button" aria-label="取出"
                        onClick={e => { e.stopPropagation(); pull(g) }}
                        onPointerDown={e => e.stopPropagation()}>✕</span>
                    </div>
                  )
                }
                const targeting = selCand && overGap !== g
                return (
                  <div key={i} data-gap={g}
                    className={'pr-gap empty' + (overGap === g ? ' over' : (targeting ? ' sel-target' : ''))}
                    role="button" tabIndex={0} aria-label={`第 ${g} 空，空缺${selCand ? '，按回车填入所选句' : ''}`}
                    onClick={() => clickGap(g)} onKeyDown={e => onGapKey(g, e)}>
                    <span className="gnum">{g}</span>
                    <span className="gph">{selCand ? '点此填入所选句子' : '拖入 / 点选一个句子'}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <aside className="pr-split-side">
          <div className="pr-cand-wrap">
            <div className="pr-side-head">候选句 · 选 <span className="n">{gaps.length}</span> 填 <span className="n">{candidates.length}</span>（含 {candidates.length - gaps.length} 个干扰项）</div>
            <div className="pr-cands">
              {candidates.map(c => {
                const used = usedIds.includes(c.id)
                const distractor = submitted && !Object.values(key).includes(c.id)
                return (
                  <button key={c.id} type="button"
                    className={'pr-cand' + (selCand === c.id ? ' sel' : '') + (used ? ' used' : '') + (dragId === c.id ? ' dragging' : '')}
                    disabled={submitted || used}
                    aria-label={`候选句 ${c.id}${used ? '，已使用' : ''}`}
                    onClick={() => clickCand(c.id)}
                    onPointerDown={e => onCandPointerDown(c.id, e)}
                    onKeyDown={e => onCandKey(c.id, e)}>
                    <span className="clab">{c.id}</span>
                    <span className="ctxt">{c.text}{distractor && <em className="pr-distractor">· 干扰项</em>}</span>
                  </button>
                )
              })}
            </div>
            {!submitted && (
              <div className="pr-seven-hint">
                拖拽句子到空格，或先点句子 <kbd>Enter</kbd> 再点空格 · <kbd>Del</kbd> 取出
              </div>
            )}
          </div>
        </aside>
      </div>

      {submitted && review?.sevenSelect && (() => {
        const right = gaps.filter(g => placed[g] === key[g]).length
        const allOk = right === gaps.length
        return (
          <div className={'explain ' + (allOk ? 'ok' : 'no')} role="status" aria-live="polite">
            <div className="ex-head">{allOk ? '全部正确' : '本题判定'}
              <span className={'scorepill ' + (allOk ? 'ok' : 'partial')} style={{ marginLeft: 'auto' }}>{right}/{gaps.length}</span>
            </div>
            <div className="ex-body"><b>解析：</b>{review.sevenSelect.explanationZh}</div>
          </div>
        )
      })()}
    </div>
  )
}
