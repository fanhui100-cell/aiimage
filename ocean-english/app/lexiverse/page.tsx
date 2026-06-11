import type { Metadata } from 'next'
import { ReferenceLexiverseFrame } from '@/components/lexiverse/ReferenceLexiverseFrame'

export const metadata: Metadata = {
  title: 'Lexiverse - LexiOcean',
  description: 'Explore vocabulary as a universe of constellations, galaxies, and planets.',
}

export const dynamic = 'force-dynamic'

export default function LexiverseRoute() {
  return <ReferenceLexiverseFrame />
}
