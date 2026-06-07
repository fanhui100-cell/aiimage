'use client'

import { LiquidSegmentedControl } from './liquid-ui'

export type GalaxyFilterValue = 'all' | 'theme' | 'domain' | 'exam' | 'cefr' | 'private' | 'custom'

const OPTIONS: { value: GalaxyFilterValue; label: string }[] = [
  { value: 'all', label: 'All · 全部' },
  { value: 'theme', label: 'Theme · 主题' },
  { value: 'domain', label: 'Domain · 领域' },
  { value: 'exam', label: 'Exam · 考试' },
  { value: 'cefr', label: 'CEFR' },
]

export interface GalaxyFilterProps {
  value: string
  onChange: (value: string) => void
}

export function GalaxyFilter({ value, onChange }: GalaxyFilterProps) {
  return (
    <LiquidSegmentedControl<GalaxyFilterValue>
      options={OPTIONS}
      value={(value as GalaxyFilterValue) || 'all'}
      onChange={(nextValue) => onChange(nextValue)}
    />
  )
}
