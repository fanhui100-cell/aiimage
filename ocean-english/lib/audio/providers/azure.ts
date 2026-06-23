/* ════════════════════════════════════════════════════════════════════════
   lib/audio/providers/azure.ts — Azure AI Speech (Neural TTS) REST adapter (R6).

   POST https://{region}.tts.speech.microsoft.com/cognitiveservices/v1
     headers: Ocp-Apim-Subscription-Key, Content-Type: application/ssml+xml,
              X-Microsoft-OutputFormat, User-Agent
     body: SSML (named voice = the accent; <prosody rate> for pace)
   Returns CBR mp3 bytes → duration derived from byte length (no dependency).

   SECURITY: the subscription key is passed in by the caller (read from .env.local), held only in
   memory, and is NEVER logged or echoed. Errors surface status + Azure's text, never the key.
   ════════════════════════════════════════════════════════════════════════ */
import { mp3DurationMs, type SynthOutput } from '@/lib/audio/checksum'

export const AZURE_MP3_FORMAT = 'audio-24khz-48kbitrate-mono-mp3' // CBR 48 kbps

export interface AzureCreds { key: string; region: string }
export interface AzureSynthRequest { text: string; voiceShortName: string; accent: string; rate: string; outputFormat?: string }

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

/** Build SSML: named voice carries the accent (en-CA-ClaraNeural = Canadian); prosody sets pace. */
export function buildSsml(req: AzureSynthRequest): string {
  const lang = req.accent || 'en-US'
  const rate = req.rate && req.rate !== '0%' ? ` rate='${req.rate}'` : ''
  const inner = rate ? `<prosody${rate}>${escapeXml(req.text)}</prosody>` : escapeXml(req.text)
  return `<speak version='1.0' xml:lang='${lang}'><voice name='${req.voiceShortName}'>${inner}</voice></speak>`
}

/** Synthesize one clip. Throws on non-200 (message excludes the key). */
export async function synthesizeAzure(req: AzureSynthRequest, creds: AzureCreds): Promise<SynthOutput> {
  if (!creds.key || !creds.region) throw new Error('azure: missing key/region')
  const format = req.outputFormat ?? AZURE_MP3_FORMAT
  const url = `https://${creds.region}.tts.speech.microsoft.com/cognitiveservices/v1`
  const ssml = buildSsml(req)
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': creds.key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': format,
      'User-Agent': 'ocean-english-qbank-audio',
    },
    body: ssml,
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    // never include the key; surface status + Azure's (key-free) error text
    throw new Error(`azure tts ${res.status} ${res.statusText}${detail ? ': ' + detail.slice(0, 300) : ''}`)
  }
  const buf = new Uint8Array(await res.arrayBuffer())
  return { bytes: buf, mimeType: 'audio/mpeg', durationMs: mp3DurationMs(buf.byteLength) }
}
