/**
 * Centralized product route constants for LexiOcean.
 * Use these instead of scattered hardcoded strings.
 */

export const routes = {
  home: '/',
  lexigraph: '/lexigraph',
  dictionary: '/dictionary',
  word: (slug: string) => `/word/${slug}`,
  review: '/memory',
  scan: '/scan',
  scanHistory: (id: string) => `/scan/history/${id}`,
  chat: '/chat',
  quiz: '/quiz',
  quizWord: (wordId: string) => `/quiz?word=${wordId}`,
  study: '/study',
  exam: '/exam',
  pronunciation: '/pronunciation',
  reading: '/reading',
  wrongAnswers: '/wrong-answers',
  universe: '/universe',
  profile: '/profile',
  onboarding: '/onboarding',
} as const
