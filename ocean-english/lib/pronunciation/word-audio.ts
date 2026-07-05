'use client'

/**
 * 词级真人发音 — 外部 API（dictionaryapi.dev，取自 Wiktionary 公共音频）。
 * P4：单词优先播真人 mp3（按口音挑 US/UK/AU），取不到 / 句子 / 短文 → 回退浏览器 TTS。
 * 结果按词缓存（含「无音频」负缓存），避免重复请求。
 */
import type { Accent } from './pronunciation-types'

type AudioEntry = { audio: string; region: 'us' | 'uk' | 'au' | '' }
const cache = new Map<string, AudioEntry[]>()
let current: HTMLAudioElement | null = null

function regionOf(url: string): AudioEntry['region'] {
  const u = url.toLowerCase()
  if (/(-us|\/us|_us)/.test(u)) return 'us'
  if (/(-uk|\/uk|-gb|_gb|-rp)/.test(u)) return 'uk'
  if (/(-au|_au)/.test(u)) return 'au'
  return ''
}

async function getEntries(word: string): Promise<AudioEntry[]> {
  const key = word.toLowerCase().trim()
  if (!key) return []
  const hit = cache.get(key)
  if (hit) return hit
  const entries: AudioEntry[] = []
  try {
    const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`)
    if (r.ok) {
      const data = (await r.json()) as { phonetics?: { audio?: string }[] }[]
      for (const e of Array.isArray(data) ? data : []) {
        for (const p of e.phonetics ?? []) {
          const url = p.audio?.trim()
          if (url && /^https?:\/\//.test(url)) entries.push({ audio: url.startsWith('//') ? 'https:' + url : url, region: regionOf(url) })
        }
      }
    }
  } catch { /* network — negative cache */ }
  cache.set(key, entries)
  return entries
}

function pickByAccent(entries: AudioEntry[], accent: Accent): string | null {
  if (!entries.length) return null
  if (accent === 'us' || accent === 'uk' || accent === 'au') {
    const m = entries.find(e => e.region === accent)
    if (m) return m.audio
  }
  return (entries.find(e => e.region === 'us') ?? entries[0]).audio
}

export function stopWordAudio(): void {
  if (current) { try { current.pause() } catch { /* no-op */ } current = null }
  try { if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel() } catch { /* no-op */ }
}

/** 播单词真人音频；成功返回 Audio 元素（可挂 onended），无音频/失败返回 null。 */
export async function playWordAudio(word: string, accent: Accent = 'auto'): Promise<HTMLAudioElement | null> {
  const url = pickByAccent(await getEntries(word), accent)
  if (!url) return null
  try {
    stopWordAudio()
    const a = new Audio(url)
    a.preload = 'auto'
    await a.play()
    current = a
    return a
  } catch { return null }
}

// ── TTS 兜底：挑最清晰的英语嗓音（默认嗓音常含糊/机械）──────────────────────
let _voices: SpeechSynthesisVoice[] = []
function loadVoices(): void {
  try {
    if (typeof speechSynthesis === 'undefined') return
    _voices = speechSynthesis.getVoices() ?? []
    if (!_voices.length) speechSynthesis.addEventListener?.('voiceschanged', () => { _voices = speechSynthesis.getVoices() ?? [] }, { once: true })
  } catch { /* no-op */ }
}
loadVoices()

// 优先高保真嗓音：云端 Natural/Neural（最清晰）→ Google/系统优质音 → 任意英语
// 顺序即优先级（越靠前越清晰）
const PREFERRED = [/online.*natural/i, /natural/i, /neural/i, /\baria\b/i, /\bjenny\b/i, /\bguy\b/i, /google/i, /enhanced/i, /premium/i, /samantha/i, /libby/i, /sonia/i, /\bava\b/i, /daniel/i]
function pickVoice(lang: string): SpeechSynthesisVoice | null {
  if (!_voices.length) loadVoices()
  if (!_voices.length) return null
  const norm = (s: string) => s.toLowerCase().replace('_', '-')
  const exact = _voices.filter(v => norm(v.lang ?? '') === norm(lang))
  const sameLang = _voices.filter(v => norm(v.lang ?? '').startsWith('en'))
  const pool = exact.length ? exact : sameLang
  if (!pool.length) return null
  for (const re of PREFERRED) { const v = pool.find(x => re.test(x.name)); if (v) return v }
  return pool.find(v => v.localService) ?? pool[0]
}

// 把长文按句切分（保留句末标点），逐句作为独立 utterance 入队 → 句间自然停顿、不糊成一片
function splitSentences(text: string): string[] {
  return text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?。！？])\s+/).map(s => s.trim()).filter(Boolean)
}

/** 清晰朗读：挑最优嗓音 + 适中语速 + 逐句入队（长文更清楚）。listening/dictation 用 slow。 */
function ttsSpeak(text: string, accent: Accent, rate = 0.92): void {
  try {
    if (typeof speechSynthesis === 'undefined') return
    const lang = accent === 'uk' ? 'en-GB' : accent === 'au' ? 'en-AU' : 'en-US'
    const v = pickVoice(lang)
    speechSynthesis.cancel()
    const parts = splitSentences(text)
    for (const part of (parts.length ? parts : [text])) {
      const u = new SpeechSynthesisUtterance(part)
      u.lang = lang
      if (v) u.voice = v
      u.rate = rate          // 清晰优先：略慢于常速
      u.pitch = 1
      u.volume = 1           // 满音量，避免发闷
      speechSynthesis.speak(u)   // 入队：逐句播放，句间天然停顿
    }
  } catch { /* no-op */ }
}

const WORD_RE = /^[a-zA-Z][a-zA-Z'’\-]{0,40}$/

/**
 * 智能朗读：单词 → 真人音频（失败回退 TTS）；短语/句子/短文 → TTS。
 * `slow`：听写/听力题用，放慢并咬字更清楚。
 */
export async function speakSmart(text: string, accent: Accent = 'auto', opts?: { slow?: boolean }): Promise<void> {
  const t = text.trim()
  if (!t) return
  if (WORD_RE.test(t)) {
    const audio = await playWordAudio(t, accent)
    if (audio) return
  }
  ttsSpeak(t, accent, opts?.slow ? 0.82 : 0.95)
}
