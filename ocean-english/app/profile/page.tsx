import { Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { MeScreen } from '@/components/screens/MeScreen'

export default function ProfilePage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <MeScreen />
      </Suspense>
    </AppShell>
  )
}
