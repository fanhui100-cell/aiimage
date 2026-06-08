'use client'

import Link from 'next/link'
import { useLearningStore } from '@/store/learningStore'
import { SpotlightCard } from '@/components/ui/motion/SpotlightCard'
import { CountUp } from '@/components/ui/motion/CountUp'

/* ── SVG Icons ── */
function IconToday() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      <path d="M9 16l2 2 4-4" />
    </svg>
  )
}

function IconLexiverse() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
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

function IconQuiz() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
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

function IconGraph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <circle cx="4" cy="6" r="2" /><circle cx="20" cy="6" r="2" />
      <circle cx="4" cy="18" r="2" /><circle cx="20" cy="18" r="2" />
      <line x1="12" y1="9" x2="4" y2="8" /><line x1="12" y1="9" x2="20" y2="8" />
      <line x1="12" y1="15" x2="4" y2="16" /><line x1="12" y1="15" x2="20" y2="16" />
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

function IconPronunciation() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  )
}

function IconScan() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
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

function ArrowRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

/* ── Group section header ── */
function GroupHeader({ zh, en }: { zh: string; en: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', whiteSpace: 'nowrap' }}>
        {zh} · {en}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
    </div>
  )
}

/* ── Large card ── */
function LargeCard({
  href, icon, titleZh, titleEn, descZh,
}: {
  href: string; icon: React.ReactNode; titleZh: string; titleEn: string; descZh: string
}) {
  return (
    <SpotlightCard
      as="a"
      href={href}
      className="card-hover spotlight-host"
      style={{
        display: 'block', textDecoration: 'none',
        background: 'var(--card-2)', border: '1px solid var(--line)',
        borderRadius: 'var(--r-card)', boxShadow: 'var(--card-shadow)',
        padding: '28px 28px 24px',
      }}
    >
      {/* Icon chip */}
      <div style={{
        width: 44, height: 44, borderRadius: 12, marginBottom: 16,
        background: 'var(--teal-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--teal-ink)',
      }}>
        {icon}
      </div>
      <div style={{ fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 22, color: 'var(--ink)', marginBottom: 4 }}>
        {titleZh}
      </div>
      <div style={{ fontFamily: 'var(--font-news)', fontStyle: 'italic', fontSize: 13, color: 'var(--teal-ink)', marginBottom: 10 }}>
        {titleEn}
      </div>
      <div style={{ fontSize: 14, color: 'var(--ink-sub)', lineHeight: 1.6 }}>{descZh}</div>
      <div style={{ marginTop: 18, color: 'var(--teal-ink)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}>
        进入 <ArrowRight />
      </div>
    </SpotlightCard>
  )
}

/* ── Small card ── */
function SmallCard({
  href, icon, titleZh, titleEn, descZh, badge,
}: {
  href: string; icon: React.ReactNode; titleZh: string; titleEn: string; descZh: string
  badge?: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="card-hover"
      style={{
        display: 'flex', flexDirection: 'column', gap: 6, textDecoration: 'none',
        background: 'var(--card)', border: '1px solid var(--line)',
        borderRadius: 'var(--r-card)', boxShadow: 'var(--card-shadow-sm)',
        padding: '16px 16px 14px', position: 'relative',
      }}
    >
      {/* Icon chip */}
      <div style={{
        width: 38, height: 38, borderRadius: 11, marginBottom: 2,
        background: 'var(--teal-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--teal-ink)', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
        {titleZh}
      </div>
      <div style={{ fontFamily: 'var(--font-news)', fontStyle: 'italic', fontSize: 11, color: 'var(--teal-ink)' }}>
        {titleEn}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-sub)', lineHeight: 1.5 }}>{descZh}</div>
      {badge}
    </Link>
  )
}

/* ── Main component ── */
export function HomeLearningCTA() {
  const { getDueWords } = useLearningStore()
  const dueCount = getDueWords().length

  return (
    <div
      className="theme-light"
      style={{ padding: 'clamp(40px,6vh,64px) clamp(18px,5vw,48px) 80px' }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* Section eyebrow */}
        <div style={{ marginBottom: 28 }}>
          <p style={{
            margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: 'var(--teal-ink)', opacity: 0.7,
          }}>你想去哪里 · Where next</p>
          <div style={{ marginTop: 6, height: '1px', background: 'var(--line)' }} />
        </div>

        {/* 2 large cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14, marginBottom: 32 }}>
          <LargeCard
            href="/today"
            icon={<IconToday />}
            titleZh="今日中枢"
            titleEn="Today Hub"
            descZh="每日任务、学习路径和你的进度看板"
          />
          <LargeCard
            href="/lexiverse"
            icon={<IconLexiverse />}
            titleZh="词汇宇宙"
            titleEn="Lexiverse"
            descZh="星系式词库漫游，在星图中发现与掌握单词"
          />
        </div>

        {/* Group 1: 练习巩固 */}
        <div style={{ marginBottom: 28 }}>
          <GroupHeader zh="练习巩固" en="Practice" />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10,
          }}
            className="home-small-grid"
          >
            <SmallCard
              href="/memory"
              icon={<IconReview />}
              titleZh="复习"
              titleEn="Review"
              descZh="间隔重复，巩固记忆"
              badge={dueCount > 0 ? (
                <span style={{
                  position: 'absolute', top: 10, right: 10,
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  padding: '2px 7px', borderRadius: 'var(--r-pill)',
                  background: 'rgba(191,74,48,0.1)', color: 'var(--rose-ink)',
                  border: '1px solid rgba(191,74,48,0.2)',
                }}>
                  <CountUp to={dueCount} /> 到期
                </span>
              ) : undefined}
            />
            <SmallCard href="/quiz" icon={<IconQuiz />} titleZh="练习模式" titleEn="Practice" descZh="多种题型强化训练" />
            <SmallCard href="/exam" icon={<IconExam />} titleZh="考试训练" titleEn="Exam Drill" descZh="模拟考试专项突破" />
            {/* 4th column placeholder to keep grid shape */}
            <div />
          </div>
        </div>

        {/* Group 2: 探索发现 */}
        <div style={{ marginBottom: 28 }}>
          <GroupHeader zh="探索发现" en="Explore" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }} className="home-small-grid">
            <SmallCard href="/lexigraph" icon={<IconGraph />} titleZh="词汇星图" titleEn="LexiGraph" descZh="交互图谱探索单词关系" />
            <SmallCard href="/reading" icon={<IconReading />} titleZh="阅读树冠" titleEn="Reading" descZh="语境阅读，沉浸扩词" />
            <SmallCard href="/pronunciation" icon={<IconPronunciation />} titleZh="声音脉络" titleEn="Pronunciation" descZh="精听精读，音形合一" />
            <div />
          </div>
        </div>

        {/* Group 3: 工具 */}
        <div>
          <GroupHeader zh="工具" en="Tools" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }} className="home-small-grid">
            <SmallCard href="/scan" icon={<IconScan />} titleZh="文档扫描" titleEn="Scan" descZh="扫描文档生词一键提取" />
            <SmallCard href="/chat" icon={<IconChat />} titleZh="AI 导学" titleEn="AI Tutor" descZh="智能问答，伴学解惑" />
            <div /><div />
          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 640px) {
          .home-small-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}
