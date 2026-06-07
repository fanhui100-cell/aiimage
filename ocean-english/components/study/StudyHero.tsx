'use client'

import Link from 'next/link'
import { calculateLevel } from '@/lib/motivation/motivation-levels'
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
        background: 'rgba(2,6,23,0.7)',
        border: '1px solid rgba(56,189,248,0.2)',
        borderRadius: '16px',
        padding: '28px 32px',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(to right, transparent, rgba(56,189,248,0.5), transparent)' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        {/* Left: greeting + stats */}
        <div>
          <div style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'rgba(56,189,248,0.5)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
            LEARNING HUB / 学习中枢
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: '26px', fontWeight: 700, color: '#ECFBFF' }}>
            Welcome back{userName ? `, ${userName}` : ''}
            <span style={{ fontSize: '16px', color: '#9BBFCA', marginLeft: '12px', fontWeight: 400 }}>欢迎回来</span>
          </h1>
          <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'rgba(155,191,202,0.6)' }}>
            Your word map is ready. Let&apos;s keep the momentum going.
            <span style={{ opacity: 0.7 }}> 词汇地图已就位，保持节奏。</span>
          </p>

          {/* Stat chips */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { label: 'Streak', labelZh: '连续天', value: `${studyProgress.currentStreak}d`, color: '#F97316' },
              { label: 'Total XP', labelZh: '经验值', value: studyProgress.totalXp, color: '#FFD76A' },
              { label: 'Words', labelZh: '单词', value: studyProgress.totalWordsLearned, color: '#34D399' },
            ].map(s => (
              <div
                key={s.label}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  background: `${s.color}10`,
                  border: `1px solid ${s.color}30`,
                  textAlign: 'center',
                  minWidth: '70px',
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: '#9BBFCA', marginTop: '1px' }}>{s.labelZh}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: LexiStar level ring */}
        <div style={{ textAlign: 'center', minWidth: '120px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(126,249,255,0.5)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
            LEXISTAR
          </div>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: `conic-gradient(#7EF9FF ${progressPct * 3.6}deg, rgba(126,249,255,0.1) 0deg)`,
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
                background: '#020617',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#7EF9FF', lineHeight: 1 }}>★</div>
              <div style={{ fontSize: '11px', color: '#9BBFCA', fontFamily: 'var(--font-mono)' }}>{lexiStar}</div>
            </div>
          </div>
          <div style={{ marginTop: '6px', fontSize: '12px', color: '#ECFBFF', fontWeight: 600 }}>
            Lv.{level}
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(155,191,202,0.45)', marginTop: '2px' }}>
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
            background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.4)', color: '#34D399',
          }}
        >
          Continue Review / 继续复习 →
        </Link>
        <Link
          href="/lexigraph"
          style={{
            padding: '10px 22px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '13px',
            background: 'rgba(126,249,255,0.06)', border: '1px solid rgba(126,249,255,0.25)', color: '#7EF9FF',
            fontFamily: 'var(--font-mono)',
          }}
        >
          ✦ Enter LexiGraph / 进入词汇星图
        </Link>
      </div>
    </div>
  )
}
