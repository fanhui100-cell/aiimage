interface SectionHeaderProps {
  label: string
  labelZh?: string
  style?: React.CSSProperties
}

/**
 * Monospace section header in deep-sea style.
 * Usage: <SectionHeader label="DEFINITION" labelZh="释义" />
 */
export function SectionHeader({ label, labelZh, style }: SectionHeaderProps) {
  return (
    <div
      style={{
        fontSize: '10px',
        letterSpacing: 'var(--section-head-spacing, 0.12em)',
        color: 'var(--section-head-color, rgba(56,189,248,0.5))',
        fontFamily: 'var(--font-mono)',
        marginBottom: '8px',
        marginTop: '18px',
        ...style,
      }}
    >
      {label}{labelZh && <span style={{ opacity: 0.6 }}> / {labelZh}</span>}
    </div>
  )
}
