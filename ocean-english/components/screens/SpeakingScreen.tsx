'use client'
/* ════════════════════════════════════════════════════════════════════════
   D8 AI 口语对话 /speaking（界面优化18 移植）
   场景选择 → 对话（聊天气泡 + 按住说话 Web Speech 识别 + 打字 + AI 朗读 + 中文反馈）。
   数据：/api/ai/conversation（DeepSeek）。语音：浏览器 SpeechRecognition / speechSynthesis。
   ════════════════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from 'react'
import { useLexiStore } from '@/store/lexiStore'
import './screen-kit.css'
import './speaking.css'

interface Scene { id: string; nm: string; en: string; ic: string; bg: string; ds: string }
interface Msg { role: 'user' | 'assistant'; content: string; feedbackZh?: string }
interface SpeechRecognitionResultLike { transcript?: string }
interface SpeechRecognitionEventLike {
  results?: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>
}
interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

const SCENES: Scene[] = [
  { id: 'cafe', nm: '咖啡馆点餐', en: 'Ordering coffee', ic: '☕', bg: '#c98a2e', ds: '练习点单、加料、结账的日常表达。' },
  { id: 'interview', nm: '求职面试', en: 'Job interview', ic: '💼', bg: '#3b5bd9', ds: '自我介绍、回答常见面试问题。' },
  { id: 'campus', nm: '校园生活', en: 'On campus', ic: '🎓', bg: '#0e8c7a', ds: '选课、问路、和同学聊天。' },
  { id: 'travel', nm: '旅行问路', en: 'Travel & directions', ic: '🧳', bg: '#d2792f', ds: '机场、酒店、问路与求助。' },
  { id: 'exam', nm: '考试口语', en: 'Speaking test', ic: '🎯', bg: '#6d4bc4', ds: '雅思托福口语题型模拟。' },
  { id: 'custom', nm: '自定义场景', en: 'Custom topic', ic: '✨', bg: '#d4477e', ds: '输入任意话题，AI 陪你练。' },
]
const OPENER: Record<string, string> = {
  cafe: "Hi! Welcome to the cafe. What can I get for you today?",
  interview: "Hello, thanks for coming in. Could you start by introducing yourself?",
  campus: "Hey, you look new here — need help finding your way around campus?",
  travel: "Hello! Where are you headed today? Do you need any directions?",
  exam: "Let's begin your speaking practice. Could you describe your hometown?",
  custom: "Hi! What would you like to talk about today?",
}
const LV: Record<number, string> = { 1: '初中', 2: '高中', 3: '四级', 4: '六级', 5: '考研', 6: '托福', 7: 'SAT' }

const SOUND = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /></svg>
const MIC = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="11" rx="3" /><path d="M5 10a7 7 0 0 0 14 0M12 17v4" /></svg>
const SEND = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>

function speak(text: string) {
  try { const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u) } catch { /* ignore */ }
}

