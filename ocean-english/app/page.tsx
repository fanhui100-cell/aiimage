'use client'

import dynamic from 'next/dynamic'
import { AppShell } from '@/components/layout/AppShell'

const BanyanParticleHero = dynamic(
  () =>
    import('@/components/visual/BanyanParticleHero/BanyanParticleHero').then(m => ({
      default: m.BanyanParticleHero,
    })),
  { ssr: false },
)

export default function HomePage() {
  return (
    <AppShell>
      <BanyanParticleHero />
    </AppShell>
  )
}
