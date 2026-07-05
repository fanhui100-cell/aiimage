export interface ExamQuestion {
  id: string
  type: 'vocabulary' | 'reading' | 'listening' | 'grammar'
  exam: 'TOEFL' | 'IELTS' | 'CET-4' | 'CET-6' | 'KAOYAN' | 'GAOKAO'
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  explanationZh: string
}

export const mockExamQuestions: ExamQuestion[] = [
  {
    id: 'q001',
    type: 'vocabulary',
    exam: 'CET-6',
    question: "The scientist's _____ research led to a breakthrough in cancer treatment.",
    options: ['superficial', 'meticulous', 'arbitrary', 'reckless'],
    correctIndex: 1,
    explanation:
      '"Meticulous" means showing great attention to detail. A scientist\'s careful research leading to a breakthrough fits this context perfectly.',
    explanationZh:
      '"Meticulous"意为"一丝不苟的、精心的"，科学家精心的研究带来突破，符合语境。',
  },
  {
    id: 'q002',
    type: 'reading',
    exam: 'TOEFL',
    question: 'According to the passage, what is the primary reason for coral reef decline?',
    options: [
      'Overfishing by local communities',
      'Rising ocean temperatures due to climate change',
      'Increased tourism and diving activities',
      'Natural disease cycles in marine ecosystems',
    ],
    correctIndex: 1,
    explanation:
      'The passage states that rising ocean temperatures caused by climate change is the leading driver of coral bleaching and reef decline.',
    explanationZh:
      '文章指出，气候变化导致的海洋温度上升是珊瑚白化和珊瑚礁衰退的主要原因。',
  },
]
