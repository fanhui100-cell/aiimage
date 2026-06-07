'use client'
// components/lexiverse/LoadingState.tsx
export interface LoadingStateProps { message?: string }
export function LoadingState({ message = 'Loading…' }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#040407',
        color: '#7EF9FF',
        fontFamily: "'Space Mono', monospace",
        fontSize: 13,
        letterSpacing: '0.06em',
      }}
    >
      <span style={{ display: 'inline-block', width: 14, height: 14, marginRight: 12, borderRadius: '50%', border: '2px solid currentColor', borderTopColor: 'transparent', animation: 'lex-spin 0.9s linear infinite' }} />
      {message}
      <style>{'@keyframes lex-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}
