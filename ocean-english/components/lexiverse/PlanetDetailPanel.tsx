'use client'
// components/lexiverse/PlanetDetailPanel.tsx
// ─────────────────────────────────────────────────────────────────────────
// The right-side drawer that opens when a planet is selected.
//
// All 6 PlanetActions are wired through props. The component itself does
// NOT call useRouter — the parent (LexiverseShell / Stage-C handler)
// receives the action via `onAction` and emits the actual navigation.
// This keeps the panel pure-presentational and easy to test.
//
// ROUTES (parent must implement when handling actions — Stage C):
//   open_word_detail   → router.push(`/word/${planet.normalizedWord}`)
//   open_lexigraph     → router.push(`/lexigraph?word=${planet.normalizedWord}`)
//   start_quiz         → router.push(`/quiz?mode=vocabulary-drill&word=${planet.normalizedWord}&returnTo=${returnTo}`)
//   ask_ai             → router.push(`/chat?context=word&word=${planet.normalizedWord}&returnTo=${returnTo}`)
//   add_to_review      → learningStore.addToReview(planet.wordId) + toast
//   play_pronunciation → pronunciationClient.speak(planet.word)
// ─────────────────────────────────────────────────────────────────────────

import type { LexiversePlanet, PlanetAction, PlanetLearningState } from '@/lib/lexiverse/lexiverse-types'
import { LiquidDrawer, LiquidActionButton, LiquidBadge, LiquidIconButton } from './liquid-ui'

const STATE_META: Record<PlanetLearningState, { label: string; zh: string; color: string }> = {
  mastered:    { label: 'Mastered',    zh: '已掌握', color: '#7EF9FF' },
  recommended: { label: 'Recommended', zh: '推荐',   color: '#FFD66B' },
  learning:    { label: 'Learning',    zh: '学习中', color: '#38BDF8' },
  review:      { label: 'Review',      zh: '待复习', color: '#FFA85A' },
  weak:        { label: 'Weak',        zh: '薄弱',   color: '#FF8FA8' },
  unknown:     { label: 'Unknown',     zh: '未学',   color: '#9FB6C6' },
  locked:      { label: 'Locked',      zh: '静默',   color: '#52617A' },
}

export interface PlanetDetailPanelProps {
  open: boolean
  planet: LexiversePlanet | null
  onClose: () => void
  onAction: (action: PlanetAction) => void
  /** review-list membership lights up the add-to-review button (Stage C) */
  isInReview?: boolean
}

export function PlanetDetailPanel({ open, planet, onClose, onAction, isInReview }: PlanetDetailPanelProps) {
  const accent = planet ? STATE_META[planet.learningState].color : '#7EF9FF'

  return (
    <LiquidDrawer open={open && !!planet} onClose={onClose} accent={accent} width={384}>
      {planet && (
        <div style={{ padding: 28 }}>
          <StateBadge state={planet.learningState} />

          <div style={{ fontSize: 42, fontWeight: 700, color: '#ECFBFF', letterSpacing: '-0.02em', lineHeight: 1, marginTop: 14 }}>
            {planet.word}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
            {planet.ipa && <span style={{ fontSize: 15, color: '#7EF9FF', fontFamily: "'Space Mono', monospace" }}>{planet.ipa}</span>}
            <LiquidIconButton onClick={() => onAction('play_pronunciation')} label="Play pronunciation">▶</LiquidIconButton>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
            {planet.cefrLevel && <LiquidBadge color="#6BE0A0">{planet.cefrLevel}</LiquidBadge>}
            {typeof planet.difficultyLevel === 'number' && <LiquidBadge color="#9FB6C6">L{planet.difficultyLevel}</LiquidBadge>}
            {(planet.examTags ?? []).slice(0, 3).map(t => (
              <LiquidBadge key={t} color="#FFD66B" size="sm">{t}</LiquidBadge>
            ))}
            {(planet.themeTags ?? []).slice(0, 2).map(t => (
              <LiquidBadge key={t} color="#7EF9FF" size="sm">{t}</LiquidBadge>
            ))}
          </div>

          {planet.definition && (
            <>
              <SecLabel>DEFINITION / 释义</SecLabel>
              <div style={{ fontSize: 14.5, lineHeight: 1.6, color: '#DCEAF2' }}>{planet.definition}</div>
              {planet.definitionZh && <div style={{ fontSize: 13, color: '#8AA2B2', marginTop: 5 }}>{planet.definitionZh}</div>}
            </>
          )}

          {planet.example && (
            <>
              <SecLabel>EXAMPLE / 例句</SecLabel>
              <div style={{ borderLeft: `2px solid ${accent}66`, paddingLeft: 12, fontSize: 13.5, fontStyle: 'italic', color: '#DCEAF2', lineHeight: 1.6 }}>
                {planet.example}
              </div>
            </>
          )}

          <SecLabel>ACTIONS / 操作</SecLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <LiquidActionButton onClick={() => onAction('start_quiz')} accent="#7EF9FF">
              ◷ Quiz · 答题
            </LiquidActionButton>
            <LiquidActionButton onClick={() => onAction('ask_ai')} accent="#B79BFF">
              ✦ Ask AI · 问 AI
            </LiquidActionButton>
            <LiquidActionButton
              onClick={() => onAction('add_to_review')}
              variant="secondary"
              disabled={isInReview}
              accent="#FFA85A"
            >
              {isInReview ? '✓ In Review · 已加入' : '+ Add to Review · 加入复习'}
            </LiquidActionButton>
            <LiquidActionButton onClick={() => onAction('open_word_detail')} variant="secondary">
              ↗ Word Detail · 单词详情
            </LiquidActionButton>
          </div>

          <div style={{ marginTop: 14 }}>
            <LiquidActionButton onClick={() => onAction('open_lexigraph')} variant="secondary" fullWidth>
              ◈ Open in LexiGraph · 进入词图（关系）
            </LiquidActionButton>
          </div>
        </div>
      )}
    </LiquidDrawer>
  )
}

function StateBadge({ state }: { state: PlanetLearningState }) {
  const meta = STATE_META[state]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 600, padding: '4px 11px', borderRadius: 999, color: meta.color, border: `1px solid ${meta.color}55`, background: `${meta.color}14`, fontFamily: "'Space Mono', monospace" }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.color, boxShadow: `0 0 6px ${meta.color}` }} />
      {meta.label} · {meta.zh}
    </span>
  )
}

function SecLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, letterSpacing: '0.14em', color: 'rgba(126,249,255,0.5)', fontFamily: "'Space Mono', monospace", margin: '24px 0 10px' }}>
      {children}
    </div>
  )
}
