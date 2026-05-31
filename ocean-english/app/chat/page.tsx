'use client'

import { useState, useRef, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useLearningStore } from '@/store/learningStore'
import { getMockAiResponse, suggestedPrompts } from '@/data/mock-chat'
import type { ChatMessage } from '@/types/study'

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
      {!isUser && (
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(139,92,246,0.3)', border: '1px solid rgba(139,92,246,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', marginRight: '8px', flexShrink: 0, marginTop: '2px' }}>
          🤖
        </div>
      )}
      <div
        style={{
          maxWidth: '75%',
          padding: '12px 16px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isUser ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isUser ? 'rgba(56,189,248,0.3)' : 'rgba(155,191,202,0.15)'}`,
          color: '#ECFBFF',
          fontSize: '14px',
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
        }}
      >
        {/* Render basic markdown bold */}
        {msg.content.split('**').map((part, i) =>
          i % 2 === 1 ? <strong key={i} style={{ color: '#7EF9FF' }}>{part}</strong> : part,
        )}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { chatMessages, addChatMessage, clearChat, addToReview } = useLearningStore()
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isTyping])

  function handleSend(text?: string) {
    const message = (text ?? input).trim()
    if (!message) return
    setInput('')

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: message, timestamp: Date.now() }
    addChatMessage(userMsg)

    setIsTyping(true)
    setTimeout(() => {
      const responseText = getMockAiResponse(message)
      const aiMsg: ChatMessage = { id: `a-${Date.now()}`, role: 'assistant', content: responseText, timestamp: Date.now() }
      addChatMessage(aiMsg)
      setIsTyping(false)

      // Auto-add words mentioned in user message
      const wordMatch = message.match(/\b(ubiquitous|ephemeral|resilient|meticulous|eloquent|pragmatic)\b/i)
      if (wordMatch) addToReview(wordMatch[0].toLowerCase(), wordMatch[0].toLowerCase())
    }, 800 + Math.random() * 600)
  }

  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', display: 'flex', flexDirection: 'column', paddingTop: '72px' }}>
        {/* Header */}
        <div style={{ padding: '16px 24px 0', borderBottom: '1px solid rgba(155,191,202,0.1)', background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(8px)' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#ECFBFF' }}>
                AI Navigator <span style={{ fontSize: '14px', color: '#9BBFCA' }}>AI 导学核心</span>
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(155,191,202,0.5)', fontFamily: 'ui-monospace, monospace' }}>
                MOCK AI — Real AI integration in Phase 3
              </p>
            </div>
            {chatMessages.length > 0 && (
              <button onClick={clearChat} style={{ background: 'none', border: '1px solid rgba(155,191,202,0.2)', borderRadius: '6px', padding: '6px 12px', color: '#9BBFCA', fontSize: '12px', cursor: 'pointer' }}>
                Clear / 清空
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: '800px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          {chatMessages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🌊</div>
              <p style={{ color: '#9BBFCA', marginBottom: '24px', fontSize: '15px' }}>
                Ask me about any English word, grammar rule, or exam strategy.
                <br />
                <span style={{ color: 'rgba(155,191,202,0.6)', fontSize: '13px' }}>
                  提问任何英语单词、语法规则或考试策略。
                </span>
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {suggestedPrompts.map(p => (
                  <button
                    key={p.label}
                    onClick={() => handleSend(p.prompt)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '20px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(155,191,202,0.2)',
                      color: '#9BBFCA',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {p.label} / {p.labelZh}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chatMessages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}

          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(139,92,246,0.3)', border: '1px solid rgba(139,92,246,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🤖</div>
              <div style={{ padding: '10px 16px', borderRadius: '16px 16px 16px 4px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(155,191,202,0.15)', color: '#9BBFCA', fontSize: '13px' }}>
                Thinking... ···
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(155,191,202,0.1)', background: 'rgba(2,6,23,0.9)', backdropFilter: 'blur(8px)' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '10px' }}>
            {chatMessages.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '-8px' }}>
                {suggestedPrompts.slice(0, 3).map(p => (
                  <button key={p.label} onClick={() => handleSend(p.prompt)}
                    style={{ whiteSpace: 'nowrap', padding: '4px 10px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(155,191,202,0.15)', color: 'rgba(155,191,202,0.6)', fontSize: '11px', cursor: 'pointer' }}>
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={{ maxWidth: '800px', margin: '8px auto 0', display: 'flex', gap: '10px' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask about a word, grammar, or exam... / 提问单词、语法或考试..."
              style={{ flex: 1, padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(155,191,202,0.2)', borderRadius: '10px', color: '#ECFBFF', fontSize: '14px', outline: 'none' }}
              onFocus={e => (e.target.style.borderColor = 'rgba(56,189,248,0.5)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(155,191,202,0.2)')}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              style={{ padding: '12px 20px', borderRadius: '10px', background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.4)', color: '#38BDF8', fontSize: '14px', cursor: input.trim() ? 'pointer' : 'not-allowed', opacity: input.trim() ? 1 : 0.5, fontWeight: 600 }}
            >
              Send →
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
