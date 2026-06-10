'use client'
// FirstVisitHint — 首访一句话浮条（B10/B8-2，不做 tour）
// localStorage flag 记忆已读；底部可关闭说明条。

import { useEffect, useState } from 'react'

export function FirstVisitHint({ storageKey, text }: { storageKey: string; text: string }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(storageKey)) setShow(true)
  }, [storageKey])

  if (!show) return null

  function dismiss() {
    localStorage.setItem(storageKey, '1')
    setShow(false)
  }

  return (
    <div style={{
      position: 'fixed', bottom: 'calc(76px + env(safe-area-inset-bottom))', left: '50%',
      transform: 'translateX(-50%)', zIndex: 80,
      maxWidth: 'min(480px, calc(100vw - 32px))',
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', borderRadius: 14,
      background: 'rgba(2,6,23,0.92)', border: '1px solid rgba(56,189,248,0.3)',
      backdropFilter: 'blur(12px)', boxShadow: '0 12px 36px rgba(0,0,0,0.45)',
    }}>
      <span style={{ fontSize: 13, color: '#ECFBFF', lineHeight: 1.6 }}>{text}</span>
      <button onClick={dismiss} aria-label="知道了"
        style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: '#7EF9FF', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-sans)', padding: '4px 6px' }}>
        知道了
      </button>
    </div>
  )
}
