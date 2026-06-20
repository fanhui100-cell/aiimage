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

// 其余全部功能 —— 导航入口合并后仅剩「社区」+ 范围外两项
// 复习→专练·智能复习；发音/口语→专练·口说家族；造句→专练·产出家族；听写→专练·听力家族；
// 报告→我的·数据 tab；排行/小组/成就→社区页；知识库与「词库」重复已删。旧路由仍可直达（见各 page 的重定向）。
export const MORE_NAV = [
  { key: 'community', zh: '社区', en: 'Community', href: '/community' }, // 排行 + 小组 + 成就 合一
  { key: 'roots',     zh: '词根', en: 'Roots',     href: '/roots' },     // 范围外，保留
  { key: 'graph',     zh: '词图', en: 'Graph',     href: '/lexigraph' }, // 范围外，保留
] as const

export type PrimaryNavKey = (typeof PRIMARY_NAV)[number]['key']
export type ToolNavKey = (typeof TOOL_NAV)[number]['key']
export type MoreNavKey = (typeof MORE_NAV)[number]['key']
