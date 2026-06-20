'use client'
/* ════════════════════════════════════════════════════════════════════════
   audio-asset-client.ts — 听力音频资产的纪律化读取（Phase 9）

   - 按 stimulus_id 或 audio_asset_id 取 active 音频元数据。
   - transcript 只在调用方显式 review/答题后模式请求时返回；
     练习模式连列都不 select，从源头杜绝「答题前暴露原文」。
   - 词级发音/短文无稳定音频 → 退回浏览器 TTS（复用 word-audio.speakSmart）。
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { speakSmart, stopWordAudio } from '@/lib/pronunciation/word-audio'
import type { Accent } from '@/lib/pronunciation/pronunciation-types'

export type AudioFetchMode = 'practice' | 'review'

/** 列契约（validate-audio-assets 据此断言练习模式不含 transcript）。 */
export const AUDIO_PRACTICE_COLUMNS = 'id, stimulus_id, url, duration_ms, accent, voice_id, provider, checksum, qa_status'
export const AUDIO_REVIEW_COLUMNS = `${AUDIO_PRACTICE_COLUMNS}, transcript`

export interface AudioAssetMeta {
  id: string
  stimulusId: string | null
  url: string
  durationMs: number | null
  accent: string | null
  voiceId: string | null
  provider: string | null
  checksum: string | null
  qaStatus: string
  /** 仅 mode==='review' 时存在；练习模式恒为 undefined（未 select）。 */
  transcript?: string
}

type AudioRow = {
  id: string
  stimulus_id: string | null
  url: string
  duration_ms: number | null
  accent: string | null
  voice_id: string | null
  provider: string | null
  checksum: string | null
  qa_status: string
  transcript?: string | null
}

function mapRow(row: AudioRow, mode: AudioFetchMode): AudioAssetMeta {
  const meta: AudioAssetMeta = {
    id: row.id,
    stimulusId: row.stimulus_id,
    url: row.url,
    durationMs: row.duration_ms,
    accent: row.accent,
    voiceId: row.voice_id,
    provider: row.provider,
    checksum: row.checksum,
    qaStatus: row.qa_status,
  }
  // 双保险：即便上游误带 transcript，练习模式也绝不向外暴露
  if (mode === 'review' && typeof row.transcript === 'string') meta.transcript = row.transcript
  return meta
}

/** 仅 http(s):// 或站内 / 开头视为可播放真实音频；v1 的 audio_ref 存的是短文正文（非 URL），不算。 */
export function isPlayableAudioUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return /^(https?:)?\/\//.test(url) || url.startsWith('/')
}

async function fetchOne(filter: 'stimulus_id' | 'id', value: string, mode: AudioFetchMode): Promise<AudioAssetMeta | null> {
  if (!value || !isSupabaseConfigured) return null
  try {
    const db = createClient()
    const { data, error } = await db
      .from('audio_assets')
      .select(mode === 'review' ? AUDIO_REVIEW_COLUMNS : AUDIO_PRACTICE_COLUMNS)
      .eq(filter, value)
      .eq('qa_status', 'active')
      .limit(1)
      .maybeSingle()
    if (error || !data) return null
    return mapRow(data as unknown as AudioRow, mode)
  } catch {
    return null   // 表不存在/网络失败 → 交给调用方走 TTS 兜底
  }
}

/** 按材料取 active 音频元数据。练习模式不含 transcript。 */
export function fetchAudioByStimulus(stimulusId: string, mode: AudioFetchMode = 'practice'): Promise<AudioAssetMeta | null> {
  return fetchOne('stimulus_id', stimulusId, mode)
}

/** 按 audio_asset id 取 active 音频元数据。练习模式不含 transcript。 */
export function fetchAudioByAssetId(audioAssetId: string, mode: AudioFetchMode = 'practice'): Promise<AudioAssetMeta | null> {
  return fetchOne('id', audioAssetId, mode)
}

/** 词级发音/无稳定音频时的 TTS 兜底（复用 word-audio：单词优先真人音频，其余 TTS）。 */
export function speakFallback(text: string, accent: Accent = 'us', opts?: { slow?: boolean }): Promise<void> {
  return speakSmart(text, accent, opts)
}

/** 停止当前音频/TTS（切题或卸载时调用）。 */
export function stopFallback(): void {
  stopWordAudio()
}
