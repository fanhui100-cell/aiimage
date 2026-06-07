interface PageShellProps {
  children: React.ReactNode
  maxWidth?: number | string
  /** paddingTop is 80px by default to clear the fixed Navbar */
  paddingTop?: number
}

/**
 * Standard full-page wrapper that handles Navbar clearance and max-width centering.
 * Use inside AppShell. Replaces the repeated `minHeight + paddingTop + maxWidth` pattern.
 */
export function PageShell({ children, maxWidth = 960, paddingTop = 80 }: PageShellProps) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop }}>
      <div
        style={{
          maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
          margin: '0 auto',
          padding: '40px 24px',
        }}
      >
        {children}
      </div>
    </div>
  )
}
