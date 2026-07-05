// DeepSeek provider — 真实 LLM 实装（DeepSeek 与 OpenAI Chat Completions 兼容）。
// 复用各 prompt 构造器，统一走 https://api.deepseek.com/chat/completions。
// 未配置 DEEPSEEK_API_KEY 时抛 provider 错误（上游 normalizeProviderError 处理）。

import type { AIProvider } from '../ai-provider'
import type {
  AIMessage,
  AIRequestContext,
  AIResponse,
  WordExplanationRequest,
  QuizGenerationRequest,
  MistakeAnalysisRequest,
  StudyPlanRequest,
} from '@/types/ai'
import { buildChatTutorMessages } from '../prompts/chat-tutor'
import { buildWordExplanationMessages } from '../prompts/word-explanation'
import { buildQuizGenerationMessages } from '../prompts/quiz-generation'
import { buildMistakeAnalysisMessages } from '../prompts/mistake-analysis'
import { buildStudyPlanMessages } from '../prompts/study-plan'
import { normalizeProviderError } from '../ai-errors'
import { AI_CONFIG } from '../ai-config'

const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/chat/completions'

export class DeepseekProvider implements AIProvider {
  readonly name = 'deepseek' as const

  private readonly apiKey: string
  private readonly model: string

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY ?? ''
    this.model = AI_CONFIG.model || 'deepseek-chat'
    if (!this.apiKey) {
      console.warn('[Lexiverse] DEEPSEEK_API_KEY 未设置，DeepSeek provider 无法工作。')
    }
  }

  /** 统一调用：messages → DeepSeek chat/completions → AIResponse */
  private async send(messages: AIMessage[], maxTokens?: number): Promise<AIResponse> {
    if (!this.apiKey) throw new Error('DEEPSEEK_API_KEY missing')
    const res = await fetch(DEEPSEEK_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: maxTokens ?? AI_CONFIG.maxOutputTokens,
        temperature: 0.7,
      }),
    })
    if (!res.ok) {
      const status = res.status
      throw new Error(status === 429 ? 'rate_limit' : `deepseek_http_${status}`)
    }
    const j = await res.json() as {
      choices?: { message?: { content?: string } }[]
      usage?: { prompt_tokens?: number; completion_tokens?: number }
    }
    return {
      content: (j.choices?.[0]?.message?.content ?? '').trim(),
      provider: 'deepseek',
      cached: false,
      usage: { promptTokens: j.usage?.prompt_tokens, completionTokens: j.usage?.completion_tokens },
    }
  }

  /** 原样发送 messages（不注入 chat-tutor 系统提示）——文档分析等自带完整 prompt 的场景 */
  async complete(messages: AIMessage[], context?: AIRequestContext): Promise<AIResponse> {
    try { return await this.send(messages, context?.maxTokens) }
    catch (err) { throw normalizeProviderError(err, 'deepseek') }
  }

  async chat(messages: AIMessage[], context: AIRequestContext): Promise<AIResponse> {
    try { return await this.send(buildChatTutorMessages(messages, context), context.maxTokens) }
    catch (err) { throw normalizeProviderError(err, 'deepseek') }
  }

  async explainWord(request: WordExplanationRequest): Promise<AIResponse> {
    try { return await this.send(buildWordExplanationMessages(request)) }
    catch (err) { throw normalizeProviderError(err, 'deepseek') }
  }

  async generateQuiz(request: QuizGenerationRequest): Promise<AIResponse> {
    try { return await this.send(buildQuizGenerationMessages(request)) }
    catch (err) { throw normalizeProviderError(err, 'deepseek') }
  }

  async analyzeMistakes(request: MistakeAnalysisRequest): Promise<AIResponse> {
    try { return await this.send(buildMistakeAnalysisMessages(request)) }
    catch (err) { throw normalizeProviderError(err, 'deepseek') }
  }

  async generateStudyPlan(request: StudyPlanRequest): Promise<AIResponse> {
    try { return await this.send(buildStudyPlanMessages(request)) }
    catch (err) { throw normalizeProviderError(err, 'deepseek') }
  }
}
