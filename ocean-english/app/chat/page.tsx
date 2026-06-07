'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { useLearningStore } from '@/store/learningStore'
import { getMockAiResponse } from '@/data/mock-chat'
import { resolveNavigatorContext } from '@/lib/ai-navigator/ai-navigator-context'
import { AINavigatorHeader } from '@/components/ai-navigator/AINavigatorHeader'
import { AINavigatorContextPanel } from '@/components/ai-navigator/AINavigatorContextPanel'
import { AINavigatorPromptShortcuts } from '@/components/ai-navigator/AINavigatorPromptShortcuts'
import type { ChatMessage } from '@/types/study'
import type { AINavigatorContext } from '@/lib/ai-navigator/ai-navigator-types'

// ── Message bubble ──────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '12px' }}
    >
      {!isUser && (
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(14,140,122,0.12)', border: '1px solid rgba(14,140,122,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', marginRight: '8px', flexShrink: 0, marginTop: '2px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--teal-ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
        </div>
      )}
      <div
        style={{
          maxWidth: '75%',
          padding: '12px 16px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isUser ? 'var(--teal-bg)' : 'var(--card)',
          border: `1px solid ${isUser ? 'rgba(14,140,122,0.25)' : 'var(--line)'}`,
          borderLeft: !isUser ? '2px solid rgba(14,140,122,0.3)' : undefined,
          color: 'var(--ink)',
          fontSize: '14px',
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
          boxShadow: 'var(--card-shadow-sm)',
        }}
      >
        {msg.content.split('**').map((part, i) =>
          i % 2 === 1 ? <strong key={i} style={{ color: 'var(--teal-ink)' }}>{part}</strong> : part,
        )}
      </div>
    </motion.div>
  )
}

// ── Empty state ──────────────────────────────────────────────────────────────

function ChatEmptyState({ context }: { context: AINavigatorContext }) {
  const greeting =
    context.type === 'word' || context.type === 'lexigraph_word'
      ? `一起来探索单词 "${context.word}" 吧。`
      : context.type === 'wrong_answer'
        ? `让我帮你理解这道错题。`
        : context.type === 'study_goal'
          ? `一起制定学习计划吧。`
          : `提问任何英语相关的问题。`

  const greetingEn =
    context.type === 'word' || context.type === 'lexigraph_word'
      ? `Let's explore "${context.word}" together.`
      : context.type === 'wrong_answer'
        ? `Let me help you understand this mistake.`
        : context.type === 'study_goal'
          ? `Let's plan your learning journey.`
          : `Ask me anything about English.`

  return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--teal-bg)', border: '1px solid rgba(14,140,122,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--teal-ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </div>
      <p style={{ color: 'var(--ink)', marginBottom: '6px', fontSize: '15px', fontFamily: 'var(--font-serif-zh)', fontWeight: 600 }}>{greeting}</p>
      <p style={{ color: 'var(--ink-sub)', fontSize: '13px', fontFamily: 'var(--font-news)', fontStyle: 'italic' }}>{greetingEn}</p>
      <p style={{ color: 'var(--ink-muted)', fontSize: '12px', marginTop: '16px' }}>
        使用上方快捷按钮，或直接在下方输入问题。
      </p>
    </div>
  )
}

// ── Inner page (reads search params) ────────────────────────────────────────

