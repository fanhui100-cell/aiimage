import { getRandomQuiz, getQuizForWord } from '@/data/mock-quiz'
import { getQuestionBankItems, type QuestionBankQuery } from '@/lib/question-bank/question-bank-client'
import { questionBankItemToQuizQuestion } from '@/lib/quiz/quiz-question-adapter'
import type { QuestionBankItem } from '@/types/question-bank'
import type { QuizQuestion } from '@/types/quiz'

export interface VocabularyDrillSessionOptions extends QuestionBankQuery {
  count?: number
  fallbackToMock?: boolean
}

function dedupeQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  const seen = new Set<string>()
  return questions.filter((question) => {
    if (seen.has(question.id)) return false
    seen.add(question.id)
    return true
  })
}

function toQuizQuestions(items: QuestionBankItem[]): QuizQuestion[] {
  return items.map(questionBankItemToQuizQuestion)
}

export function buildVocabularyDrillSession(options: VocabularyDrillSessionOptions = {}): QuizQuestion[] {
  const count = Math.max(1, Math.min(options.count ?? 5, 10))
  const fallbackToMock = options.fallbackToMock ?? true
  const baseQuery: QuestionBankQuery = {
    ...options,
    skillTag: options.skillTag ?? 'vocabulary_drill',
    sourceType: options.sourceType ?? 'original_curated',
    limit: count,
  }

  const primary = getQuestionBankItems(baseQuery)
  let questions = toQuizQuestions(primary)

  if (questions.length < count && (options.wordId || options.normalizedWord)) {
    const broader = getQuestionBankItems({
      ...baseQuery,
      wordId: undefined,
      normalizedWord: undefined,
      limit: count - questions.length,
    })
    questions = dedupeQuestions([...questions, ...toQuizQuestions(broader)])
  }

  if (questions.length < count && options.difficultyLevel) {
    const broader = getQuestionBankItems({
      ...baseQuery,
      wordId: undefined,
      normalizedWord: undefined,
      difficultyLevel: undefined,
      limit: count - questions.length,
    })
    questions = dedupeQuestions([...questions, ...toQuizQuestions(broader)])
  }

  if (questions.length < count && fallbackToMock) {
    const mockQuestions =
      options.wordId || options.normalizedWord
        ? [...getQuizForWord(options.wordId ?? options.normalizedWord ?? ''), ...getRandomQuiz(count)]
        : getRandomQuiz(count)
    questions = dedupeQuestions([...questions, ...mockQuestions]).slice(0, count)
  }

  return questions.slice(0, count)
}
