import { Suspense } from 'react'
import type { Metadata } from 'next'
import { LexiGraphPage } from '@/components/lexigraph/LexiGraphPage'

export const metadata: Metadata = {
  title: '词汇星图 · LexiGraph — LexiOcean',
  description: '用交互星图探索单词关系、搭配与记忆状态。',
}

export default function LexiGraphRoute() {
  return (
    <Suspense>
      <LexiGraphPage />
    </Suspense>
  )
}
