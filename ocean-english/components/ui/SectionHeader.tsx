interface SectionHeaderProps {
  /** 区块小标题,格式 "LABEL · 中文" */
  label: string
  labelZh?: string
  /** 'light' 用 --teal-ink; 'dark' 用 --section-head-color(默认) */
  theme?: 'light' | 'dark'
  /** 是否在标题下方加一条发丝横线 */
  divider?: boolean
  style?: React.CSSProperties
}

export function SectionHeader({ label, labelZh, theme, divider, style }: SectionHeaderProps) {
  const color = theme === 'light'
    ? 'var(--teal-ink)'
    : 'var(--section-head-color, rgba(79,230,206,0.55))'

  return (
    <div style={{ marginBottom: divider ? 0 : '8px', marginTop: '18px', ...style }}>
      <p
        style={{
          margin: 0,
          fontSize: '11px',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-mono)',
          color,
          opacity: 0.7,
        }}
      >
        {label}{labelZh && <span> · {labelZh}</span>}
      </p>
      {divider && (
        <div
          style={{
            marginTop: '6px',
            height: '1px',
            background: theme === 'light' ? 'var(--line)' : 'var(--glass-border)',
          }}
        />
      )}
    </div>
  )
}
