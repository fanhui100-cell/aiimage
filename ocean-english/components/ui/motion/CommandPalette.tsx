'use client'

/**
 * §B8 CommandPalette · ⌘K 全局命令面板（替代「全部功能」sheet）
 * ----------------------------------------------------------------------------
 * · 主题感知：const dark = isDarkRoute(pathname)
 *     - 暗色宇宙面（/lexiverse /lexigraph /explore）→ 深海玻璃 + --teal
 *     - 米白面（其余全部）→ 纸卡 + --teal-ink（随浅/深模式自适应）
 * · 数据来源：lib/product-flow/nav.ts 的 PRIMARY_NAV / TOOL_NAV / MORE_NAV
 * · 全局唤起：⌘K / Ctrl+K；键盘 ↑↓ 选择、↵ 跳转、esc 关闭
 * · 「最近」存 localStorage('cmdk:recent')
 *
 * 挂载（AppShell.tsx）：用 <CommandPaletteProvider> 包住 children，
 * 顶栏 / 移动底栏的「全部」按钮调用 useCommandPalette().open()。
 */

import {
  createContext, useContext, useState, useEffect, useMemo, useRef, useCallback,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { isDarkRoute } from '@/lib/theme-route'
import { PRIMARY_NAV, TOOL_NAV, MORE_NAV } from '@/lib/product-flow/nav'

type NavItem = { key: string; zh: string; en: string; href: string }
type Section = { group: string; en: string; items: NavItem[] }

const SECTIONS: Section[] = [
  { group: '主线', en: 'Core', items: PRIMARY_NAV as unknown as NavItem[] },
  { group: '工具', en: 'Tools', items: TOOL_NAV as unknown as NavItem[] },
  { group: '更多', en: 'More', items: MORE_NAV as unknown as NavItem[] },
]
const ALL: NavItem[] = SECTIONS.flatMap(s => s.items)

function loadRecent(): NavItem[] {
  if (typeof window === 'undefined') return []
  try {
    const keys: string[] = JSON.parse(localStorage.getItem('cmdk:recent') || '[]')
    return keys.map(k => ALL.find(i => i.key === k)).filter(Boolean).slice(0, 4) as NavItem[]
  } catch { return [] }
}
function pushRecent(key: string) {
  try {
    const keys: string[] = JSON.parse(localStorage.getItem('cmdk:recent') || '[]')
    const next = [key, ...keys.filter(k => k !== key)].slice(0, 6)
    localStorage.setItem('cmdk:recent', JSON.stringify(next))
  } catch { /* ignore */ }
}

function matches(it: NavItem, q: string) {
  if (!q) return true
  const hay = `${it.zh} ${it.en} ${it.href}`.toLowerCase()
  return q.toLowerCase().split(/\s+/).every(t => hay.includes(t))
}

/* ── Context ─────────────────────────────────────────────────────────────── */
const Ctx = createContext<{ open: () => void; close: () => void; toggle: () => void } | null>(null)
export function useCommandPalette() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCommandPalette 必须在 <CommandPaletteProvider> 内使用')
  return c
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const api = useMemo(() => ({
    open: () => setOpen(true), close: () => setOpen(false), toggle: () => setOpen(o => !o),
  }), [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); api.toggle() }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [api])

  return (
    <Ctx.Provider value={api}>
      {children}
      {open && <Palette onClose={api.close} />}
    </Ctx.Provider>
  )
}

