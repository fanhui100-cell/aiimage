'use client'

import type { ScanHistoryFilter } from '@/types/scan-history'

interface ScanHistoryFiltersProps {
  filters: ScanHistoryFilter
  onChange: (patch: Partial<ScanHistoryFilter>) => void
  totalCount: number
  filteredCount: number
}

const FILE_TYPES: { value: ScanHistoryFilter['fileType']; label: string }[] = [
  { value: 'all', label: 'All / 全部' },
  { value: 'pdf', label: 'PDF' },
  { value: 'image', label: 'Image / 图片' },
  { value: 'text', label: 'Text / 文本' },
]

export function ScanHistoryFilters({ filters, onChange, totalCount, filteredCount }: ScanHistoryFiltersProps) {
  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Search */}
      <input
        type="text"
        value={filters.query}
        onChange={e => onChange({ query: e.target.value })}
        placeholder="Search by file name, summary… / 按文件名、摘要搜索…"
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'var(--card)',
          border: '1px solid var(--line)',
          color: 'var(--ink)',
          fontSize: '13px',
          outline: 'none',
          marginBottom: '12px',
          boxSizing: 'border-box',
        }}
      />

      {/* File type tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
        {FILE_TYPES.map(ft => {
          const active = filters.fileType === ft.value
          return (
            <button
              key={ft.value}
              onClick={() => onChange({ fileType: ft.value })}
              style={{
                padding: '4px 12px',
                borderRadius: '20px',
                background: active ? 'rgba(59,91,217,0.1)' : 'var(--card)',
                border: `1px solid ${active ? 'rgba(59,91,217,0.45)' : 'var(--line)'}`,
                color: active ? 'var(--blue-ink)' : 'var(--ink-sub)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {ft.label}
            </button>
          )
        })}
      </div>

      {/* Toggle filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { key: 'hasQuestions' as const, label: 'Has Questions / 有题目' },
          { key: 'hasVocabulary' as const, label: 'Has Vocabulary / 有生词' },
          { key: 'hasWarnings' as const, label: 'Has Warnings / 有警告' },
        ].map(({ key, label }) => {
          const active = filters[key]
          return (
            <button
              key={key}
              onClick={() => onChange({ [key]: !active })}
              style={{
                padding: '4px 12px',
                borderRadius: '20px',
                background: active ? 'rgba(179,120,31,0.08)' : 'var(--card)',
                border: `1px solid ${active ? 'rgba(255,215,106,0.4)' : 'var(--line)'}`,
                color: active ? 'var(--gold-ink)' : 'var(--ink-muted)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Result count */}
      <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
        {filteredCount === totalCount
          ? `${totalCount} document${totalCount !== 1 ? 's' : ''}`
          : `${filteredCount} of ${totalCount} documents`}
      </div>
    </div>
  )
}
