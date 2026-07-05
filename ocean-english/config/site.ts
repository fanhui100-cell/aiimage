import type { LevelOption } from '@/types/learning'
import { PRIMARY_NAV, TOOL_NAV } from '@/lib/product-flow/nav'

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
  // B1：两套导航均派生自 lib/product-flow/nav.ts 唯一词表
  navigation: PRIMARY_NAV.map(i => ({ label: i.en, labelZh: i.zh, href: i.href })),
  navigationMore: TOOL_NAV.map(i => ({ label: i.en, labelZh: i.zh, href: i.href, group: 'learning' as const })),
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
