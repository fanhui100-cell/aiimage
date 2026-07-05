// TODO Phase 3B: Implement OpenAI provider.
// Reference: https://platform.openai.com/docs/api-reference/chat
// Install: npm install openai

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

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai' as const

  private readonly apiKey: string
  private readonly model: string

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY ?? ''
    this.model = AI_CONFIG.model || 'gpt-4o-mini'

    if (!this.apiKey) {
      console.warn('[Lexiverse] OPENAI_API_KEY is not set. OpenAI provider will not function.')
    }
  }

  private notImplemented(methodName: string): never {
    throw new Error(
      `OpenAI provider method "${methodName}" is not yet implemented. Set AI_PROVIDER=mock to use mock responses.`,
    )
  }

  async chat(messages: AIMessage[], context: AIRequestContext): Promise<AIResponse> {
    try {
      const builtMessages = buildChatTutorMessages(messages, context)
      // TODO Phase 3B: Call OpenAI Chat Completions API
      // const openai = new OpenAI({ apiKey: this.apiKey })
      // const completion = await openai.chat.completions.create({
      //   model: this.model,
      //   messages: builtMessages,
      //   max_tokens: context.maxTokens ?? AI_CONFIG.maxOutputTokens,
      // })
      // return { content: completion.choices[0].message.content ?? '', provider: 'openai', cached: false }
      void builtMessages
      this.notImplemented('chat')
    } catch (err) {
      throw normalizeProviderError(err, 'openai')
    }
  }

  async complete(messages: AIMessage[]): Promise<AIResponse> {
    try {
      void messages
      this.notImplemented('complete')
    } catch (err) {
      throw normalizeProviderError(err, 'openai')
    }
  }

  async explainWord(request: WordExplanationRequest): Promise<AIResponse> {
    try {
      const messages = buildWordExplanationMessages(request)
      // TODO Phase 3B: implement
      void messages
      this.notImplemented('explainWord')
    } catch (err) {
      throw normalizeProviderError(err, 'openai')
    }
  }

  async generateQuiz(request: QuizGenerationRequest): Promise<AIResponse> {
    try {
      const messages = buildQuizGenerationMessages(request)
      // TODO Phase 3B: implement
      void messages
      this.notImplemented('generateQuiz')
    } catch (err) {
      throw normalizeProviderError(err, 'openai')
    }
  }

  async analyzeMistakes(request: MistakeAnalysisRequest): Promise<AIResponse> {
    try {
      const messages = buildMistakeAnalysisMessages(request)
      // TODO Phase 3B: implement
      void messages
      this.notImplemented('analyzeMistakes')
    } catch (err) {
      throw normalizeProviderError(err, 'openai')
    }
  }

  async generateStudyPlan(request: StudyPlanRequest): Promise<AIResponse> {
    try {
      const messages = buildStudyPlanMessages(request)
      // TODO Phase 3B: implement
      void messages
      this.notImplemented('generateStudyPlan')
    } catch (err) {
      throw normalizeProviderError(err, 'openai')
    }
  }
}
