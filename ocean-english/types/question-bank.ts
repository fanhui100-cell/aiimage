export type QuestionSourceType =
  | 'original_curated'
  | 'ai_generated_practice'
  | 'scan_private_practice'
  | 'exam_tagged_practice'

export type QuestionBankQuestionType =
  | 'definition_to_word'
  | 'zh_definition_to_word'
  | 'en_to_zh'
  | 'zh_to_en'
  | 'synonym_choice'
  | 'antonym_choice'
  | 'collocation_choice'

export type QuestionSkillTag =
  | 'definition'
  | 'translation'
  | 'synonym'
  | 'antonym'
  | 'collocation'
  | 'usage'
  | 'vocabulary_drill'

export interface QuestionChoice {
  id: 'a' | 'b' | 'c' | 'd'
  text: string
}

export interface QuestionBankItem {
  id: string
  type: QuestionBankQuestionType
  sourceType: QuestionSourceType
  sourceNote: string
  wordId: string
  normalizedWord: string
  difficultyLevel: 1 | 2 | 3 | 4 | 5
  prompt: string
  promptZh?: string
  choices: QuestionChoice[]
  answer: QuestionChoice['id']
  explanation: string
  explanationZh?: string
  skillTags: QuestionSkillTag[]
  examTags: string[]
  themeTags: string[]
  createdAt: string
}
