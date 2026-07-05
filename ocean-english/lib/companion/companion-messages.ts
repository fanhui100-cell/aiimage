/**
 * Bilingual companion message catalog.
 * Used by emitCompanionEvent and the Lumi companion shell.
 * No AI, no external calls — static curated messages only.
 */

import type { CompanionMessage, CompanionMessageCategory } from './companion-types'

const MESSAGES: Record<CompanionMessageCategory, CompanionMessage[]> = {
  welcome: [
    { en: 'Welcome back. Your word map is ready to glow.', zh: '欢迎回来，你的词汇地图已准备好点亮了。', category: 'welcome' },
    { en: "Ready to explore? Let's light up the graph.", zh: '准备好探索了吗？让我们点亮星图。', category: 'welcome' },
  ],
  pronunciation: [
    { en: 'Good. Let the sound shape the memory.', zh: '很好，让声音帮你塑造记忆。', category: 'pronunciation' },
    { en: 'Listen once. Your memory gets a clearer signal.', zh: '听一遍，记忆信号会更清晰。', category: 'pronunciation' },
    { en: 'This word now has a sound in your map.', zh: '这个单词现在在你的地图里有了声音。', category: 'pronunciation' },
  ],
  addToReview: [
    { en: "I'll keep this word warm for your next review.", zh: '我会帮你把这个单词保持在可复习状态。', category: 'addToReview' },
    { en: 'Nice. This node is now alive in your memory.', zh: '很好，这个节点已经在你的记忆中活起来了。', category: 'addToReview' },
  ],
  quiz: [
    { en: 'Good work. Keep going.', zh: '做得好，继续保持。', category: 'quiz' },
    { en: 'Testing yourself is the fastest way to remember.', zh: '自测是最快的记忆方式。', category: 'quiz' },
  ],
  dailyMission: [
    { en: "Mission complete! You're building momentum.", zh: '任务完成！你正在积累动力。', category: 'dailyMission' },
    { en: "One more step toward today's goal.", zh: '向今日目标又近了一步。', category: 'dailyMission' },
  ],
  achievement: [
    { en: 'Achievement unlocked! Your map grows.', zh: '成就解锁！你的地图在成长。', category: 'achievement' },
    { en: 'Milestone reached. Keep lighting up the path.', zh: '里程碑达成，继续点亮前行的路。', category: 'achievement' },
  ],
  streak: [
    { en: 'Streak alive. Even 3 minutes keeps the signal strong.', zh: '连续学习保持。哪怕今天只学 3 分钟，信号也会继续存在。', category: 'streak' },
  ],
  idle: [
    { en: 'Even 3 minutes keeps the signal alive.', zh: '哪怕今天只学 3 分钟，也能让学习信号继续存在。', category: 'idle' },
    { en: 'Your word map is waiting.', zh: '你的词汇地图在等着你。', category: 'idle' },
  ],
  mistake: [
    { en: 'Good mistake. This is where your memory gets stronger.', zh: '这是一个有价值的错误，记忆正是在这里变强的。', category: 'mistake' },
  ],
  fallback: [
    { en: 'Keep exploring. Your map grows with every word.', zh: '继续探索，每个单词都让你的地图成长。', category: 'fallback' },
  ],
}

/** Pick a message for a given category, cycling through options by index. */
export function pickCompanionMessage(
  category: CompanionMessageCategory,
  index = 0,
): CompanionMessage {
  const list = MESSAGES[category]
  return list[index % list.length]
}

/** Return just the English text for quick use in setCompanionMessage. */
export function getCompanionMessageEn(category: CompanionMessageCategory, index = 0): string {
  return pickCompanionMessage(category, index).en
}
