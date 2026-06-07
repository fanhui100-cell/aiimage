import type { DailyMission, DailyMissionProgress } from './motivation-types'

export const MISSIONS_DEF = [
  {
    id: 'light_3_nodes',
    title: 'Light up 3 word nodes',
    titleZh: '点亮 3 个词汇节点',
    target: 3,
    reward: 15,
  },
  {
    id: 'add_1_review',
    title: 'Add 1 word to review',
    titleZh: '加入 1 个单词到复习',
    target: 1,
    reward: 10,
  },
  {
    id: 'play_3_pronunciation',
    title: 'Play pronunciation 3 times',
    titleZh: '播放 3 次发音',
    target: 3,
    reward: 8,
  },
] as const

export function getDefaultDailyMissions(): DailyMission[] {
  return MISSIONS_DEF.map(m => ({ ...m, progress: 0, completed: false }))
}

/** Derive current mission state from daily progress counters. */
export function deriveMissions(progress: DailyMissionProgress): DailyMission[] {
  const counts = [progress.litCount, progress.reviewCount, progress.pronunciationCount]
  return MISSIONS_DEF.map((def, i) => {
    const p = Math.min(counts[i], def.target)
    return {
      ...def,
      progress: p,
      completed: p >= def.target,
    }
  })
}
