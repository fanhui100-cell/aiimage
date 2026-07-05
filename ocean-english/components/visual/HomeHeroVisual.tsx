'use client'

import dynamic from 'next/dynamic'
import { HOME_HERO_VISUAL } from '@/config/home-hero-visual'

const LegacyBanyanParticleHero = dynamic(
  () =>
    import('@/components/visual/BanyanParticleHero/BanyanParticleHero').then(m => ({
      default: m.BanyanParticleHero,
    })),
  { ssr: false },
)

const LuminousBanyanHero = dynamic(
  () =>
    import('@/components/visual/LuminousBanyanHero/LuminousBanyanHero').then(m => ({
      default: m.LuminousBanyanHero,
    })),
  { ssr: false },
)

export function HomeHeroVisual() {
  if (HOME_HERO_VISUAL === 'legacy-banyan') {
    return <LegacyBanyanParticleHero />
  }

  return <LuminousBanyanHero />
}
