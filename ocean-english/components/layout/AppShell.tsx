import { Navbar } from './Navbar'
import { CloudSyncProvider } from '@/components/auth/CloudSyncProvider'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>
      <Navbar />
      <CloudSyncProvider>
        <main>{children}</main>
      </CloudSyncProvider>
    </div>
  )
}
