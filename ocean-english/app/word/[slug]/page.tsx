import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { getMockWord } from '@/data/mock-words'
import { WordDetailClient } from './WordDetailClient'

export default async function WordPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const word = getMockWord(slug)

  if (!word) {
    return (
      <AppShell>
        <div
          style={{
            minHeight: '100vh',
            background: 'var(--bg-deep)',
            paddingTop: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌊</div>
            <h1 style={{ color: '#ECFBFF', marginBottom: '8px' }}>Word not found</h1>
            <p style={{ color: '#9BBFCA', marginBottom: '24px' }}>
              &quot;{slug}&quot; is not in the mock dictionary yet.
            </p>
            <Link href="/dictionary" style={{ color: '#38BDF8', textDecoration: 'none' }}>
              ← Back to Dictionary / 返回词典
            </Link>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <WordDetailClient word={word} />
    </AppShell>
  )
}
