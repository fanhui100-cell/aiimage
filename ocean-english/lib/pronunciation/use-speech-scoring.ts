'use client'
/* ============================================================================
   lib/pronunciation/use-speech-scoring.ts — F4 录音 + 浏览器识别 hook
   getUserMedia 录音（MediaRecorder 留 blob 回放）+ SpeechRecognition 转写
   （lang 跟口音设置，interimResults，maxAlternatives 3）。
   Safari/拒麦 → supported=false / micDenied，由 UI 降级「跟读对比」。
   ============================================================================ */

import { useCallback, useEffect, useRef, useState } from 'react'
import { scoreAttempt, type PronunciationScore } from './scoring'

interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export type SpeechPhase = 'idle' | 'recording' | 'processing' | 'scored' | 'fallback-recorded'

export interface UseSpeechScoring {
  supported: boolean          // SpeechRecognition 可用
  micDenied: boolean
  phase: SpeechPhase
  score: PronunciationScore | null
  audioUrl: string | null     // 自己的录音回放
  level: number               // 0-1 实时音量（波形用）
  start: (target: string, lang: string) => Promise<void>
  stop: () => void
  reset: () => void
}

export function useSpeechScoring(): UseSpeechScoring {
  const [supported] = useState<boolean>(() => !!getRecognitionCtor())
  const [micDenied, setMicDenied] = useState(false)
  const [phase, setPhase] = useState<SpeechPhase>('idle')
  const [score, setScore] = useState<PronunciationScore | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [level, setLevel] = useState(0)

  const recRef = useRef<SpeechRecognitionLike | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef(0)
  const targetRef = useRef('')
  const altsRef = useRef<string[]>([])
  const rafRef = useRef(0)
  const ctxRef = useRef<AudioContext | null>(null)

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    try { recRef.current?.abort() } catch { /* noop */ }
    try { mediaRef.current?.state !== 'inactive' && mediaRef.current?.stop() } catch { /* noop */ }
    streamRef.current?.getTracks().forEach(t => t.stop())
    void ctxRef.current?.close().catch(() => {})
    ctxRef.current = null
    streamRef.current = null
  }, [])

  useEffect(() => () => { cleanup(); if (audioUrl) URL.revokeObjectURL(audioUrl) }, [cleanup, audioUrl])

  const finalize = useCallback(() => {
    const durationMs = Date.now() - startedAtRef.current
    if (supported) {
      setScore(scoreAttempt(targetRef.current, altsRef.current, durationMs))
      setPhase('scored')
    } else {
      setPhase('fallback-recorded')
    }
  }, [supported])

  const start = useCallback(async (target: string, lang: string) => {
    setScore(null)
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null) }
    targetRef.current = target
    altsRef.current = []

    // 1) 录音（blob 供回放；降级模式也需要）
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const mr = new MediaRecorder(stream)
      mediaRef.current = mr
      mr.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' })
        setAudioUrl(URL.createObjectURL(blob))
      }
      mr.start()
      // 实时音量（真波形）
      const ctx = new AudioContext()
      ctxRef.current = ctx
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      src.connect(analyser)
      const buf = new Uint8Array(analyser.frequencyBinCount)
      const tick = () => {
        analyser.getByteTimeDomainData(buf)
        let sum = 0
        for (const v of buf) sum += Math.abs(v - 128)
        setLevel(Math.min(1, (sum / buf.length) / 40))
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch {
      setMicDenied(true)
      return
    }

    // 2) 识别（支持时）
    if (supported) {
      const Ctor = getRecognitionCtor()!
      const rec = new Ctor()
      recRef.current = rec
      rec.lang = lang
      rec.interimResults = true
      rec.maxAlternatives = 3
      rec.continuous = false
      rec.onresult = e => {
        const last = e.results[e.results.length - 1]
        const alts: string[] = []
        for (let i = 0; i < last.length; i++) alts.push(last[i].transcript)
        altsRef.current = alts
      }
      rec.onerror = () => { /* no-speech 等 → 按空转写计 0 分路径 */ }
      rec.onend = () => {
        // 识别先停（自动端点检测）→ 同步收掉录音并出分
        cancelAnimationFrame(rafRef.current)
        try { mediaRef.current?.state !== 'inactive' && mediaRef.current?.stop() } catch { /* noop */ }
        streamRef.current?.getTracks().forEach(t => t.stop())
        void ctxRef.current?.close().catch(() => {})
        setPhase('processing')
        setTimeout(finalize, 120)
      }
      rec.start()
    }

    startedAtRef.current = Date.now()
    setPhase('recording')
  }, [supported, audioUrl, finalize])

  const stop = useCallback(() => {
    if (supported && recRef.current) {
      try { recRef.current.stop() } catch { finalize() }   // onend 接管
    } else {
      cleanup()
      finalize()
    }
  }, [supported, cleanup, finalize])

  const reset = useCallback(() => {
    cleanup()
    setPhase('idle')
    setScore(null)
    setLevel(0)
  }, [cleanup])

  return { supported, micDenied, phase, score, audioUrl, level, start, stop, reset }
}
