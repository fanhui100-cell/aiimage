/* ============================================================================
   lib/analytics/achievements.ts — 成就/勋章计算（D11）
   全部里程碑都从真实学习信号派生，绝不造假：
     连续天数 / 掌握词数 / 收录词数 / 累计复习 / 发音达标 / 跨维镀金 / XP。
   纯函数，便于复用与测试（scripts/verify-achievements.ts）。
   ============================================================================ */

export interface AchInput {
  streak: number        // 最长连续天数
  mastered: number      // 已掌握词数
  total: number         // 学习库收录词数
  reviewedTotal: number // 累计复习次数
  pronOk: number        // 发音达标(≥80)词数
  gold: number          // 跨维镀金词数(mastered 且 dims≥2)
  xp: number
}

export interface Badge {
  em: string
  nm: string
  d: string
  bg: string
  value: number
  total: number
  done: boolean
  /** 0-100 进度（未解锁时） */
  prog: number
  /** 接近解锁（≥80% 且未完成） */
  near: boolean
}

export interface AchCategory { cat: string; items: Badge[] }

export interface AchReport {
  categories: AchCategory[]
  all: Badge[]
  unlocked: number
  total: number
  /** 最近（最高规格）解锁的勋章；没有则为 null */
  recent: Badge | null
  /** 成就等级：每解锁 3 枚升 1 级 */
  level: number
}

type Spec = { cat: string; em: string; nm: string; bg: string; total: number; key: keyof AchInput; unit: (n: number) => string }

const SPECS: Spec[] = [
  // 连续打卡
  { cat: '连续打卡', em: '🔥', nm: '七日不辍', bg: '#fce6b8', total: 7, key: 'streak', unit: n => `连续学习 ${n} 天` },
  { cat: '连续打卡', em: '📅', nm: '月度坚持', bg: '#fcd98a', total: 30, key: 'streak', unit: n => `连续学习 ${n} 天` },
  { cat: '连续打卡', em: '💯', nm: '百日筑基', bg: '#f4d06a', total: 100, key: 'streak', unit: n => `连续学习 ${n} 天` },
  // 词汇里程
  { cat: '词汇里程', em: '🌱', nm: '初露锋芒', bg: '#cdeee4', total: 100, key: 'mastered', unit: n => `掌握 ${n} 词` },
  { cat: '词汇里程', em: '🌿', nm: '词汇千里', bg: '#bfe9dc', total: 1000, key: 'mastered', unit: n => `掌握 ${n} 词` },
  { cat: '词汇里程', em: '🌳', nm: '词海行者', bg: '#a9e0cf', total: 3000, key: 'mastered', unit: n => `掌握 ${n} 词` },
  { cat: '词汇里程', em: '🏔️', nm: '万词之巅', bg: '#93d7c3', total: 10000, key: 'mastered', unit: n => `掌握 ${n} 词` },
  // 积累 / 复习
  { cat: '积累 · 复习', em: '📥', nm: '启航收词', bg: '#d8d0ef', total: 50, key: 'total', unit: n => `收录 ${n} 词入库` },
  { cat: '积累 · 复习', em: '📚', nm: '博采众词', bg: '#cabfe9', total: 500, key: 'total', unit: n => `收录 ${n} 词入库` },
  { cat: '积累 · 复习', em: '🔁', nm: '勤勉复习', bg: '#d8d0ef', total: 200, key: 'reviewedTotal', unit: n => `累计复习 ${n} 次` },
  // 技能 / 多维
  { cat: '技能 · 多维', em: '🗣️', nm: '字正腔圆', bg: '#f6d6e3', total: 10, key: 'pronOk', unit: n => `发音达标 ${n} 词` },
  { cat: '技能 · 多维', em: '✨', nm: '跨维镀金', bg: '#f4f0e6', total: 20, key: 'gold', unit: n => `镀金 ${n} 词（掌握且多维）` },
  { cat: '技能 · 多维', em: '⚡', nm: 'XP 五千', bg: '#fce6b8', total: 5000, key: 'xp', unit: n => `累计 ${n} XP` },
]

export function buildAchievements(input: AchInput): AchReport {
  const all: Badge[] = []
  const catMap = new Map<string, Badge[]>()
  for (const s of SPECS) {
    const value = Math.max(0, Math.round(input[s.key] ?? 0))
    const done = value >= s.total
    const prog = done ? 100 : Math.min(99, Math.round((value / s.total) * 100))
    const badge: Badge = {
      em: s.em, nm: s.nm, d: s.unit(s.total), bg: s.bg,
      value, total: s.total, done, prog, near: !done && prog >= 80,
    }
    all.push(badge)
    const arr = catMap.get(s.cat) ?? []
    arr.push(badge); catMap.set(s.cat, arr)
  }
  const categories: AchCategory[] = [...catMap.entries()].map(([cat, items]) => ({ cat, items }))
  const unlockedBadges = all.filter(b => b.done)
  // 最近解锁：取已解锁中规格(total)最高者作为「最新高光」
  const recent = unlockedBadges.length
    ? unlockedBadges.reduce((a, b) => (b.total > a.total ? b : a))
    : null
  return {
    categories, all,
    unlocked: unlockedBadges.length,
    total: all.length,
    recent,
    level: Math.floor(unlockedBadges.length / 3) + 1,
  }
}
