import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LexiverseShell } from '@/components/lexiverse/LexiverseShell'

export const metadata: Metadata = {
  title: '词汇星河 — LexiOcean',
  description: 'Explore your vocabulary as a universe of constellations, galaxies, and planets.',
}

export default function LexiverseRoute() {
  return (
    <Suspense fallback={
      <div style={{ position: 'fixed', inset: 0, background: '#040407', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4fe6ce', fontFamily: 'system-ui', fontSize: '14px' }}>
        词汇星河加载中…
      </div>
    }>
      <LexiverseShell />
    </Suspense>
  )
}
