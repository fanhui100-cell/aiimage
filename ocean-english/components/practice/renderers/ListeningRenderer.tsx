'use client'
/* ListeningRenderer — 听力 stem：AudioPlayer（有稳定音频用真实播放，否则 TTS 兜底）+ 题干。
   transcript 绝不随练习载荷下发；仅答题后（locked）经 audio-asset-client review 模式按需拉取后显示。
   实际作答（choice/spell）由 PracticeRunner 在下方按 inputMode 路由。 */
import { useEffect, useState } from 'react'
import type { PracticeItem } from '../practice-types'
import { AudioPlayer } from '../audio/AudioPlayer'
import { fetchAudioByStimulus, isPlayableAudioUrl } from '@/lib/audio/audio-asset-client'

export function ListeningRenderer({ item, locked }: { item: PracticeItem; locked: boolean }) {
  const slow = item.type === 'listening_comprehension'
  // v2 已生成稳定音频 → item.audio.url 是真实 URL；v1 的 audio.url 存的是短文正文（非 URL）→ 当作 TTS 文本。
  const rawUrl = item.audio?.url ?? undefined
  const audioUrl = isPlayableAudioUrl(rawUrl) ? rawUrl : undefined
  // 无稳定音频时朗读：v1 短文正文 / 词面 / 词 id / 题干
  const ttsText = audioUrl
    ? undefined
    : rawUrl || item.stimulus?.textEn || item.targetWords[0]?.surface || item.targetWords[0]?.wordId || item.prompt

  // transcript 只在答题后拉取：v2 经 review 模式查 audio_assets；v1 用本地已有文本（仅当存在）。
  const [reviewTranscript, setReviewTranscript] = useState<string | undefined>(undefined)
  useEffect(() => {
    if (!locked || !item.stimulusId) return
    let alive = true
    fetchAudioByStimulus(item.stimulusId, 'review')
      .then((a) => { if (alive && a?.transcript) setReviewTranscript(a.transcript) })
      .catch(() => {})
    return () => { alive = false }
  }, [locked, item.stimulusId])
  const transcript = reviewTranscript || (audioUrl ? undefined : item.stimulus?.textEn)

  return (
    <div style={{ textAlign: 'center' }}>
      <AudioPlayer url={audioUrl} fallbackText={ttsText ? String(ttsText) : undefined} transcript={transcript} revealed={locked} slow={slow} />
      {item.promptZh && <div className="ask" style={{ marginTop: 10 }}>{item.promptZh}</div>}
      {item.type === 'listening_comprehension' && item.prompt && (
        <div style={{ marginTop: 12, fontSize: 16, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-news)', lineHeight: 1.5 }}>{item.prompt}</div>
      )}
    </div>
  )
}
