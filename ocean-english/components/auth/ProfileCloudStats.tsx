'use client'

import { useEffect, useState } from 'react'
import type { DbCloudStats } from '@/types/database'

interface StatTile {
  label: string
  labelZh: string
  value: number
  color: string
}

function StatGrid({ items }: { items: StatTile[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
      {items.map(({ label, labelZh, value, color }) => (
        <div
          key={label}
          style={{
            background: `${color}08`,
            border: `1px solid ${color}20`,
            borderRadius: '8px',
            padding: '10px 12px',
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: 700, color, marginBottom: '2px' }}>{value}</div>
          <div style={{ fontSize: '11px', color: '#9BBFCA' }}>{label}</div>
          <div style={{ fontSize: '10px', color: 'rgba(155,191,202,0.5)' }}>{labelZh}</div>
        </div>
      ))}
    </div>
  )
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{
      fontSize: '10px',
      color: 'rgba(56,189,248,0.45)',
      fontFamily: 'var(--font-mono)',
      letterSpacing: '0.08em',
      marginTop: '14px',
      marginBottom: '8px',
    }}>
      {text}
    </div>
  )
}

export function ProfileCloudStats() {
  const [stats, setStats] = useState<DbCloudStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/stats')
      .then(r => r.json())
      .then(data => { if (data.ok) setStats(data.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const learningItems: StatTile[] = stats ? [
    { label: 'Saved Words', labelZh: '收藏单词', value: stats.savedWordsCount, color: '#FFD76A' },
    { label: 'Review Words', labelZh: '复习队列', value: stats.reviewWordsCount, color: '#38BDF8' },
    { label: 'Wrong Answers', labelZh: '错题', value: stats.wrongAnswersCount, color: '#F87171' },
    { label: 'Quiz Sessions', labelZh: '练习记录', value: stats.quizSessionsCount, color: '#34D399' },
  ] : []

  const scanItems: StatTile[] = stats ? [
    { label: 'Scan Documents', labelZh: '扫描文档', value: stats.scanDocumentsCount, color: '#A78BFA' },
    { label: 'Quiz Drafts', labelZh: '题目草稿', value: stats.quizDraftsCount, color: '#FB923C' },
    { label: 'Study Notes', labelZh: '学习笔记', value: stats.studyNotesCount, color: '#34D399' },
  ] : []

  const chatItems: StatTile[] = stats ? [
    { label: 'Chat Sessions', labelZh: '聊天会话', value: stats.chatSessionsCount, color: '#38BDF8' },
    { label: 'Chat Messages', labelZh: '消息记录', value: stats.chatMessagesCount, color: '#6EE7B7' },
  ] : []

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(155,191,202,0.1)',
      borderRadius: '10px',
      padding: '16px 18px',
      marginBottom: '20px',
    }}>
      <div style={{
        fontSize: '11px',
        color: 'rgba(56,189,248,0.6)',
        fontFamily: 'var(--font-mono)',
        marginBottom: '4px',
        letterSpacing: '0.1em',
      }}>
        CLOUD DATA / 云端数据
      </div>

      {loading ? (
        <div style={{ fontSize: '12px', color: 'rgba(155,191,202,0.4)', marginTop: '10px' }}>
          Loading cloud stats…
        </div>
      ) : !stats ? (
        <div style={{ fontSize: '12px', color: 'rgba(155,191,202,0.5)', marginTop: '10px' }}>
          No cloud data yet. Start studying to sync your progress.
          <br />
          <span style={{ fontSize: '11px' }}>暂无云端数据，开始学习后将自动同步。</span>
        </div>
      ) : (
        <>
          <SectionLabel text="LEARNING / 学习" />
          <StatGrid items={learningItems} />

          <SectionLabel text="SCAN & ANALYSIS / 扫描与分析" />
          <StatGrid items={scanItems} />

          <SectionLabel text="CHAT / 聊天" />
          <StatGrid items={chatItems} />

          <div style={{
            marginTop: '14px',
            fontSize: '11px',
            color: 'rgba(155,191,202,0.4)',
            lineHeight: 1.5,
          }}>
            Local-first — new data syncs automatically when signed in.
            History migration available in Phase 5.5.
            <br />
            <span style={{ fontSize: '10px' }}>
              本地优先，登录后新数据自动同步。历史数据迁移将在 Phase 5.5 提供。
            </span>
          </div>
        </>
      )}
    </div>
  )
}
