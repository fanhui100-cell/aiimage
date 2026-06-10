'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useLexiStore } from '@/store/lexiStore'
import { useMotivationStore } from '@/store/useMotivationStore'
import { calculateLevel } from '@/lib/motivation/motivation-levels'
import { ACHIEVEMENT_DEFS } from '@/lib/motivation/motivation-achievements'

const LEVEL_NAMES: Record<number, string> = {
  1: '探索者', 2: '学习者', 3: '探险家', 4: '达人', 5: '精通者',
}

function LevelRing({ progress }: { progress: number }) {
  const r = 44
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(1, progress))
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--line)" strokeWidth="6" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke="var(--teal-ink)" strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  )
}

function StatCard({ value, label, accent = 'teal' }: { value: string | number; label: string; accent?: 'teal' | 'gold' | 'rose' }) {
  const color = accent === 'gold' ? 'var(--gold-ink)' : accent === 'rose' ? 'var(--rose-ink)' : 'var(--teal-ink)'
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--line)',
      borderRadius: 'var(--r-card)', padding: '18px 16px', boxShadow: 'var(--card-shadow-sm)',
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, color, marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--ink-muted)', fontFamily: 'var(--font-sans)' }}>
        {label}
      </div>
    </div>
  )
}

function AchievementBadge({ titleZh, descriptionZh, unlocked }: { titleZh: string; descriptionZh: string; unlocked: boolean }) {
  return (
    <div style={{
      display: 'flex', gap: '10px', alignItems: 'flex-start',
      padding: '14px 16px',
      background: unlocked ? 'var(--card)' : 'var(--paper)',
      border: `1px solid ${unlocked ? 'rgba(179,120,31,0.3)' : 'var(--line)'}`,
      borderRadius: 'var(--r-card)',
      opacity: unlocked ? 1 : 0.55,
      transition: 'opacity 0.2s',
    }}>
      <div style={{ fontSize: '20px', lineHeight: 1, flexShrink: 0, marginTop: '1px' }}>
        {unlocked ? '🏅' : '🔒'}
      </div>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: unlocked ? 'var(--gold-ink)' : 'var(--ink-muted)', marginBottom: '2px', fontFamily: 'var(--font-sans)' }}>
          {titleZh}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
          {descriptionZh}
        </div>
      </div>
    </div>
  )
}

export function ProfileBody({ userEmail, createdAt }: { userEmail: string; createdAt: string }) {
  const words = useLexiStore(s => s.words)
  const currentStreak = useLexiStore(s => s.streakData.current)
  const totalXp = useLexiStore(s => s.xp)
  const lexiStar = useMotivationStore(s => s.lexiStar)
  const achievements = useMotivationStore(s => s.achievements)

  const { level, progress } = useMemo(() => calculateLevel(lexiStar), [lexiStar])
  const levelName = LEVEL_NAMES[level] ?? '探索者'

  // 已学 = 进入过学习闭环的词（排除 locked/unknown/recommended）
  const totalWordsLearned = words.filter(
    w => w.state === 'learning' || w.state === 'review' || w.state === 'weak' || w.state === 'mastered',
  ).length
  const dueCount = words.filter(w => w.nextReviewAt != null && w.nextReviewAt <= Date.now()).length

  const displayName = userEmail.split('@')[0]
  const joinDate = new Date(createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })

  const enrichedAchievements = ACHIEVEMENT_DEFS.map(def => ({
    ...def,
    unlocked: achievements.find(a => a.id === def.id)?.unlocked ?? false,
  }))

  return (
    <div>
      {/* ── 页面标题 ── */}
      <p style={{ margin: '0 0 4px', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--teal-ink)', opacity: 0.7 }}>
        个人中心 · Profile
      </p>
      <h1 style={{ margin: '0 0 4px', fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 'clamp(24px, 3vw, 34px)', color: 'var(--ink)' }}>
        个人中心
      </h1>
      <p style={{ margin: '0 0 32px', fontFamily: 'var(--font-news)', fontStyle: 'italic', fontSize: '15px', color: 'var(--teal-ink)' }}>
        My Profile
      </p>

      {/* ── 头像卡 ── */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--line)',
        borderRadius: 'var(--r-card)', boxShadow: 'var(--card-shadow)',
        padding: '24px', display: 'flex', gap: '24px', alignItems: 'center',
        marginBottom: '24px', flexWrap: 'wrap',
      }}>
        {/* 等级环 + 初始字母头像 */}
        <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
          <LevelRing progress={progress} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'var(--teal-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontFamily: 'var(--font-serif-zh)', fontSize: '28px', fontWeight: 700,
            }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* 用户信息 */}
        <div style={{ flex: 1, minWidth: '180px' }}>
          <div style={{ fontFamily: 'var(--font-serif-zh)', fontSize: '20px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px' }}>
            {displayName}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '3px 10px', borderRadius: 'var(--r-pill)', background: 'rgba(14,140,122,0.08)', color: 'var(--teal-ink)', border: '1px solid rgba(14,140,122,0.2)' }}>
              L{level} {levelName}
            </span>
            {currentStreak > 0 && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '3px 10px', borderRadius: 'var(--r-pill)', background: 'rgba(179,120,31,0.08)', color: 'var(--gold-ink)', border: '1px solid rgba(179,120,31,0.2)' }}>
                🔥 连续 {currentStreak} 天
              </span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1.7 }}>
            {userEmail}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
            注册于 {joinDate}
          </div>
        </div>

        {/* LexiStar 总星 */}
        <div style={{ textAlign: 'right', flexShrink: 0, paddingRight: '4px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '26px', fontWeight: 700, color: 'var(--teal-ink)' }}>
            {lexiStar}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
            LEXISTAR ✦
          </div>
        </div>
      </div>

      {/* ── 数据统计 ── */}
      <p style={{ margin: '0 0 10px', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', opacity: 0.7 }}>
        数据统计 · Stats
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginBottom: '32px' }}>
        <StatCard value={currentStreak} label="连续天数" accent="teal" />
        <StatCard value={totalXp} label="累计经验" accent="gold" />
        <StatCard value={totalWordsLearned} label="已学词汇" accent="teal" />
        <StatCard value={dueCount} label="待复习" accent={dueCount > 0 ? 'rose' : 'teal'} />
      </div>

      {/* ── 成就徽章 ── */}
      <p style={{ margin: '0 0 10px', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', opacity: 0.7 }}>
        成就徽章 · Achievements
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px', marginBottom: '32px' }}>
        {enrichedAchievements.map(a => (
          <AchievementBadge
            key={a.id}
            titleZh={a.titleZh}
            descriptionZh={a.descriptionZh}
            unlocked={a.unlocked}
          />
        ))}
      </div>

      {/* ── 账户操作 ── */}
      <p style={{ margin: '0 0 10px', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', opacity: 0.7 }}>
        账户 · Account
      </p>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--line)',
        borderRadius: 'var(--r-card)', padding: '20px', marginBottom: '16px',
      }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', marginBottom: '2px' }}>邮箱</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>{userEmail}</div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <form action="/auth/logout" method="POST">
            <button
              type="submit"
              style={{
                fontFamily: 'var(--font-sans)', fontSize: '13px',
                padding: '8px 18px', borderRadius: 'var(--r-pill)',
                border: '1px solid rgba(191,74,48,0.3)',
                background: 'rgba(191,74,48,0.06)', color: 'var(--rose-ink)',
                cursor: 'pointer',
              }}
            >
              退出登录
            </button>
          </form>
          <Link href="/" style={{ fontSize: '13px', color: 'var(--teal-ink)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>
            ← 返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}