export function SpeakingScreen() {
  const profileLevel = useLexiStore(s => s.profile.level ?? 4)
  const [view, setView] = useState<'pick' | 'chat'>('pick')
  const [scene, setScene] = useState<Scene>(SCENES[0])
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [recording, setRecording] = useState(false)
  const [micHint, setMicHint] = useState<string | null>(null)
  const msgsRef = useRef<HTMLDivElement>(null)
  const recRef = useRef<{ stop: () => void } | null>(null)

  useEffect(() => { msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight }) }, [msgs, typing])

  function enter(s: Scene) {
    setScene(s); setMsgs([{ role: 'assistant', content: OPENER[s.id] ?? OPENER.custom }]); setView('chat')
  }

  async function send(text: string) {
    const t = text.trim()
    if (!t || typing) return
    const next: Msg[] = [...msgs, { role: 'user', content: t }]
    setMsgs(next); setInput(''); setTyping(true)
    try {
      const res = await fetch('/api/ai/conversation', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scene.nm, level: profileLevel, messages: next.map(m => ({ role: m.role, content: m.content })) }),
      })
      const j = res.ok ? await res.json() : null
      if (j?.ok) setMsgs(m => [...m, { role: 'assistant', content: j.reply || '…', feedbackZh: j.feedbackZh || undefined }])
      else setMsgs(m => [...m, { role: 'assistant', content: '（AI 暂时不可用，稍后再试）' }])
    } catch {
      setMsgs(m => [...m, { role: 'assistant', content: '（网络出错，稍后再试）' }])
    }
    setTyping(false)
  }

  function startRec() {
    const speechWindow = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor
      webkitSpeechRecognition?: SpeechRecognitionCtor
    }
    const SR = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
    if (!SR) { setMicHint('当前浏览器不支持语音识别，请打字'); setTimeout(() => setMicHint(null), 2200); return }
    try {
      const rec = new SR()
      rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 1
      rec.onresult = (e) => { const tr = e.results?.[0]?.[0]?.transcript; if (tr) void send(tr) }
      rec.onerror = () => { setRecording(false); setMicHint('没听清，再试一次或打字'); setTimeout(() => setMicHint(null), 2000) }
      rec.onend = () => setRecording(false)
      recRef.current = { stop: () => rec.stop() }
      rec.start(); setRecording(true); setMicHint('正在聆听…（松开发送）')
    } catch { setMicHint('麦克风不可用，请打字'); setTimeout(() => setMicHint(null), 2000) }
  }
  function stopRec() { if (recording) { recRef.current?.stop(); setRecording(false); setMicHint(null) } }

  // ── 场景选择 ──
  if (view === 'pick') {
    return (
      <div className="scr theme-light">
        <div className="wrap">
          <p className="eyebrow">AI 口语 · Speaking</p>
          <h1 className="h1">挑个场景，开口说</h1>
          <p className="sub">选一个生活场景，和 AI 用英语对话 —— 它会即时给中文反馈，帮你说得更地道。</p>
          <div className="sp-grid">
            {SCENES.map(s => (
              <button key={s.id} className="sp-scene" onClick={() => enter(s)}>
                <div className="ic" style={{ background: `${s.bg}22`, color: s.bg }}>{s.ic}</div>
                <div className="nm">{s.nm}</div><div className="en">{s.en}</div><div className="ds">{s.ds}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── 对话 ──
  return (
    <div className="sp-chatwrap theme-light">
      <div className="sp-chat-top">
        <button className="sp-chat-back" onClick={() => setView('pick')}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg></button>
        <span className="ic" style={{ background: `${scene.bg}22`, color: scene.bg }}>{scene.ic}</span>
        <div><div className="nm">{scene.nm}</div><div className="en">{scene.en}</div></div>
        <span className="lv">{LV[profileLevel] ?? '六级'} · Lv{profileLevel}</span>
      </div>
      <div className="sp-msgs" ref={msgsRef}>
        {msgs.map((m, i) => m.role === 'assistant' ? (
          <div className="sp-msg ai" key={i}>
            <span className="sp-av ai">AI</span>
            <div>
              <div className="sp-bubble">{m.content}</div>
              <div className="sp-msg-foot"><button className="sp-speak" onClick={() => speak(m.content)}>{SOUND}</button></div>
              {m.feedbackZh && <div className="sp-fb"><span><span className="t">建议</span>{m.feedbackZh}</span></div>}
            </div>
          </div>
        ) : (
          <div className="sp-msg user" key={i}><span className="sp-av me">我</span><div className="sp-bubble">{m.content}</div></div>
        ))}
        {typing && <div className="sp-msg ai"><span className="sp-av ai">AI</span><div className="sp-bubble" style={{ padding: 0 }}><div className="sp-typing"><i /><i /><i /></div></div></div>}
      </div>
      {micHint && <div className="sp-hint">{micHint}</div>}
      <div className="sp-input">
        <input className="sp-text" value={input} placeholder="打字，或按住右侧话筒说话…"
          onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void send(input) }} />
        <button className="sp-send" onClick={() => void send(input)}>{SEND}</button>
        <button className={`sp-mic ${recording ? 'rec' : ''}`} title="按住说话"
          onMouseDown={startRec} onMouseUp={stopRec} onMouseLeave={stopRec}
          onTouchStart={e => { e.preventDefault(); startRec() }} onTouchEnd={e => { e.preventDefault(); stopRec() }}>{MIC}</button>
      </div>
    </div>
  )
}
