/**
 * Phase 6A Pronunciation Types
 *
 * Defines the provider interface and shared types for the pronunciation system.
 * The Phase 6D MVP uses browser SpeechSynthesis; future phases can swap in
 * cloud TTS providers without changing the interface.
 */

export type Accent = 'us' | 'uk' | 'au' | 'auto'

export type PronunciationState = 'idle' | 'loading' | 'speaking' | 'error' | 'unsupported'

export type SpeakTarget = 'word' | 'sentence' | 'example'

export interface SpeakOptions {
  accent?: Accent
  rate?: number    // 0.5 – 2.0, default 0.9
  pitch?: number   // 0 – 2.0, default 1.0
  volume?: number  // 0 – 1.0, default 1.0
}

/**
 * Pronunciation provider interface.
 * Implemented by SpeechSynthesisProvider (browser) and future cloud TTS adapters.
 */
export interface PronunciationProvider {
  /** Speak the given text. Returns a promise that resolves when speaking ends. */
  speak(text: string, options?: SpeakOptions): Promise<void>

  /** Stop any active speech immediately. */
  stop(): void

  /** Whether the provider is available in the current environment. */
  isSupported(): boolean

  /** Provider identifier for logging / analytics. */
  readonly providerId: string
}

/**
 * User accent preference stored in local state.
 */
export interface AccentPreference {
  accent: Accent
  rate: number
}

export const DEFAULT_ACCENT_PREFERENCE: AccentPreference = {
  accent: 'auto',
  rate: 0.9,
}

/**
 * Maps Accent to BCP-47 language tag for SpeechSynthesis.
 */
export const ACCENT_LOCALE_MAP: Record<Accent, string | null> = {
  us: 'en-US',
  uk: 'en-GB',
  au: 'en-AU',
  auto: null,  // let browser pick best available English voice
}
