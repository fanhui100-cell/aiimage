import { Suspense } from 'react'
import type { Metadata } from 'next'
import { LoadingState } from '@/components/lexiverse/LoadingState'
import { LexiverseVocabBrowserClient } from './LexiverseVocabBrowserClient'

export const metadata: Metadata = {
  title: 'Vocab Browser - Lexiverse',
  description: 'Browse, filter, and preview Lexiverse vocabulary.',
}

export default function LexiverseVocabPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading Vocab Browser..." />}>
      <LexiverseVocabBrowserClient />
    </Suspense>
  )
}
