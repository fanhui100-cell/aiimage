'use client'

import type { LexiGraphNode as NodeType } from '@/types/lexigraph'
import { NODE_FILL, NODE_STROKE, STATE_RING } from '@/lib/lexigraph/lexigraph-colors'

interface Props {
  node: NodeType
  isHovered: boolean
  isActive: boolean
  onHover: (id: string | null) => void
  onClick: (node: NodeType) => void
  /** One-shot wave ring when pronunciation plays on this node */
  isWaving?: boolean
}

export function LexiGraphNode({ node, isHovered, isActive, onHover, onClick, isWaving }: Props) {
  const isCore = node.type === 'core'
  const r = isHovered ? node.size * 1.14 : node.size
  const fill = isCore ? 'rgba(14,165,233,0.18)' : NODE_FILL[node.type]
  const stroke = isActive ? '#ECFBFF' : NODE_STROKE[node.type]
  const ring = STATE_RING[node.state]
  const hasRing = ring !== 'transparent'
  const ringClass =
    node.state === 'weak' ? 'lxi-pulse' :
    node.state === 'mastered' ? 'lxi-glow' :
    undefined

  return (
    <g
      style={{ cursor: 'pointer' }}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(node)}
    >
      {/* State ring */}
      {hasRing && (
        <circle
          cx={node.x}
          cy={node.y}
          r={r + 5}
          fill="none"
          stroke={ring}
          strokeWidth={isCore ? 2 : 1.5}
          strokeOpacity={isHovered ? 0.9 : 0.5}
          className={ringClass}
        />
      )}

      {/* Main fill circle */}
      <circle
        cx={node.x}
        cy={node.y}
        r={r}
        fill={fill}
        stroke={stroke}
        strokeWidth={isCore ? 2 : 1.5}
        strokeOpacity={isHovered ? 1 : 0.7}
        filter={isHovered ? 'url(#lxi-glow)' : undefined}
      />

      {/* Core nucleus dot */}
      {isCore && (
        <circle cx={node.x} cy={node.y} r={5} fill="#38BDF8" fillOpacity={0.85} />
      )}

      {/* One-shot pronunciation wave ring */}
      {isWaving && (
        <circle
          cx={node.x}
          cy={node.y}
          r={node.size}
          fill="none"
          stroke="#38BDF8"
          strokeWidth={1.5}
          className="lxi-wave"
        />
      )}

      {/* Label */}
      <text
        x={node.x}
        y={node.y + r + 13}
        textAnchor="middle"
        fill="#ECFBFF"
        fontSize={isCore ? 13 : 11}
        fontWeight={isCore ? 700 : 400}
        fontFamily="var(--font-mono)"
        fillOpacity={isHovered ? 1 : 0.72}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {node.label}
      </text>
    </g>
  )
}
