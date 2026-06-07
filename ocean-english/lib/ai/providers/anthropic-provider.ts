// TODO Phase 3B: Implement Anthropic Claude provider.
// Reference: https://docs.anthropic.com/en/api/messages
// Install: npm install @anthropic-ai/sdk

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

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic' as const

  private readonly apiKey: string
  private readonly model: string

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY ?? ''
    this.model = AI_CONFIG.model || 'claude-haiku-4-5-20251001'

    if (!this.apiKey) {
      console.warn('[LexiOcean] ANTHROPIC_API_KEY is not set. Anthropic provider will not function.')
    }
  }

  private notImplemented(methodName: string): never {
    throw new Error(
      `Anthropic provider method "${methodName}" is not yet implemented. Set AI_PROVIDER=mock to use mock responses.`,
    )
  }

  async chat(messages: AIMessage[], context: AIRequestContext): Promise<AIResponse> {
    try {
      const builtMessages = buildChatTutorMessages(messages, context)
      // TODO Phase 3B: Call Anthropic Messages API
      // const anthropic = new Anthropic({ apiKey: this.apiKey })
      // const systemMsg = builtMessages.find(m => m.role === 'system')?.content ?? ''
      // const userMessages = builtMessages.filter(m => m.role !== 'system')
      // const response = await anthropic.messages.create({
      //   model: this.model,
      //   max_tokens: context.maxTokens ?? AI_CONFIG.maxOutputTokens,
      //   system: systemMsg,
      //   messages: userMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      // })
      // const content = response.content[0].type === 'text' ? response.content[0].text : ''
      // return { content, provider: 'anthropic', cached: false }
      void builtMessages
      this.notImplemented('chat')
    } catch (err) {
      throw normalizeProviderError(err, 'anthropic')
    }
  }

  async explainWord(request: WordExplanationRequest): Promise<AIResponse> {
    try {
      const messages = buildWordExplanationMessages(request)
      // TODO Phase 3B: implement
      void messages
      this.notImplemented('explainWord')
    } catch (err) {
      throw normalizeProviderError(err, 'anthropic')
    }
  }

  async generateQuiz(request: QuizGenerationRequest): Promise<AIResponse> {
    try {
      const messages = buildQuizGenerationMessages(request)
      // TODO Phase 3B: implement
      void messages
      this.notImplemented('generateQuiz')
    } catch (err) {
      throw normalizeProviderError(err, 'anthropic')
    }
  }

  async analyzeMistakes(request: MistakeAnalysisRequest): Promise<AIResponse> {
    try {
      const messages = buildMistakeAnalysisMessages(request)
      // TODO Phase 3B: implement
      void messages
      this.notImplemented('analyzeMistakes')
    } catch (err) {
      throw normalizeProviderError(err, 'anthropic')
    }
  }

  async generateStudyPlan(request: StudyPlanRequest): Promise<AIResponse> {
    try {
      const messages = buildStudyPlanMessages(request)
      // TODO Phase 3B: implement
      void messages
      this.notImplemented('generateStudyPlan')
    } catch (err) {
      throw normalizeProviderError(err, 'anthropic')
    }
  }
}
