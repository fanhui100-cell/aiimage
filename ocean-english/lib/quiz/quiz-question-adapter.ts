import type { QuestionBankItem } from '@/types/question-bank'
import type { QuizQuestion } from '@/types/quiz'

export function questionBankItemToQuizQuestion(item: QuestionBankItem): QuizQuestion {
  return {
    id: item.id,
    type: 'multiple-choice',
    wordId: item.wordId,
    word: item.normalizedWord,
    question: item.prompt,
    options: item.choices.map((choice) => ({
      id: choice.id,
      text: choice.text,
    })),
    correctAnswer: item.answer,
    explanation: item.explanation,
    explanationZh: item.explanationZh ?? item.sourceNote,
  }
}
