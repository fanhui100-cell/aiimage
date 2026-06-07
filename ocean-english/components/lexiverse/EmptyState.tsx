'use client'
// components/lexiverse/EmptyState.tsx
export interface EmptyStateProps {
  title?: string
  description?: string
  zhDescription?: string
}
export function EmptyState({
  title = 'No galaxies match',
  description = 'Try a different filter or search term.',
  zhDescription = '没有匹配的星系。换一个筛选或搜索词试试。',
}: EmptyStateProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        color: '#9FB6C6',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        maxWidth: 340,
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontSize: 32, opacity: 0.45, marginBottom: 12 }}>◌</div>
      <div style={{ color: '#ECFBFF', fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.55 }}>{description}</div>
      <div style={{ fontSize: 12, marginTop: 4, opacity: 0.72 }}>{zhDescription}</div>
    </div>
  )
}
