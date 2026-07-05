'use client'

import Link from 'next/link'
import type { AINavigatorContext } from '@/lib/ai-navigator/ai-navigator-types'

interface Props {
  context: AINavigatorContext
}

export function AINavigatorContextPanel({ context }: Props) {
  if (context.type === 'free_chat') return null

  if (context.type === 'word' || context.type === 'lexigraph_word') {
    const color = context.type === 'lexigraph_word' ? '#7EF9FF' : '#38BDF8'
    const fromLabel = context.type === 'lexigraph_word' ? 'LexiGraph' : 'Word Detail'
    const fromHref =
      context.type === 'lexigraph_word'
        ? `/lexigraph?word=${encodeURIComponent(context.word)}`
        : `/dictionary?word=${encodeURIComponent(context.word)}`

    return (
      <div
        style={{
          maxWidth: '800px', margin: '12px auto 0', padding: '0 24px',
        }}
      >
        <div
          style={{
            padding: '14px 18px', borderRadius: '10px',
            background: `${color}06`, border: `1px solid ${color}25`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '10px', letterSpacing: '0.1em', color: `${color}80`, fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                CONTEXT · {fromLabel.toUpperCase()}
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color, marginBottom: '2px' }}>
                {context.word}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(155,191,202,0.5)' }}>
                The AI will focus on this word in its responses.
                <span style={{ marginLeft: '6px', opacity: 0.7 }}>AI 将围绕此单词作答。</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignSelf: 'flex-end' }}>
              <Link
                href={fromHref}
                style={{
                  padding: '5px 12px', borderRadius: '6px', textDecoration: 'none',
                  fontSize: '11px', fontWeight: 600, color: `${color}cc`,
                  background: `${color}10`, border: `1px solid ${color}30`,
                }}
              >
                ← Back to {fromLabel}
              </Link>
              {context.type === 'word' && (
                <Link
                  href={`/lexigraph?word=${encodeURIComponent(context.word)}`}
                  style={{
                    padding: '5px 12px', borderRadius: '6px', textDecoration: 'none',
                    fontSize: '11px', fontWeight: 600, color: 'rgba(126,249,255,0.7)',
                    background: 'rgba(126,249,255,0.06)', border: '1px solid rgba(126,249,255,0.2)',
                  }}
                >
                  ✦ Open in LexiGraph
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (context.type === 'wrong_answer') {
    return (
      <div style={{ maxWidth: '800px', margin: '12px auto 0', padding: '0 24px' }}>
        <div
          style={{
            padding: '14px 18px', borderRadius: '10px',
            background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          <div style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(239,68,68,0.5)', fontFamily: 'var(--font-mono)', marginBottom: '6px' }}>
            CONTEXT · WRONG ANSWER / 错题
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#ECFBFF', marginBottom: '6px' }}>
            {context.word}
          </div>
          <div style={{ fontSize: '12px', color: '#9BBFCA', marginBottom: '4px' }}>
            {context.question}
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(239,68,68,0.7)' }}>
              My answer: {context.userAnswer} ✗
            </span>
            <span style={{ fontSize: '12px', color: '#34D399' }}>
              Correct: {context.correctAnswer} ✓
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link
              href="/memory"
              style={{
                padding: '5px 12px', borderRadius: '6px', textDecoration: 'none',
                fontSize: '11px', fontWeight: 600, color: 'rgba(239,68,68,0.7)',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              ← Back to Memory
            </Link>
            <Link
              href={`/dictionary?word=${encodeURIComponent(context.word)}`}
              style={{
                padding: '5px 12px', borderRadius: '6px', textDecoration: 'none',
                fontSize: '11px', fontWeight: 600, color: 'rgba(155,191,202,0.6)',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(155,191,202,0.15)',
              }}
            >
              Word Detail
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (context.type === 'study_goal') {
    return (
      <div style={{ maxWidth: '800px', margin: '12px auto 0', padding: '0 24px' }}>
        <div
          style={{
            padding: '14px 18px', borderRadius: '10px',
            background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.2)',
          }}
        >
          <div style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(52,211,153,0.5)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
            CONTEXT · STUDY GOAL / 学习目标
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {[
              { label: 'Streak', labelZh: '连续天', value: `${context.currentStreak}d`, color: '#F97316' },
              { label: 'Total XP', labelZh: '经验值', value: context.totalXp, color: '#FFD76A' },
              { label: 'Saved Words', labelZh: '收藏单词', value: context.savedWordCount, color: '#34D399' },
              { label: 'Due Review', labelZh: '待复习', value: context.dueWordCount, color: '#38BDF8' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center', minWidth: '60px' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: '#9BBFCA' }}>{s.labelZh}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '10px' }}>
            <Link
              href="/today"
              style={{
                padding: '5px 12px', borderRadius: '6px', textDecoration: 'none',
                fontSize: '11px', fontWeight: 600, color: 'rgba(52,211,153,0.7)',
                background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
              }}
            >
              ← Back to Study Hub
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return null
}
