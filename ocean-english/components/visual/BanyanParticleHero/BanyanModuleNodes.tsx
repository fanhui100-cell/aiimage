'use client'

import { Html } from '@react-three/drei'
import { learningModules } from '@/config/learning-modules'
import type { ModuleId } from '@/types/learning'

interface BanyanModuleNodesProps {
  activeModuleId: ModuleId | null
  hoveredModuleId: ModuleId | null
  onNodeClick: (id: ModuleId) => void
  onNodeHover: (id: ModuleId | null) => void
}

export function BanyanModuleNodes({
  activeModuleId,
  hoveredModuleId,
  onNodeClick,
  onNodeHover,
}: BanyanModuleNodesProps) {
  return (
    <>
      {learningModules.map(module => {
        const { x, y, z } = module.visualPosition
        const isActive = activeModuleId === module.id
        const isHovered = hoveredModuleId === module.id
        const highlight = isActive || isHovered

        return (
          <Html key={module.id} position={[x, y, z]} center zIndexRange={[10, 20]}>
            <button
              onClick={() => onNodeClick(module.id as ModuleId)}
              onMouseEnter={() => onNodeHover(module.id as ModuleId)}
              onMouseLeave={() => onNodeHover(null)}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0',
                outline: 'none',
                userSelect: 'none',
              }}
              aria-label={`${module.name} / ${module.nameZh}`}
            >
              {/* Outer pulse ring */}
              <span
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: highlight ? '40px' : '28px',
                  height: highlight ? '40px' : '28px',
                  borderRadius: '50%',
                  border: `1px solid ${module.color}`,
                  opacity: highlight ? 0.9 : 0.5,
                  transition: 'all 0.25s ease',
                  animation: 'banyanPulse 2s ease-in-out infinite',
                  pointerEvents: 'none',
                }}
              />
              {/* Inner glow core */}
              <span
                style={{
                  position: 'relative',
                  width: highlight ? '14px' : '10px',
                  height: highlight ? '14px' : '10px',
                  borderRadius: '50%',
                  background: module.color,
                  boxShadow: `0 0 ${highlight ? '18px' : '10px'} ${module.color}`,
                  transition: 'all 0.25s ease',
                  zIndex: 1,
                  flexShrink: 0,
                }}
              />
              {/* Labels */}
              <span
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  opacity: highlight ? 1 : 0.7,
                  transition: 'opacity 0.25s ease',
                  pointerEvents: 'none',
                  marginTop: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    color: highlight ? module.color : '#ECFBFF',
                    whiteSpace: 'nowrap',
                    textShadow: highlight
                      ? `0 0 8px ${module.color}`
                      : '0 1px 3px rgba(2,6,23,0.9)',
                    transition: 'color 0.25s ease',
                    fontFamily: 'ui-monospace, monospace',
                  }}
                >
                  {module.name}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    color: '#9BBFCA',
                    whiteSpace: 'nowrap',
                    fontFamily: 'ui-sans-serif, sans-serif',
                  }}
                >
                  {module.nameZh}
                </span>
              </span>
            </button>
          </Html>
        )
      })}

      {/* Pulse keyframe injection */}
      <Html>
        <style>{`
          @keyframes banyanPulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
            50% { transform: translate(-50%, -50%) scale(1.45); opacity: 0.15; }
          }
        `}</style>
      </Html>
    </>
  )
}
