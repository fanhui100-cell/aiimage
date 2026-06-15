import { AI_CONFIG } from './ai-config'
import { MockProvider } from './providers/mock-provider'
import { OpenAIProvider } from './providers/openai-provider'
import { AnthropicProvider } from './providers/anthropic-provider'
import { GeminiProvider } from './providers/gemini-provider'
import { DeepseekProvider } from './providers/deepseek-provider'
import type { AIProvider } from './ai-provider'
import type { AIProviderName } from '@/types/ai'

// 已真正实装的真实 provider 名单。deepseek 已接 DeepSeek API；openai/anthropic/gemini
// 当前方法仍 notImplemented，即便被 env 选中也回退 mock —— 避免生产误开后 AI 接口直接 500。
const IMPLEMENTED_PROVIDERS = new Set<AIProviderName>(['deepseek'])

export function createAIClient(providerName: AIProviderName = AI_CONFIG.provider): AIProvider {
  if (providerName !== 'mock' && !IMPLEMENTED_PROVIDERS.has(providerName)) {
    console.warn(`[ai] provider "${providerName}" 尚未实装，已回退到 mock（实装后加入 IMPLEMENTED_PROVIDERS）`)
    return new MockProvider()
  }
  switch (providerName) {
    case 'deepseek':
      return new DeepseekProvider()
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
