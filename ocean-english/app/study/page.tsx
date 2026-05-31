import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'

const modules = [
  { en: 'Reading Canopy', zh: '阅读树冠', desc: 'Annotated articles & sentence analysis' },
  { en: 'Voice Sonar', zh: '声音脉络', desc: 'Pronunciation & shadowing practice' },
  { en: 'Study Plan', zh: '学习计划', desc: 'Daily goals & adaptive path' },
  { en: 'Progress', zh: '学习进度', desc: 'Track your improvement over time' },
]

export default function StudyPage() {
  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
          <h1 style={{ margin: '0 0 6px', fontSize: '32px', fontWeight: 700, color: '#ECFBFF' }}>
            Study Mode <span style={{ fontSize: '18px', color: '#9BBFCA' }}>学习模式</span>
          </h1>
          <p style={{ margin: '0 0 32px', color: '#9BBFCA', fontSize: '14px' }}>
            Reading practice, pronunciation training, and structured study sessions.
            <br />
            <span style={{ fontSize: '13px', color: 'rgba(155,191,202,0.6)' }}>
              阅读练习、发音训练与结构化学习课程。
            </span>
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            {modules.map(m => (
              <div
                key={m.en}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px dashed rgba(56,189,248,0.2)',
                  borderRadius: '10px',
                  padding: '32px',
                  textAlign: 'center',
                  color: 'rgba(56,189,248,0.4)',
                  fontSize: '12px',
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', color: 'rgba(56,189,248,0.6)' }}>
                  {m.en} / {m.zh}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(155,191,202,0.4)' }}>{m.desc}</div>
                <div style={{ marginTop: '12px', fontSize: '11px' }}>(Phase 2)</div>
              </div>
            ))}
          </div>
          <Link href="/" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>
            ← Back to Home / 返回首页
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