/* ── 面板 ────────────────────────────────────────────────────────────────── */
function Palette({ onClose }: { onClose: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const dark = isDarkRoute(pathname)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([])
  // 仅键盘 ↑↓ 切换时滚动选中项入视区；鼠标 hover 改 active 不滚动
  // （否则 hover→active→scroll 把行移到光标下，又触发 hover，形成失控自动下拉）
  const kbdNav = useRef(false)
  const recent = useMemo(() => loadRecent(), [])

  const { sections, flat } = useMemo(() => {
    const secs: Section[] = []
    if (!q && recent.length) secs.push({ group: '最近', en: 'Recent', items: recent })
    SECTIONS.forEach(s => {
      const items = s.items.filter(i => matches(i, q))
      if (items.length) secs.push({ ...s, items })
    })
    return { sections: secs, flat: secs.flatMap(s => s.items) }
  }, [q, recent])

  useEffect(() => { setActive(0) }, [q])
  useEffect(() => { const t = setTimeout(() => inputRef.current?.focus(), 50); return () => clearTimeout(t) }, [])

  // 选中项滚入视区（不用 scrollIntoView）—— 只在键盘导航时滚动
  useEffect(() => {
    if (!kbdNav.current) return
    kbdNav.current = false
    const el = rowRefs.current[active], box = listRef.current
    if (!el || !box) return
    const top = el.offsetTop, bottom = top + el.offsetHeight
    if (top < box.scrollTop) box.scrollTop = top - 8
    else if (bottom > box.scrollTop + box.clientHeight) box.scrollTop = bottom - box.clientHeight + 8
  }, [active])

  const pick = useCallback((it: NavItem) => { pushRecent(it.key); onClose(); router.push(it.href) }, [onClose, router])

  const onKey = (e: React.KeyboardEvent) => {
    const n = Math.max(flat.length, 1)
    if (e.key === 'ArrowDown') { e.preventDefault(); kbdNav.current = true; setActive(a => (a + 1) % n) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); kbdNav.current = true; setActive(a => (a - 1 + n) % n) }
    else if (e.key === 'Enter') { e.preventDefault(); flat[active] && pick(flat[active]) }
    else if (e.key === 'Escape') { e.preventDefault(); onClose() }
  }

  // 主题色（与 Navbar.tsx 同一套判断）
  const T = dark ? {
    panel: 'linear-gradient(180deg, rgba(13,21,34,0.98), rgba(9,14,24,0.99))',
    border: 'var(--glass-border-hover)', line: 'var(--glass-border)',
    fg: 'var(--text-primary)', sub: 'var(--text-secondary)', muted: 'var(--text-muted)',
    accent: 'var(--teal)', rowOn: 'var(--teal-bg)', kbdBg: 'rgba(255,255,255,0.05)',
  } : {
    panel: 'var(--card-2)', border: 'var(--line-strong)', line: 'var(--line)',
    fg: 'var(--ink)', sub: 'var(--ink-sub)', muted: 'var(--ink-muted)',
    accent: 'var(--teal-ink)', rowOn: 'var(--teal-bg)', kbdBg: 'var(--paper-2)',
  }

  let idx = -1
  return (
    <div className="cmdk-backdrop" onMouseDown={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 120, background: dark ? 'rgba(4,8,14,0.6)' : 'rgba(20,25,30,0.34)',
        backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '13vh' }}>
      <div className="cmdk-panel" onMouseDown={e => e.stopPropagation()} onKeyDown={onKey}
        style={{ width: 'min(620px, 92vw)', borderRadius: 'var(--r-card)', overflow: 'hidden',
          background: T.panel, border: `1px solid ${T.border}`,
          boxShadow: dark ? '0 40px 100px -30px rgba(0,0,0,0.85)' : '0 40px 100px -30px rgba(20,30,40,0.4)',
          fontFamily: 'var(--font-sans)' }}>

        {/* 搜索 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '15px 17px', borderBottom: `1px solid ${T.line}` }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="跳转功能 · 搜索单词 / 文章 / 词族…" spellCheck={false}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: T.fg, fontFamily: 'var(--font-sans)', fontSize: 16 }} />
          <button onClick={onClose} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: T.muted, background: T.kbdBg, border: `1px solid ${T.line}`, borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>esc</button>
        </div>

        {/* 列表 */}
        <div className="cmdk-list" ref={listRef} style={{ maxHeight: 'min(56vh, 440px)', overflowY: 'auto', padding: 8 }}>
          {flat.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: T.sub, fontSize: 13.5, lineHeight: 1.9 }}>
              没有匹配「<b style={{ color: T.accent }}>{q}</b>」的功能
              <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10.5, color: T.muted, marginTop: 4 }}>试试「专练」「词图」「扫描」</span>
            </div>
          )}
          {sections.map((sec, si) => (
            <div key={si} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', gap: 8, padding: '9px 10px 6px', fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: T.muted }}>
                {sec.group}<span style={{ opacity: .6 }}>{sec.en}</span>
              </div>
              {sec.items.map(it => {
                idx++; const my = idx; const on = my === active
                return (
                  <button key={`${si}-${it.key}`} ref={el => { rowRefs.current[my] = el }}
                    onMouseMove={() => { if (active !== my) { kbdNav.current = false; setActive(my) } }} onClick={() => pick(it)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                      padding: '10px 11px', borderRadius: 11, border: `1px solid ${on ? T.border : 'transparent'}`,
                      background: on ? T.rowOn : 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 600, color: T.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.zh}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: T.muted, flexShrink: 0 }}>{it.en}</span>
                    {/* href 仅选中行渲染，避免「隐形但占位」的可变宽度把 en 列挤得参差不齐 */}
                    {on && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: T.muted, opacity: .75, flexShrink: 0 }}>{it.href}</span>}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: T.accent, width: 14, textAlign: 'center', flexShrink: 0, opacity: on ? 1 : 0 }}>↵</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '11px 16px', borderTop: `1px solid ${T.line}` }}>
          {[['↑↓', '选择'], ['↵', '跳转'], ['esc', '关闭']].map(([k, l]) => (
            <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.muted }}>
              <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: T.sub, background: T.kbdBg, border: `1px solid ${T.line}`, borderRadius: 5, padding: '1px 6px' }}>{k}</kbd>{l}
            </span>
          ))}
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9.5, color: T.muted }}>{flat.length} 个入口</span>
        </div>
      </div>
    </div>
  )
}
