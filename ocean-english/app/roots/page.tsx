import { Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { RootsScreen } from '@/components/screens/RootsScreen'

// D9：词根/词族串记 — 一个词根带出一族词（基于 word_relations）
export default function RootsPage() {
  return (
    <AppShell>
      <Suspense>
        <RootsScreen />
      </Suspense>
    </AppShell>
  )
}
