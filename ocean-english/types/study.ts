export interface DailyTask {
  id: string
  type: 'vocabulary' | 'review' | 'quiz' | 'reading' | 'listening'
  title: string
  titleZh: string
  description: string
  descriptionZh: string
  targetCount: number
  completedCount: number
  xp: number
}

export interface StudyProgress {
  totalWordsLearned: number
  currentStreak: number
  longestStreak: number
  totalXp: number
  lastStudyDate: string
  levelProgress: Record<string, number>
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  wordRef?: string
}

export interface ScanResult {
  extractedText: string
  vocabulary: { word: string; definition: string; definitionZh: string }[]
  questions: { text: string; suggestedAnswer: string; suggestedAnswerZh: string }[]
}
