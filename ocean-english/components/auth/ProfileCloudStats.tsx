'use client'

import { useEffect, useState } from 'react'
import type { DbCloudStats } from '@/types/database'

export function ProfileCloudStats() {
  const [stats, setStats] = useState<DbCloudStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/stats')
      .then(r => r.json())
      .then(data => {
        if (data.ok) setStats(data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const items = stats ? [
    { label: 'Saved Words', labelZh: '收藏单词', value: stats.savedWordsCount, color: '#FFD76A' },
    { label: 'Review Words', labelZh: '复习队列', value: stats.reviewWordsCount, color: '#38BDF8' },
    { label: 'Wrong Answers', labelZh: '错题', value: stats.wrongAnswersCount, color: '#F87171' },
    { label: 'Quiz Sessions', labelZh: '练习记录', value: stats.quizSessionsCount, color: '#34D399' },
  ] : []

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(155,191,202,0.1)', borderRadius: '10px', padding: '16px 18px', marginBottom: '20px' }}>
      <div style={{ fontSize: '11px', color: 'rgba(56,189,248,0.6)', fontFamily: 'ui-monospace, monospace', marginBottom: '12px', letterSpacing: '0.1em' }}>
        CLOUD DATA / 云端数据
      </div>
      {loading ? (
        <div style={{ fontSize: '12px', color: 'rgba(155,191,202,0.4)' }}>Loading cloud stats…</div>
      ) : !stats ? (
        <div style={{ fontSize: '12px', color: 'rgba(155,191,202,0.5)' }}>
          No cloud data yet. Start studying to sync your progress.
          <br /><span style={{ fontSize: '11px' }}>暂无云端数据，开始学习后将自动同步。</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {items.map(({ label, labelZh, value, color }) => (
            <div key={label} style={{ background: `${color}08`, border: `1px solid ${color}20`, borderRadius: '8px', padding: '10px 12px' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color, marginBottom: '2px' }}>{value}</div>
              <div style={{ fontSize: '11px', color: '#9BBFCA' }}>{label}</div>
              <div style={{ fontSize: '10px', color: 'rgba(155,191,202,0.5)' }}>{labelZh}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
