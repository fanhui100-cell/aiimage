'use client'
// components/lexiverse/GalaxyFilter.tsx
// Segmented control to filter the universe by Galaxy `sourceType`.
import { LiquidSegmentedControl } from './liquid-ui'

export type GalaxyFilterValue = 'all' | 'theme' | 'domain' | 'exam' | 'cefr' | 'private' | 'custom'

const OPTIONS: { value: GalaxyFilterValue; label: string }[] = [
  { value: 'all',     label: 'All · 全部' },
  { value: 'theme',   label: 'Theme · 主题' },
  { value: 'domain',  label: 'Domain · 领域' },
  { value: 'exam',    label: 'Exam · 考试' },
  { value: 'cefr',    label: 'CEFR' },
  { value: 'private', label: 'Private · 私有' },
]

export interface GalaxyFilterProps {
  value: string
  onChange: (v: string) => void
}

export function GalaxyFilter({ value, onChange }: GalaxyFilterProps) {
  return (
    <LiquidSegmentedControl<GalaxyFilterValue>
      options={OPTIONS}
      value={(value as GalaxyFilterValue) ?? 'all'}
      onChange={v => onChange(v)}
    />
  )
}
