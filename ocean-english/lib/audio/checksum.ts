/* ════════════════════════════════════════════════════════════════════════
   lib/audio/checksum.ts — deterministic synth-input hashing + output verification (R6).

   Server/script-only (uses node:crypto). Shared by generate-audio-assets (write) and
   validate-audio-assets (verify) so the idempotency + output contract stay in lockstep.

   Idempotency: the checksum is over the SYNTH INPUT (normalized transcript + voice + accent +
   provider + output format + prosody rate), NOT the audio bytes — TTS output need not be
   byte-identical across runs, but the same input must never be re-synthesized/re-inserted.
   ════════════════════════════════════════════════════════════════════════ */
import { createHash } from 'node:crypto'

export interface SynthSettings {
  provider: string        // e.g. 'azure'
  voiceShortName: string  // e.g. 'en-CA-ClaraNeural'
  accent: string          // e.g. 'en-CA'
  outputFormat: string    // e.g. 'audio-24khz-48kbitrate-mono-mp3'
  rate: string            // SSML prosody rate, e.g. '-8%' or '0%'
}

/** Normalize transcript so trivial whitespace/quote differences don't change the checksum. */
export function normalizeSynthInput(text: string): string {
  return String(text ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

/** Deterministic content+voice checksum (sha256, hex). Drives skip-if-exists idempotency. */
export function computeChecksum(text: string, s: SynthSettings): string {
  const norm = normalizeSynthInput(text)
  const key = [norm, s.provider, s.voiceShortName, s.accent, s.outputFormat, s.rate].join('')
  return createHash('sha256').update(key, 'utf8').digest('hex')
}

/** Deterministic object key in the private bucket. transcript never appears — only the checksum. */
export function deterministicStoragePath(s: SynthSettings, checksum: string, ext = 'mp3'): string {
  const safe = (x: string) => x.replace(/[^A-Za-z0-9_.-]/g, '_')
  return `audio/v2/${safe(s.accent)}/${safe(s.voiceShortName)}/${checksum}.${ext}`
}

/** English word count (matches shape.ts countWords) — used to estimate synthesis minutes/cost. */
export function countWords(text: string): number {
  return (String(text ?? '').match(/[A-Za-z][A-Za-z'’-]*/g) || []).length
}

const BITRATE_KBPS = 48 // audio-24khz-48kbitrate-mono-mp3 is CBR 48 kbps → 6 bytes/ms
/** Duration (ms) of a CBR MP3 from its byte length. No dependency: bytes / (kbps*125/1000). */
export function mp3DurationMs(byteLength: number, bitrateKbps = BITRATE_KBPS): number {
  const bytesPerMs = (bitrateKbps * 1000) / 8 / 1000 // = kbps*0.125
  return Math.round(byteLength / bytesPerMs)
}

export interface SynthOutput { bytes: Uint8Array; mimeType: string; durationMs: number }
export interface VerifyBounds { minDurationMs?: number; maxDurationMs?: number; minBytes?: number }

/** Validate a synth product BEFORE upload: non-empty bytes, mp3 MIME, duration within bounds. */
export function verifySynthOutput(out: SynthOutput, bounds: VerifyBounds = {}): string | null {
  const { minDurationMs = 800, maxDurationMs = 600000, minBytes = 512 } = bounds
  if (!out.bytes || out.bytes.byteLength < minBytes) return `empty/too-small audio (${out.bytes?.byteLength ?? 0} bytes)`
  if (!/^audio\/(mpeg|mp3)$/i.test(out.mimeType)) return `unexpected MIME: ${out.mimeType}`
  if (!Number.isFinite(out.durationMs) || out.durationMs < minDurationMs) return `duration too short: ${out.durationMs}ms`
  if (out.durationMs > maxDurationMs) return `duration too long: ${out.durationMs}ms (max ${maxDurationMs})`
  return null
}
