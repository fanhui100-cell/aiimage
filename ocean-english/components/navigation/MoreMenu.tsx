'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { siteConfig } from '@/config/site'

const GROUP_LABELS: Record<string, string> = {
  learning: '功能区',
  lexiverse: 'Lexiverse 系列',
  coming: '即将上线',
}

export function MoreMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const groups = ['learning', 'lexiverse', 'coming'] as const
  const itemsByGroup = Object.fromEntries(
    groups.map(g => [g, siteConfig.navigationMore.filter(item => item.group === g)])
  )

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(p => !p)}
        className="flex flex-col items-center leading-none group"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span
          className="text-sm tracking-wide transition-colors group-hover:text-[#38bdf8]"
          style={{ color: open ? '#38bdf8' : 'var(--text-secondary)' }}
        >
          More {open ? '▴' : '▾'}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
          更多
        </span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 12px)',
            right: 0,
            minWidth: '192px',
            background: 'rgba(2,6,23,0.97)',
            border: '1px solid rgba(56,189,248,0.18)',
            borderRadius: '12px',
            padding: '6px 0 8px',
            backdropFilter: 'blur(16px)',
            zIndex: 100,
            boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          }}
        >
          {groups.map((group, gi) => {
            const items = itemsByGroup[group]
            if (!items.length) return null
            return (
              <div key={group}>
                {gi > 0 && (
                  <div style={{ height: '1px', background: 'rgba(155,191,202,0.08)', margin: '6px 12px' }} />
                )}
                <div style={{
                  fontSize: '9px',
                  letterSpacing: '0.12em',
                  color: 'rgba(155,191,202,0.4)',
                  padding: '6px 16px 3px',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {GROUP_LABELS[group]}
                </div>
                {items.map(item => {
                  const isComing = 'comingSoon' in item && item.comingSoon
                  const active = !isComing && pathname.startsWith(item.href)

                  if (isComing) {
                    return (
                      <div
                        key={item.href}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 16px',
                          opacity: 0.38,
                          cursor: 'default',
                        }}
                      >
                        <span style={{ fontSize: '13px', color: '#ECFBFF' }}>{item.label}</span>
                        <span style={{ fontSize: '10px', color: 'rgba(155,191,202,0.6)', marginLeft: '12px', fontFamily: 'var(--font-mono)' }}>
                          soon
                        </span>
                      </div>
                    )
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 16px',
                        textDecoration: 'none',
                        transition: 'background 0.15s',
                        background: active ? 'rgba(56,189,248,0.07)' : 'transparent',
                      }}
                      className="hover:bg-[rgba(56,189,248,0.06)]"
                    >
                      <span style={{ fontSize: '13px', color: active ? '#38BDF8' : '#ECFBFF' }}>{item.label}</span>
                      <span style={{ fontSize: '11px', color: 'rgba(155,191,202,0.45)', marginLeft: '12px' }}>
                        {item.labelZh}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
