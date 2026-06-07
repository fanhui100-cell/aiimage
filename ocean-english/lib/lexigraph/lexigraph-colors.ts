import type { LexiGraphEdgeRelation, LexiGraphNodeState, LexiGraphNodeType } from '@/types/lexigraph'

export const EDGE_COLORS: Record<LexiGraphEdgeRelation, string> = {
  synonym:     '#34D399',
  antonym:     '#F87171',
  collocation: '#38BDF8',
  etymology:   '#FBBF24',
  scene:       '#2DD4BF',
  exam:        '#A78BFA',
  example:     '#6B7FA3',
}

export const NODE_FILL: Record<LexiGraphNodeType, string> = {
  core:        'rgba(14,165,233,0.18)',
  synonym:     'rgba(52,211,153,0.12)',
  antonym:     'rgba(248,113,113,0.12)',
  collocation: 'rgba(56,189,248,0.10)',
  etymology:   'rgba(251,191,36,0.10)',
  scene:       'rgba(45,212,191,0.10)',
  exam:        'rgba(167,139,250,0.10)',
  example:     'rgba(107,127,163,0.10)',
}

export const NODE_STROKE: Record<LexiGraphNodeType, string> = {
  core:        '#38BDF8',
  synonym:     '#34D399',
  antonym:     '#F87171',
  collocation: '#38BDF8',
  etymology:   '#FBBF24',
  scene:       '#2DD4BF',
  exam:        '#A78BFA',
  example:     '#6B7FA3',
}

export const STATE_RING: Record<LexiGraphNodeState, string> = {
  unknown:     'transparent',
  learning:    '#38BDF8',
  review:      '#FB923C',
  mastered:    '#34D399',
  weak:        '#F87171',
  recommended: '#FBBF24',
}
