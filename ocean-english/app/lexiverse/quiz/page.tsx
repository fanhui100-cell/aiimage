import { Suspense } from 'react'
import type { Metadata } from 'next'
import { LoadingState } from '@/components/lexiverse/LoadingState'
import { LexiverseQuizClient } from './LexiverseQuizClient'

export const metadata: Metadata = {
  title: 'Quiz Center - Lexiverse',
  description: 'Practice Lexiverse vocabulary with drills, sentence questions, exam mode, and wrong-answer review.',
}

export default function LexiverseQuizPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading Quiz Center..." />}>
      <LexiverseQuizClient />
    </Suspense>
  )
}
