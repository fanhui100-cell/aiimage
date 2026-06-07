import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { PageShell } from '@/components/ui/PageShell'
import { EmptyState } from '@/components/ui/EmptyState'
import { GlassCard } from '@/components/ui/GlassCard'
import { SectionHeader } from '@/components/ui/SectionHeader'

const alternatives = [
  { label: 'Vocabulary Builder', labelZh: '词汇构建', href: '/dictionary', desc: 'Look up words with full definitions, etymology, and examples' },
  { label: 'AI Navigator', labelZh: 'AI 导学', href: '/chat', desc: 'Ask AI to analyze sentences, explain grammar, or build vocabulary' },
  { label: 'LexiGraph', labelZh: '词汇星图', href: '/lexigraph', desc: 'Explore word relationships and collocations on an interactive map' },
]

export default function ReadingPage() {
  return (
    <AppShell>
      <PageShell maxWidth={720}>
        <div style={{ marginBottom: '8px', fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(184,255,178,0.45)', fontFamily: 'var(--font-mono)' }}>
          LEXIOCEAN / READING CANOPY
        </div>
        <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 700, color: '#ECFBFF' }}>
          Reading Canopy <span style={{ fontSize: 'clamp(14px, 2vw, 18px)', color: '#9BBFCA' }}>阅读树冠</span>
        </h1>
        <p style={{ margin: '0 0 32px', fontSize: '14px', color: '#9BBFCA', lineHeight: 1.6 }}>
          Annotated reading, sentence analysis, and vocabulary tracking inside real texts.
          <br />
          <span style={{ fontSize: '13px', color: 'rgba(155,191,202,0.5)' }}>分级阅读训练、长难句分析与文本内生词标注。</span>
        </p>

        <EmptyState
          icon="📖"
          title="Reading Canopy — Coming Soon"
          titleZh="阅读功能正在建设中"
          description="Immersive annotated reading with AI sentence analysis is on the roadmap."
          descriptionZh="带 AI 注释的沉浸式阅读功能即将上线。"
          variant="coming-soon"
        />

        <SectionHeader label="AVAILABLE NOW" labelZh="当前可用" style={{ marginTop: '32px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alternatives.map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <GlassCard accentColor="#38BDF8">
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#ECFBFF', marginBottom: '2px' }}>
                  {item.label} <span style={{ color: '#9BBFCA', fontWeight: 400 }}>/ {item.labelZh}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#9BBFCA' }}>{item.desc}</div>
              </GlassCard>
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '28px' }}>
          <Link href="/study" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>
            ← Back to Study / 返回学习中心
          </Link>
          <Link href="/universe/reading" style={{ fontSize: '13px', color: 'rgba(184,255,178,0.5)', textDecoration: 'none' }}>
            Reading in Universe →
          </Link>
        </div>
      </PageShell>
    </AppShell>
  )
}
