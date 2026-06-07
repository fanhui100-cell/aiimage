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
      {/* 深海 hero 满屏,底部渐变溶入米白 */}
      <HomeHeroVisual />
      {/* 米白日光模块区 */}
      <HomeLearningCTA />
    </AppShell>
  )
}
