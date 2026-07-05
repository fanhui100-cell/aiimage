/* 界面优化4：今日动线编排配置（与 TodayScreen 同源，抽出供 TodayBento 复用）。
   文案 / 词题量 / key 均不改，路由仍走项目 useNavigate（见 TodayBento go()）。 */

export type PathId = 'full' | 'words' | 'reading' | 'exam'
export type CardColor = 'teal' | 'blue' | 'gold' | 'rose' | 'violet'
export type IconName = 'book' | 'target' | 'doc' | 'refresh' | 'spark' | 'exam' | 'flag' | 'chart' | 'flame'
export type ActCard = { key: string; t: string; en: string; s: string; c: CardColor; ic: IconName; meta?: string }

export const COLOR_VAR: Record<CardColor, string> = {
  teal: 'var(--teal-ink)', blue: 'var(--blue-ink)', gold: 'var(--gold-ink)',
  rose: 'var(--rose-ink)', violet: 'var(--violet-ink)',
}

export const PATHS: Record<PathId, { zh: string; cards: ActCard[] }> = {
  full: {
    zh: '全面掌握', cards: [
      { key: 'learn', t: '今日新词', en: 'New Words', s: '闪卡学习，链到词图', c: 'teal', ic: 'book', meta: '12 词' },
      { key: 'practice', t: '练习', en: 'Practice', s: '选择 + 打字，错题长红边', c: 'blue', ic: 'target', meta: '10 题' },
      { key: 'reading', t: '阅读任务', en: 'Reading', s: '带生词短文，语境里理解', c: 'violet', ic: 'doc', meta: '1 篇' },
      { key: 'review', t: '复习到期', en: 'Review SRS', s: '到期词就地评分', c: 'gold', ic: 'refresh', meta: '8 词' },
      { key: 'recap', t: '今日小结', en: 'Recap', s: '闭环点亮你的词汇宇宙', c: 'teal', ic: 'spark', meta: '' },
    ],
  },
  words: {
    zh: '速记词汇', cards: [
      { key: 'learn', t: '新词速刷', en: 'Rapid Cards', s: '放大卡片，快速过词', c: 'teal', ic: 'book', meta: '20 词' },
      { key: 'quiz', t: '快速自测', en: 'Quick Check', s: '秒答巩固，连击加分', c: 'blue', ic: 'target', meta: '12 题' },
      { key: 'review', t: '复习到期', en: 'Review', s: '到期词就地评分', c: 'gold', ic: 'refresh', meta: '8 词' },
    ],
  },
  reading: {
    zh: '精读提升', cards: [
      { key: 'article', t: '今日精读', en: 'Deep Reading', s: '整篇文章，标注生词', c: 'violet', ic: 'doc', meta: '1 篇 · 680 词' },
      { key: 'pick', t: '文中取词', en: 'Mine Words', s: '从文章里收词学习', c: 'teal', ic: 'book', meta: '9 词' },
      { key: 'practice', t: '练习', en: 'Practice', s: '就刚学的词练一组', c: 'blue', ic: 'target', meta: '8 题' },
      { key: 'review', t: '复习到期', en: 'Review', s: '到期词就地评分', c: 'gold', ic: 'refresh', meta: '6 词' },
    ],
  },
  exam: {
    zh: '应试备考', cards: [
      { key: 'mock', t: '今日题型练习', en: 'Exam Drill', s: '按目标考试出题型', c: 'rose', ic: 'exam', meta: '15 题' },
      { key: 'wrong', t: '错题强化', en: 'Wrong Set', s: '昨日错题重练', c: 'rose', ic: 'flag', meta: '6 题' },
      { key: 'progress', t: '目标考试进度', en: 'Exam Progress', s: '距目标还有一段', c: 'teal', ic: 'chart', meta: '' },
      { key: 'review', t: '复习到期', en: 'Review', s: '到期词就地评分', c: 'gold', ic: 'refresh', meta: '5 词' },
    ],
  },
}
export const PATH_KEYS: PathId[] = ['full', 'words', 'reading', 'exam']
// 八档统一：LEVEL_NAMES 改从 lib/levels.ts 单源 re-export（index 8 = 雅思，替代旧「满级」死值）
export { LEVEL_NAMES } from '@/lib/levels'
export const daysToExam = (d: string) => { const ms = new Date(d + 'T00:00:00').getTime() - Date.now(); return Math.max(0, Math.ceil(ms / 86_400_000)) }

const ICON_PATHS: Record<IconName, React.ReactNode> = {
  book: <path d="M12 5.5C10.5 4 8 3.5 4 4v14c4-.5 6.5 0 8 1.5M12 5.5C13.5 4 16 3.5 20 4v14c-4-.5-6.5 0-8 1.5M12 5.5v14" />,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="0.6" fill="currentColor" /></>,
  doc: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></>,
  refresh: <><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M3 21v-5h5" /></>,
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" />,
  exam: <><path d="M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" /><rect x="8" y="2" width="8" height="4" rx="1" /><path d="m9 13 2 2 4-4" /></>,
  flag: <path d="M4 21V4M4 4h13l-2 4 2 4H4" />,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  flame: <path d="M12 3c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.5.5-2.5 1-3 .2 1 .8 1.5 1.5 1.5C11 8 10 6 12 3z" />,
}
export function Icon({ name, color, size = 20 }: { name: IconName; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {ICON_PATHS[name]}
    </svg>
  )
}
