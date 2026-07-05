'use client'

import { contextBadgeLabel } from '@/lib/ai-navigator/ai-navigator-context'
import type { AINavigatorContext } from '@/lib/ai-navigator/ai-navigator-types'

interface Props {
  context: AINavigatorContext
  onClear?: () => void
  hasMessages: boolean
}

const CONTEXT_BADGE_COLORS: Partial<Record<AINavigatorContext['type'], string>> = {
  word: '#38BDF8',
  lexigraph_word: '#7EF9FF',
  wrong_answer: '#EF4444',
  study_goal: '#34D399',
}

export function AINavigatorHeader({ context, onClear, hasMessages }: Props) {
  const badge = contextBadgeLabel(context)
  const badgeColor = CONTEXT_BADGE_COLORS[context.type] ?? '#9BBFCA'

  return (
    <div
      style={{
        padding: '14px 24px 0',
        borderBottom: '1px solid rgba(155,191,202,0.1)',
        background: 'rgba(2,6,23,0.8)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '12px', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#ECFBFF', lineHeight: 1.2 }}>
            领航{' '}
            <span style={{ fontSize: '13px', color: '#9BBFCA', fontWeight: 400 }}>LexiPilot · AI 副驾</span>
          </h1>
          <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'rgba(155,191,202,0.45)', fontFamily: 'var(--font-mono)' }}>
            Ask about words, sentences, mistakes, and study plans.
            {' '}<span style={{ opacity: 0.7 }}>询问单词、句子、错题和学习计划。</span>
          </p>
          {badge && (
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                marginTop: '7px', padding: '3px 10px', borderRadius: '20px',
                background: `${badgeColor}12`, border: `1px solid ${badgeColor}35`,
                fontSize: '11px', color: badgeColor, fontFamily: 'var(--font-mono)',
                maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              <span style={{ opacity: 0.7 }}>●</span>
              {badge}
            </div>
          )}
        </div>
        {hasMessages && onClear && (
          <button
            onClick={onClear}
            style={{
              flexShrink: 0, background: 'none', border: '1px solid rgba(155,191,202,0.2)',
              borderRadius: '6px', padding: '6px 12px', color: '#9BBFCA', fontSize: '12px', cursor: 'pointer',
            }}
          >
            Clear / 清空
          </button>
        )}
      </div>
    </div>
  )
}
