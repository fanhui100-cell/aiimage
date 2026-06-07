'use client'

import Link from 'next/link'
import { SectionHeader } from '@/components/ui/SectionHeader'

const QUICK_PROMPTS = [
  { label: 'Explain a word', labelZh: '解释单词', href: '/chat' },
  { label: 'Generate a quiz', labelZh: '生成练习题', href: '/chat' },
  { label: 'Review my mistakes', labelZh: '分析错题', href: '/chat' },
  { label: 'Make a study plan', labelZh: '制定计划', href: '/chat' },
]

export function AINavigatorPanel() {
  return (
    <div
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid rgba(139,92,246,0.15)',
        borderRadius: '12px',
        padding: '20px',
      }}
    >
      <SectionHeader label="AI NAVIGATOR" labelZh="AI 导学" style={{ marginTop: 0, marginBottom: '4px' }} />
      <p style={{ fontSize: '12px', color: 'rgba(155,191,202,0.5)', margin: '0 0 14px' }}>
        Ask anything — words, grammar, strategies, quizzes.
        <br />
        <span style={{ fontSize: '11px' }}>提问词汇、语法、策略或练习题。</span>
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
        {QUICK_PROMPTS.map(p => (
          <Link
            key={p.label}
            href={p.href}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 12px', borderRadius: '7px', textDecoration: 'none',
              background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.12)',
              transition: 'border-color 0.15s',
            }}
          >
            <span style={{ fontSize: '12px', color: '#ECFBFF' }}>{p.label}</span>
            <span style={{ fontSize: '11px', color: 'rgba(155,191,202,0.4)' }}>{p.labelZh}</span>
          </Link>
        ))}
      </div>

      <Link
        href="/chat?context=study_goal"
        style={{
          display: 'block', textAlign: 'center', padding: '9px 16px', borderRadius: '8px',
          textDecoration: 'none', fontWeight: 600, fontSize: '13px',
          background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.35)', color: '#8B5CF6',
        }}
      >
        Open AI Navigator / 打开 AI 导学 →
      </Link>
    </div>
  )
}
