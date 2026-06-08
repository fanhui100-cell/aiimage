import { Navbar } from './Navbar'
import { MobileTabBar } from './MobileTabBar'
import { AIGuideButton } from './AIGuideButton'
import { CloudSyncProvider } from '@/components/auth/CloudSyncProvider'
import { MilestoneToast } from '@/components/ui/MilestoneToast'
import { LevelGate } from '@/components/product-flow/LevelGate'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>
      <Navbar />
      <CloudSyncProvider>
        <main>{children}</main>
      </CloudSyncProvider>
      <MobileTabBar />
      <AIGuideButton />
      <LevelGate />
      <MilestoneToast />
    </div>
  )
}
