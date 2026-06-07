import { AI_CONFIG } from './ai-config'
import { MockProvider } from './providers/mock-provider'
import { OpenAIProvider } from './providers/openai-provider'
import { AnthropicProvider } from './providers/anthropic-provider'
import { GeminiProvider } from './providers/gemini-provider'
import type { AIProvider } from './ai-provider'

export function createAIClient(): AIProvider {
  switch (AI_CONFIG.provider) {
    case 'openai':
      return new OpenAIProvider()
    case 'anthropic':
      return new AnthropicProvider()
    case 'gemini':
      return new GeminiProvider()
    default:
      return new MockProvider()
  }
}
