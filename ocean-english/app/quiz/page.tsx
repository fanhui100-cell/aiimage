import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'

export default function QuizPage() {
  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px' }}>
          <h1 style={{ margin: '0 0 6px', fontSize: '32px', fontWeight: 700, color: '#ECFBFF' }}>
            Quiz Mode <span style={{ fontSize: '18px', color: '#9BBFCA' }}>练习模式</span>
          </h1>
          <p style={{ margin: '0 0 32px', color: '#9BBFCA', fontSize: '14px' }}>
            Test your knowledge with AI-generated quizzes tailored to your level.
            <br />
            <span style={{ fontSize: '13px', color: 'rgba(155,191,202,0.6)' }}>
              AI 生成个性化练习题，测试你的英语水平。
            </span>
          </p>
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px dashed rgba(56,189,248,0.2)',
              borderRadius: '12px',
              padding: '48px',
              textAlign: 'center',
              color: 'rgba(56,189,248,0.4)',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '13px',
              letterSpacing: '0.05em',
              marginBottom: '24px',
            }}
          >
            [ Quiz Card Interface — Multiple choice, fill-in-the-blank (Phase 2) ]
            <br />[ 练习题卡 — 选择题、填空题 (Phase 2) ]
          </div>
          <Link href="/" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>
            ← Back to Home / 返回首页
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
