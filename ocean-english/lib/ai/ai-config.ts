import type { AIProviderName } from '@/types/ai'

const VALID_PROVIDERS: readonly AIProviderName[] = ['mock', 'openai', 'anthropic', 'gemini']

function resolveProvider(): AIProviderName {
  const raw = process.env.AI_PROVIDER
  if (raw && (VALID_PROVIDERS as readonly string[]).includes(raw)) {
    return raw as AIProviderName
  }
  return 'mock'
}

export const AI_CONFIG = {
  provider: resolveProvider(),
  maxPromptLength: 4000,
  maxOutputTokens: parseInt(process.env.AI_MAX_OUTPUT_TOKENS ?? '1024', 10),
  enableCache: process.env.AI_ENABLE_CACHE === 'true',
  model: process.env.AI_MODEL ?? '',
} as const
