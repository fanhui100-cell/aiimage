interface PageShellProps {
  children: React.ReactNode
  maxWidth?: number | string
  /** paddingTop 默认 8px——Navbar 高度已由 AppShell 的 var(--nav-h) 全局补偿（P1） */
  paddingTop?: number
  /** 'light' 加 theme-light 作用域(米白);'dark' 或省略用深海默认 */
  theme?: 'light' | 'dark'
  className?: string
}

export function PageShell({
  children,
  maxWidth = 960,
  paddingTop = 8,
  theme,
  className,
}: PageShellProps) {
  const isLight = theme === 'light'
  return (
    <div
      className={isLight ? `theme-light${className ? ` ${className}` : ''}` : className}
      style={{
        minHeight: '100vh',
        paddingTop,
        background: isLight ? 'var(--paper)' : 'var(--bg-deep)',
      }}
    >
      <div
        style={{
          maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
          margin: '0 auto',
          padding: 'clamp(20px, 4vw, 48px)',
          paddingTop: '40px',
        }}
      >
        {children}
      </div>
    </div>
  )
}
