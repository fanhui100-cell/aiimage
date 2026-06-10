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
  // B1-4：/universe 已删除，宇宙统一指 /lexiverse（与 NAVIGATE_MAP 对齐）
  universe: '/lexiverse',
  profile: '/profile',
  onboarding: '/onboarding',
} as const
