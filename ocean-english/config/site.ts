import type { LevelOption } from '@/types/learning'

export const siteConfig = {
  projectName: 'LexiOcean',
  projectNameZh: '深海英语学习系统',
  slogan: '万词成海,自有光',
  sloganEn: 'An ocean of words, lit from within.',
  sloganZh: '万词成海,自有光',
  description:
    'An AI-powered English learning system where vocabulary, pronunciation, reading, documents, exams, and memory grow together.',
  descriptionZh:
    '一个由 AI 驱动的英语学习系统，让词汇、发音、阅读、文档、考试与记忆一起生长。',
  defaultTheme: 'ocean-dark',
  heroHint: 'Move your cursor to disturb the living particles.',
  heroHintZh: '移动鼠标，扰动这棵动态知识树。',
  heroHint2: 'Click a glowing node to enter a learning module.',
  heroHint2Zh: '点击发光节点，进入对应学习模块。',
  ctaPrimary: 'Start Learning',
  ctaPrimaryZh: '开始学习',
  ctaSecondary: 'Choose Level',
  ctaSecondaryZh: '选择等级',
  /** Primary navigation — 新 IA §16:今日·学习·复习·练习·探索 */
  navigation: [
    { label: 'Today', labelZh: '今日', href: '/today' },
    { label: 'Learn', labelZh: '学习', href: '/dictionary' },
    { label: 'Review', labelZh: '复习', href: '/memory' },
    { label: 'Practice', labelZh: '练习', href: '/quiz' },
    { label: 'Explore', labelZh: '探索', href: '/explore' },
  ],
  /** Secondary items in the More dropdown */
  navigationMore: [
    { label: 'Scan', labelZh: '文档扫描', href: '/scan', group: 'learning' as const },
    { label: 'Reading', labelZh: '阅读', href: '/reading', group: 'learning' as const },
    { label: 'Listening', labelZh: '听力', href: '/pronunciation', group: 'learning' as const },
    { label: 'Exam Drill', labelZh: '考试训练', href: '/exam', group: 'learning' as const },
    { label: 'Vocab Browser', labelZh: '词库浏览', href: '/lexiverse/vocab', group: 'lexiverse' as const },
    { label: 'Lexiverse Quiz', labelZh: '词汇练习', href: '/lexiverse/quiz', group: 'lexiverse' as const },
  ],
} as const

export const levelOptions: LevelOption[] = [
  {
    id: 'beginner',
    name: 'Beginner',
    nameZh: '入门',
    description: 'Start from scratch — alphabet, basic greetings, everyday words.',
    descriptionZh: '从零开始，字母、基础问候、日常词汇。',
  },
  {
    id: 'elementary',
    name: 'Elementary',
    nameZh: '新手',
    description: 'Build foundational vocabulary and simple sentence structures.',
    descriptionZh: '构建基础词汇，学习简单句型。',
  },
  {
    id: 'intermediate',
    name: 'Intermediate',
    nameZh: '熟练',
    description: 'Expand vocabulary, improve reading fluency and listening.',
    descriptionZh: '扩展词汇，提升阅读流利度与听力。',
  },
  {
    id: 'advanced',
    name: 'Advanced',
    nameZh: '进阶',
    description: 'Master nuanced vocabulary, academic writing, and complex grammar.',
    descriptionZh: '掌握细致词汇、学术写作与复杂语法。',
  },
  {
    id: 'exam-prep',
    name: 'Exam Prep',
    nameZh: '考试备考',
    description: 'Focused training for TOEFL, IELTS, CET-4/6, 考研, or 高考.',
    descriptionZh: '专项备考托福、雅思、四六级、考研或高考。',
  },
  {
    id: 'free-explore',
    name: 'Free Explore',
    nameZh: '自由探索',
    description: 'No fixed path — dive into any module that interests you.',
    descriptionZh: '无固定路径，随心探索感兴趣的模块。',
  },
]
