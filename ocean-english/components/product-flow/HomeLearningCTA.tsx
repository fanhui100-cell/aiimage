'use client'

import Link from 'next/link'
import { useLearningStore } from '@/store/learningStore'
import { SpotlightCard } from '@/components/ui/motion/SpotlightCard'

/* 线性 SVG 图标集 */
function IconStudy() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

function IconGraph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <circle cx="4" cy="6" r="2" />
      <circle cx="20" cy="6" r="2" />
      <circle cx="4" cy="18" r="2" />
      <circle cx="20" cy="18" r="2" />
      <line x1="12" y1="9" x2="4" y2="8" />
      <line x1="12" y1="9" x2="20" y2="8" />
      <line x1="12" y1="15" x2="4" y2="16" />
      <line x1="12" y1="15" x2="20" y2="16" />
    </svg>
  )
}

function IconReview() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  )
}

function IconScan() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  )
}

function IconChat() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function IconReading() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function IconListening() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  )
}

function IconQuiz() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function IconLexiverse() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  )
}

function IconExam() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M4 6h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
      <path d="M8 12h8M8 16h5" />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

export function HomeLearningCTA() {
  const { getDueWords } = useLearningStore()
  const dueCount = getDueWords().length

  return (
    <div
      className="theme-light"
      style={{ padding: 'clamp(40px,6vh,64px) clamp(18px,5vw,48px) 80px' }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* 区块小标题 */}
        <div style={{ marginBottom: '28px' }}>
          <p style={{
            margin: 0,
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--teal-ink)',
            opacity: 0.7,
          }}>
            你想去哪里 · Where next
          </p>
          <div style={{ marginTop: '6px', height: '1px', background: 'var(--line)' }} />
        </div>

        {/* 2 大模块卡 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px', marginBottom: '14px' }}>
          <LargeCard
            href="/today"
            icon={<IconStudy />}
            titleZh="今日中枢"
            titleEn="Today Hub"
            descZh="每日任务、学习路径和你的进度看板"
          />
          <LargeCard
            href="/lexigraph"
            icon={<IconGraph />}
            titleZh="词汇星图"
            titleEn="LexiGraph"
            descZh="用交互图谱探索单词关系、搭配和近反义词"
          />
        </div>

        {/* 小模块卡网格 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
          <SmallCard href="/memory" icon={<IconReview />} titleZh="复习">
            {dueCount > 0 && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '11px',
                padding: '2px 8px', borderRadius: 'var(--r-pill)',
                background: 'rgba(191,74,48,0.1)', color: 'var(--rose-ink)',
                border: '1px solid rgba(191,74,48,0.2)',
              }}>
                {dueCount} 到期
              </span>
            )}
          </SmallCard>
          <SmallCard href="/quiz" icon={<IconQuiz />} titleZh="练习模式" />
          <SmallCard href="/lexiverse" icon={<IconLexiverse />} titleZh="词汇宇宙" />
          <SmallCard href="/exam" icon={<IconExam />} titleZh="考试训练" />
          <SmallCard href="/scan" icon={<IconScan />} titleZh="文档扫描" />
          <SmallCard href="/chat" icon={<IconChat />} titleZh="AI 导学" />
          <SmallCard href="/reading" icon={<IconReading />} titleZh="阅读树冠" />
          <SmallCard href="/pronunciation" icon={<IconListening />} titleZh="声音脉络" />
        </div>

      </div>
    </div>
  )
}

function LargeCard({
  href, icon, titleZh, titleEn, descZh,
}: {
  href: string
  icon: React.ReactNode
  titleZh: string
  titleEn: string
  descZh: string
}) {
  return (
    <SpotlightCard
      as="a"
      href={href}
      className="card-hover spotlight-host"
      style={{
        display: 'block',
        textDecoration: 'none',
        background: 'var(--card-2)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--r-card)',
        boxShadow: 'var(--card-shadow)',
        padding: '28px 28px 24px',
      }}
    >
      <div style={{ color: 'var(--teal-ink)', marginBottom: '14px' }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: '22px', color: 'var(--ink)', marginBottom: '4px' }}>
        {titleZh}
      </div>
      <div style={{ fontFamily: 'var(--font-news)', fontStyle: 'italic', fontSize: '13px', color: 'var(--teal-ink)', marginBottom: '10px' }}>
        {titleEn}
      </div>
      <div style={{ fontSize: '14px', color: 'var(--ink-sub)', lineHeight: 1.6 }}>
        {descZh}
      </div>
      <div style={{ marginTop: '18px', color: 'var(--teal-ink)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600 }}>
        进入 <ArrowRight />
      </div>
    </SpotlightCard>
  )
}

function SmallCard({
  href, icon, titleZh, children,
}: {
  href: string
  icon: React.ReactNode
  titleZh: string
  children?: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="card-hover"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        textDecoration: 'none',
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--r-card)',
        boxShadow: 'var(--card-shadow-sm)',
        padding: '18px 18px 16px',
        minHeight: '90px',
      }}
    >
      <div style={{ color: 'var(--teal-ink)' }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>
        {titleZh}
      </div>
      {children}
    </Link>
  )
}
