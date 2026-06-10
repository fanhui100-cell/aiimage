import { Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { LearnScreen } from '@/components/screens/LearnScreen'

export default function LearnPage() {
  return (
    <AppShell>
      <Suspense>
        <LearnScreen />
      </Suspense>
    </AppShell>
  )
}
