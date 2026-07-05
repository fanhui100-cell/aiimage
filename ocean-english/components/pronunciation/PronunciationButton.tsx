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

function PlayIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

/**
 * Self-contained pronunciation button using browser SpeechSynthesis.
 * Drop this anywhere a word or example sentence should be speakable.
 */
export function PronunciationButton({ text, accent = 'auto', size = 'sm', onPlayed }: PronunciationButtonProps) {
  const { speak, stop, state, isSupported } = usePronunciation()

  if (!isSupported) return null

  const isSpeaking = state === 'speaking' || state === 'loading'
  const isError = state === 'error'
  const isLoading = state === 'loading'

  const accentLabel = accent === 'uk' ? 'UK' : accent === 'au' ? 'AU' : accent === 'auto' ? 'Auto' : 'US'

  const handleClick = () => {
    if (isError) {
      speak(text, { accent, rate: 0.9 })
      onPlayed?.()
      return
    }
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
    cursor: 'pointer',
    transition: 'opacity 0.15s',
    userSelect: 'none',
    ...(size === 'sm'
      ? { padding: '3px 7px', fontSize: '11px' }
      : { padding: '5px 12px', fontSize: '13px' }),
    background: isError
      ? 'rgba(191,74,48,0.08)'
      : isSpeaking
      ? 'rgba(14,140,122,0.12)'
      : 'rgba(14,140,122,0.06)',
    color: isError
      ? 'var(--rose-ink)'
      : 'var(--teal-ink)',
    outline: isSpeaking
      ? '1px solid rgba(14,140,122,0.35)'
      : isError
      ? '1px solid rgba(191,74,48,0.3)'
      : '1px solid rgba(14,140,122,0.15)',
    opacity: isLoading ? 0.7 : 1,
  }

  return (
    <button
      onClick={handleClick}
      style={baseStyle}
      title={isError ? 'Retry / 重试' : isSpeaking ? 'Stop / 停止' : `Pronounce (${accentLabel}) / 朗读`}
      aria-label={isError ? 'Retry pronunciation' : isSpeaking ? 'Stop pronunciation' : `Pronounce "${text}" in ${accentLabel} accent`}
      aria-pressed={isSpeaking}
    >
      {isSpeaking ? (
        <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: '2px', height: '14px' }}>
          <i className="eq-bar" />
          <i className="eq-bar" />
          <i className="eq-bar" />
          <i className="eq-bar" />
        </span>
      ) : isLoading ? (
        <span style={{ fontFamily: 'var(--font-mono)', lineHeight: 1, opacity: 0.7 }}>…</span>
      ) : isError ? (
        <span style={{ fontFamily: 'var(--font-mono)', lineHeight: 1 }}>↺</span>
      ) : (
        <PlayIcon />
      )}
      {size === 'md' && !isSpeaking && (
        <span>{isError ? 'Retry' : accentLabel}</span>
      )}
    </button>
  )
}
