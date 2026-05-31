import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'

export default function ChatPage() {
  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
          <h1 style={{ margin: '0 0 6px', fontSize: '32px', fontWeight: 700, color: '#ECFBFF' }}>
            AI Navigator{' '}
            <span style={{ fontSize: '18px', color: '#9BBFCA' }}>AI 导学核心</span>
          </h1>
          <p style={{ margin: '0 0 32px', color: '#9BBFCA', fontSize: '14px' }}>
            Your intelligent study guide. Ask about words, grammar, exams, and get personalized
            learning plans.
            <br />
            <span style={{ fontSize: '13px', color: 'rgba(155,191,202,0.6)' }}>
              你的智能学习向导，提问单词、语法、考试，制定个性化学习计划。
            </span>
          </p>
          <div
            style={{
              height: '60vh',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(139,92,246,0.5)',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '13px',
              letterSpacing: '0.05em',
              marginBottom: '24px',
            }}
          >
            [ AI Chat Interface — Mock / AI 对话界面 (Phase 2) ]
          </div>
          <Link href="/" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>
            ← Back to Home / 返回首页
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
