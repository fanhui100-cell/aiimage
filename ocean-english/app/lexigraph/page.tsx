import { Suspense } from 'react'
import type { Metadata } from 'next'
import { LexiGraphPage } from '@/components/lexigraph/LexiGraphPage'

export const metadata: Metadata = {
  title: 'LexiGraph / 词汇星图 — LexiOcean',
  description: 'Explore word relationships, usage, memory, and review status.',
}

export default function LexiGraphRoute() {
  return (
    <Suspense>
      <LexiGraphPage />
    </Suspense>
  )
}
