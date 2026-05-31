export type QuizType = 'multiple-choice' | 'fill-blank'

export interface QuizOption {
  id: string
  text: string
}

export interface QuizQuestion {
  id: string
  type: QuizType
  wordId: string
  word: string
  question: string
  options?: QuizOption[]
  correctAnswer: string
  explanation: string
  explanationZh: string
}

export interface QuizAttempt {
  questionId: string
  wordId: string
  word: string
  userAnswer: string
  correct: boolean
  timestamp: number
}

export interface QuizSession {
  id: string
  startedAt: number
  completedAt?: number
  attempts: QuizAttempt[]
  score: number
  total: number
}
