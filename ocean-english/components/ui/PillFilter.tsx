'use client'

interface PillOption {
  value: string
  label: string
  labelShort?: string
}

interface PillFilterProps {
  options: PillOption[]
  value: string
  onChange: (value: string) => void
  accentColor?: string
}

export function PillFilter({ options, value, onChange, accentColor = '#38BDF8' }: PillFilterProps) {
  const hex = accentColor.replace('#', '')
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {options.map(opt => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: active ? 600 : 400,
              cursor: 'pointer',
              border: `1px solid ${active ? accentColor + '80' : 'rgba(155,191,202,0.2)'}`,
              background: active ? `${accentColor}18` : 'rgba(255,255,255,0.03)',
              color: active ? accentColor : 'rgba(155,191,202,0.7)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {opt.labelShort ?? opt.label}
          </button>
        )
      })}
    </div>
  )
}
