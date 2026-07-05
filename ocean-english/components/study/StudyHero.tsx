'use client'

import Link from 'next/link'
import { calculateLevel } from '@/lib/motivation/motivation-levels'
import { CountUp } from '@/components/ui/motion/CountUp'
import { ShinyText } from '@/components/ui/motion/ShinyText'
import type { StudyProgress } from '@/types/study'

interface Props {
  studyProgress: StudyProgress
  lexiStar: number
  userName?: string
}

export function StudyHero({ studyProgress, lexiStar, userName }: Props) {
  const { level, progress, nextLevelTarget } = calculateLevel(lexiStar)
  const progressPct = Math.round(progress * 100)

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--line)',
        borderRadius: '16px',
        padding: '28px 32px',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, rgba(14,140,122,0.4), transparent)' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        {/* Left: greeting + stats */}
        <div>
          <div style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'var(--teal-ink)', fontFamily: 'var(--font-mono)', marginBottom: '8px', opacity: 0.6 }}>
            LEARNING HUB / 学习中枢
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: 700, color: 'var(--ink)' }}>
            Welcome back{userName ? `, ${userName}` : ''}
            <span style={{ fontSize: '16px', color: 'var(--ink-sub)', marginLeft: '12px', fontWeight: 400 }}>欢迎回来</span>
          </h1>
          <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--ink-muted)' }}>
            Your word map is ready. Let&apos;s keep the momentum going.
            <span style={{ opacity: 0.7 }}> 词汇地图已就位，保持节奏。</span>
          </p>

          {/* Stat chips */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { label: 'Streak', labelZh: '连续天', to: studyProgress.currentStreak, suffix: 'd', color: '#F97316', shiny: studyProgress.currentStreak >= 3 },
              { label: 'Total XP', labelZh: '经验值', to: studyProgress.totalXp, color: 'var(--gold-ink)', shiny: false },
              { label: 'Words', labelZh: '单词', to: studyProgress.totalWordsLearned, color: '#34D399', shiny: false },
            ].map(s => (
              <div
                key={s.label}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  background: 'var(--card-2)',
                  border: '1px solid var(--line-strong)',
                  textAlign: 'center',
                  minWidth: '70px',
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 700, color: s.shiny ? undefined : s.color }}>
                  {s.shiny ? (
                    <ShinyText baseColor={s.color} shineColor="#fbbf77">
                      <CountUp to={s.to} suffix={s.suffix} />
                    </ShinyText>
                  ) : (
                    <CountUp to={s.to} suffix={s.suffix} />
                  )}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--ink-muted)', marginTop: '1px' }}>{s.labelZh}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: LexiStar level ring */}
        <div style={{ textAlign: 'center', minWidth: '120px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'var(--teal-ink)', fontFamily: 'var(--font-mono)', marginBottom: '8px', opacity: 0.6 }}>
            LEXISTAR
          </div>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: `conic-gradient(var(--teal-ink) ${progressPct * 3.6}deg, var(--line) 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'var(--card)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--gold-ink)" stroke="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <div style={{ fontSize: '11px', color: 'var(--ink-sub)', fontFamily: 'var(--font-mono)' }}><CountUp to={lexiStar} /></div>
            </div>
          </div>
          <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--ink)', fontWeight: 600 }}>
            Lv.{level}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--ink-muted)', marginTop: '2px' }}>
            {lexiStar}/{nextLevelTarget} to Lv.{level + 1}
          </div>
        </div>
      </div>

      {/* Primary CTAs */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
        <Link
          href="/memory"
          style={{
            padding: '10px 22px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '13px',
            background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34D399',
          }}
        >
          Continue Review / 继续复习 →
        </Link>
        <Link
          href="/lexigraph"
          style={{
            padding: '10px 22px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '13px',
            background: 'rgba(14,140,122,0.07)', border: '1px solid rgba(14,140,122,0.2)', color: 'var(--teal-ink)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          ✦ Enter LexiGraph / 进入词汇星图
        </Link>
      </div>
    </div>
  )
}
