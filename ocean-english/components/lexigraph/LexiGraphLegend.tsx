'use client'

import { useState } from 'react'
import { EDGE_COLORS } from '@/lib/lexigraph/lexigraph-colors'
import type { LexiGraphEdgeRelation } from '@/types/lexigraph'

const ENTRIES: Array<{ relation: LexiGraphEdgeRelation; label: string }> = [
  { relation: 'synonym', label: 'Synonym / 近义词' },
  { relation: 'antonym', label: 'Antonym / 反义词' },
  { relation: 'collocation', label: 'Collocation / 搭配' },
  { relation: 'etymology', label: 'Etymology / 词源' },
  { relation: 'scene', label: 'Scene / 场景' },
  { relation: 'exam', label: 'Exam tag / 考试标签' },
]

export function LexiGraphLegend() {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 10 }}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Toggle legend"
        style={{
          padding: '3px 9px',
          borderRadius: '4px',
          fontSize: '10px',
          letterSpacing: '0.1em',
          background: 'rgba(2,6,23,0.8)',
          border: '1px solid rgba(56,189,248,0.22)',
          color: 'rgba(56,189,248,0.55)',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
          backdropFilter: 'blur(8px)',
        }}
      >
        LEGEND
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '6px',
          background: 'rgba(2,6,23,0.92)',
          border: '1px solid rgba(56,189,248,0.2)',
          borderRadius: '8px',
          padding: '12px 14px',
          minWidth: '190px',
          backdropFilter: 'blur(14px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}>
          {ENTRIES.map(e => (
            <div key={e.relation} style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '7px' }}>
              <span style={{
                width: '22px', height: '2px',
                background: EDGE_COLORS[e.relation],
                display: 'inline-block', borderRadius: '1px', flexShrink: 0,
              }} />
              <span style={{ fontSize: '11px', color: '#9BBFCA', fontFamily: 'var(--font-mono)' }}>
                {e.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
