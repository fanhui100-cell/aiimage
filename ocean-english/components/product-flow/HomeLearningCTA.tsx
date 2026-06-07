'use client'

import Link from 'next/link'
import { useLearningStore } from '@/store/learningStore'

interface CTACard {
  href: string
  label: string
  labelZh: string
  desc: string
  descZh: string
  accent: string
  size: 'large' | 'small'
}

const primaryCTAs: CTACard[] = [
  {
    href: '/study',
    label: 'Start Learning',
    labelZh: '开始学习',
    desc: 'Daily missions, learning paths, and your progress dashboard.',
    descZh: '每日任务、学习路径和你的进度看板。',
    accent: '#38BDF8',
    size: 'large',
  },
  {
    href: '/lexigraph',
    label: 'Enter LexiGraph',
    labelZh: '进入词汇星图',
    desc: 'Explore word relationships, collocations, and synonyms on an interactive map.',
    descZh: '用交互式图谱探索单词关系、搭配和近反义词。',
    accent: '#7EF9FF',
    size: 'large',
  },
]

const secondaryCTAs: CTACard[] = [
  {
    href: '/memory',
    label: 'Continue Review',
    labelZh: '继续复习',
    desc: 'Words due for spaced repetition',
    descZh: '间隔重复复习队列',
    accent: '#34D399',
    size: 'small',
  },
  {
    href: '/scan',
    label: 'Scan a Document',
    labelZh: '扫描文档',
    desc: 'Extract vocabulary from PDFs and images',
    descZh: '从 PDF / 图片提取词汇',
    accent: '#FFD76A',
    size: 'small',
  },
  {
    href: '/chat',
    label: 'Ask AI Navigator',
    labelZh: '问 AI 导学',
    desc: 'Get explanations, quizzes, and study plans',
    descZh: '获取解释、练习题和学习计划',
    accent: '#8B5CF6',
    size: 'small',
  },
]

export function HomeLearningCTA() {
  const { reviewWords, getDueWords } = useLearningStore()
  const dueCount = getDueWords().length

  return (
    <div
      style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '0 24px 80px',
      }}
    >
      <div
        style={{
          marginBottom: '20px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: '12px',
            color: 'rgba(155,191,202,0.5)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Where would you like to go? / 你想去哪里？
        </p>
      </div>

      {/* Primary CTAs — 2 large cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        {primaryCTAs.map(cta => (
          <Link
            key={cta.href}
            href={cta.href}
            style={{
              display: 'block',
              padding: '24px 28px',
              borderRadius: '12px',
              textDecoration: 'none',
              background: `rgba(${hexToRgb(cta.accent)},0.05)`,
              border: `1px solid rgba(${hexToRgb(cta.accent)},0.2)`,
              backdropFilter: 'blur(8px)',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.borderColor = `rgba(${hexToRgb(cta.accent)},0.5)`
              el.style.background = `rgba(${hexToRgb(cta.accent)},0.08)`
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.borderColor = `rgba(${hexToRgb(cta.accent)},0.2)`
              el.style.background = `rgba(${hexToRgb(cta.accent)},0.05)`
            }}
          >
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: cta.accent,
                marginBottom: '6px',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.04em',
              }}
            >
              {cta.label} / {cta.labelZh} →
            </div>
            <div style={{ fontSize: '13px', color: '#9BBFCA', lineHeight: 1.5 }}>
              {cta.desc}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(155,191,202,0.5)', marginTop: '4px' }}>
              {cta.descZh}
            </div>
          </Link>
        ))}
      </div>

      {/* Secondary CTAs — 3 smaller cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '10px',
        }}
      >
        {secondaryCTAs.map(cta => {
          const isReview = cta.href === '/memory'
          return (
            <Link
              key={cta.href}
              href={cta.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: '10px',
                textDecoration: 'none',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(155,191,202,0.12)',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.borderColor = `rgba(${hexToRgb(cta.accent)},0.35)`
                el.style.background = `rgba(${hexToRgb(cta.accent)},0.05)`
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.borderColor = 'rgba(155,191,202,0.12)'
                el.style.background = 'rgba(255,255,255,0.02)'
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: cta.accent, marginBottom: '2px' }}>
                  {cta.label} / {cta.labelZh}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(155,191,202,0.5)' }}>
                  {cta.descZh}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                {isReview && dueCount > 0 && (
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: 'rgba(239,68,68,0.15)',
                      color: '#EF4444',
                      border: '1px solid rgba(239,68,68,0.3)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {dueCount} due
                  </span>
                )}
                {isReview && reviewWords.length > 0 && dueCount === 0 && (
                  <span style={{ fontSize: '11px', color: 'rgba(155,191,202,0.4)' }}>
                    {reviewWords.length} saved
                  </span>
                )}
                <span style={{ fontSize: '16px', color: 'rgba(155,191,202,0.3)' }}>→</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `${r},${g},${b}`
}
