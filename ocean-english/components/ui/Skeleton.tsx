interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  count?: number
  theme?: 'dark' | 'light'
  style?: React.CSSProperties
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 6, count = 1, theme = 'dark', style }: SkeletonProps) {
  const grad = theme === 'light'
    ? 'linear-gradient(90deg, rgba(20,30,40,0.05) 0%, rgba(20,30,40,0.11) 50%, rgba(20,30,40,0.05) 100%)'
    : 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)'

  const base: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
    background: grad,
    backgroundSize: '200% 100%',
    animation: 'skeletonShimmer 1.5s ease-in-out infinite',
    ...style,
  }

  if (count === 1) return <div style={base} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{ ...base, opacity: 1 - i * 0.15 }} />
      ))}
    </div>
  )
}
