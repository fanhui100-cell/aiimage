/**
 * Chat cloud sync utilities — fire-and-forget, never throw.
 * Only called when user is logged in and a chat session exists.
 * System-role messages are never sent (filtered at API level too).
 */

import type { ChatMessage } from '@/types/study'

export async function createChatSession(): Promise<string | null> {
  try {
    const res = await fetch('/api/chat/sessions', { method: 'POST' })
    if (!res.ok) return null
    const data = await res.json()
    return data.ok ? data.sessionId : null
  } catch {
    return null
  }
}

export function syncChatMessages(sessionId: string, messages: ChatMessage[]): void {
  // Only sync user and assistant messages — system role never sent
  const filtered = messages.filter(m => m.role === 'user' || m.role === 'assistant')
  if (filtered.length === 0) return

  void fetch('/api/chat/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      messages: filtered.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        wordRef: m.wordRef,
        timestamp: m.timestamp,
      })),
    }),
  }).catch(err => console.warn('[chat-sync] network error:', err))
}
