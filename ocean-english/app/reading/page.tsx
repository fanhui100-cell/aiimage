import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { PageShell } from '@/components/ui/PageShell'
import { EmptyState } from '@/components/ui/EmptyState'
import { GlassCard } from '@/components/ui/GlassCard'
import { SectionHeader } from '@/components/ui/SectionHeader'

const alternatives = [
  { labelZh: '词汇根系', label: 'Vocabulary', href: '/dictionary', descZh: '查看单词完整释义、词源和例句' },
  { labelZh: 'AI 导学', label: 'AI Navigator', href: '/chat', descZh: '让 AI 分析句子、解释语法、辅助词汇学习' },
  { labelZh: '词汇星图', label: 'LexiGraph', href: '/lexigraph', descZh: '用交互图谱探索单词关系与搭配' },
]

export default function ReadingPage() {
  return (
    <AppShell>
      <PageShell maxWidth={720} theme="light">
        <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--teal-ink)', opacity: 0.7 }}>
          阅读树冠 · Reading
        </p>
        <h1 style={{ margin: '0 0 4px', fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 'clamp(24px, 3.5vw, 38px)', color: 'var(--ink)', letterSpacing: '0.01em' }}>
          阅读树冠
        </h1>
        <p style={{ margin: '0 0 32px', fontFamily: 'var(--font-news)', fontStyle: 'italic', fontSize: '15px', color: 'var(--teal-ink)' }}>
          Reading Canopy — Annotated reading &amp; sentence analysis
        </p>

        <EmptyState
          icon=""
          title="阅读功能正在建设中"
          titleZh="Reading Canopy — Coming Soon"
          description="带 AI 注释的沉浸式阅读功能即将上线。"
          descriptionZh="Immersive annotated reading with AI sentence analysis is on the roadmap."
          variant="coming-soon"
        />

        <SectionHeader label="AVAILABLE NOW" labelZh="当前可用" theme="light" divider style={{ marginTop: '32px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
          {alternatives.map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <GlassCard theme="light">
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', marginBottom: '3px' }}>
                  {item.labelZh} <span style={{ fontFamily: 'var(--font-news)', fontStyle: 'italic', color: 'var(--teal-ink)', fontWeight: 400 }}>{item.label}</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--ink-sub)' }}>{item.descZh}</div>
              </GlassCard>
            </Link>
          ))}
        </div>

        <div style={{ marginTop: '28px' }}>
          <Link href="/today" style={{ fontSize: '13px', color: 'var(--teal-ink)', textDecoration: 'none' }}>
            ← 返回今日
          </Link>
        </div>
      </PageShell>
    </AppShell>
  )
}
