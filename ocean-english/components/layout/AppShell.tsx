import { Navbar } from './Navbar'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deep)' }}>
      <Navbar />
      <main>{children}</main>
    </div>
  )
}
