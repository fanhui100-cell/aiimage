/* ════════════════════════════════════════════════════════════════════════
   validate-audio-pipeline.ts — R6 pure-logic selftest (no DB, no key, no network).

   Locks the deterministic contracts the synth pipeline depends on: checksum determinism +
   sensitivity, input normalization, mp3 duration-from-bytes, voice/accent assignment, storage
   path shape, SSML build (escaping + prosody), and output verification bounds.
   Exit 1 on any contract break. Usage: npx tsx scripts/validate-audio-pipeline.ts
   ════════════════════════════════════════════════════════════════════════ */
import { normalizeSynthInput, computeChecksum, deterministicStoragePath, mp3DurationMs, countWords, verifySynthOutput, type SynthSettings } from '@/lib/audio/checksum'
import { assignVoice, TOEFL_VOICE_POOL, US_NEUTRAL_POOL } from '@/lib/audio/voice-pools'
import { buildSsml } from '@/lib/audio/providers/azure'

const fails: string[] = []
const ok = (c: boolean, m: string) => { if (!c) fails.push(m) }
const S = (over: Partial<SynthSettings> = {}): SynthSettings => ({ provider: 'azure', voiceShortName: 'en-US-AvaNeural', accent: 'en-US', outputFormat: 'audio-24khz-48kbitrate-mono-mp3', rate: '0%', ...over })

// normalize
ok(normalizeSynthInput('  a\r\nb  “q” ’ ') === 'a\nb "q" \'', `normalize: got ${JSON.stringify(normalizeSynthInput('  a\r\nb  “q” ’ '))}`)

// checksum determinism + sensitivity
const t = 'The lecture begins now.'
ok(computeChecksum(t, S()) === computeChecksum(t, S()), 'checksum: deterministic for same input')
ok(computeChecksum(t, S()) === computeChecksum('  The  lecture begins now. ', S()), 'checksum: stable under whitespace normalization')
ok(computeChecksum(t, S()) !== computeChecksum(t, S({ voiceShortName: 'en-GB-RyanNeural', accent: 'en-GB' })), 'checksum: changes with voice/accent')
ok(computeChecksum(t, S()) !== computeChecksum(t, S({ rate: '-8%' })), 'checksum: changes with rate')
ok(computeChecksum(t, S()) !== computeChecksum(t + ' Extra.', S()), 'checksum: changes with text')
ok(/^[0-9a-f]{64}$/.test(computeChecksum(t, S())), 'checksum: sha256 hex')

// storage path: deterministic, contains accent+voice+checksum, NEVER the transcript
const cs = computeChecksum(t, S())
const path = deterministicStoragePath(S(), cs)
ok(path === `audio/v2/en-US/en-US-AvaNeural/${cs}.mp3`, `storagePath: got ${path}`)
ok(!path.includes(' ') && !path.toLowerCase().includes('lecture'), 'storagePath: no transcript leakage')

// mp3 duration from CBR 48kbps bytes (6 bytes/ms)
ok(mp3DurationMs(60000) === 10000, `mp3Duration: 60000 bytes → ${mp3DurationMs(60000)}ms (expect 10000)`)
ok(countWords('one two three-four') === 3, `countWords: ${countWords('one two three-four')}`)

// voice assignment: TOEFL → 4-accent pool; others → neutral US; deterministic
const v1 = assignVoice('toefl', 'stim-abc'), v2 = assignVoice('toefl', 'stim-abc')
ok(v1.voiceShortName === v2.voiceShortName, 'assignVoice: deterministic per stimulus')
ok(TOEFL_VOICE_POOL.some((p) => p.voiceShortName === v1.voiceShortName), 'assignVoice: toefl uses 4-accent pool')
ok(v1.rate === '0%', 'assignVoice: toefl natural rate')
const cn = assignVoice('cet4', 'stim-xyz')
ok(US_NEUTRAL_POOL.some((p) => p.voiceShortName === cn.voiceShortName) && cn.accent === 'en-US', 'assignVoice: cet4 neutral US')
ok(cn.rate === '-8%', 'assignVoice: cn-exam slow-medium rate')
// accent coverage: the toefl pool spans US/CA/GB/AU
ok(new Set(TOEFL_VOICE_POOL.map((p) => p.accent)).size === 4, 'toefl pool covers 4 accents')

// SSML: escaping + voice + prosody
const ssml = buildSsml({ text: 'A & B < C "q"', voiceShortName: 'en-CA-ClaraNeural', accent: 'en-CA', rate: '-8%' })
ok(ssml.includes("name='en-CA-ClaraNeural'") && ssml.includes("xml:lang='en-CA'"), 'ssml: named voice + lang')
ok(ssml.includes('&amp;') && ssml.includes('&lt;') && !ssml.includes('A & B'), 'ssml: escapes special chars')
ok(ssml.includes("rate='-8%'"), 'ssml: prosody rate applied')
ok(!buildSsml({ text: 'x', voiceShortName: 'en-US-AvaNeural', accent: 'en-US', rate: '0%' }).includes('prosody'), 'ssml: no prosody at 0% rate')

// verifySynthOutput bounds
ok(verifySynthOutput({ bytes: new Uint8Array(60000), mimeType: 'audio/mpeg', durationMs: 10000 }) === null, 'verify: good output passes')
ok(verifySynthOutput({ bytes: new Uint8Array(10), mimeType: 'audio/mpeg', durationMs: 5000 }) !== null, 'verify: too-small bytes rejected')
ok(verifySynthOutput({ bytes: new Uint8Array(60000), mimeType: 'text/html', durationMs: 10000 }) !== null, 'verify: non-mp3 MIME rejected')
ok(verifySynthOutput({ bytes: new Uint8Array(60000), mimeType: 'audio/mpeg', durationMs: 100 }) !== null, 'verify: too-short duration rejected')

if (fails.length) { console.error(`✗ validate-audio-pipeline FAILED (${fails.length}):`); for (const f of fails) console.error(`  ✗ ${f}`); process.exit(1) }
console.log(`✓ validate-audio-pipeline PASSED — checksum determinism/sensitivity, normalize, mp3 duration, voice assignment (4-accent TOEFL / neutral-US CN), storage-path (no transcript leak), SSML escaping+prosody, output verification`)
