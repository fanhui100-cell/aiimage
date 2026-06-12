'use client'
// F1-3：通用 Popover — 点击触发、点外关闭、Esc 关闭、焦点圈定（轻量）、
// 移动端 <640px 改底部弹层。纸面 token：--card 底、--shadow-hover、12px 圆角。

import { useEffect, useRef, useState, type ReactNode } from 'react'

export function Popover({ trigger, children, label }: {
  trigger: (open: boolean) => ReactNode
  children: ReactNode | ((close: () => void) => ReactNode)
  label: string
}) {
  const [open, setOpen] = useState(false)
  const [mobile, setMobile] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const sync = () => setMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)
        && panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); return }
      // 轻量 focus trap：Tab 循环在面板内
      if (e.key === 'Tab' && panelRef.current) {
        const els = panelRef.current.querySelectorAll<HTMLElement>('button, a, [tabindex]:not([tabindex="-1"])')
        if (!els.length) return
        const first = els[0], last = els[els.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    // 打开时聚焦面板首个可聚焦元素
    setTimeout(() => panelRef.current?.querySelector<HTMLElement>('button, a')?.focus(), 30)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const close = () => setOpen(false)
  const body = typeof children === 'function' ? children(close) : children

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button type="button" aria-haspopup="dialog" aria-expanded={open} aria-label={label}
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex' }}>
        {trigger(open)}
      </button>
      {open && (mobile ? (
        <>
          <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 79, background: 'rgba(10,20,28,0.35)' }} />
          <div ref={panelRef} role="dialog" aria-label={label}
            style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 80, background: 'var(--card)', borderRadius: '16px 16px 0 0', boxShadow: 'var(--shadow-hover)', padding: '18px 20px calc(18px + env(safe-area-inset-bottom))', maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--line-strong)', margin: '0 auto 14px' }} />
            {body}
          </div>
        </>
      ) : (
        <div ref={panelRef} role="dialog" aria-label={label}
          style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, zIndex: 80, minWidth: 264, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, boxShadow: 'var(--shadow-hover)', padding: '16px 18px' }}>
          {body}
        </div>
      ))}
    </div>
  )
}
