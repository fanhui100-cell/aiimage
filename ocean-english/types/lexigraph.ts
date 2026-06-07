import type { DictionaryWord } from '@/lib/dictionary/dictionary-types'

export type LexiGraphNodeType =
  | 'core'
  | 'synonym'
  | 'antonym'
  | 'collocation'
  | 'etymology'
  | 'scene'
  | 'exam'
  | 'example'

export type LexiGraphNodeState =
  | 'unknown'
  | 'learning'
  | 'review'
  | 'mastered'
  | 'weak'
  | 'recommended'

export interface LexiGraphNode {
  id: string
  word: string
  label: string
  type: LexiGraphNodeType
  state: LexiGraphNodeState
  x: number
  y: number
  size: number
  sourceWord?: string
}

/** Pre-layout node (no x/y yet) */
export type LexiGraphNodeInput = Omit<LexiGraphNode, 'x' | 'y'>

export type LexiGraphEdgeRelation =
  | 'synonym'
  | 'antonym'
  | 'collocation'
  | 'etymology'
  | 'scene'
  | 'exam'
  | 'example'

export interface LexiGraphEdge {
  id: string
  source: string
  target: string
  relation: LexiGraphEdgeRelation
  label?: string
  strength: number
}

export interface LexiGraphModel {
  centerWord: string
  centerDetail: DictionaryWord
  nodes: LexiGraphNode[]
  edges: LexiGraphEdge[]
  sourceType: 'seed' | 'mock' | 'db' | 'mixed'
  warnings: string[]
}
