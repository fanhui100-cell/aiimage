'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './Navbar'
import { MobileTabBar } from './MobileTabBar'
import { CHROMELESS_ROUTES } from './MobileTabBar'
import { CloudSyncProvider } from '@/components/auth/CloudSyncProvider'
import { MilestoneToast } from '@/components/ui/MilestoneToast'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
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
