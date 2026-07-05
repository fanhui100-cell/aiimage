/** Phase 7D — AI Navigator context types */

export type AINavigatorContextType =
  | 'word'
  | 'lexigraph_word'
  | 'wrong_answer'
  | 'study_goal'
  | 'free_chat'

// Context types deferred to a later phase:
// | 'scan_document' | 'scan_question' | 'quiz_result'

export interface AINavigatorWordContext {
  type: 'word' | 'lexigraph_word'
  word: string
  fromPage: 'word_detail' | 'lexigraph'
}

export interface AINavigatorWrongAnswerContext {
  type: 'wrong_answer'
  id: string
  word: string
  question: string
  userAnswer: string
  correctAnswer: string
  explanation?: string
}

export interface AINavigatorStudyGoalContext {
  type: 'study_goal'
  totalXp: number
  currentStreak: number
  savedWordCount: number
  dueWordCount: number
}

export interface AINavigatorFreeChatContext {
  type: 'free_chat'
}

export type AINavigatorContext =
  | AINavigatorWordContext
  | AINavigatorWrongAnswerContext
  | AINavigatorStudyGoalContext
  | AINavigatorFreeChatContext

export interface PromptShortcut {
  id: string
  label: string
  labelZh: string
  /** Context types for which this shortcut is enabled. Empty = always enabled. */
  enabledFor: AINavigatorContextType[]
  /** If true, fills the input box but does not auto-send. */
  fillOnly?: boolean
  disabled?: boolean
  disabledReason?: string
}
