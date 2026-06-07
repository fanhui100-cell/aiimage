interface EmptyStateAction {
  label: string
  href: string
}

interface EmptyStateProps {
  icon?: string
  title: string
  titleZh?: string
  description?: string
  descriptionZh?: string
  /** variant: 'empty' = muted; 'coming-soon' = cyan dashed; 'error' = red tint */
  variant?: 'empty' | 'coming-soon' | 'error'
  actions?: EmptyStateAction[]
}

const VARIANT_STYLES: Record<NonNullable<EmptyStateProps['variant']>, React.CSSProperties> = {
  empty: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(155,191,202,0.1)',
  },
  'coming-soon': {
    background: 'rgba(126,249,255,0.03)',
    border: '1px dashed rgba(126,249,255,0.3)',
  },
  error: {
    background: 'rgba(239,68,68,0.04)',
    border: '1px solid rgba(239,68,68,0.2)',
  },
}

const VARIANT_TITLE_COLOR: Record<NonNullable<EmptyStateProps['variant']>, string> = {
  empty: 'rgba(155,191,202,0.5)',
  'coming-soon': 'rgba(126,249,255,0.8)',
  error: 'rgba(239,68,68,0.8)',
}

/**
 * Consistent empty / coming-soon / error state component.
 */
export function EmptyState({
  icon,
  title,
  titleZh,
  description,
  descriptionZh,
  variant = 'empty',
  actions = [],
}: EmptyStateProps) {
  const titleColor = VARIANT_TITLE_COLOR[variant]

  return (
    <div
      style={{
        borderRadius: '16px',
        padding: '48px 32px',
        textAlign: 'center',
        ...VARIANT_STYLES[variant],
      }}
    >
      {icon && (
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>{icon}</div>
      )}
      <div
        style={{
          fontSize: '16px',
          fontWeight: 700,
          color: titleColor,
          marginBottom: titleZh ? '2px' : '10px',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {title}
      </div>
      {titleZh && (
        <div
          style={{
            fontSize: '13px',
            color: 'rgba(155,191,202,0.5)',
            marginBottom: '12px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {titleZh}
        </div>
      )}
      {description && (
        <div style={{ fontSize: '13px', color: '#9BBFCA', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto' }}>
          {description}
        </div>
      )}
      {descriptionZh && (
        <div style={{ fontSize: '12px', color: 'rgba(155,191,202,0.5)', marginTop: '4px', maxWidth: '400px', margin: '4px auto 0' }}>
          {descriptionZh}
        </div>
      )}
      {actions.length > 0 && (
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px' }}>
          {actions.map(a => (
            <a
              key={a.href}
              href={a.href}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                background: 'rgba(56,189,248,0.08)',
                border: '1px solid rgba(56,189,248,0.25)',
                color: '#38BDF8',
                transition: 'opacity 0.15s',
              }}
            >
              {a.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
