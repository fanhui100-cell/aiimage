import { Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingState } from '@/components/lexiverse/LoadingState'
import { LexiverseQuizClient } from '@/components/quiz/LexiverseQuizClient'

// A6：/quiz 为全站唯一测验入口，内部使用 Lexiverse 四模式引擎（状态机写回）
export default function QuizPage() {
  return (
    <AppShell>
      <Suspense fallback={<LoadingState message="Loading Quiz Center..." />}>
        <LexiverseQuizClient />
      </Suspense>
    </AppShell>
  )
}
