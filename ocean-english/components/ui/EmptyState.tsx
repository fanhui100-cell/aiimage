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
  /** 'light' = paper background (default); 'dark' = deep glass background */
  theme?: 'light' | 'dark'
  actions?: EmptyStateAction[]
}

export function EmptyState({
  icon,
  title,
  titleZh,
  description,
  descriptionZh,
  variant = 'empty',
  theme = 'light',
  actions = [],
}: EmptyStateProps) {
  const isLight = theme === 'light'

  const variantStyle: React.CSSProperties = (() => {
    if (variant === 'coming-soon') {
      return {
        background: isLight ? 'rgba(14,140,122,0.04)' : 'rgba(126,249,255,0.03)',
        border: `1px dashed ${isLight ? 'rgba(14,140,122,0.25)' : 'rgba(126,249,255,0.3)'}`,
      }
    }
    if (variant === 'error') {
      return {
        background: 'rgba(239,68,68,0.04)',
        border: '1px solid rgba(239,68,68,0.2)',
      }
    }
    return {
      background: isLight ? 'var(--card)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${isLight ? 'var(--line)' : 'rgba(155,191,202,0.1)'}`,
    }
  })()

  const titleColor = (() => {
    if (variant === 'error') return isLight ? 'rgba(191,74,48,0.8)' : 'rgba(239,68,68,0.8)'
    if (variant === 'coming-soon') return isLight ? 'var(--teal-ink)' : 'rgba(126,249,255,0.8)'
    return isLight ? 'var(--ink-sub)' : 'rgba(155,191,202,0.5)'
  })()

  const subtitleColor = isLight ? 'var(--ink-muted)' : 'rgba(155,191,202,0.5)'
  const descColor = isLight ? 'var(--ink-sub)' : '#9BBFCA'

  const actionStyle: React.CSSProperties = isLight
    ? {
        background: 'rgba(14,140,122,0.08)',
        border: '1px solid rgba(14,140,122,0.25)',
        color: 'var(--teal-ink)',
      }
    : {
        background: 'rgba(56,189,248,0.08)',
        border: '1px solid rgba(56,189,248,0.25)',
        color: 'var(--teal)',
      }

  return (
    <div
      style={{
        borderRadius: '16px',
        padding: '48px 32px',
        textAlign: 'center',
        ...variantStyle,
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
            color: subtitleColor,
            marginBottom: '12px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {titleZh}
        </div>
      )}
      {description && (
        <div style={{ fontSize: '13px', color: descColor, lineHeight: 1.6, maxWidth: '400px', margin: '0 auto' }}>
          {description}
        </div>
      )}
      {descriptionZh && (
        <div style={{ fontSize: '12px', color: subtitleColor, marginTop: '4px', maxWidth: '400px', margin: '4px auto 0' }}>
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
                transition: 'opacity 0.15s',
                ...actionStyle,
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
