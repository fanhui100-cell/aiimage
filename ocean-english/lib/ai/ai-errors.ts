import type { AIError, AIProviderName } from '@/types/ai'

export function makeAIError(
  code: AIError['code'],
  message: string,
  retryable = false,
): AIError {
  return { code, message, retryable }
}

/**
 * Logs full error details server-side, returns a safe client-facing AIError.
 * Never exposes raw err.message, stack traces, or provider configuration details.
 */
export function normalizeProviderError(err: unknown, provider: AIProviderName): AIError {
  // Log full details server-side only
  console.error(`[Lexiverse AI][${provider}]`, err instanceof Error ? err.message : err)

  if (err instanceof Error) {
    if (err.message.includes('rate limit') || err.message.includes('429')) {
      return makeAIError('rate_limit', 'Too many requests. Please wait a moment and try again.', true)
    }
    if (err.message.includes('timeout') || err.message.includes('ETIMEDOUT')) {
      return makeAIError('timeout', 'The AI service took too long to respond. Please try again.', true)
    }
    if (err.message.includes('401') || err.message.includes('invalid_api_key')) {
      // Don't reveal "invalid API key" detail to client
      return makeAIError('provider_error', 'AI service configuration error. Please contact support.', false)
    }
    if (err.message.includes('not yet implemented')) {
      return makeAIError('provider_error', 'This AI provider is not available yet. Using mock mode.', false)
    }
  }

  // Generic safe fallback — no internal details
  return makeAIError('provider_error', 'AI service encountered an error. Please try again.', false)
}

/** Returns only the fields safe to send to the client. */
export function safeErrorPayload(err: AIError): Pick<AIError, 'code' | 'message' | 'retryable'> {
  return { code: err.code, message: err.message, retryable: err.retryable }
}