function ChatInner() {
  const searchParams = useSearchParams()
  const {
    chatMessages,
    addChatMessage,
    clearChat,
    addToReview,
    userLevel,
    wrongAnswers,
    studyProgress,
    savedWords,
    reviewWords,
  } = useLearningStore()

  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const context: AINavigatorContext = resolveNavigatorContext({
    params: searchParams,
    wrongAnswers,
    studyProgress,
    savedWords,
    reviewWords,
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isTyping])

  async function handleSend(text?: string) {
    const message = (text ?? input).trim()
    if (!message || isTyping) return
    setInput('')

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: Date.now(),
    }
    addChatMessage(userMsg)

    // Auto-add words mentioned in user message
    const wordMatch = message.match(/\b(ubiquitous|ephemeral|resilient|meticulous|eloquent|pragmatic)\b/i)
    if (wordMatch) addToReview(wordMatch[0].toLowerCase(), wordMatch[0].toLowerCase())

    setIsTyping(true)
    try {
      const history = chatMessages.map(m => ({ role: m.role, content: m.content }))
      history.push({ role: 'user', content: message })

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          context: { userLevel: userLevel ?? 'intermediate', language: 'bilingual' },
        }),
      })

      const data = (await res.json()) as { content?: string }
      const responseText = res.ok && data.content ? data.content : getMockAiResponse(message)
      addChatMessage({ id: `a-${Date.now()}`, role: 'assistant', content: responseText, timestamp: Date.now() })
    } catch {
      addChatMessage({ id: `a-${Date.now()}`, role: 'assistant', content: getMockAiResponse(message), timestamp: Date.now() })
    } finally {
      setIsTyping(false)
    }
  }

  function handleFill(text: string) {
    setInput(text)
    inputRef.current?.focus()
    // Move cursor to end
    setTimeout(() => {
      const el = inputRef.current
      if (el) el.setSelectionRange(el.value.length, el.value.length)
    }, 0)
  }

  return (
    <div className="theme-light" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingTop: '72px' }}>
      {/* Header */}
      <AINavigatorHeader
        context={context}
        onClear={clearChat}
        hasMessages={chatMessages.length > 0}
      />

      {/* Context panel */}
      <AINavigatorContextPanel context={context} />

      {/* Prompt shortcuts */}
      <AINavigatorPromptShortcuts
        context={context}
        onSend={handleSend}
        onFill={handleFill}
        disabled={isTyping}
      />

      {/* Divider */}
      {chatMessages.length > 0 && (
        <div style={{ maxWidth: '800px', margin: '14px auto 0', padding: '0 24px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ height: '1px', background: 'var(--line)' }} />
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', maxWidth: '800px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {chatMessages.length === 0 && <ChatEmptyState context={context} />}

        <AnimatePresence initial={false}>
          {chatMessages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        </AnimatePresence>

        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(14,140,122,0.12)', border: '1px solid rgba(14,140,122,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--teal-ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              </div>
              <div style={{ padding: '10px 16px', borderRadius: '16px 16px 16px 4px', background: 'var(--card)', border: '1px solid var(--line)', borderLeft: '2px solid rgba(14,140,122,0.3)', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: 'var(--card-shadow-sm)' }}>
                {[0, 0.15, 0.3].map((delay, i) => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 0.9, delay, ease: 'easeInOut' }}
                    style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--teal-ink)', display: 'inline-block' }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 24px 16px', borderTop: '1px solid var(--line)', background: 'var(--card-2)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '10px' }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="提问单词、语法或考试相关问题..."
            style={{
              flex: 1, padding: '12px 16px',
              background: 'var(--card)', border: '1px solid var(--line)',
              borderRadius: '10px', color: 'var(--ink)', fontSize: '14px', outline: 'none',
            }}
            onFocus={e => (e.target.style.borderColor = 'rgba(14,140,122,0.5)')}
            onBlur={e => (e.target.style.borderColor = 'var(--line)')}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            style={{
              padding: '12px 20px', borderRadius: '10px',
              background: 'var(--teal-bg)', border: '1px solid rgba(14,140,122,0.4)',
              color: 'var(--teal-ink)', fontSize: '14px',
              cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
              opacity: input.trim() && !isTyping ? 1 : 0.5,
              fontWeight: 600,
            }}
          >
            发送 →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page (Suspense boundary for useSearchParams) ─────────────────────────────

export default function ChatPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="theme-light" style={{ minHeight: '100vh', paddingTop: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: 'var(--ink-sub)', fontSize: '13px' }}>加载中…</div>
          </div>
        }
      >
        <ChatInner />
      </Suspense>
    </AppShell>
  )
}
