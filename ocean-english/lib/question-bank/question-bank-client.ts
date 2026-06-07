import { ORIGINAL_VOCAB_DRILL_LITE } from '@/data/question-bank/original-vocab-drill-lite'
import type {
  QuestionBankItem,
  QuestionBankQuestionType,
  QuestionSkillTag,
  QuestionSourceType,
} from '@/types/question-bank'

export interface QuestionBankQuery {
  questionType?: QuestionBankQuestionType
  questionTypes?: QuestionBankQuestionType[]
  wordId?: string
  normalizedWord?: string
  difficultyLevel?: QuestionBankItem['difficultyLevel']
  examTag?: string
  themeTag?: string
  sourceType?: QuestionSourceType
  skillTag?: QuestionSkillTag
  limit?: number
}

export function getQuestionBankItems(query: QuestionBankQuery = {}): QuestionBankItem[] {
  const limit = Math.max(1, Math.min(query.limit ?? 50, 100))

  return ORIGINAL_VOCAB_DRILL_LITE.filter((item) => {
    if (query.questionType && item.type !== query.questionType) return false
    if (query.questionTypes && !query.questionTypes.includes(item.type)) return false
    if (query.wordId && item.wordId !== query.wordId) return false
    if (query.normalizedWord && item.normalizedWord !== query.normalizedWord) return false
    if (query.difficultyLevel && item.difficultyLevel !== query.difficultyLevel) return false
    if (query.examTag && !item.examTags.includes(query.examTag)) return false
    if (query.themeTag && !item.themeTags.includes(query.themeTag)) return false
    if (query.sourceType && item.sourceType !== query.sourceType) return false
    if (query.skillTag && !item.skillTags.includes(query.skillTag)) return false
    return true
  }).slice(0, limit)
}

export function getQuestionsForWord(wordId: string, limit = 10): QuestionBankItem[] {
  return getQuestionBankItems({ wordId, limit })
}

export function getVocabularyDrillQuestions(limit = 20): QuestionBankItem[] {
  return getQuestionBankItems({ skillTag: 'vocabulary_drill', limit })
}
