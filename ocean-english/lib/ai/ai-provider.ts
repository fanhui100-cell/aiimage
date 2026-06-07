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
  explainWord(request: WordExplanationRequest): Promise<AIResponse>
  generateQuiz(request: QuizGenerationRequest): Promise<AIResponse>
  analyzeMistakes(request: MistakeAnalysisRequest): Promise<AIResponse>
  generateStudyPlan(request: StudyPlanRequest): Promise<AIResponse>
}
