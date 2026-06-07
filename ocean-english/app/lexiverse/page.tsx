// app/lexiverse/page.tsx
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 · /lexiverse route.
//
// Server-component shell that wraps the client Lexiverse shell in Suspense
// (required because LexiverseShell calls useSearchParams). The route is
// fully client-rendered at the moment — no server data needed for Stage A
// because the catalog ships statically.
// ─────────────────────────────────────────────────────────────────────────

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { LexiverseShell } from '@/components/lexiverse/LexiverseShell'
import { LoadingState } from '@/components/lexiverse/LoadingState'

export const metadata: Metadata = {
  title: 'Lexiverse / 词汇宇宙 — LexiOcean',
  description: 'Explore your vocabulary as a universe of constellations, galaxies, and planets.',
}

export default function LexiverseRoute() {
  return (
    <Suspense fallback={<LoadingState message="Loading Lexiverse… / 加载宇宙中" />}>
      <LexiverseShell />
    </Suspense>
  )
}
