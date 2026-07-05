import { cn } from '@/lib/utils'

interface GlassPanelProps {
  children: React.ReactNode
  className?: string
  glowColor?: string
}

export function GlassPanel({
  children,
  className,
  glowColor = 'var(--accent-blue)',
}: GlassPanelProps) {
  return (
    <div
      className={cn('rounded-xl p-5 relative overflow-hidden', className)}
      style={{
        background: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${glowColor}40`,
        boxShadow: `0 0 24px ${glowColor}20, inset 0 0 40px rgba(0,0,0,0.4)`,
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-40"
        style={{ background: `linear-gradient(to right, transparent, ${glowColor}, transparent)` }}
      />
      {children}
    </div>
  )
}
