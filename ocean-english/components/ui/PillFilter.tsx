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
  /** Pass a hex/rgb literal for non-standard accent (e.g. purple). Omit to use theme default. */
  accentColor?: string
  theme?: 'dark' | 'light'
}

export function PillFilter({ options, value, onChange, accentColor, theme = 'light' }: PillFilterProps) {
  const isLight = theme === 'light'

  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {options.map(opt => {
        const active = value === opt.value

        let activeBorder: string
        let activeBg: string
        let activeColor: string
        let inactiveBorder: string
        let inactiveBg: string
        let inactiveColor: string

        if (accentColor) {
          activeBorder = `1px solid ${accentColor}80`
          activeBg = `${accentColor}18`
          activeColor = accentColor
          inactiveBorder = isLight ? '1px solid var(--line-strong)' : '1px solid rgba(155,191,202,0.2)'
          inactiveBg = isLight ? 'var(--card)' : 'rgba(255,255,255,0.03)'
          inactiveColor = isLight ? 'var(--ink-muted)' : 'rgba(155,191,202,0.7)'
        } else if (isLight) {
          activeBorder = '1px solid rgba(14,140,122,0.5)'
          activeBg = 'rgba(14,140,122,0.1)'
          activeColor = 'var(--teal-ink)'
          inactiveBorder = '1px solid var(--line-strong)'
          inactiveBg = 'var(--card)'
          inactiveColor = 'var(--ink-muted)'
        } else {
          activeBorder = '1px solid rgba(79,230,206,0.5)'
          activeBg = 'rgba(79,230,206,0.1)'
          activeColor = 'var(--teal)'
          inactiveBorder = '1px solid rgba(155,191,202,0.2)'
          inactiveBg = 'rgba(255,255,255,0.03)'
          inactiveColor = 'rgba(155,191,202,0.7)'
        }

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
              border: active ? activeBorder : inactiveBorder,
              background: active ? activeBg : inactiveBg,
              color: active ? activeColor : inactiveColor,
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
