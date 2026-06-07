import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '词汇星河 — LexiOcean',
  description: 'Explore your vocabulary as a universe of constellations, galaxies, and planets.',
}

export default function LexiverseRoute() {
  return (
    <iframe
      src="/lexiverse-html/Lexiverse%20Galaxy%20Overview.html"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        border: 'none',
        zIndex: 9999,
      }}
      allow="autoplay"
    />
  )
}
