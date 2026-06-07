/**
 * SpeechSynthesisProvider
 *
 * Phase 6D MVP pronunciation implementation using the Web Speech API.
 * Works in all modern browsers without any external API keys or audio files.
 *
 * Responsibilities:
 * - Select the best available voice for the requested accent (US / UK / AU)
 * - Handle the async voice-loading quirk in Chrome (voices load after a delay)
 * - Provide a clean Promise interface over the event-based SpeechSynthesis API
 * - Handle errors and browser compatibility gracefully
 *
 * Usage (client-side only):
 *   const provider = getSpeechSynthesisProvider()
 *   if (provider.isSupported()) {
 *     await provider.speak('ubiquitous', { accent: 'us' })
 *   }
 */

import type { PronunciationProvider, SpeakOptions, Accent } from './pronunciation-types'
import { ACCENT_LOCALE_MAP } from './pronunciation-types'

// ── Voice loading ─────────────────────────────────────────────────────────

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return Promise.resolve([])

  const immediate = window.speechSynthesis.getVoices()
  if (immediate.length > 0) return Promise.resolve(immediate)

  // Chrome loads voices asynchronously — wait for the event, with a 3s timeout
  return new Promise(resolve => {
    const onReady = () => resolve(window.speechSynthesis.getVoices())
    window.speechSynthesis.addEventListener('voiceschanged', onReady, { once: true })
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', onReady)
      resolve(window.speechSynthesis.getVoices())
    }, 3000)
  })
}

function selectVoice(
  voices: SpeechSynthesisVoice[],
  accent: Accent,
): SpeechSynthesisVoice | null {
  const targetLocale = ACCENT_LOCALE_MAP[accent]

  if (targetLocale) {
    // Exact locale match first
    const exact = voices.find(v => v.lang === targetLocale)
    if (exact) return exact
    // Prefix match (e.g., 'en-GB-Standard-A' starts with 'en-GB')
    const prefix = voices.find(v => v.lang.startsWith(targetLocale.slice(0, 5)))
    if (prefix) return prefix
  }

  // Fallback: any English voice
  return voices.find(v => v.lang.startsWith('en')) ?? null
}

// ── Provider implementation ───────────────────────────────────────────────

class SpeechSynthesisProvider implements PronunciationProvider {
  readonly providerId = 'browser-speech-synthesis'

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  async speak(text: string, options: SpeakOptions = {}): Promise<void> {
    if (!this.isSupported()) throw new Error('speech_synthesis_not_supported')

    const { accent = 'auto', rate = 0.9, pitch = 1.0, volume = 1.0 } = options

    // Cancel any currently speaking utterance
    window.speechSynthesis.cancel()

    const voices = await loadVoices()

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text)

      const voice = selectVoice(voices, accent)
      if (voice) utterance.voice = voice
      utterance.lang = ACCENT_LOCALE_MAP[accent] ?? 'en-US'
      utterance.rate = Math.max(0.5, Math.min(2.0, rate))
      utterance.pitch = Math.max(0, Math.min(2.0, pitch))
      utterance.volume = Math.max(0, Math.min(1.0, volume))

      utterance.onend = () => resolve()
      utterance.onerror = e => reject(new Error(e.error ?? 'speech_error'))

      window.speechSynthesis.speak(utterance)

      // iOS Safari sometimes silently stalls — resume after a tick
      setTimeout(() => window.speechSynthesis.resume(), 50)
    })
  }

  stop(): void {
    if (this.isSupported()) window.speechSynthesis.cancel()
  }
}

// ── Singleton factory ──────────────────────────────────────────────────────

let _provider: SpeechSynthesisProvider | null = null

export function getSpeechSynthesisProvider(): PronunciationProvider {
  _provider ??= new SpeechSynthesisProvider()
  return _provider
}
