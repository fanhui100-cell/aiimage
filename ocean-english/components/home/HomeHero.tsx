'use client'
// HomeHero — 首页 hero 装配层（fix1）
// 3D 粒子大树（LuminousBanyan，最新调参版）+ BanyanHero 抽出的 HeroOverlay 覆盖层；
// 不支持 WebGL 或 prefers-reduced-motion 时回退 2D Canvas 版 BanyanHero。
//
// 偏离说明：HomeHeroVisual 切换器包的是「自带覆盖层 + 调参面板」的整段组件，
// 直接叠 HeroOverlay 会出现双标题；故按 HOME_HERO_VISUAL 配置直接挂对应
// 画布（luminous-banyan → LuminousBanyanCanvas，参数取 LuminousBanyanHero
// 定稿默认值），legacy-banyan 则整段渲染旧组件。

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { HOME_HERO_VISUAL } from '@/config/home-hero-visual'
import { BanyanHero } from './BanyanHero'
import { HeroOverlay } from './HeroOverlay'

const LuminousBanyanCanvas = dynamic(
  () => import('@/components/visual/LuminousBanyanHero/LuminousBanyanCanvas').then(m => ({ default: m.LuminousBanyanCanvas })),
  { ssr: false },
)
const LegacyBanyanParticleHero = dynamic(
  () => import('@/components/visual/BanyanParticleHero/BanyanParticleHero').then(m => ({ default: m.BanyanParticleHero })),
  { ssr: false },
)

function detectWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export function HomeHero({ navigate }: { navigate: (go: string) => void }) {
  // null = 未检测（SSR/首帧只渲染深色底，避免闪烁）
  const [mode, setMode] = useState<'3d' | '2d' | null>(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setMode(!reduce && detectWebGL() ? '3d' : '2d')
  }, [])

  // 降级：2D Canvas 版（reduced-motion 时静帧）
  if (mode === '2d') {
    const reduce = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return <BanyanHero navigate={navigate} animate={!reduce} />
  }

  if (mode === '3d' && HOME_HERO_VISUAL === 'legacy-banyan') {
    return <LegacyBanyanParticleHero />
  }

  return (
    <section style={{ position: 'relative', width: '100%', height: 'min(86vh, 720px)', minHeight: 460, overflow: 'hidden', background: 'radial-gradient(120% 90% at 50% 30%, #0a1622 0%, #060b12 60%, #04070c 100%)' }}>
      {mode === '3d' && (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* 参数 = LuminousBanyanHero 定稿默认值（13ce2aa 深海辉光调参版） */}
          <LuminousBanyanCanvas pointSize={3.0} tailAlpha={0.25} tint="#ffffff" animationKey={0} />
        </div>
      )}
      <HeroOverlay navigate={navigate} />
    </section>
  )
}
