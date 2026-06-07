'use client'

import { writeAccentPreference } from '@/lib/pronunciation/pronunciation-client'
import type { Accent } from '@/lib/pronunciation/pronunciation-types'

interface Props {
  value: Accent
  onChange: (accent: Accent) => void
}

const OPTIONS: Array<{ value: Accent; label: string; ariaLabel: string }> = [
  { value: 'auto', label: 'Auto', ariaLabel: 'Auto accent' },
  { value: 'us', label: 'US', ariaLabel: 'American English accent' },
  { value: 'uk', label: 'UK', ariaLabel: 'British English accent' },
]

/**
 * Compact 3-button accent toggle (Auto / US / UK).
 * Reads/writes the shared lexiocean-accent-preference localStorage key via pronunciation-client helpers.
 * Fully self-contained — drop it anywhere near a PronunciationButton.
 */
export function AccentSelector({ value, onChange }: Props) {
  return (
    <div
      style={{ display: 'inline-flex', gap: '2px' }}
      role="group"
      aria-label="Pronunciation accent preference"
    >
      {OPTIONS.map(o => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            onClick={() => {
              writeAccentPreference(o.value)
              onChange(o.value)
            }}
            aria-pressed={active}
            aria-label={o.ariaLabel}
            style={{
              padding: '2px 7px',
              borderRadius: '4px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              border: `1px solid ${active ? 'rgba(56,189,248,0.55)' : 'rgba(56,189,248,0.18)'}`,
              background: active ? 'rgba(56,189,248,0.14)' : 'transparent',
              color: active ? '#38BDF8' : 'rgba(155,191,202,0.5)',
              transition: 'color 0.12s, background 0.12s, border-color 0.12s',
              lineHeight: 1.4,
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
