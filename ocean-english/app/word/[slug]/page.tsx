import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { getDictionaryClient } from '@/lib/dictionary/dictionary-client'
import { WordDetailClient } from './WordDetailClient'

export default async function WordPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const word = await getDictionaryClient().lookupWord(slug)

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
            <h1 style={{ color: '#ECFBFF', marginBottom: '8px' }}>Word not found / 未找到单词</h1>
            <p style={{ color: '#9BBFCA', marginBottom: '24px' }}>
              &quot;{slug}&quot; is not in the dictionary yet.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <Link href="/dictionary" style={{ color: '#38BDF8', textDecoration: 'none', fontSize: '14px' }}>
                ← Browse Dictionary / 浏览词典
              </Link>
            </div>
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
