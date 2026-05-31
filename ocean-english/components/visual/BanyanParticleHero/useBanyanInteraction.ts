import { useState, useCallback } from 'react'
import type { ModuleId } from '@/types/learning'

export interface BanyanInteractionState {
  activeModuleId: ModuleId | null
  hoveredModuleId: ModuleId | null
  isPanelOpen: boolean
  animationKey: number
}

export interface BanyanInteractionActions {
  handleNodeClick: (id: ModuleId) => void
  handleNodeHover: (id: ModuleId | null) => void
  closePanel: () => void
  restartAnimation: () => void
}

export function useBanyanInteraction(): BanyanInteractionState & BanyanInteractionActions {
  const [activeModuleId, setActiveModuleId] = useState<ModuleId | null>(null)
  const [hoveredModuleId, setHoveredModuleId] = useState<ModuleId | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)

  const handleNodeClick = useCallback((id: ModuleId) => {
    setActiveModuleId(id)
    setIsPanelOpen(true)
  }, [])

  const handleNodeHover = useCallback((id: ModuleId | null) => {
    setHoveredModuleId(id)
  }, [])

  const closePanel = useCallback(() => {
    setIsPanelOpen(false)
    setActiveModuleId(null)
  }, [])

  const restartAnimation = useCallback(() => {
    setAnimationKey(k => k + 1)
  }, [])

  return {
    activeModuleId,
    hoveredModuleId,
    isPanelOpen,
    animationKey,
    handleNodeClick,
    handleNodeHover,
    closePanel,
    restartAnimation,
  }
}
