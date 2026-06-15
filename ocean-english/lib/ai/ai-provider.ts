import type {
  AIMessage,
  AIRequestContext,
  AIResponse,
  AIProviderName,
  WordExplanationRequest,
  QuizGenerationRequest,
  MistakeAnalysisRequest,
  StudyPlanRequest,
} from '@/types/ai'

export interface AIProvider {
  readonly name: AIProviderName
  chat(messages: AIMessage[], context: AIRequestContext): Promise<AIResponse>
  /** 原样发送 messages（不注入 chat-tutor 系统提示），供文档分析等自带完整 prompt 的场景使用 */
  complete(messages: AIMessage[], context?: AIRequestContext): Promise<AIResponse>
  explainWord(request: WordExplanationRequest): Promise<AIResponse>
  generateQuiz(request: QuizGenerationRequest): Promise<AIResponse>
  analyzeMistakes(request: MistakeAnalysisRequest): Promise<AIResponse>
  generateStudyPlan(request: StudyPlanRequest): Promise<AIResponse>
}
