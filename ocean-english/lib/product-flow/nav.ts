/**
 * lib/product-flow/nav.ts — 全站唯一导航词表（方案 A · 返工：导航与流程接线）
 * PRIMARY_NAV：桌面顶栏 + 移动底栏（5 项主入口）
 * TOOL_NAV：桌面「工具」下拉 + 首页工具区（仅 T2 高频工具 3 项）
 * MORE_NAV：收进「我的」页「全部功能」区（保持可达，不占主导航）
 */

export const PRIMARY_NAV = [
  { key: 'today',  zh: '今日', en: 'Today',      href: '/today' },
  { key: 'words',  zh: '词库', en: 'Dictionary', href: '/dictionary' },
  { key: 'drill',  zh: '专练', en: 'Drill',      href: '/drill', badge: 'due+wrong' },
  { key: 'cosmos', zh: '宇宙', en: 'Cosmos',     href: '/lexiverse' },
  { key: 'me',     zh: '我的', en: 'Me',         href: '/profile' },
] as const

// T2 高频工具（顶栏「工具」下拉 + 首页工具区）
export const TOOL_NAV = [
  { key: 'scan',    zh: '扫描', en: 'Scan',      href: '/scan' },
  { key: 'tutor',   zh: '领航', en: 'LexiPilot', href: '/chat' },
  { key: 'reading', zh: '阅读', en: 'Reading',   href: '/reading' },
] as const

// 其余全部功能 —— 收进「我的」页「全部功能」区（保持可达）
export const MORE_NAV = [
  { key: 'review',    zh: '复习',   en: 'Review',      href: '/memory' },
  { key: 'exam',      zh: '试炼',   en: 'LexiTrial',   href: '/exam' },
  { key: 'speak',     zh: '发音',   en: 'Speak',       href: '/pronunciation' },
  { key: 'speaking',  zh: '口语',   en: 'Speaking',    href: '/speaking' },
  { key: 'listening', zh: '听写',   en: 'Listening',   href: '/listening' },
  { key: 'writing',   zh: '造句',   en: 'Writing',     href: '/writing' },
  { key: 'roots',     zh: '词根',   en: 'Roots',       href: '/roots' },
  { key: 'graph',     zh: '词图',   en: 'Graph',       href: '/lexigraph' },
  { key: 'report',    zh: '报告',   en: 'Report',      href: '/report' },
  { key: 'rank',      zh: '排行',   en: 'Leaderboard', href: '/leaderboard' },
  { key: 'groups',    zh: '小组',   en: 'Groups',      href: '/groups' },
  { key: 'vault',     zh: '知识库', en: 'LexiVault',   href: '/dictionary' },
] as const

export type PrimaryNavKey = (typeof PRIMARY_NAV)[number]['key']
export type ToolNavKey = (typeof TOOL_NAV)[number]['key']
export type MoreNavKey = (typeof MORE_NAV)[number]['key']
