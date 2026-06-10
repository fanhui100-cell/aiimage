/**
 * lib/product-flow/nav.ts — 全站唯一导航词表（B1）
 * MobileTabBar / Navbar / 首页工具条 / UnifiedMenu 全部从这里取，
 * 杜绝「宇宙 / Universe / 词汇宇宙」多种叫法并存。
 */

export const PRIMARY_NAV = [
  { key: 'today',  zh: '今日', en: 'Today',      href: '/today' },
  { key: 'words',  zh: '词库', en: 'Dictionary', href: '/dictionary' },
  { key: 'review', zh: '复习', en: 'Review',     href: '/memory', badge: 'due+wrong' },
  { key: 'cosmos', zh: '宇宙', en: 'Cosmos',     href: '/lexiverse' },
  { key: 'me',     zh: '我的', en: 'Me',         href: '/profile' },
] as const

// 二级工具（收进「我的」页 + 首页工具条 + 桌面「工具」下拉）
export const TOOL_NAV = [
  { key: 'reading', zh: '阅读',    en: 'Reading',  href: '/reading' },
  { key: 'scan',    zh: '扫描',    en: 'Scan',     href: '/scan' },
  { key: 'speak',   zh: '发音',    en: 'Speak',    href: '/pronunciation' },
  { key: 'tutor',   zh: 'AI 导学', en: 'AI Tutor', href: '/chat' },
  { key: 'exam',    zh: '模考',    en: 'Exam',     href: '/exam' },
  { key: 'graph',   zh: '词图',    en: 'Graph',    href: '/lexigraph' },
] as const

export type PrimaryNavKey = (typeof PRIMARY_NAV)[number]['key']
export type ToolNavKey = (typeof TOOL_NAV)[number]['key']
