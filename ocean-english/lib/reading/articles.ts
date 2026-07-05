/* ============================================================================
   lib/reading/articles.ts — F3-2 阅读板块文章库
   原创短文（LexiOcean team 撰写，CC0）。keyWords = 文中词典词 slug
   （与 Supabase dictionary 对齐），用于：生词率计算 + 文内可点高亮。
   ============================================================================ */

export interface ReadingArticle {
  id: string
  title: string
  titleZh: string
  level: number          // 7 档（lib/levels.ts）
  minutes: number
  text: string           // 段落以 \n\n 分隔
  keyWords: string[]     // 文中词典词（小写 slug，可点/计生词率）
}

export const READING_ARTICLES: ReadingArticle[] = [
  {
    id: 'morning-market',
    title: 'The Morning Market',
    titleZh: '清晨的市场',
    level: 2,
    minutes: 2,
    text: `The market opens before sunrise. Farmers arrange fresh vegetables on wooden tables, and the smell of bread drifts from a small bakery near the gate.\n\nAn old woman sells flowers at the corner. She remembers every customer and their favorite colors. People say her roses last longer than any others in town.\n\nBy nine, the crowd arrives. Children pull their parents toward the fruit stands, while vendors shout prices over the noise. It is loud, busy, and somehow comfortable — a habit the whole town shares.`,
    keyWords: ['arrange', 'drift', 'customer', 'favorite', 'crowd', 'vendor', 'comfortable', 'habit', 'bakery', 'noise'],
  },
  {
    id: 'oceans-memory',
    title: "The Ocean's Memory",
    titleZh: '海洋的记忆',
    level: 3,
    minutes: 3,
    text: `Scientists describe the ocean as a vast archive. Every layer of sediment on the seafloor preserves evidence of ancient climates: volcanic ash, pollen, and the shells of tiny creatures that lived millions of years ago.\n\nBy drilling deep cores, researchers can analyze these layers and reconstruct the planet's history. A single column of mud may reveal how temperatures shifted, when ice sheets expanded, and how life adapted to each change.\n\nThis memory is fragile. Trawling and mining disturb the seafloor, erasing records that took millennia to accumulate. Protecting these silent archives, scientists argue, is as urgent as protecting the creatures that swim above them.`,
    keyWords: ['vast', 'archive', 'sediment', 'preserve', 'evidence', 'ancient', 'analyze', 'reconstruct', 'reveal', 'expand', 'adapt', 'fragile', 'disturb', 'accumulate', 'urgent'],
  },
  {
    id: 'quiet-power-of-habit',
    title: 'The Quiet Power of Habit',
    titleZh: '习惯的静默力量',
    level: 4,
    minutes: 3,
    text: `We tend to attribute success to dramatic decisions, yet most progress derives from routines so small they seem trivial. A writer who drafts two hundred words every morning will outproduce one who waits for inspiration; a learner who reviews ten words daily will eventually surpass one who crams irregularly.\n\nPsychologists explain this through the mechanism of compounding: each repetition strengthens neural pathways, making the next attempt marginally easier. The effect is invisible day to day and undeniable year to year.\n\nThe implication is practical. Instead of pursuing intensity, design for consistency. Shrink the task until refusing it feels absurd — then let accumulation do the work that willpower cannot sustain.`,
    keyWords: ['attribute', 'derive', 'trivial', 'inspiration', 'surpass', 'mechanism', 'repetition', 'marginally', 'undeniable', 'implication', 'consistency', 'absurd', 'accumulation', 'sustain', 'intensity'],
  },
  {
    id: 'language-and-machines',
    title: 'Language and Machines',
    titleZh: '语言与机器',
    level: 6,
    minutes: 4,
    text: `For decades, linguists assumed that genuine language comprehension required innate structures unique to the human mind. The recent proliferation of large language models has complicated that assumption: systems trained merely to predict the next word now translate, summarize, and even explain jokes with disconcerting fluency.\n\nSkeptics contend that statistical mimicry is not understanding — that these models manipulate symbols without grasping their referents. Proponents counter that the boundary between imitation and comprehension is more ambiguous than we like to admit; after all, children also acquire language by absorbing patterns from their environment.\n\nWhat the debate obscures is a pragmatic consensus: whether or not machines "understand," they have become formidable instruments for human learners. A patient, tireless interlocutor — one that adapts its register to your proficiency — was once a luxury reserved for the wealthy. It now resides in every pocket.`,
    keyWords: ['comprehension', 'innate', 'proliferation', 'assumption', 'merely', 'predict', 'summarize', 'fluency', 'contend', 'mimicry', 'manipulate', 'ambiguous', 'acquire', 'obscure', 'pragmatic', 'consensus', 'formidable', 'proficiency', 'luxury', 'reside'],
  },
]
