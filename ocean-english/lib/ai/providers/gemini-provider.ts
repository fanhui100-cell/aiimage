// TODO Phase 3B: Implement Google Gemini provider.
// Reference: https://ai.google.dev/gemini-api/docs
// Install: npm install @google/generative-ai

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

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini' as const

  private readonly apiKey: string
  private readonly model: string

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY ?? ''
    this.model = AI_CONFIG.model || 'gemini-1.5-flash'

    if (!this.apiKey) {
      console.warn('[LexiOcean] GEMINI_API_KEY is not set. Gemini provider will not function.')
    }
  }

  private notImplemented(methodName: string): never {
    throw new Error(
      `Gemini provider method "${methodName}" is not yet implemented. Set AI_PROVIDER=mock to use mock responses.`,
    )
  }

  async chat(messages: AIMessage[], context: AIRequestContext): Promise<AIResponse> {
    try {
      const builtMessages = buildChatTutorMessages(messages, context)
      // TODO Phase 3B: Call Gemini generateContent API
      // const genAI = new GoogleGenerativeAI(this.apiKey)
      // const model = genAI.getGenerativeModel({ model: this.model })
      // const chat = model.startChat({ history: [...] })
      // const result = await chat.sendMessage(lastUserMessage)
      // return { content: result.response.text(), provider: 'gemini', cached: false }
      void builtMessages
      this.notImplemented('chat')
    } catch (err) {
      throw normalizeProviderError(err, 'gemini')
    }
  }

  async explainWord(request: WordExplanationRequest): Promise<AIResponse> {
    try {
      const messages = buildWordExplanationMessages(request)
      // TODO Phase 3B: implement
      void messages
      this.notImplemented('explainWord')
    } catch (err) {
      throw normalizeProviderError(err, 'gemini')
    }
  }

  async generateQuiz(request: QuizGenerationRequest): Promise<AIResponse> {
    try {
      const messages = buildQuizGenerationMessages(request)
      // TODO Phase 3B: implement
      void messages
      this.notImplemented('generateQuiz')
    } catch (err) {
      throw normalizeProviderError(err, 'gemini')
    }
  }

  async analyzeMistakes(request: MistakeAnalysisRequest): Promise<AIResponse> {
    try {
      const messages = buildMistakeAnalysisMessages(request)
      // TODO Phase 3B: implement
      void messages
      this.notImplemented('analyzeMistakes')
    } catch (err) {
      throw normalizeProviderError(err, 'gemini')
    }
  }

  async generateStudyPlan(request: StudyPlanRequest): Promise<AIResponse> {
    try {
      const messages = buildStudyPlanMessages(request)
      // TODO Phase 3B: implement
      void messages
      this.notImplemented('generateStudyPlan')
    } catch (err) {
      throw normalizeProviderError(err, 'gemini')
    }
  }
}
