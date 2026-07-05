export const DICTIONARY_THEME_TAGS = [
  'academic',
  'ai-learning',
  'business',
  'communication',
  'daily-life',
  'engineering',
  'exam',
  'learning',
  'project-management',
  'reading',
  'technology',
] as const

export const DICTIONARY_DOMAIN_TAGS = [
  'ai-tech',
  'business',
  'communication',
  'document-learning',
  'education',
  'engineering',
  'exam-prep',
  'general',
  'project',
  'technology',
] as const

export const DICTIONARY_EXAM_TAGS = [
  'TOEFL',
  'IELTS',
  'CET-4',
  'CET-6',
  'KAOYAN',
  'GAOKAO',
  'SAT',
  'GRE',
  'custom',
] as const

export type DictionaryThemeTag = typeof DICTIONARY_THEME_TAGS[number]
export type DictionaryDomainTag = typeof DICTIONARY_DOMAIN_TAGS[number]
export type DictionaryExamTag = typeof DICTIONARY_EXAM_TAGS[number]

export function isKebabTag(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
}
