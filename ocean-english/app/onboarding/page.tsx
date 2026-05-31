'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { siteConfig, levelOptions } from '@/config/site'
import type { LearningLevel } from '@/types/learning'

export default function OnboardingPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<LearningLevel | null>(null)

  function handleConfirm() {
    if (!selected) return
    localStorage.setItem('lexiocean_level', selected)
    router.push('/')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-deep)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div
          style={{
            fontSize: '13px',
            letterSpacing: '0.2em',
            color: 'rgba(56, 189, 248, 0.6)',
            marginBottom: '12px',
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          {siteConfig.projectName} / {siteConfig.projectNameZh}
        </div>
        <h1 style={{ margin: 0, fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 700, color: '#ECFBFF' }}>
          Choose Your Level
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: '15px', color: '#9BBFCA' }}>选择你的英语等级</p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px',
          maxWidth: '860px',
          width: '100%',
          marginBottom: '40px',
        }}
      >
        {levelOptions.map(level => {
          const isSelected = selected === level.id
          return (
            <button
              key={level.id}
              onClick={() => setSelected(level.id)}
              style={{
                background: isSelected ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isSelected ? 'rgba(56,189,248,0.7)' : 'rgba(155,191,202,0.2)'}`,
                borderRadius: '12px',
                padding: '20px 24px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 0 20px rgba(56,189,248,0.15)' : 'none',
              }}
            >
              <div style={{ fontSize: '17px', fontWeight: 700, color: isSelected ? '#38BDF8' : '#ECFBFF', marginBottom: '2px' }}>
                {level.name}
              </div>
              <div style={{ fontSize: '13px', color: '#9BBFCA', marginBottom: '10px' }}>{level.nameZh}</div>
              <div style={{ fontSize: '13px', color: '#9BBFCA', lineHeight: 1.5 }}>{level.description}</div>
              <div style={{ fontSize: '12px', color: 'rgba(155,191,202,0.65)', marginTop: '4px', lineHeight: 1.5 }}>
                {level.descriptionZh}
              </div>
            </button>
          )
        })}
      </div>

      <button
        onClick={handleConfirm}
        disabled={!selected}
        style={{
          padding: '14px 48px',
          borderRadius: '10px',
          background: selected ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${selected ? 'rgba(56,189,248,0.7)' : 'rgba(155,191,202,0.2)'}`,
          color: selected ? '#38BDF8' : '#9BBFCA',
          fontSize: '15px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          cursor: selected ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s ease',
        }}
      >
        Confirm & Enter / 确认进入
      </button>
    </div>
  )
}
