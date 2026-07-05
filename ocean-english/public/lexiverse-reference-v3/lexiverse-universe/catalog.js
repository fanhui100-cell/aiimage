/* Lexiverse catalog · 重构版 — 每个类别 = 一个星系，星系大小 = 真实词量。
   5 个星座区 × 16 星系（八档统一：雅思从考试前沿迁入等级带）：
   · 等级带 (8) —— 初中→雅思/SAT 的主学习路径，金色轨道按 cefrRank 串联，词量来自真实词表
   · 考试前沿 (2) —— GRE / 专四专八
   · 技能域 (3) —— 口语高频 / 学术写作 AWL / 商务职场
   · 词源云 (2) —— 词根词缀 / 易混词阵
   · 私人星域 (1) —— 我的星云（收藏 + 错词，随学习生长）
   字段: wordCount 实装词量 · protoCount 原型加载量 · wuVariant 默认布局
         pathOrder 等级路径序号 · fixedPos 宇宙中的固定位置 */
window.LexiverseCatalog = {
  CONSTELLATIONS: [
    { id: 'level-belt',    title: 'Level Belt',    titleZh: '等级带',   centroid: { x: 0, y: 0, z: 0 },        color: '#7EF9FF', tagline: 'The main path — eight galaxies from Junior to SAT.',  taglineZh: '主学习路径 · 初中到雅思/SAT 八座星系，按 CEFR 难度拾级而上。' },
    { id: 'exam-frontier', title: 'Exam Frontier', titleZh: '考试前沿', centroid: { x: 0, y: 650, z: -1050 },  color: '#FFD66B', tagline: 'Beyond the belt — GRE, TEM.',                  taglineZh: '等级带之外的进阶考试 · GRE/专四专八。' },
    { id: 'skill-domain',  title: 'Skill Domain',  titleZh: '技能域',   centroid: { x: -1720, y: 150, z: -570 }, color: '#6BE0A0', tagline: 'Words by what you do — speaking, writing, business.', taglineZh: '按场景学 · 口语/学术写作/商务职场。' },
    { id: 'lexis-nebula',  title: 'Lexis Nebula',  titleZh: '词源云',   centroid: { x: 1700, y: -120, z: -700 }, color: '#C8B8FF', tagline: 'The structure of words — roots, affixes, confusables.', taglineZh: '词的内部结构 · 词根词缀/易混词阵。' },
    { id: 'personal',      title: 'My Field',      titleZh: '私人星域', centroid: { x: 0, y: -520, z: 900 },   color: '#FFA85A', tagline: 'A galaxy that grows as you learn.',                   taglineZh: '随你的学习生长的星系 · 收藏与错词。' },
  ],
  GALAXIES: [
    // ── 等级带 Level Belt (7) — 金色轨道按 pathOrder 串联 ──
    { id: 'junior', constellationId: 'level-belt', pathOrder: 1, title: 'Junior',  titleZh: '初中星系', wordCount: 1987,  dataFile: 'data/words-junior.js', wuVariant: 'nebula',
      description: 'First light — everyday core words.', descriptionZh: '第一缕星光 · 日常核心词。', sourceType: 'level', filter: { list: ['收录 1,987 词（源表 3,223 条）'] },
      fixedPos: { x: -1560, y: -270, z: 320 },  colorTheme: '#9CFFB0', visualType: 'spiral' },
    { id: 'senior', constellationId: 'level-belt', pathOrder: 2, title: 'Senior',  titleZh: '高中星系', wordCount: 3743,  dataFile: 'data/words-senior.js', wuVariant: 'nebula',
      description: 'The belt widens — full school vocabulary.', descriptionZh: '星带渐宽 · 高中全量词汇。', sourceType: 'level', filter: { list: ['收录 3,743 词（源表 6,008 条）'] },
      fixedPos: { x: -1020, y: -170, z: -160 }, colorTheme: '#6BE0A0', visualType: 'spiral' },
    { id: 'cet4',   constellationId: 'level-belt', pathOrder: 3, title: 'CET-4',   titleZh: '四级星系', wordCount: 4544,  dataFile: 'data/words-cet4-full.js', wuVariant: 'nebula',
      description: 'The first great crossing.', descriptionZh: '第一次大航行 · 四级核心。', sourceType: 'level', filter: { list: ['收录 4,544 词（源表 7,508 条）'] },
      fixedPos: { x: -440, y: -60, z: 260 },    colorTheme: '#7EF9FF', visualType: 'spiral' },
    { id: 'cet6',   constellationId: 'level-belt', pathOrder: 4, title: 'CET-6',   titleZh: '六级星系', wordCount: 3991,  dataFile: 'data/words-cet6.js', wuVariant: 'nebula',
      description: 'Deeper waters, denser clusters.', descriptionZh: '更深的水域 · 更密的词族。', sourceType: 'level', filter: { list: ['收录 3,991 词（源表 5,651 条）'] },
      fixedPos: { x: 130, y: 40, z: -190 },     colorTheme: '#5FB6E0', visualType: 'spiral' },
    { id: 'kaoyan', constellationId: 'level-belt', pathOrder: 5, title: 'KaoYan',  titleZh: '考研星系', wordCount: 5047,  dataFile: 'data/words-kaoyan.js', wuVariant: 'nebula',
      description: 'The long voyage — postgraduate core.', descriptionZh: '漫长远航 · 考研核心。', sourceType: 'level', filter: { list: ['收录 5,047 词（源表 9,602 条）'] },
      fixedPos: { x: 710, y: 150, z: 200 },     colorTheme: '#9FA8FF', visualType: 'spiral' },
    // 雅思（八档统一）：cefrRank 4.5(B2–C1) 插在考研与托福之间，pathOrder 6；从「考试前沿」迁入等级带
    { id: 'ielts',  constellationId: 'level-belt', pathOrder: 6, title: 'IELTS',   titleZh: '雅思星系', wordCount: 5038,  dataFile: 'data/words-ielts.js', wuVariant: 'nebula',
      description: 'Academic IELTS — between KaoYan and TOEFL (B2–C1).', descriptionZh: '雅思学术高频 · 难度在考研与托福之间（B2–C1）。', sourceType: 'level', filter: { list: ['收录 5,038 词（ECDICT ielts）'] },
      fixedPos: { x: 1010, y: 205, z: 30 },     colorTheme: '#FFD66B', visualType: 'spiral' },
    { id: 'toefl',  constellationId: 'level-belt', pathOrder: 7, title: 'TOEFL',   titleZh: '托福星系', wordCount: 10367, dataFile: 'data/words-toefl.js', wuVariant: 'nebula',
      description: 'The largest galaxy in the belt.', descriptionZh: '等级带中最大的星系。', sourceType: 'level', filter: { list: ['收录 10,367 词（源表 13,477 条）'] },
      fixedPos: { x: 1300, y: 250, z: -140 },   colorTheme: '#C39BFF', visualType: 'spiral' },
    { id: 'sat',    constellationId: 'level-belt', pathOrder: 8, title: 'SAT',     titleZh: 'SAT 星系', wordCount: 4464,  dataFile: 'data/words-sat.js', wuVariant: 'nebula',
      description: 'The far frontier of the belt.', descriptionZh: '等级带的最远疆界。', sourceType: 'level', filter: { list: ['收录 4,464 词（源表 8,887 条）'] },
      fixedPos: { x: 1850, y: 350, z: 230 },    colorTheme: '#FF9BD2', visualType: 'spiral' },

    // ── 考试前沿 Exam Frontier (2) ──
    { id: 'gre',   constellationId: 'exam-frontier', title: 'GRE',   titleZh: 'GRE 星系', wordCount: 650, protoCount: 650, wuVariant: 'nebula',
      description: 'Rare, high-difficulty words in cold orbit.', descriptionZh: '稀有高难词的寒冷轨道。', sourceType: 'exam', filter: { list: ['GRE 核心'] },
      fixedPos: { x: 20, y: 730, z: -1320 },   colorTheme: '#F0B840', visualType: 'wireframe' },
    { id: 'tem',   constellationId: 'exam-frontier', title: 'TEM 4/8', titleZh: '专四专八', wordCount: 880, protoCount: 880, wuVariant: 'nebula',
      description: 'English-major proving grounds.', descriptionZh: '英语专业的试炼场。', sourceType: 'exam', filter: { list: ['专四/专八'] },
      fixedPos: { x: 780, y: 630, z: -960 },   colorTheme: '#FFC861', visualType: 'spiral' },

    // ── 技能域 Skill Domain (3) ──
    { id: 'spoken',   constellationId: 'skill-domain', title: 'Spoken',   titleZh: '口语高频', wordCount: 380, protoCount: 380, wuVariant: 'nebula',
      description: 'The 1,500 words of daily speech.', descriptionZh: '日常口语的 1,500 词。', sourceType: 'skill', filter: { list: ['口语高频'] },
      fixedPos: { x: -1520, y: 430, z: -720 }, colorTheme: '#9CFFB0', visualType: 'cluster' },
    { id: 'awl',      constellationId: 'skill-domain', title: 'AWL',      titleZh: '学术写作', wordCount: 540, protoCount: 540, wuVariant: 'nebula',
      description: '570 academic word families.', descriptionZh: 'AWL 570 学术词族。', sourceType: 'skill', filter: { list: ['AWL 学术词表'] },
      fixedPos: { x: -1980, y: 170, z: -210 }, colorTheme: '#8AD7FF', visualType: 'spiral' },
    { id: 'business', constellationId: 'skill-domain', title: 'Business', titleZh: '商务职场', wordCount: 460, protoCount: 460, wuVariant: 'nebula',
      description: 'Markets, meetings, metrics.', descriptionZh: '市场、会议、指标。', sourceType: 'skill', filter: { list: ['商务/职场'] },
      fixedPos: { x: -1660, y: -130, z: -820 }, colorTheme: '#B79BFF', visualType: 'cluster' },

    // ── 词源云 Lexis Nebula (2) ──
    { id: 'roots',       constellationId: 'lexis-nebula', title: 'Roots & Affixes', titleZh: '词根词缀', wordCount: 620, protoCount: 620, wuVariant: 'nebula',
      description: 'Constellation-dense — words grouped by root.', descriptionZh: '星座最密的星系 · 按词根聚团。', sourceType: 'lexis', filter: { list: ['词根词缀族'] },
      fixedPos: { x: 1540, y: -210, z: -920 }, colorTheme: '#C8B8FF', visualType: 'nebula' },
    { id: 'confusables', constellationId: 'lexis-nebula', title: 'Confusables', titleZh: '易混词阵', wordCount: 320, protoCount: 320, wuVariant: 'nebula',
      description: 'Twin stars that fool the eye.', descriptionZh: '以假乱真的双子星。', sourceType: 'lexis', filter: { list: ['易混词对'] },
      fixedPos: { x: 1950, y: -60, z: -500 },  colorTheme: '#FF8FA8', visualType: 'nebula' },

    // ── 私人星域 Personal (1) ──
    { id: 'mine', constellationId: 'personal', title: 'My Nebula', titleZh: '我的星云', wordCount: 0, protoCount: 600, wuVariant: 'nebula', isMine: true,
      description: 'Learned + starred + mistakes — starts empty, grows with you.', descriptionZh: '已学会 + 收藏 + 错词 · 从 0 起步，随学习生长。', sourceType: 'mine', filter: { list: ['学会 + 收藏 + 错词'] },
      fixedPos: { x: 40, y: -540, z: 940 },    colorTheme: '#FFA85A', visualType: 'nebula' },
  ],
};
