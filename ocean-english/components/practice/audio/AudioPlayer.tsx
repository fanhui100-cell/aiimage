'use client'
/* ════════════════════════════════════════════════════════════════════════
   AudioPlayer — 听力播放器（Phase 9）

   - 有真实音频 URL → HTML5 <audio>：可访问的播放/暂停、加载/错误态、重播。
   - 无 URL 或加载失败 → 退回 TTS（speakFallback），词级/草稿/无音频都不崩。
   - replayLimit：模拟卷可限制重播次数（数据提供时）；练习模式不传 = 不限。
   - transcript 仅在 revealed（答题后/复习）时显示，之前绝不渲染。
   视觉沿用 .pr-v2 ListenButton 的渐变圆 + 均衡条，不做整页重设计。
   ════════════════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from 'react'
import { isPlayableAudioUrl, speakFallback, stopFallback } from '@/lib/audio/audio-asset-client'

type Status = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

export interface AudioPlayerProps {
  /** 真实音频 URL（http(s):// 或 /…）。v1 短文正文不是 URL → 走 TTS。 */
  url?: string
  /** 无 URL/加载失败时由 TTS 朗读的文本（短文正文或词）。 */
  fallbackText?: string
  /** 听力原文；仅 revealed 时显示。 */
  transcript?: string
  /** 答题后/复习态：true 才显示 transcript。 */
  revealed?: boolean
  /** 慢速朗读（听写/听力题）。 */
  slow?: boolean
  /** 模拟卷受控重播上限；undefined=不限。 */
  replayLimit?: number
  label?: string
}

export function AudioPlayer({ url, fallbackText, transcript, revealed = false, slow = false, replayLimit, label = '播放听力音频' }: AudioPlayerProps) {
  const playable = isPlayableAudioUrl(url)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ttsTimer = useRef<number | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [plays, setPlays] = useState(0)
  const [useTts, setUseTts] = useState(!playable)   // 真实音频加载失败时切 TTS

  const exhausted = replayLimit != null && plays >= replayLimit
  const ttsMode = useTts || !playable

  // 切题/卸载：停音频 + 停 TTS + 清定时
  useEffect(() => {
    setUseTts(!playable); setStatus('idle'); setPlays(0)
  }, [url, playable])
  useEffect(() => () => {
    try { audioRef.current?.pause() } catch { /* no-op */ }
    if (ttsTimer.current) window.clearTimeout(ttsTimer.current)
    stopFallback()
  }, [])

  const speakTts = () => {
    stopFallback()
    setStatus('playing')
    setPlays((p) => p + 1)
    void speakFallback(fallbackText || '', 'us', { slow })
    // TTS 无可靠 ended 粒度：定时回 idle（与既有 ListenButton 行为一致）
    if (ttsTimer.current) window.clearTimeout(ttsTimer.current)
    ttsTimer.current = window.setTimeout(() => setStatus('idle'), slow ? 2600 : 1200)
  }

  const playAudio = async () => {
    const a = audioRef.current
    if (!a) { setUseTts(true); speakTts(); return }
    try {
      stopFallback()
      a.currentTime = 0
      setStatus('loading')
      await a.play()
      // onPlaying 事件会把 status 设为 playing；这里只计次
      setPlays((p) => p + 1)
    } catch {
      setUseTts(true)   // 自动播放被拦/解码失败 → TTS 兜底
      setStatus('idle')
    }
  }

  const onClick = () => {
    if (exhausted) return
    if (ttsMode) { speakTts(); return }
    if (status === 'playing') { try { audioRef.current?.pause() } catch { /* no-op */ } return }
    void playAudio()
  }

  const isBusy = status === 'playing' || status === 'loading'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {playable && (
        <audio
          ref={audioRef}
          src={url}
          preload="none"
          onLoadStart={() => setStatus('loading')}
          onPlaying={() => setStatus('playing')}
          onPause={() => setStatus((s) => (s === 'playing' ? 'paused' : s))}
          onEnded={() => setStatus('idle')}
          onError={() => { setUseTts(true); setStatus('idle') }}
          style={{ display: 'none' }}
        />
      )}

      <button
        type="button"
        className="press"
        onClick={onClick}
        disabled={exhausted}
        aria-label={exhausted ? '已达播放次数上限' : status === 'playing' ? '暂停' : label}
        aria-pressed={status === 'playing'}
        aria-busy={status === 'loading'}
        title={exhausted ? '已达播放次数上限' : label}
        style={{
          width: 64, height: 64, borderRadius: 999, border: 'none',
          cursor: exhausted ? 'not-allowed' : 'pointer', opacity: exhausted ? 0.45 : 1,
          background: 'linear-gradient(180deg,#6ff0db,#34d8c0)', color: '#04241f',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 14px 28px -14px rgba(14,140,122,.7)',
        }}
      >
        {status === 'loading' ? (
          <span aria-hidden style={{ width: 22, height: 22, borderRadius: 999, border: '3px solid rgba(4,36,31,.35)', borderTopColor: '#04241f', animation: 'pr-spin .7s linear infinite' }} />
        ) : isBusy ? (
          <span aria-hidden style={{ display: 'inline-flex', gap: 3 }}>
            {[0, 1, 2, 3].map((i) => <span key={i} style={{ width: 3, height: 14, borderRadius: 2, background: '#04241f', animation: `pr-eq .7s ${i * 0.12}s ease-in-out infinite` }} />)}
          </span>
        ) : status === 'paused' ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
        )}
      </button>

      {replayLimit != null && (
        <span style={{ fontSize: 11, color: exhausted ? 'var(--rose-ink)' : 'var(--ink-muted)' }} role="status">
          {exhausted ? '播放次数已用尽' : `可重播 ${Math.max(0, replayLimit - plays)} 次`}
        </span>
      )}
      {ttsMode && (
        <span style={{ fontSize: 10.5, color: 'var(--ink-muted)', opacity: 0.8 }}>朗读模式</span>
      )}

      {revealed && transcript && <div className="transcript">{transcript}</div>}
    </div>
  )
}
