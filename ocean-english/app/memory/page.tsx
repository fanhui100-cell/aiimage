import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'

const stats = [
  { icon: '📅', en: 'Due Today', zh: '今日待复习', count: '0 words' },
  { icon: '📚', en: 'Word Bank', zh: '我的词库', count: '0 words' },
  { icon: '❌', en: 'Wrong Answers', zh: '错题本', count: '0 items' },
]

export default function MemoryPage() {
  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
          <h1 style={{ margin: '0 0 6px', fontSize: '32px', fontWeight: 700, color: '#ECFBFF' }}>
            Memory Roots <span style={{ fontSize: '18px', color: '#9BBFCA' }}>记忆根系</span>
          </h1>
          <p style={{ margin: '0 0 32px', color: '#9BBFCA', fontSize: '14px' }}>
            Spaced repetition, wrong-answer notebook, and memory curve tracking.
            <br />
            <span style={{ fontSize: '13px', color: 'rgba(155,191,202,0.6)' }}>
              间隔复习、错题本与记忆曲线追踪。
            </span>
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '16px',
              marginBottom: '32px',
            }}
          >
            {stats.map(s => (
              <div
                key={s.en}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(52,211,153,0.25)',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#34D399', marginBottom: '2px' }}>
                  {s.en}
                </div>
                <div style={{ fontSize: '12px', color: '#9BBFCA', marginBottom: '8px' }}>{s.zh}</div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'rgba(52,211,153,0.5)',
                    fontFamily: 'ui-monospace, monospace',
                  }}
                >
                  {s.count}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(52,211,153,0.2)',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              color: 'rgba(52,211,153,0.4)',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '13px',
              marginBottom: '24px',
            }}
          >
            [ Memory Review Interface — Spaced repetition cards (Phase 2) ]
            <br />[ 记忆复习界面 — 间隔复习卡片 (Phase 2) ]
          </div>
          <Link href="/" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>
            ← Back to Home / 返回首页
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
