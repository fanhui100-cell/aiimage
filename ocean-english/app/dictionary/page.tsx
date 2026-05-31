import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'

const mockPlaceholderStyle: React.CSSProperties = {
  background: 'rgba(56,189,248,0.06)',
  border: '1px dashed rgba(56,189,248,0.25)',
  borderRadius: '8px',
  padding: '24px',
  color: 'rgba(56,189,248,0.5)',
  fontSize: '13px',
  letterSpacing: '0.05em',
  fontFamily: 'ui-monospace, monospace',
  textAlign: 'center',
}

export default function DictionaryPage() {
  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
          <h1 style={{ margin: '0 0 6px', fontSize: '32px', fontWeight: 700, color: '#ECFBFF' }}>
            Vocabulary Roots{' '}
            <span style={{ fontSize: '18px', color: '#9BBFCA' }}>词汇根系</span>
          </h1>
          <p style={{ margin: '0 0 4px', color: '#9BBFCA', fontSize: '14px' }}>
            Search any English word for definitions, phonetics, etymology, mnemonics, and examples.
          </p>
          <p style={{ margin: '0 0 32px', color: 'rgba(155,191,202,0.6)', fontSize: '13px' }}>
            搜索任意英文单词，获取释义、音标、词源、记忆法与例句。
          </p>

          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(155,191,202,0.15)',
              borderRadius: '12px',
              padding: '32px',
              marginBottom: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={mockPlaceholderStyle}>[ 单词搜索框 — Word Search Input (Phase 2) ]</div>
            <div style={mockPlaceholderStyle}>[ 词典结果面板 — Word Detail Panel (Phase 2) ]</div>
          </div>

          <Link href="/" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>
            ← Back to Home / 返回首页
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
