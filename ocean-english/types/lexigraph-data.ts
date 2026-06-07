export type LexiGraphDataNodeType =
  | 'word'
  | 'synonym'
  | 'antonym'
  | 'collocation'
  | 'theme'
  | 'domain'
  | 'exam'
  | 'word_family'
  | 'difficulty'
  | 'cefr'
  | 'related'

export type LexiGraphDataEdgeType =
  | 'synonym'
  | 'antonym'
  | 'collocation'
  | 'theme'
  | 'domain'
  | 'exam'
  | 'word_family'
  | 'difficulty'
  | 'cefr'
  | 'related'

export interface LexiGraphDataNode {
  id: string
  label: string
  normalizedWord?: string
  type: LexiGraphDataNodeType
  sourceWord?: string
  metadata?: Record<string, unknown>
}

export interface LexiGraphDataEdge {
  id: string
  source: string
  target: string
  type: LexiGraphDataEdgeType
  label?: string
  weight?: number
  metadata?: Record<string, unknown>
}

export interface LexiGraphRelationSummary {
  synonyms: number
  antonyms: number
  collocations: number
  related: number
  themes: number
  domains: number
  exams: number
  wordFamily: number
}

export interface LexiGraphData {
  centerWord: string
  nodes: LexiGraphDataNode[]
  edges: LexiGraphDataEdge[]
  relationSummary: LexiGraphRelationSummary
  warnings: string[]
}

export interface LexiGraphDataAdapterOptions {
  maxSynonyms?: number
  maxAntonyms?: number
  maxCollocations?: number
  maxRelatedTags?: number
  maxExamTags?: number
  includeMetadataNodes?: boolean
}
