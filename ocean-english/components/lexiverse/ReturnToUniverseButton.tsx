'use client'

import { LiquidActionButton } from './liquid-ui'

export interface ReturnToUniverseButtonProps {
  onClick: () => void
}

export function ReturnToUniverseButton({ onClick }: ReturnToUniverseButtonProps) {
  return (
    <LiquidActionButton onClick={onClick} variant="secondary" iconStart={<span aria-hidden>←</span>}>
      Return to universe · 返回宇宙
    </LiquidActionButton>
  )
}
