import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'

export default async function WordPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px' }}>
          <div
            style={{
              marginBottom: '8px',
              fontSize: '13px',
              color: 'rgba(56,189,248,0.5)',
              fontFamily: 'ui-monospace, monospace',
              letterSpacing: '0.1em',
            }}
          >
            WORD / 单词
          </div>
          <h1
            style={{ margin: '0 0 8px', fontSize: '40px', fontWeight: 700, color: '#ECFBFF' }}
          >
            {slug}
          </h1>
          <div
            style={{
              fontSize: '18px',
              color: '#7EF9FF',
              marginBottom: '32px',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            /mɒk · fəˈnɛtɪks/
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(155,191,202,0.15)',
              borderRadius: '12px',
              padding: '28px',
              marginBottom: '32px',
              color: '#9BBFCA',
              fontSize: '13px',
              fontFamily: 'ui-monospace, monospace',
              lineHeight: 1.8,
            }}
          >
            [ Word detail panel — definitions, etymology, mnemonics, examples will appear here in
            Phase 2 ]
            <br />
            [ 单词详情面板 — 释义、词源、记忆法、例句将在 Phase 2 完成 ]
          </div>
          <Link href="/dictionary" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>
            ← Dictionary / 词典
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
