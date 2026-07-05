import { Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { ReviewHub } from '@/components/screens/ReviewHub'

export default function MemoryPage() {
  return (
    <AppShell>
      <Suspense>
        <ReviewHub />
      </Suspense>
    </AppShell>
  )
}
