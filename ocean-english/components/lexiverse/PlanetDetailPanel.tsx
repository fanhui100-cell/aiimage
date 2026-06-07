'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import type { LexiversePlanet, PlanetAction, PlanetLearningState } from '@/lib/lexiverse/lexiverse-types'
import { LiquidActionButton, LiquidBadge, LiquidDrawer, LiquidIconButton } from './liquid-ui'

const STATE_META: Record<PlanetLearningState, { label: string; zh: string; color: string }> = {
  mastered: { label: 'Mastered', zh: '已掌握', color: '#7EF9FF' },
  recommended: { label: 'Recommended', zh: '推荐', color: '#FFD66B' },
  learning: { label: 'Learning', zh: '学习中', color: '#38BDF8' },
  review: { label: 'Review', zh: '待复习', color: '#FFA85A' },
  weak: { label: 'Weak', zh: '薄弱', color: '#FF8FA8' },
  unknown: { label: 'Unknown', zh: '未学习', color: '#9FB6C6' },
  locked: { label: 'Locked', zh: '静默', color: '#52617A' },
}

export interface PlanetDetailPanelProps {
  open: boolean
  planet: LexiversePlanet | null
  onClose: () => void
  onAction: (action: PlanetAction) => void
  isInReview?: boolean
}

export function PlanetDetailPanel({ open, planet, onClose, onAction, isInReview }: PlanetDetailPanelProps) {
  const meta = planet ? STATE_META[planet.learningState] : STATE_META.unknown

  return (
    <LiquidDrawer open={open && !!planet} onClose={onClose} accent={meta.color} width={372}>
      {planet && (
        <div style={{ padding: '30px 26px' }}>
          <StateBadge state={planet.learningState} />

          <div style={{ fontSize: 46, fontWeight: 700, color: '#ECFBFF', letterSpacing: '-0.025em', lineHeight: 1, marginTop: 10 }}>
            {planet.word}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 9 }}>
            {planet.ipa && <span style={{ fontSize: 15, color: '#7EF9FF', fontFamily: "'Space Mono', monospace" }}>{planet.ipa}</span>}
            <span style={{ fontSize: 12, color: '#6F8AA0' }}>{planet.visualType}</span>
            <LiquidIconButton onClick={() => onAction('play_pronunciation')} label="Play pronunciation" size={30}>▶</LiquidIconButton>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
            {planet.cefrLevel && <LiquidBadge color="#6BE0A0">{planet.cefrLevel}</LiquidBadge>}
            {typeof planet.difficultyLevel === 'number' && <LiquidBadge color="#9FB6C6">L{planet.difficultyLevel}</LiquidBadge>}
            {(planet.examTags ?? []).slice(0, 3).map((tag) => <LiquidBadge key={tag} color="#FFD66B" size="sm">{tag}</LiquidBadge>)}
            {(planet.themeTags ?? []).slice(0, 2).map((tag) => <LiquidBadge key={tag} color="#7EF9FF" size="sm">{tag}</LiquidBadge>)}
          </div>

          {planet.definition && (
            <>
              <SectionLabel>DEFINITION / 释义</SectionLabel>
              <div style={{ fontSize: 15, lineHeight: 1.6, color: '#DCEAF2' }}>{planet.definition}</div>
              {planet.definitionZh && <div style={{ fontSize: 13, color: '#8AA2B2', marginTop: 5 }}>{planet.definitionZh}</div>}
            </>
          )}

          {planet.example && (
            <>
              <SectionLabel>EXAMPLE / 例句</SectionLabel>
              <div style={{ borderLeft: `2px solid ${meta.color}66`, paddingLeft: 12, fontSize: 13.5, fontStyle: 'italic', color: '#DCEAF2', lineHeight: 1.6 }}>
                {planet.example}
              </div>
            </>
          )}

          <SectionLabel>TASKS / 学习任务</SectionLabel>
          <div style={{ display: 'flex', gap: 9 }}>
            <LiquidActionButton onClick={() => onAction('start_quiz')} accent="#7EF9FF" fullWidth>
              Quiz · 练习
            </LiquidActionButton>
            <LiquidActionButton onClick={() => onAction('ask_ai')} accent="#B79BFF" fullWidth>
              Ask AI · 问 AI
            </LiquidActionButton>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 18 }}>
            <LiquidActionButton
              onClick={() => onAction('add_to_review')}
              variant={isInReview ? 'secondary' : 'primary'}
              disabled={isInReview}
              accent="#FFA85A"
              fullWidth
            >
              {isInReview ? 'In Review · 已加入复习' : 'Add to Review · 加入复习'}
            </LiquidActionButton>
            <LiquidActionButton onClick={() => onAction('open_lexigraph')} variant="secondary" fullWidth>
              Open in LexiGraph · 进入词图
            </LiquidActionButton>
            <Link
              href={`/lexiverse/word/${planet.normalizedWord}`}
              style={{
                display: 'block',
                padding: 11,
                borderRadius: 11,
                textAlign: 'center',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600,
                color: '#9FB6C6',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(159,182,198,0.18)',
              }}
            >
              Open Word Detail · 词语详情 →
            </Link>
          </div>
        </div>
      )}
    </LiquidDrawer>
  )
}

function StateBadge({ state }: { state: PlanetLearningState }) {
  const meta = STATE_META[state]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 600, padding: '4px 11px', borderRadius: 20, color: meta.color, border: `1px solid ${meta.color}66`, background: `${meta.color}14`, fontFamily: "'Space Mono', monospace" }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.color, boxShadow: `0 0 8px ${meta.color}` }} />
      {meta.label} · {meta.zh}
    </span>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: 10, letterSpacing: '0.14em', color: 'rgba(126,249,255,0.5)', fontFamily: "'Space Mono', monospace", margin: '24px 0 10px' }}>
      {children}
    </div>
  )
}
