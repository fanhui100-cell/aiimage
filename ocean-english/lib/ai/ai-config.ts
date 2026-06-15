import type { AIProviderName } from '@/types/ai'

const VALID_PROVIDERS: readonly AIProviderName[] = ['mock', 'openai', 'anthropic', 'gemini', 'deepseek']
type AIProviderEnv = Record<string, string | undefined>

export function resolveAIProviderName(env: AIProviderEnv): AIProviderName {
  const raw = env.AI_PROVIDER
  // DeepSeek 已实装且与 OpenAI 兼容：显式选 deepseek，或未指定 provider 但配了 DEEPSEEK_API_KEY，
  // 即自动启用（无需 AI_ENABLE_REAL_PROVIDERS）——让 6 个 AI 路由开箱即真。
  if (raw === 'deepseek' || (!raw && env.DEEPSEEK_API_KEY)) return 'deepseek'
  if (raw && (VALID_PROVIDERS as readonly string[]).includes(raw)) {
    if (raw !== 'mock' && env.AI_ENABLE_REAL_PROVIDERS !== 'true') return 'mock'
    return raw as AIProviderName
  }
  return 'mock'
}

export const AI_CONFIG = {
  provider: resolveAIProviderName(process.env),
  maxPromptLength: 4000,
  maxOutputTokens: parseInt(process.env.AI_MAX_OUTPUT_TOKENS ?? '1024', 10),
  enableCache: process.env.AI_ENABLE_CACHE === 'true',
  model: process.env.AI_MODEL ?? '',
} as const
