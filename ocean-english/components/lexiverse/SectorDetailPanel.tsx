'use client'
// components/lexiverse/SectorDetailPanel.tsx
// ─────────────────────────────────────────────────────────────────────────
// Right-side slide-in panel that opens when a sector card is clicked.
// Shows sector stats, featured words, mastery bar, and the "Enter Galaxy"
// CTA that actually flies the camera into the sector's planet field.
//
// Matches "ga-drawer ga-sector-panel" from galaxy-app.css / galaxy-app.js.
// ─────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react'
import type { LexiverseSector } from '@/lib/lexiverse/lexiverse-types'

const T = {
  pearl: '#EAF6FF',
  cyan: '#7EF9FF',
  mint: '#6BE0A0',
  coral: '#FF9E6B',
  amber: '#FFC861',
  ink: '#051421',
  text: '#F2FAFF',
  textDim: '#9DB6CB',
  textMuted: '#7791A8',
  glassFill: 'linear-gradient(155deg, rgba(190,222,255,0.16), rgba(150,190,240,0.07) 60%, rgba(150,185,235,0.05))',
  glassBorder: 'rgba(190, 228, 255, 0.28)',
  glassBlur: 'blur(26px) saturate(1.5)',
  glassShadow: '0 24px 70px rgba(2,8,26,0.55), 0 4px 16px rgba(2,8,26,0.35)',
  rXl: 28,
  rMd: 16,
  rPill: 999,
}

const STATUS_COLOR: Record<string, string> = {
  active: '#7EF9FF',
  growing: '#6BE0A0',
  forming: '#FF9E6B',
}

interface SectorDetailPanelProps {
  sector: LexiverseSector | null
  featuredWords: string[]
  onClose: () => void
  onEnterSector: (id: string) => void
}

export function SectorDetailPanel({ sector, featuredWords, onClose, onEnterSector }: SectorDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const isOpen = sector !== null

  // Animate open/close with CSS transform
  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    el.style.transform = isOpen ? 'translateX(0)' : 'translateX(460px)'
  }, [isOpen])

  // Render the last non-null sector so the exit animation has content
  const displaySector = sector

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute', top: 14, right: 14, bottom: 14,
        width: 400, maxWidth: 'calc(100vw - 28px)',
        borderRadius: T.rXl,
        display: 'flex', flexDirection: 'column',
        background: T.glassFill,
        border: `1px solid ${T.glassBorder}`,
        backdropFilter: T.glassBlur,
        boxShadow: T.glassShadow,
        transform: 'translateX(460px)',
        transition: 'transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: 'transform',
        zIndex: 8,
        pointerEvents: isOpen ? 'auto' : 'none',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
      }}
    >
      {/* header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 12, padding: '22px 24px 0',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'rgba(126,249,255,0.6)',
          fontFamily: "'Space Mono', monospace",
        }}>
          Sector overview · 星区概述
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: `1px solid ${T.glassBorder}`,
            borderRadius: '50%',
            width: 28, height: 28, cursor: 'pointer',
            color: T.textDim, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, marginTop: -4,
          }}
        >
          ✕
        </button>
      </div>

      {/* scrollable body */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 24px 24px',
        scrollbarWidth: 'none',
      }}>
        {displaySector && <SectorDetailBody sector={displaySector} featuredWords={featuredWords} onEnter={onEnterSector} />}
      </div>
    </div>
  )
}

function SectorDetailBody({ sector: s, featuredWords, onEnter }: {
  sector: LexiverseSector
  featuredWords: string[]
  onEnter: (id: string) => void
}) {
  const statusColor = STATUS_COLOR[s.status] ?? T.cyan
  const mastery = Math.round(s.masteryRatio * 100)

  return (
    <>
      {/* sector name with color dot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 10 }}>
        <span style={{
          width: 13, height: 13, borderRadius: '50%', flexShrink: 0,
          background: s.color, boxShadow: `0 0 12px ${s.color}`,
        }} />
        <div style={{
          fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em',
          color: T.pearl, lineHeight: 1,
        }}>
          {s.name}
        </div>
      </div>

      {/* nameZh + status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
        <span style={{ color: T.textDim, fontSize: 15 }}>{s.nameZh}</span>
        <span style={{
          fontSize: 10, fontFamily: "'Space Mono', monospace",
          textTransform: 'uppercase', color: statusColor,
          background: `${statusColor}2E`,
          padding: '2px 9px', borderRadius: T.rPill,
        }}>
          {s.status}
        </span>
      </div>

      {/* description */}
      <div style={{ fontSize: 15.5, lineHeight: 1.55, color: T.text, marginTop: 16 }}>
        {s.blurb}
      </div>

      {/* stats grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12, marginTop: 20,
      }}>
        {[
          { value: s.wordCount, label: 'Words · 词汇', color: T.pearl },
          { value: `${mastery}%`, label: 'Mastery · 掌握', color: T.mint },
          { value: s.reviewWords, label: 'Review · 复习', color: T.coral },
        ].map(({ value, label, color }) => (
          <div key={label} style={{
            padding: '13px 14px', borderRadius: T.rMd,
            background: 'rgba(126,249,255,0.04)',
            border: `1px solid ${T.glassBorder}`,
          }}>
            <div style={{
              fontSize: 19, fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              color, lineHeight: 1,
            }}>
              {value}
            </div>
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 3 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* featured words */}
      {featuredWords.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{
            fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'rgba(126,249,255,0.6)', fontFamily: "'Space Mono', monospace",
            marginBottom: 10,
          }}>
            Featured words · 重点词
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {featuredWords.map(w => (
              <span key={w} style={{
                fontSize: 12.5, padding: '5px 11px', borderRadius: T.rPill,
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${T.glassBorder}`,
                color: '#C7DCEC',
              }}>
                {w}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* mastery progress */}
      <div style={{ marginTop: 20 }}>
        <div style={{
          fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'rgba(126,249,255,0.6)', fontFamily: "'Space Mono', monospace",
          marginBottom: 8,
        }}>
          Mastery · 掌握进度
        </div>
        <div style={{
          height: 7, borderRadius: 7,
          background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${mastery}%`,
            background: `linear-gradient(90deg, ${s.color}, #ffffff)`,
          }} />
        </div>
      </div>

      {/* actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 24 }}>
        {/* primary CTA */}
        <button
          onClick={() => onEnter(s.id)}
          style={{
            width: '100%', padding: '12px 18px',
            borderRadius: T.rPill, border: 'none', cursor: 'pointer',
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em',
            color: T.ink,
            background: `linear-gradient(135deg, ${s.color}cc, ${s.color})`,
            boxShadow: `0 4px 18px ${s.color}66, inset 0 1px 0 rgba(255,255,255,0.5)`,
          }}
        >
          Enter Galaxy · 进入词汇星系 →
        </button>
      </div>
    </>
  )
}
