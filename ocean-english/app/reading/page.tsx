import { Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { ReadingScreen } from '@/components/screens/ReadingScreen'

// F3-2：阅读板块真实化 — 原创短文 + 真实生词率排序 + 文内词典词可点入库
export default function ReadingPage() {
  return (
    <AppShell>
      <Suspense>
        <ReadingScreen />
      </Suspense>
    </AppShell>
  )
}
