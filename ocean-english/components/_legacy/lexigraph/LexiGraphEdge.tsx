'use client'

import type { LexiGraphEdge as EdgeType, LexiGraphNode } from '@/types/lexigraph'
import { EDGE_COLORS } from '@/lib/lexigraph/lexigraph-colors'

interface Props {
  edge: EdgeType
  nodes: LexiGraphNode[]
  isHighlighted: boolean
  isDimmed: boolean
}

export function LexiGraphEdge({ edge, nodes, isHighlighted, isDimmed }: Props) {
  const source = nodes.find(n => n.id === edge.source)
  const target = nodes.find(n => n.id === edge.target)
  if (!source || !target) return null

  const color = EDGE_COLORS[edge.relation]
  const opacity = isDimmed ? 0.06 : isHighlighted ? 0.9 : edge.strength * 0.38
  const dashed = edge.relation === 'etymology' || edge.relation === 'scene'

  return (
    <line
      x1={source.x}
      y1={source.y}
      x2={target.x}
      y2={target.y}
      stroke={color}
      strokeWidth={isHighlighted ? 2 : 1}
      strokeOpacity={opacity}
      strokeDasharray={dashed ? '5 3' : undefined}
    />
  )
}
