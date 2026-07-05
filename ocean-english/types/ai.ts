import type { LearningLevel } from './learning'

export type AIProviderName = 'mock' | 'openai' | 'anthropic' | 'gemini' | 'deepseek'

// Mirrors LearningLevel for consistent vocabulary across the app
export type AIUserLevel = LearningLevel

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIRequestContext {
  userLevel?: AIUserLevel
  language?: 'en' | 'zh' | 'bilingual'
  maxTokens?: number
  sessionId?: string
}

export interface AIResponse {
  content: string
  provider: AIProviderName
  cached: boolean
  usage?: {
    promptTokens?: number
    completionTokens?: number
  }
}

export interface AIError {
  code: 'provider_error' | 'rate_limit' | 'invalid_input' | 'timeout' | 'unknown'
  message: string
  provider?: AIProviderName
  retryable: boolean
}

export interface WordExplanationRequest {
  word: string
  userLevel?: AIUserLevel
  context?: string
}

export interface QuizGenerationRequest {
  words: string[]
  userLevel?: AIUserLevel
  questionCount?: number
  questionType?: 'multiple_choice' | 'fill_blank' | 'definition_match'
}

export interface MistakeAnalysisRequest {
  wrongAnswers: Array<{
    word: string
    question: string
    userAnswer: string
    correctAnswer: string
  }>
  userLevel?: AIUserLevel
}

export interface StudyPlanRequest {
  userLevel?: AIUserLevel
  savedWordCount: number
  dailyGoal?: number
  weakAreas?: string[]
}
