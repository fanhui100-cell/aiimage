'use client'

import { usePronunciation } from '@/lib/pronunciation/pronunciation-client'
import type { Accent } from '@/lib/pronunciation/pronunciation-types'

interface PronunciationButtonProps {
  /** Text to speak — typically a single word or short phrase */
  text: string
  accent?: Accent
  /** 'sm' renders a compact icon-only button; 'md' shows a label */
  size?: 'sm' | 'md'
  /** Called once when playback starts (not on stop). Use for motivation hooks. */
  onPlayed?: () => void
}

const ICON_IDLE = '▶'
const ICON_SPEAKING = '■'
const ICON_LOADING = '…'
const ICON_ERROR = '✕'

/**
 * Self-contained pronunciation button using browser SpeechSynthesis.
 * Drop this anywhere a word or example sentence should be speakable.
 *
 * Phase 6D: wired to browser TTS, no external API required.
 * Future: swap PronunciationProvider to use cloud TTS.
 *
 * Usage:
 *   <PronunciationButton text="ubiquitous" accent="us" />
 *   <PronunciationButton text="ubiquitous" accent="uk" size="sm" />
 */
export function PronunciationButton({ text, accent = 'auto', size = 'sm', onPlayed }: PronunciationButtonProps) {
  const { speak, stop, state, isSupported } = usePronunciation()

  if (!isSupported) return null

  const isSpeaking = state === 'speaking' || state === 'loading'
  const isError = state === 'error'

  const icon = state === 'speaking'
    ? ICON_SPEAKING
    : state === 'loading'
    ? ICON_LOADING
    : isError
    ? ICON_ERROR
    : ICON_IDLE

  const accentLabel = accent === 'uk' ? 'UK' : accent === 'au' ? 'AU' : accent === 'auto' ? 'Auto' : 'US'

  const handleClick = () => {
    if (!text.trim()) return
    if (isSpeaking) {
      stop()
    } else {
      speak(text, { accent, rate: 0.9 })
      onPlayed?.()
    }
  }

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    border: 'none',
    borderRadius: '5px',
    cursor: isError ? 'default' : 'pointer',
    transition: 'opacity 0.15s',
    userSelect: 'none',
    // Sizing
    ...(size === 'sm'
      ? { padding: '3px 7px', fontSize: '11px' }
      : { padding: '5px 12px', fontSize: '13px' }),
    // State-based color
    background: isError
      ? 'rgba(248,113,113,0.08)'
      : isSpeaking
      ? 'rgba(56,189,248,0.15)'
      : 'rgba(56,189,248,0.07)',
    color: isError
      ? '#F87171'
      : isSpeaking
      ? '#38BDF8'
      : 'rgba(56,189,248,0.8)',
    outline: isSpeaking ? '1px solid rgba(56,189,248,0.35)' : '1px solid rgba(56,189,248,0.15)',
  }

  return (
    <button
      onClick={handleClick}
      style={baseStyle}
      title={isSpeaking ? 'Stop / 停止' : `Pronounce (${accentLabel}) / 朗读`}
      aria-label={isSpeaking ? 'Stop pronunciation' : `Pronounce "${text}" in ${accentLabel} accent`}
      aria-pressed={isSpeaking}
    >
      <span style={{ fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
        {icon}
      </span>
      {size === 'md' && (
        <span>
          {isSpeaking ? 'Stop' : accentLabel}
        </span>
      )}
    </button>
  )
}
