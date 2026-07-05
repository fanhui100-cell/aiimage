import type { AchievementLite } from './motivation-types'

export const ACHIEVEMENT_DEFS: Omit<AchievementLite, 'unlocked' | 'unlockedAt'>[] = [
  {
    id: 'first_light',
    title: 'First Light',
    titleZh: '第一道光',
    description: 'Light up your first word node in LexiGraph.',
    descriptionZh: '在词汇星图中点亮第一个词汇节点。',
  },
  {
    id: 'review_keeper',
    title: 'Review Keeper',
    titleZh: '复习守护者',
    description: 'Add 5 words to your review queue.',
    descriptionZh: '将 5 个单词加入复习队列。',
  },
  {
    id: 'sound_seeker',
    title: 'Sound Seeker',
    titleZh: '声音探索者',
    description: 'Play pronunciation 10 times.',
    descriptionZh: '播放发音 10 次。',
  },
  {
    id: 'graph_explorer',
    title: 'Graph Explorer',
    titleZh: '星图探险家',
    description: 'Open 10 different words in LexiGraph.',
    descriptionZh: '在词汇星图中探索 10 个不同的单词。',
  },
]

export function getDefaultAchievements(): AchievementLite[] {
  return ACHIEVEMENT_DEFS.map(def => ({ ...def, unlocked: false }))
}

/** Returns IDs of newly unlocked achievements given current counts. */
export function checkNewAchievements(
  counts: {
    litNodeCount: number
    reviewActionCount: number
    pronunciationPlayCount: number
    graphSearchCount: number
  },
  already: string[],
): string[] {
  const rules: Array<{ id: string; met: boolean }> = [
    { id: 'first_light',    met: counts.litNodeCount >= 1 },
    { id: 'review_keeper',  met: counts.reviewActionCount >= 5 },
    { id: 'sound_seeker',   met: counts.pronunciationPlayCount >= 10 },
    { id: 'graph_explorer', met: counts.graphSearchCount >= 10 },
  ]
  return rules.filter(r => r.met && !already.includes(r.id)).map(r => r.id)
}
