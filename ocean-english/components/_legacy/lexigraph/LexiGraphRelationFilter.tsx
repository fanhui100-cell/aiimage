'use client'

export type RelationFilter = 'all' | 'meaning' | 'usage' | 'memory' | 'exam'

interface Props {
  value: RelationFilter
  onChange: (filter: RelationFilter) => void
}

const OPTIONS: Array<{ value: RelationFilter; label: string; labelZh: string }> = [
  { value: 'all',     label: 'All',     labelZh: '全部' },
  { value: 'meaning', label: 'Meaning', labelZh: '含义' },
  { value: 'usage',   label: 'Usage',   labelZh: '用法' },
  { value: 'memory',  label: 'Memory',  labelZh: '记忆' },
  { value: 'exam',    label: 'Exam',    labelZh: '考试' },
]

export function LexiGraphRelationFilter({ value, onChange }: Props) {
  return (
    <div style={{ display: 'inline-flex', gap: '2px' }} role="group" aria-label="Relation filter">
      {OPTIONS.map(o => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            title={`${o.label} / ${o.labelZh}`}
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.06em',
              cursor: 'pointer',
              border: `1px solid ${active ? 'rgba(56,189,248,0.55)' : 'rgba(56,189,248,0.15)'}`,
              background: active ? 'rgba(56,189,248,0.14)' : 'rgba(2,6,23,0.7)',
              color: active ? '#38BDF8' : 'rgba(155,191,202,0.45)',
              backdropFilter: 'blur(6px)',
              lineHeight: 1.5,
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** Returns which edge relations are visible for a given filter. null = show all. */
export const FILTER_RELATIONS: Record<RelationFilter, string[] | null> = {
  all:     null,
  meaning: ['synonym', 'antonym'],
  usage:   ['collocation', 'example'],
  memory:  ['etymology', 'scene'],
  exam:    ['exam'],
}
