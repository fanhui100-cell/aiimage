/**
 * Pronunciation client — thin facade over the active pronunciation provider.
 *
 * Phase 6A/6D: uses SpeechSynthesisProvider (browser).
 * Future: swap provider for cloud TTS without changing call sites.
 *
 * This file is safe to import in client components.
 * For server components, pronunciation is handled at the client boundary.
 */

'use client'

import { useState, useCallback } from 'react'
import { getSpeechSynthesisProvider } from './speech-synthesis-provider'
import type { Accent, PronunciationState, SpeakOptions } from './pronunciation-types'
import { DEFAULT_ACCENT_PREFERENCE } from './pronunciation-types'

export type { Accent, PronunciationState, SpeakOptions }

// ── React hook ─────────────────────────────────────────────────────────────

export interface UsePronunciationResult {
  state: PronunciationState
  speak: (text: string, options?: SpeakOptions) => void
  stop: () => void
  isSupported: boolean
}

/**
 * React hook for pronunciation playback.
 *
 * Usage:
 *   const { speak, stop, state, isSupported } = usePronunciation()
 *   <button onClick={() => speak('ubiquitous', { accent: 'us' })}>
 *     {state === 'speaking' ? '■' : '▶'}
 *   </button>
 */
// Module-level singleton — safe to read outside render
const _provider = getSpeechSynthesisProvider()

export function usePronunciation(): UsePronunciationResult {
  const [state, setState] = useState<PronunciationState>('idle')
  // isSupported is a stable capability check, not render-reactive state
  const isSupported = _provider.isSupported()

  const speak = useCallback((text: string, options?: SpeakOptions) => {
    if (!_provider.isSupported()) {
      setState('unsupported')
      return
    }
    setState('loading')
    _provider.speak(text, options)
      .then(() => setState('idle'))
      .catch(() => setState('error'))
    // Transition to 'speaking' after first tick (provider starts async)
    setTimeout(() => setState(s => s === 'loading' ? 'speaking' : s), 100)
  }, [])

  const stop = useCallback(() => {
    _provider.stop()
    setState('idle')
  }, [])

  return { state, speak, stop, isSupported }
}

// ── Accent preference helpers ──────────────────────────────────────────────

const PREF_KEY = 'lexiocean-accent-preference'

const VALID_ACCENTS: readonly Accent[] = ['auto', 'us', 'uk', 'au']

export function readAccentPreference(): Accent {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (!raw) return DEFAULT_ACCENT_PREFERENCE.accent
    const parsed = JSON.parse(raw) as { accent?: string }
    const stored = parsed.accent
    if (stored && (VALID_ACCENTS as readonly string[]).includes(stored)) {
      return stored as Accent
    }
    return DEFAULT_ACCENT_PREFERENCE.accent
  } catch {
    return DEFAULT_ACCENT_PREFERENCE.accent
  }
}

export function writeAccentPreference(accent: Accent): void {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify({ accent }))
  } catch {
    // localStorage unavailable — silently ignore
  }
}
