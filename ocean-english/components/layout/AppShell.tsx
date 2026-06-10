'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Navbar } from './Navbar'
import { MobileTabBar } from './MobileTabBar'
import { CHROMELESS_ROUTES, FOCUS_ROUTES } from './MobileTabBar'
import { FocusBackButton } from './FocusBackButton'
import { CloudSyncProvider } from '@/components/auth/CloudSyncProvider'
import { MilestoneToast } from '@/components/ui/MilestoneToast'
import { LumiCompanion } from '@/components/companion/LumiCompanion'
import { useLexiStore } from '@/store/lexiStore'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // 启动兜底：① 词库空且断网时注入离线种子包；② stub 词条（zh === ''）补拉词典内容
  useEffect(() => {
    const lexi = useLexiStore.getState()
    void lexi.injectOfflineSeedIfEmpty()
    void lexi.hydrateMissingEntries()
  }, [])
  const chromeless = CHROMELESS_ROUTES.some(
    r => pathname === r || pathname.startsWith(r + '/')
  )
  // B1-3：聚焦页（tab bar 隐藏）移动端给悬浮返回；chromeless 页自带返回
  const focus = !chromeless && FOCUS_ROUTES.some(
    r => pathname === r || pathname.startsWith(r + '/')
  )

  if (chromeless) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>
        <main>{children}</main>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>
      <Navbar />
      {focus && <FocusBackButton />}
      <CloudSyncProvider>
        <main>{children}</main>
      </CloudSyncProvider>
      <MobileTabBar />
      <MilestoneToast />
      {/* B10-2：陪伴系统挂 Lumi（仅非 chromeless；设置可关，会话频控 ≤2 条） */}
      <LumiCompanion />
    </div>
  )
}
