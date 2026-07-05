/* ════════════════════════════════════════════════════════════════════════
   lib/audio/voice-pools.ts — Azure Neural voice/accent assignment (R6, pure).

   Decision #6: TOEFL audio balances US / Canada / UK / Australia accents (male+female).
   Decision #7: 中考/高考/CET first batch = neutral US English, clear, slow-medium pace.

   Assignment is DETERMINISTIC (hash of stimulus id) so re-runs reproduce the same voice and the
   checksum stays stable — no Math.random. Azure encodes accent in the NAMED voice itself
   (en-CA-ClaraNeural IS Canadian), so accent is reliable, not prompt-steered.
   ════════════════════════════════════════════════════════════════════════ */

export interface VoicePick { accent: string; voiceShortName: string; gender: 'F' | 'M'; rate: string }

// TOEFL four-accent pool (R4 confirmed: balanced US/CA/AU/UK + gendered voices).
export const TOEFL_VOICE_POOL: ReadonlyArray<Omit<VoicePick, 'rate'>> = [
  { accent: 'en-US', voiceShortName: 'en-US-AvaNeural', gender: 'F' },
  { accent: 'en-US', voiceShortName: 'en-US-AndrewNeural', gender: 'M' },
  { accent: 'en-CA', voiceShortName: 'en-CA-ClaraNeural', gender: 'F' },
  { accent: 'en-CA', voiceShortName: 'en-CA-LiamNeural', gender: 'M' },
  { accent: 'en-GB', voiceShortName: 'en-GB-SoniaNeural', gender: 'F' },
  { accent: 'en-GB', voiceShortName: 'en-GB-RyanNeural', gender: 'M' },
  { accent: 'en-AU', voiceShortName: 'en-AU-NatashaNeural', gender: 'F' },
  { accent: 'en-AU', voiceShortName: 'en-AU-WilliamNeural', gender: 'M' },
]

// Neutral US pair for Chinese exams (clear, slow-medium pace).
export const US_NEUTRAL_POOL: ReadonlyArray<Omit<VoicePick, 'rate'>> = [
  { accent: 'en-US', voiceShortName: 'en-US-AvaNeural', gender: 'F' },
  { accent: 'en-US', voiceShortName: 'en-US-AndrewNeural', gender: 'M' },
]

const TOEFL_RATE = '0%'        // natural pace for TOEFL realism
const CN_EXAM_RATE = '-8%'     // slow-medium for 中考/高考/CET clarity

const TOEFL_EXAMS = new Set(['toefl'])

function fnv(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

/** Deterministically assign a voice for a stimulus. TOEFL → 4-accent pool; others → neutral US slow-medium. */
export function assignVoice(examId: string | null | undefined, stimulusId: string): VoicePick {
  const isToefl = TOEFL_EXAMS.has(String(examId ?? '').toLowerCase())
  const pool = isToefl ? TOEFL_VOICE_POOL : US_NEUTRAL_POOL
  const pick = pool[fnv(stimulusId) % pool.length]
  return { ...pick, rate: isToefl ? TOEFL_RATE : CN_EXAM_RATE }
}
