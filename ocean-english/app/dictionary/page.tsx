import { Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { DictionaryScreen } from '@/components/screens/DictionaryScreen'

export default function DictionaryPage() {
  return (
    <AppShell>
      <Suspense>
        <DictionaryScreen />
      </Suspense>
    </AppShell>
  )
}
