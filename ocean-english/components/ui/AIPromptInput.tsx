'use client'

/**
 * §B13 AIPromptInput · 领航员输入条（流光描边 + 建议 chips）
 * ----------------------------------------------------------------------------
 * 落点：/chat LexiPilot、study/AINavigatorPanel——全在米白面，用 --teal-ink 系。
 * 这里只做「输入条 + 建议 chip + 提交」表现层；onSend 交给上层接 /api/chat 流式。
 * 替换现有 AINavigatorPromptShortcuts 即可。
 */
import { useState } from 'react'

interface AIPromptInputProps {
  /** 提交回调（上层去调 /api/chat）*/
  onSend: (text: string) => void
  /** 是否正在等待回复（显示打字态、禁用提交）*/
  pending?: boolean
  /** 建议 prompt chips */
  suggestions?: string[]
  placeholder?: string
}

export function AIPromptInput({
  onSend, pending = false,
  suggestions = ['解释这个词', '造个例句', '近义词辨析'],
  placeholder = '问问领航员…',
}: AIPromptInputProps) {
  const [val, setVal] = useState('')
  const submit = (text?: string) => {
    const q = (text ?? val).trim()
    if (!q || pending) return
    onSend(q); setVal('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {suggestions.map(s => (
          <button key={s} onClick={() => submit(s)} disabled={pending}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-sub)', background: 'var(--card)',
              border: '1px solid var(--line)', borderRadius: 'var(--r-pill)', padding: '6px 13px', cursor: pending ? 'default' : 'pointer' }}>
            {s}
          </button>
        ))}
      </div>

      <div className="aip-pill" style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--card-2)',
        borderRadius: 'var(--r-pill)', padding: '8px 8px 8px 17px' }}>
        {pending ? (
          <span className="aip-typing" style={{ flex: 1, display: 'inline-flex', gap: 4, padding: '6px 0' }}><i /><i /><i /></span>
        ) : (
          <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder={placeholder} spellCheck={false}
            style={{ flex: 1, position: 'relative', background: 'none', border: 'none', outline: 'none',
              color: 'var(--ink)', fontFamily: 'var(--font-sans)', fontSize: 14 }} />
        )}
        <button onClick={() => submit()} disabled={pending} aria-label="发送"
          style={{ position: 'relative', width: 34, height: 34, flexShrink: 0, borderRadius: '50%', border: 'none',
            background: 'var(--teal-ink)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
        </button>
      </div>
    </div>
  )
}
