'use client'

import Link from 'next/link'
import { useMotivationStore } from '@/store/useMotivationStore'

const DEFAULT_MSG = 'Welcome back. Your word map is ready to glow.'
const DEFAULT_MSG_ZH = '欢迎回来，你的词汇地图已准备好点亮了。'

interface Props {
  onClose: () => void
}

export function LumiBubble({ onClose }: Props) {
  const { lastCompanionMessage, litNodeCount, reviewActionCount } = useMotivationStore()

  const message = lastCompanionMessage || DEFAULT_MSG
  const isDefault = !lastCompanionMessage

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '68px',
        right: 0,
        width: '240px',
        background: 'rgba(2,6,23,0.94)',
        border: '1px solid rgba(56,189,248,0.3)',
        borderRadius: '12px',
        padding: '16px 16px 14px',
        backdropFilter: 'blur(18px)',
        boxShadow: '0 0 28px rgba(56,189,248,0.12), 0 8px 32px rgba(0,0,0,0.5)',
        zIndex: 60,
      }}
    >
      <button
        onClick={onClose}
        aria-label="Close Lumi"
        style={{
          position: 'absolute', top: '8px', right: '10px',
          background: 'none', border: 'none', color: 'rgba(155,191,202,0.35)',
          cursor: 'pointer', fontSize: '15px', lineHeight: 1, padding: 0,
        }}
      >
        ×
      </button>

      {/* Message */}
      <div style={{ fontSize: '12px', color: '#ECFBFF', lineHeight: 1.65, paddingRight: '12px', marginBottom: '6px' }}>
        {message}
      </div>
      {isDefault && (
        <div style={{ fontSize: '11px', color: '#9BBFCA', marginBottom: '10px', opacity: 0.7 }}>
          {DEFAULT_MSG_ZH}
        </div>
      )}

      {/* Stats row */}
      <div style={{
        display: 'flex', gap: '14px', paddingTop: '8px',
        borderTop: '1px solid rgba(56,189,248,0.1)', marginBottom: '10px',
      }}>
        <div style={{ fontSize: '10px', color: 'rgba(155,191,202,0.55)' }}>
          <span style={{ color: '#38BDF8', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {litNodeCount}
          </span>{' '}nodes lit
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(155,191,202,0.55)' }}>
          <span style={{ color: '#34D399', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {reviewActionCount}
          </span>{' '}reviewed
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <Link
          href="/memory"
          style={{
            flex: 1, padding: '5px 8px', borderRadius: '5px', fontSize: '11px',
            textDecoration: 'none', textAlign: 'center',
            background: 'rgba(52,211,153,0.1)', color: '#34D399',
            border: '1px solid rgba(52,211,153,0.28)',
          }}
        >
          Review
        </Link>
        <Link
          href="/quiz"
          style={{
            flex: 1, padding: '5px 8px', borderRadius: '5px', fontSize: '11px',
            textDecoration: 'none', textAlign: 'center',
            background: 'rgba(139,92,246,0.1)', color: '#8B5CF6',
            border: '1px solid rgba(139,92,246,0.28)',
          }}
        >
          Quiz
        </Link>
      </div>
    </div>
  )
}
