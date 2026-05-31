import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'

const examTypes = [
  { en: 'TOEFL', zh: '托福', desc: 'Test of English as a Foreign Language' },
  { en: 'IELTS', zh: '雅思', desc: 'International English Language Testing System' },
  { en: 'CET-4', zh: '四级', desc: '大学英语四级' },
  { en: 'CET-6', zh: '六级', desc: '大学英语六级' },
  { en: '考研英语', zh: '考研', desc: 'Graduate School Entrance Exam English' },
  { en: '高考英语', zh: '高考', desc: 'National College Entrance Exam English' },
]

export default function ExamPage() {
  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
          <h1 style={{ margin: '0 0 6px', fontSize: '32px', fontWeight: 700, color: '#ECFBFF' }}>
            Exam Branch <span style={{ fontSize: '18px', color: '#9BBFCA' }}>考试枝路</span>
          </h1>
          <p style={{ margin: '0 0 32px', color: '#9BBFCA', fontSize: '14px' }}>
            Choose your target exam for focused preparation and mock tests.
            <br />
            <span style={{ fontSize: '13px', color: 'rgba(155,191,202,0.6)' }}>
              选择目标考试，专项备考与模拟练习。
            </span>
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '14px',
              marginBottom: '32px',
            }}
          >
            {examTypes.map(exam => (
              <div
                key={exam.en}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(249,115,22,0.25)',
                  borderRadius: '10px',
                  padding: '20px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#F97316', marginBottom: '2px' }}>
                  {exam.en}
                </div>
                <div style={{ fontSize: '13px', color: '#9BBFCA', marginBottom: '8px' }}>
                  {exam.zh}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(155,191,202,0.5)' }}>{exam.desc}</div>
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
