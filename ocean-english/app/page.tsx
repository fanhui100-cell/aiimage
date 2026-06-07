'use client'

import dynamic from 'next/dynamic'
import { AppShell } from '@/components/layout/AppShell'
import { HomeLearningCTA } from '@/components/product-flow/HomeLearningCTA'

const HomeHeroVisual = dynamic(
  () =>
    import('@/components/visual/HomeHeroVisual').then(m => ({
      default: m.HomeHeroVisual,
    })),
  { ssr: false },
)

export default function HomePage() {
  return (
    <AppShell>
      <HomeHeroVisual />
      <HomeLearningCTA />
    </AppShell>
  )
}
