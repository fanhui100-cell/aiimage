import type { LevelOption } from '@/types/learning'

export const siteConfig = {
  projectName: 'Lexiverse',
  projectNameZh: '词渊',
  slogan: 'An ocean of words, lit from within.',
  sloganEn: 'An ocean of words, lit from within.',
  sloganZh: '万词成海，自有光。',
  description:
    'A vocabulary learning universe — 7-state SRS, star-map exploration, full-loop from learning to mastery.',
  descriptionZh:
    '词汇宇宙 · 7 状态记忆闭环，从学习到掌握一气呵成。',
  defaultTheme: 'ocean-dark',
  heroHint: 'Move your cursor to disturb the living particles.',
  heroHintZh: 'Move your cursor to disturb the living particles.',
  heroHint2: 'Click a glowing node to enter a learning module.',
  heroHint2Zh: 'Click a glowing node to enter a learning module.',
  ctaPrimary: '开始学习',
  ctaPrimaryZh: '开始学习',
  ctaSecondary: '选择等级',
  ctaSecondaryZh: '选择等级',
  navigation: [
    { label: 'Today',    labelZh: '今日', href: '/today' },
    { label: 'Words',    labelZh: '词',   href: '/dictionary' },
    { label: 'Review',   labelZh: '复习', href: '/memory' },
    { label: 'Practice', labelZh: '练习', href: '/quiz' },
    { label: 'Universe', labelZh: '宇宙', href: '/lexiverse' },
  ],
  navigationMore: [
    { label: 'Scan', labelZh: 'Scan', href: '/scan', group: 'learning' as const },
    { label: 'Reading', labelZh: 'Reading', href: '/reading', group: 'learning' as const },
    { label: 'Listening', labelZh: 'Listening', href: '/pronunciation', group: 'learning' as const },
    { label: 'Exam Drill', labelZh: 'Exam Drill', href: '/exam', group: 'learning' as const },
    { label: 'Vocab Browser', labelZh: 'Vocab Browser', href: '/lexiverse/vocab', group: 'lexiverse' as const },
    { label: 'Lexiverse Quiz', labelZh: 'Lexiverse Quiz', href: '/lexiverse/quiz', group: 'lexiverse' as const },
  ],
} as const

export const levelOptions: LevelOption[] = [
  {
    id: 'beginner',
    name: 'Beginner',
    nameZh: 'Beginner',
    description: 'Start from scratch with the alphabet, basic greetings, and everyday words.',
    descriptionZh: 'Start from scratch with the alphabet, basic greetings, and everyday words.',
  },
  {
    id: 'elementary',
    name: 'Elementary',
    nameZh: 'Elementary',
    description: 'Build foundational vocabulary and simple sentence structures.',
    descriptionZh: 'Build foundational vocabulary and simple sentence structures.',
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    nameZh: 'Intermediate',
    description: 'Expand vocabulary, improve reading fluency, and build listening confidence.',
    descriptionZh: 'Expand vocabulary, improve reading fluency, and build listening confidence.',
  },
  {
    id: 'advanced',
    name: 'Advanced',
    nameZh: 'Advanced',
    description: 'Master nuanced vocabulary, academic writing, and complex grammar.',
    descriptionZh: 'Master nuanced vocabulary, academic writing, and complex grammar.',
  },
  {
    id: 'exam-prep',
    name: 'Exam Prep',
    nameZh: 'Exam Prep',
    description: 'Focused training for TOEFL, IELTS, CET-4/6, postgraduate exams, or Gaokao.',
    descriptionZh: 'Focused training for TOEFL, IELTS, CET-4/6, postgraduate exams, or Gaokao.',
  },
  {
    id: 'free-explore',
    name: 'Free Explore',
    nameZh: 'Free Explore',
    description: 'No fixed path. Dive into any module that interests you.',
    descriptionZh: 'No fixed path. Dive into any module that interests you.',
  },
]
