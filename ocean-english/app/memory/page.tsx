import { Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { ReviewScreen } from '@/components/screens/ReviewScreen'

export default function MemoryPage() {
  return (
    <AppShell>
      <Suspense>
        <ReviewScreen />
      </Suspense>
    </AppShell>
  )
}
