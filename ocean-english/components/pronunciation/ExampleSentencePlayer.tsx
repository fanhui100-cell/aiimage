'use client'

import { usePronunciation } from '@/lib/pronunciation/pronunciation-client'
import type { Accent } from '@/lib/pronunciation/pronunciation-types'

interface Props {
  sentence: string
  accent?: Accent
  onPlayed?: () => void
}

/**
 * Compact play button for an English example sentence.
 * Renders nothing when sentence is empty or speechSynthesis is unsupported.
 */
export function ExampleSentencePlayer({ sentence, accent = 'auto', onPlayed }: Props) {
  const { speak, stop, state, isSupported } = usePronunciation()

  if (!isSupported || !sentence.trim()) return null

  const isSpeaking = state === 'speaking' || state === 'loading'
  const isError = state === 'error'

  const handleClick = () => {
    if (!sentence.trim()) return
    if (isSpeaking) { stop(); return }
    speak(sentence, { accent, rate: 0.85 })
    onPlayed?.()
  }

  return (
    <button
      onClick={handleClick}
      title={isSpeaking ? 'Stop / 停止' : 'Play example / 播放例句'}
      aria-label={isSpeaking ? 'Stop example playback' : 'Play example sentence'}
      aria-pressed={isSpeaking}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        padding: '2px 7px',
        borderRadius: '4px',
        fontSize: '10px',
        fontFamily: 'var(--font-mono)',
        cursor: isSpeaking ? 'default' : 'pointer',
        border: `1px solid ${isError ? 'rgba(248,113,113,0.22)' : isSpeaking ? 'rgba(56,189,248,0.38)' : 'rgba(56,189,248,0.18)'}`,
        background: isError ? 'rgba(248,113,113,0.06)' : isSpeaking ? 'rgba(56,189,248,0.12)' : 'transparent',
        color: isError ? '#F87171' : isSpeaking ? '#38BDF8' : 'rgba(56,189,248,0.6)',
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      <span>{isSpeaking ? '■' : isError ? '✕' : '▶'}</span>
      <span>EN</span>
    </button>
  )
}
