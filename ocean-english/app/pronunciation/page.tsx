import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { PageShell } from '@/components/ui/PageShell'
import { EmptyState } from '@/components/ui/EmptyState'
import { GlassCard } from '@/components/ui/GlassCard'
import { SectionHeader } from '@/components/ui/SectionHeader'

const alternatives = [
  { labelZh: '单词详情', label: 'Word Detail', href: '/dictionary', descZh: '每个单词都有 IPA 音标、发音播放和美式/英式切换' },
  { labelZh: 'AI 导学', label: 'AI Navigator', href: '/chat', descZh: '向 AI 请教发音技巧、音标讲解或跟读建议' },
  { labelZh: '学习中心', label: 'Study Mode', href: '/study', descZh: '跟踪发音练习记录，完成每日目标' },
]

export default function PronunciationPage() {
  return (
    <AppShell>
      <PageShell maxWidth={720} theme="light">
        <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--teal-ink)', opacity: 0.7 }}>
          声音脉络 · Pronunciation
        </p>
        <h1 style={{ margin: '0 0 4px', fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 'clamp(24px, 3.5vw, 38px)', color: 'var(--ink)', letterSpacing: '0.01em' }}>
          声音脉络
        </h1>
        <p style={{ margin: '0 0 32px', fontFamily: 'var(--font-news)', fontStyle: 'italic', fontSize: '15px', color: 'var(--teal-ink)' }}>
          Voice Sonar — Phonetics, shadowing &amp; speaking practice
        </p>

        <EmptyState
          icon=""
          title="发音功能正在建设中"
          titleZh="Voice Sonar — Coming Soon"
          description="完整的跟读和口语反馈功能即将上线。"
          descriptionZh="Full pronunciation practice with shadowing and speaking feedback is on the roadmap."
          variant="coming-soon"
        />

        <div style={{ marginTop: '16px', padding: '14px 18px', borderRadius: 'var(--r-sm)', background: 'var(--teal-bg)', border: '1px solid rgba(14,140,122,0.2)', fontSize: '13px', color: 'var(--ink-sub)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--teal-ink)' }}>当前可用：</strong>词典和词汇星图中的每个单词都有 IPA 音标和美式/英式发音播放功能，从任意单词详情页即可使用。
        </div>

        <SectionHeader label="EXPLORE INSTEAD" labelZh="可以先去这里" theme="light" divider style={{ marginTop: '28px' }} />
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
          <Link href="/study" style={{ fontSize: '13px', color: 'var(--teal-ink)', textDecoration: 'none' }}>
            ← 返回学习中心
          </Link>
        </div>
      </PageShell>
    </AppShell>
  )
}
