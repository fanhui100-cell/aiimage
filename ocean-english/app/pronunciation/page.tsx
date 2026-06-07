import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { PageShell } from '@/components/ui/PageShell'
import { EmptyState } from '@/components/ui/EmptyState'
import { GlassCard } from '@/components/ui/GlassCard'
import { SectionHeader } from '@/components/ui/SectionHeader'

const alternatives = [
  { label: 'Word Detail', labelZh: '单词详情', href: '/dictionary', desc: 'Every word has IPA, pronunciation playback, and accent selector' },
  { label: 'AI Navigator', labelZh: 'AI 导学', href: '/chat', desc: 'Ask AI for pronunciation tips, phonetics explanations, or shadowing advice' },
  { label: 'Study Mode', labelZh: '学习模式', href: '/study', desc: 'Track your pronunciation practice sessions and daily goals' },
]

export default function PronunciationPage() {
  return (
    <AppShell>
      <PageShell maxWidth={720}>
        <div style={{ marginBottom: '8px', fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(126,249,255,0.45)', fontFamily: 'var(--font-mono)' }}>
          LEXIOCEAN / VOICE SONAR
        </div>
        <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 700, color: '#ECFBFF' }}>
          Voice Sonar <span style={{ fontSize: 'clamp(14px, 2vw, 18px)', color: '#9BBFCA' }}>声音脉络</span>
        </h1>
        <p style={{ margin: '0 0 32px', fontSize: '14px', color: '#9BBFCA', lineHeight: 1.6 }}>
          Phonetics, pronunciation playback, dictation, shadowing, and speaking practice.
          <br />
          <span style={{ fontSize: '13px', color: 'rgba(155,191,202,0.5)' }}>音标、发音播放、听写、跟读与口语训练。</span>
        </p>

        <EmptyState
          icon="🔊"
          title="Voice Sonar — Coming Soon"
          titleZh="发音功能正在建设中"
          description="Full pronunciation practice with shadowing and speaking feedback is on the roadmap."
          descriptionZh="完整的跟读和口语反馈功能即将上线。"
          variant="coming-soon"
        />

        <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '8px', background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.15)', fontSize: '12px', color: '#9BBFCA' }}>
          <strong style={{ color: '#38BDF8' }}>Available now:</strong> Every word in Dictionary and LexiGraph has IPA pronunciation playback with US/UK accent selector. Try it from any word detail page.
          <br />
          <span style={{ opacity: 0.7 }}>当前可用：词典和词汇星图中的每个单词都有 IPA 音标和美式/英式发音播放功能。</span>
        </div>

        <SectionHeader label="EXPLORE INSTEAD" labelZh="可以先去这里" style={{ marginTop: '28px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alternatives.map(item => (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
              <GlassCard accentColor="#7EF9FF">
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
          <Link href="/universe/voice-sonar" style={{ fontSize: '13px', color: 'rgba(126,249,255,0.5)', textDecoration: 'none' }}>
            Voice Sonar in Universe →
          </Link>
        </div>
      </PageShell>
    </AppShell>
  )
}
