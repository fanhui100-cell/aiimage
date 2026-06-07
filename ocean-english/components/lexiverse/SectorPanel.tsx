'use client'
// components/lexiverse/SectorPanel.tsx
// ─────────────────────────────────────────────────────────────────────────
// Galaxy Overview · left sector index panel.
// Matches the "ga-index" / "ga-sec-card" design from the Claude Design
// handoff (Lexiverse Galaxy Overview.html + galaxy-app.css).
//
// Interaction:
//   click card body → onOpenDetail(id)  — opens right SectorDetailPanel
//   click "Enter" button → onEnterSector(id)  — fly camera + show planets
// ─────────────────────────────────────────────────────────────────────────

import type { LexiverseSector } from '@/lib/lexiverse/lexiverse-types'

// ── design tokens (mirrors liquid-glass.css) ──────────────────────────────
const T = {
  cyan: '#7EF9FF',
  pearl: '#EAF6FF',
  mint: '#6BE0A0',
  coral: '#FF9E6B',
  textDim: '#9DB6CB',
  textMuted: '#7791A8',
  ink: '#051421',
  glassFillSoft: 'linear-gradient(155deg, rgba(180,215,255,0.10), rgba(150,190,240,0.045))',
  glassBorder: 'rgba(190, 228, 255, 0.28)',
  glassBorderStrong: 'rgba(190, 228, 255, 0.45)',
  glassBlur: 'blur(26px) saturate(1.5)',
  glassShadow: '0 24px 70px rgba(2,8,26,0.55), 0 4px 16px rgba(2,8,26,0.35)',
  rLg: 22,
  rMd: 16,
  rPill: 999,
}

const STATUS_COLOR: Record<string, string> = {
  active: '#7EF9FF',
  growing: '#6BE0A0',
  forming: '#FF9E6B',
}

interface SectorPanelProps {
  sectors: LexiverseSector[]
  /** which sector's detail panel is currently open */
  detailSectorId: string | null
  onOpenDetail: (id: string) => void
  onEnterSector: (id: string) => void
}

export function SectorPanel({ sectors, detailSectorId, onOpenDetail, onEnterSector }: SectorPanelProps) {
  if (sectors.length === 0) return null

  return (
    <div style={{
      position: 'absolute', left: 16, top: 72, zIndex: 6,
      width: 244, maxHeight: 'calc(100vh - 160px)',
      display: 'flex', flexDirection: 'column',
      borderRadius: T.rLg,
      background: T.glassFillSoft,
      border: `1px solid ${T.glassBorder}`,
      backdropFilter: T.glassBlur,
      boxShadow: T.glassShadow,
      overflow: 'hidden',
    }}>
      {/* header */}
      <div style={{
        padding: '16px 18px 10px',
        fontFamily: "'Space Mono', monospace",
        fontSize: 10.5,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'rgba(126,249,255,0.6)',
        flexShrink: 0,
      }}>
        Sectors · 星区 ({sectors.length})
      </div>

      {/* scrollable card list */}
      <div style={{
        overflowY: 'auto', padding: '0 12px 14px',
        scrollbarWidth: 'none',
      }}>
        {sectors.map(s => (
          <SectorCard
            key={s.id}
            sector={s}
            isActive={detailSectorId === s.id}
            onOpenDetail={onOpenDetail}
            onEnterSector={onEnterSector}
          />
        ))}
      </div>
    </div>
  )
}

// ── individual sector card ─────────────────────────────────────────────────
interface SectorCardProps {
  sector: LexiverseSector
  isActive: boolean
  onOpenDetail: (id: string) => void
  onEnterSector: (id: string) => void
}

function SectorCard({ sector: s, isActive, onOpenDetail, onEnterSector }: SectorCardProps) {
  const statusColor = STATUS_COLOR[s.status] ?? T.cyan
  const mastery = Math.round(s.masteryRatio * 100)

  return (
    <div
      onClick={() => onOpenDetail(s.id)}
      style={{
        padding: '11px 13px',
        borderRadius: T.rMd,
        marginBottom: 8,
        cursor: 'pointer',
        background: isActive
          ? `linear-gradient(155deg, rgba(126,249,255,0.09), rgba(90,200,220,0.04))`
          : T.glassFillSoft,
        border: isActive
          ? `1px solid rgba(126,249,255,0.60)`
          : `1px solid ${T.glassBorder}`,
        boxShadow: isActive ? '0 0 14px rgba(126,249,255,0.30)' : undefined,
        transition: 'border-color 0.16s, box-shadow 0.16s',
      }}
    >
      {/* row 1: dot + name + status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
          background: s.color,
          boxShadow: `0 0 7px ${s.color}`,
        }} />
        <span style={{
          fontSize: 14, fontWeight: 700, color: T.pearl,
          flex: 1, minWidth: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
        }}>
          {s.name}
        </span>
        <span style={{
          fontSize: 9,
          fontFamily: "'Space Mono', monospace",
          textTransform: 'uppercase',
          color: statusColor,
          background: `${statusColor}2E`,
          padding: '2px 7px',
          borderRadius: T.rPill,
          flexShrink: 0,
        }}>
          {s.status}
        </span>
      </div>

      {/* row 2: nameZh · blurb */}
      <div style={{
        fontSize: 11, color: T.textDim, marginTop: 4,
        lineHeight: 1.4,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {s.nameZh} · {s.blurb}
      </div>

      {/* progress bar */}
      <div style={{
        height: 4, borderRadius: 4,
        background: 'rgba(255,255,255,0.08)',
        marginTop: 9, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 4,
          width: `${mastery}%`,
          background: `linear-gradient(90deg, ${s.color}, #ffffff)`,
        }} />
      </div>

      {/* meta row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontFamily: "'Space Mono', monospace",
        fontSize: 10, color: T.textMuted,
        marginTop: 6,
      }}>
        <span>{s.wordCount} words</span>
        <span>{mastery}% · {s.reviewWords} review</span>
      </div>

      {/* Enter button — only on active card */}
      {isActive && (
        <button
          onClick={(e) => { e.stopPropagation(); onEnterSector(s.id) }}
          style={{
            width: '100%', marginTop: 10,
            padding: '7px 12px', borderRadius: T.rPill,
            cursor: 'pointer', border: 'none',
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontSize: 12, fontWeight: 700, letterSpacing: '-0.01em',
            color: T.ink,
            background: `linear-gradient(135deg, ${s.color}cc, ${s.color})`,
            boxShadow: `0 4px 14px ${s.color}66, inset 0 1px 0 rgba(255,255,255,0.5)`,
          }}
        >
          Enter · 进入 →
        </button>
      )}
    </div>
  )
}
