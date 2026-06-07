'use client'

import { useState } from 'react'
import type { LexiGraphModel, LexiGraphNode as NodeType } from '@/types/lexigraph'
import { LexiGraphEdge } from './LexiGraphEdge'
import { LexiGraphNode } from './LexiGraphNode'
import { type RelationFilter, FILTER_RELATIONS } from './LexiGraphRelationFilter'

interface Props {
  model: LexiGraphModel
  activeNodeId: string | null
  onNodeClick: (node: NodeType) => void
  waveActive?: boolean
  activeFilter?: RelationFilter
}

export function LexiGraphMap({ model, activeNodeId, onNodeClick, waveActive, activeFilter = 'all' }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const allowedRelations = FILTER_RELATIONS[activeFilter]

  const visibleEdgeIds = allowedRelations
    ? new Set(model.edges.filter(e => allowedRelations.includes(e.relation)).map(e => e.id))
    : null  // null = all visible

  const hoveredEdgeIds = hoveredId
    ? new Set(
        model.edges
          .filter(e => e.source === hoveredId || e.target === hoveredId)
          .map(e => e.id),
      )
    : new Set<string>()

  return (
    <svg
      viewBox="0 0 760 600"
      preserveAspectRatio="xMidYMid meet"
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
      aria-label="LexiGraph word relationship map"
    >
      <defs>
        <filter id="lxi-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Edges — rendered below nodes */}
      {model.edges.map(edge => {
        const filteredOut = visibleEdgeIds !== null && !visibleEdgeIds.has(edge.id)
        return (
          <LexiGraphEdge
            key={edge.id}
            edge={edge}
            nodes={model.nodes}
            isHighlighted={!filteredOut && hoveredId !== null && hoveredEdgeIds.has(edge.id)}
            isDimmed={filteredOut || (hoveredId !== null && !hoveredEdgeIds.has(edge.id))}
          />
        )
      })}

      {/* Nodes */}
      {model.nodes.map(node => (
        <LexiGraphNode
          key={node.id}
          node={node}
          isHovered={hoveredId === node.id}
          isActive={activeNodeId === node.id}
          onHover={setHoveredId}
          onClick={onNodeClick}
          isWaving={waveActive === true && node.type === 'core'}
        />
      ))}
    </svg>
  )
}
