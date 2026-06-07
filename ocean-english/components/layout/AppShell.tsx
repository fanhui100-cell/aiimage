import { Navbar } from './Navbar'
import { MobileTabBar } from './MobileTabBar'
import { AIGuideButton } from './AIGuideButton'
import { CloudSyncProvider } from '@/components/auth/CloudSyncProvider'
import { NightModeToggle } from '@/components/ui/NightModeToggle'
import { MilestoneToast } from '@/components/ui/MilestoneToast'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>
      <Navbar />
      <CloudSyncProvider>
        <main>{children}</main>
      </CloudSyncProvider>
      <MobileTabBar />
      <AIGuideButton />
      <NightModeToggle />
      <MilestoneToast />
    </div>
  )
}
