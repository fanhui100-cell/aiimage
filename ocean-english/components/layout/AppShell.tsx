import { Navbar } from './Navbar'
import { MobileTabBar } from './MobileTabBar'
import { CloudSyncProvider } from '@/components/auth/CloudSyncProvider'
import { NightModeToggle } from '@/components/ui/NightModeToggle'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>
      <Navbar />
      <CloudSyncProvider>
        <main>{children}</main>
      </CloudSyncProvider>
      <MobileTabBar />
      <NightModeToggle />
    </div>
  )
}
