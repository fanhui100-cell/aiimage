'use client'

import { useRouter } from 'next/navigation'

/**
 * B1-3：聚焦页移动端悬浮返回。
 * AppShell 在路由命中 FOCUS_ROUTES 时渲染（chromeless 路由各自页头已有返回，排除在外）。
 * 固定左上角 40px 圆钮（毛玻璃底），点击 router.back()，无历史时回 /today。
 */
export function FocusBackButton() {
  const router = useRouter()

  function back() {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back()
    else router.push('/today')
  }

  return (
    <button
      type="button"
      onClick={back}
      aria-label="返回"
      className="md:hidden"
      style={{
        position: 'fixed',
        top: 'calc(14px + env(safe-area-inset-top))',
        left: 14,
        zIndex: 120,
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: '1px solid var(--line)',
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 14px -6px rgba(20,30,40,0.25)',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
    </button>
  )
}
