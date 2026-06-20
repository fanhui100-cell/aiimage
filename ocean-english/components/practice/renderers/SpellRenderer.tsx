'use client'
/* SpellRenderer — 拼写（精确 + 一次容错）。含 README §7 三连修复：
   Enter stopPropagation 防双触发跳题；isComposing/keyCode===229 守卫输入法；
   输入过滤 /[^a-zA-Z '\-]/g 挡中文。Levenshtein 容错由父级 onSubmit 处理。 */
import type { RefObject } from 'react'
import type { PracticeItem, SpellPhase } from '../practice-types'
import { HintInitials, Diff } from '../icons'

export function SpellRenderer({
  item, phase, diffAns, value, correctAnswer, locked, inputRef, onChange, onSubmit,
}: {
  item: PracticeItem
  phase: SpellPhase
  diffAns: string
  value: string
  correctAnswer: string
  locked: boolean
  inputRef: RefObject<HTMLInputElement | null>
  onChange: (v: string) => void
  onSubmit: () => void
}) {
  const ans = (correctAnswer || '').toLowerCase()
  return (
    <div className="spell">
      <div className="hintrow">
        <HintInitials answer={ans} />
        {item.targetWords[0]?.dimension ? null : null}
      </div>
      <label className="sr-only" htmlFor="pr-spell-input">敲出这个词</label>
      <input
        id="pr-spell-input"
        ref={inputRef}
        className={`lg-input ${phase}`}
        type="text"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="敲出这个词…"
        value={value}
        disabled={locked}
        onChange={(e) => onChange(e.target.value.replace(/[^a-zA-Z '-]/g, ''))}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return
          if (e.nativeEvent.isComposing || e.keyCode === 229) return   // 输入法确认候选词的回车
          e.preventDefault()
          e.stopPropagation()                                           // 防止冒泡到全局监听触发 next()
          onSubmit()
        }}
      />
      <div aria-live="polite">
        {phase === 'tol' && <div className="tol-msg">差一个字母，再试一次 ✦</div>}
        {phase === 'bad' && (
          <>
            <div className="diffrow"><div className="lab">你的拼写</div><div className="difftxt"><Diff val={diffAns} ans={ans} /></div></div>
            <div className="diffrow" style={{ marginTop: 8 }}><div className="lab">正解</div><div className="answer-line">{ans}</div></div>
          </>
        )}
      </div>
    </div>
  )
}
