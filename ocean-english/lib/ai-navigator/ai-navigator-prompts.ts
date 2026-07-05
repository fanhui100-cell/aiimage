/** Phase 7D — AI Navigator prompt shortcuts */

import type { AINavigatorContext, PromptShortcut } from './ai-navigator-types'

export const PROMPT_SHORTCUTS: PromptShortcut[] = [
  {
    id: 'explain_word',
    label: 'Explain this word',
    labelZh: '解释这个单词',
    enabledFor: ['word', 'lexigraph_word', 'free_chat', 'study_goal', 'wrong_answer'],
  },
  {
    id: 'break_sentence',
    label: 'Break down a sentence',
    labelZh: '分析句子语法',
    enabledFor: ['word', 'lexigraph_word', 'free_chat', 'study_goal', 'wrong_answer'],
    fillOnly: true,
  },
  {
    id: 'explain_mistake',
    label: 'Explain my mistake',
    labelZh: '解析我的错题',
    enabledFor: ['wrong_answer'],
  },
  {
    id: 'generate_quiz',
    label: 'Generate a quiz',
    labelZh: '生成练习题',
    enabledFor: ['word', 'lexigraph_word', 'free_chat', 'study_goal', 'wrong_answer'],
  },
  {
    id: 'study_plan',
    label: 'Make a study plan',
    labelZh: '制定学习计划',
    enabledFor: ['word', 'lexigraph_word', 'free_chat', 'study_goal', 'wrong_answer'],
  },
  {
    id: 'summarize_doc',
    label: 'Summarize a document',
    labelZh: '总结这份文档',
    enabledFor: [],
    disabled: true,
    disabledReason: 'Coming soon — requires Scan context',
  },
]

/** Generate the user-facing prompt text for a shortcut given the current context. */
export function buildShortcutPrompt(
  shortcutId: string,
  context: AINavigatorContext,
): string | null {
  switch (shortcutId) {
    case 'explain_word': {
      const word =
        context.type === 'word' || context.type === 'lexigraph_word'
          ? context.word
          : context.type === 'wrong_answer'
            ? context.word
            : null
      if (word) {
        return `Please explain the word "${word}" for a Chinese English learner. Include the Chinese meaning, a simple English definition, example sentences, collocations, and a memory tip.`
      }
      return `Please explain a word for me. Which word would you like to start with?`
    }

    case 'break_sentence': {
      const word =
        context.type === 'word' || context.type === 'lexigraph_word' ? context.word : null
      const prefix = word ? `Using the word "${word}" — ` : ''
      return `${prefix}Please break down this sentence and explain its grammar and meaning: `
    }

    case 'explain_mistake': {
      if (context.type !== 'wrong_answer') return null
      const { word, question, userAnswer, correctAnswer } = context
      const parts = [
        `Please explain why my answer was wrong and how to avoid this mistake next time.`,
        `Word: ${word}`,
        `Question: ${question}`,
        `My answer: ${userAnswer}`,
        `Correct answer: ${correctAnswer}`,
      ]
      return parts.join('\n').slice(0, 400)
    }

    case 'generate_quiz': {
      const word =
        context.type === 'word' || context.type === 'lexigraph_word'
          ? context.word
          : context.type === 'wrong_answer'
            ? context.word
            : null
      if (word) {
        return `Please generate 3 vocabulary quiz questions for the word "${word}", suitable for a Chinese English learner.`
      }
      return `Please generate 5 vocabulary quiz questions at intermediate level, suitable for a Chinese English learner.`
    }

    case 'study_plan': {
      if (context.type === 'study_goal') {
        const { savedWordCount, dueWordCount, currentStreak } = context
        return `Please create a short 7-day study plan for me. I have ${savedWordCount} saved words, ${dueWordCount} words due for review, and a ${currentStreak}-day streak.`
      }
      return `Please create a short 7-day vocabulary study plan for an intermediate Chinese English learner.`
    }

    default:
      return null
  }
}
