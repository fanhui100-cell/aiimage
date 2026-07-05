export type PracticeAnswerMode = 'choice' | 'spell' | 'free_text' | 'multi_blank' | 'matching' | 'build_sentence'

export interface PracticeAnswerModeInput {
  type: string
  inputMode?: string | null
  answerText?: string | null
  choices?: { id: string; text: string }[] | null
}

export function resolvePracticeAnswerMode(item: PracticeAnswerModeInput): PracticeAnswerMode {
  if (item.type === 'build_a_sentence') return 'build_sentence'

  const m = item.inputMode ?? 'choice'
  if (m === 'speak') return 'free_text'
  if (m === 'multi_blank' || m === 'matching' || m === 'free_text' || m === 'build_sentence') return m
  if (m === 'spell') return 'spell'

  const hasChoices = !!(item.choices && item.choices.length >= 2)
  if (m === 'listen') return hasChoices ? 'choice' : 'spell'
  return hasChoices ? 'choice' : item.answerText ? 'spell' : 'choice'
}
