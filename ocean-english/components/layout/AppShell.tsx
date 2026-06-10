'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Navbar } from './Navbar'
import { MobileTabBar } from './MobileTabBar'
import { CHROMELESS_ROUTES } from './MobileTabBar'
import { CloudSyncProvider } from '@/components/auth/CloudSyncProvider'
import { MilestoneToast } from '@/components/ui/MilestoneToast'
import { useLexiStore } from '@/store/lexiStore'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // 启动兜底：v3 迁移产生的 stub 词条（zh === ''）补拉词典内容
  useEffect(() => {
    useLexiStore.getState().hydrateMissingEntries()
  }, [])
  const chromeless = CHROMELESS_ROUTES.some(
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
      <CloudSyncProvider>
        <main>{children}</main>
      </CloudSyncProvider>
      <MobileTabBar />
      <MilestoneToast />
    </div>
  )
}
