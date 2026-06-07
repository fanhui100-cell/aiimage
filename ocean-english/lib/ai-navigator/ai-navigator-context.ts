'use client'

/**
 * Phase 7D — Resolve AINavigatorContext from URL search params + store data.
 * All lookups are client-side only (Zustand stores).
 */

import type { ReadonlyURLSearchParams } from 'next/navigation'
import type { AINavigatorContext } from './ai-navigator-types'
import type { WrongAnswer } from '@/store/learningStore'
import type { StudyProgress } from '@/types/study'
import type { ReviewWord } from '@/store/learningStore'

export interface ContextResolverInput {
  params: ReadonlyURLSearchParams | null
  wrongAnswers: WrongAnswer[]
  studyProgress: StudyProgress
  savedWords: string[]
  reviewWords: ReviewWord[]
}

/** Parse URL params and resolve context. Always returns a valid context (falls back to free_chat). */
export function resolveNavigatorContext(input: ContextResolverInput): AINavigatorContext {
  const { params, wrongAnswers, studyProgress, savedWords, reviewWords } = input

  if (!params) return { type: 'free_chat' }

  const contextType = params.get('context')

  if (contextType === 'word' || contextType === 'lexigraph_word') {
    const rawWord = params.get('word') ?? ''
    const word = decodeURIComponent(rawWord).slice(0, 100).trim()
    if (!word) return { type: 'free_chat' }
    return {
      type: contextType,
      word,
      fromPage: contextType === 'word' ? 'word_detail' : 'lexigraph',
    }
  }

  if (contextType === 'wrong_answer') {
    const rawId = params.get('id') ?? ''
    const id = decodeURIComponent(rawId).slice(0, 50).trim()
    if (!id) return { type: 'free_chat' }
    const wa = wrongAnswers.find(w => w.id === id)
    if (!wa) return { type: 'free_chat' }
    return {
      type: 'wrong_answer',
      id: wa.id,
      word: wa.word,
      question: wa.question.slice(0, 300),
      userAnswer: wa.userAnswer.slice(0, 150),
      correctAnswer: wa.correctAnswer.slice(0, 150),
      explanation: wa.explanation?.slice(0, 200),
    }
  }

  if (contextType === 'study_goal') {
    const dueNow = reviewWords.filter(r => r.nextReviewAt <= Date.now()).length
    return {
      type: 'study_goal',
      totalXp: studyProgress.totalXp,
      currentStreak: studyProgress.currentStreak,
      savedWordCount: savedWords.length,
      dueWordCount: dueNow,
    }
  }

  return { type: 'free_chat' }
}

/** Short human-readable description of context for the header badge. */
export function contextBadgeLabel(ctx: AINavigatorContext): string | null {
  switch (ctx.type) {
    case 'word':
      return `Word: ${ctx.word} · from Word Detail`
    case 'lexigraph_word':
      return `Word: ${ctx.word} · from LexiGraph`
    case 'wrong_answer':
      return `Wrong answer: ${ctx.word}`
    case 'study_goal':
      return `Study Goal · streak ${ctx.currentStreak}d`
    case 'free_chat':
    default:
      return null
  }
}
