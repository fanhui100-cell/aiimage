// config/lexiverse-galaxies.ts
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 · Lexiverse Galaxy Catalog
//
// 6 constellations × 6–8 galaxies = 42 base galaxies.
// All `filter` fields reference REAL dictionary slices already in the repo:
//   themeTags  : daily-life | academic | business | technology |
//                engineering | learning | communication | emotion |
//                science | project-management
//   domainTags : general | education | ai-tech | engineering | business |
//                exam-prep | document-learning | project | communication
//   examTags   : CET-4 | CET-6 | IELTS | TOEFL | postgraduate | gaokao
//   cefrLevels : A1 | A2 | B1 | B2 | C1 | C2
//
// Positions are hand-placed for visual quality (loose clusters per
// constellation); tweak any single position freely without breaking others.
// ─────────────────────────────────────────────────────────────────────────

import type { LexiverseConstellation, LexiverseGalaxy } from '@/lib/lexiverse/lexiverse-types'

// ── Constellations (6) ────────────────────────────────────────────────────
export const CONSTELLATIONS: LexiverseConstellation[] = [
  {
    id: 'daily-communication',
    title: 'Daily Communication',
    titleZh: '日常表达',
    centroid: { x: 0, y: -130, z: 0 },
    color: '#FFA85A',
    hullColor: 'rgba(255,168,90,0.05)',
    tagline: 'The vocabulary of everyday life and how we talk.',
    taglineZh: '日常生活与人际表达的根基词汇。',
  },
  {
    id: 'academic-knowledge',
    title: 'Academic Knowledge',
    titleZh: '学术求知',
    centroid: { x: 0, y: 130, z: 0 },
    color: '#7EF9FF',
    hullColor: 'rgba(126,249,255,0.05)',
    tagline: 'Thinking, arguing, writing — the vocabulary of study.',
    taglineZh: '思考、论证、书写的高阶词汇集群。',
  },
  {
    id: 'tech-engineering',
    title: 'Tech & Engineering',
    titleZh: '科技工程',
    centroid: { x: 220, y: 30, z: -20 },
    color: '#5FE0D6',
    hullColor: 'rgba(95,224,214,0.05)',
    tagline: 'Engineering, AI, software, systems.',
    taglineZh: '工程、AI、软件、系统的专业词汇。',
  },
  {
    id: 'business-project',
    title: 'Business & Project',
    titleZh: '商务项目',
    centroid: { x: -220, y: 30, z: -20 },
    color: '#6BE0A0',
    hullColor: 'rgba(107,224,160,0.05)',
    tagline: 'Strategy, projects, business communication.',
    taglineZh: '战略、项目、商务沟通的词汇。',
  },
  {
    id: 'exam-targets',
    title: 'Exam Targets',
    titleZh: '考试光柱',
    centroid: { x: 0, y: 30, z: 220 },
    color: '#FFD66B',
    hullColor: 'rgba(255,214,107,0.05)',
    tagline: 'Specialised vocabulary clusters for major exams.',
    taglineZh: '面向各大考试的专项词汇星群。',
  },
  {
    id: 'cefr-ladder',
    title: 'CEFR Ladder',
    titleZh: '能级阶梯',
    centroid: { x: 0, y: 30, z: -220 },
    color: '#6BE0A0',
    hullColor: 'rgba(107,224,160,0.05)',
    tagline: 'Vocabulary stratified by Common European Framework.',
    taglineZh: '按欧洲共同语言参考标准分层的词汇。',
  },
]

// ── Galaxies (42) ─────────────────────────────────────────────────────────
export const GALAXIES: LexiverseGalaxy[] = [
  // ╔═══ 🟧 Daily Communication (8) ═══════════════════════════════════════╗
  {
    id: 'daily-basics', constellationId: 'daily-communication',
    title: 'Daily Basics', titleZh: '日常基础',
    description: 'Words you use every single day.', descriptionZh: '每天都用得到的基本词汇。',
    sourceType: 'theme', filter: { themeTags: ['daily-life'], difficultyLevels: [1, 2] },
    visualPosition: { x: -60, y: -110, z: -30 }, colorTheme: '#FFB78A', visualType: 'spiral',
  },
  {
    id: 'social-interaction', constellationId: 'daily-communication',
    title: 'Social Interaction', titleZh: '社交互动',
    description: 'How we relate, greet, and get along.', descriptionZh: '与他人建立连接的词汇。',
    sourceType: 'theme', filter: { themeTags: ['daily-life', 'communication'] },
    visualPosition: { x: -30, y: -150, z: 30 }, colorTheme: '#FFA85A', visualType: 'cluster',
  },
  {
    id: 'emotion-feeling', constellationId: 'daily-communication',
    title: 'Emotion & Feeling', titleZh: '情感感受',
    description: 'The colour of how we feel.', descriptionZh: '描绘内心感受的色彩词汇。',
    sourceType: 'theme', filter: { themeTags: ['emotion'] },
    visualPosition: { x: 10, y: -170, z: 30 }, colorTheme: '#FF8FA8', visualType: 'nebula',
  },
  {
    id: 'family-home', constellationId: 'daily-communication',
    title: 'Family & Home', titleZh: '家庭家居',
    description: 'Where you live and who you love.', descriptionZh: '居所与亲情的词汇。',
    sourceType: 'theme', filter: { themeTags: ['daily-life'], difficultyLevels: [1, 2, 3] },
    visualPosition: { x: 40, y: -130, z: -50 }, colorTheme: '#FFC861', visualType: 'cluster',
  },
  {
    id: 'body-health', constellationId: 'daily-communication',
    title: 'Body & Health', titleZh: '身心健康',
    description: 'Anatomy, wellness, feeling unwell.', descriptionZh: '身体、健康与生理感受。',
    sourceType: 'theme', filter: { themeTags: ['daily-life'] },
    visualPosition: { x: 60, y: -90, z: 20 }, colorTheme: '#FF9E6B', visualType: 'cluster',
  },
  {
    id: 'travel-place', constellationId: 'daily-communication',
    title: 'Travel & Place', titleZh: '旅行场所',
    description: 'Going somewhere; words about getting there.', descriptionZh: '关于地点、出行与旅行。',
    sourceType: 'theme', filter: { themeTags: ['daily-life'] },
    visualPosition: { x: 70, y: -110, z: -30 }, colorTheme: '#FFC07A', visualType: 'cluster',
  },
  {
    id: 'food-taste', constellationId: 'daily-communication',
    title: 'Food & Taste', titleZh: '饮食味觉',
    description: 'Taste, ingredients, the kitchen.', descriptionZh: '关于食物与味觉的词汇。',
    sourceType: 'theme', filter: { themeTags: ['daily-life'] },
    visualPosition: { x: 50, y: -160, z: -10 }, colorTheme: '#FFB070', visualType: 'cluster',
  },
  {
    id: 'conversation-talk', constellationId: 'daily-communication',
    title: 'Conversation', titleZh: '日常对话',
    description: 'Casual and useful talk.', descriptionZh: '日常对话与小聊。',
    sourceType: 'theme', filter: { themeTags: ['communication'], difficultyLevels: [1, 2, 3] },
    visualPosition: { x: -70, y: -130, z: 10 }, colorTheme: '#E89060', visualType: 'cluster',
  },

  // ╔═══ 🔵 Academic Knowledge (8) ════════════════════════════════════════╗
  {
    id: 'academic-foundations', constellationId: 'academic-knowledge',
    title: 'Academic Foundations', titleZh: '学术基底',
    description: 'High-frequency academic vocabulary.', descriptionZh: '学术领域的高频词汇。',
    sourceType: 'theme', filter: { themeTags: ['academic'] },
    visualPosition: { x: 0, y: 140, z: 0 }, colorTheme: '#7EF9FF', visualType: 'spiral',
  },
  {
    id: 'scientific-method', constellationId: 'academic-knowledge',
    title: 'Scientific Method', titleZh: '科学方法',
    description: 'Hypothesis, evidence, experiment.', descriptionZh: '假设、证据、实验的科学词汇。',
    sourceType: 'theme', filter: { themeTags: ['academic', 'science'] },
    visualPosition: { x: 60, y: 100, z: 30 }, colorTheme: '#5FE0D6', visualType: 'wireframe',
  },
  {
    id: 'learning-research', constellationId: 'academic-knowledge',
    title: 'Learning & Research', titleZh: '学习研究',
    description: 'The vocabulary of finding things out.', descriptionZh: '关于求知与研究的词汇。',
    sourceType: 'theme', filter: { themeTags: ['academic', 'learning'] },
    visualPosition: { x: -60, y: 100, z: 30 }, colorTheme: '#8FD6FF', visualType: 'cluster',
  },
  {
    id: 'academic-communication', constellationId: 'academic-knowledge',
    title: 'Academic Communication', titleZh: '学术交流',
    description: 'Presenting, citing, discussing.', descriptionZh: '陈述、引用、研讨的词汇。',
    sourceType: 'theme', filter: { themeTags: ['academic', 'communication'] },
    visualPosition: { x: -80, y: 130, z: 0 }, colorTheme: '#82B6FF', visualType: 'cluster',
  },
  {
    id: 'argument-debate', constellationId: 'academic-knowledge',
    title: 'Argument & Debate', titleZh: '论证辩论',
    description: 'Building, defending, refuting positions.', descriptionZh: '构建、辩护与反驳论点。',
    sourceType: 'theme', filter: { themeTags: ['academic'] },
    visualPosition: { x: 80, y: 130, z: 0 }, colorTheme: '#C8B8FF', visualType: 'wireframe',
  },
  {
    id: 'writing-composition', constellationId: 'academic-knowledge',
    title: 'Writing & Composition', titleZh: '写作表达',
    description: 'Shaping ideas into prose.', descriptionZh: '将思想塑造成文字。',
    sourceType: 'theme', filter: { themeTags: ['academic'] },
    visualPosition: { x: 40, y: 150, z: -50 }, colorTheme: '#6BC7E0', visualType: 'spiral',
  },
  {
    id: 'critical-thinking', constellationId: 'academic-knowledge',
    title: 'Critical Thinking', titleZh: '批判思维',
    description: 'Analysis, reasoning, abstraction.', descriptionZh: '分析、推理、抽象。',
    sourceType: 'theme', filter: { themeTags: ['academic'] },
    visualPosition: { x: 0, y: 90, z: -70 }, colorTheme: '#B79BFF', visualType: 'wireframe',
  },
  {
    id: 'knowledge-domains', constellationId: 'academic-knowledge',
    title: 'Knowledge Domains', titleZh: '知识领域',
    description: 'Cross-disciplinary vocabulary.', descriptionZh: '跨学科的高频词汇。',
    sourceType: 'theme', filter: { themeTags: ['learning'] },
    visualPosition: { x: 30, y: 170, z: 50 }, colorTheme: '#88E0FF', visualType: 'spiral',
  },

  // ╔═══ 🟦 Tech & Engineering (6) ════════════════════════════════════════╗
  {
    id: 'engineering-foundations', constellationId: 'tech-engineering',
    title: 'Engineering Foundations', titleZh: '工程基础',
    description: 'Mechanical, electrical, civil — the core of engineering.', descriptionZh: '工程学科的核心词汇。',
    sourceType: 'domain', filter: { domainTags: ['engineering'] },
    visualPosition: { x: 210, y: 60, z: -10 }, colorTheme: '#5FE0D6', visualType: 'wireframe',
  },
  {
    id: 'ai-machine-learning', constellationId: 'tech-engineering',
    title: 'AI & Machine Learning', titleZh: 'AI 与机器学习',
    description: 'Models, training, inference, neural nets.', descriptionZh: '模型、训练、推理、神经网络。',
    sourceType: 'domain', filter: { domainTags: ['ai-tech'] },
    visualPosition: { x: 240, y: 0, z: -30 }, colorTheme: '#B79BFF', visualType: 'spiral',
  },
  {
    id: 'software-engineering', constellationId: 'tech-engineering',
    title: 'Software Engineering', titleZh: '软件工程',
    description: 'Code, systems, architecture.', descriptionZh: '代码、系统、架构。',
    sourceType: 'domain', filter: { domainTags: ['ai-tech', 'engineering'] },
    visualPosition: { x: 200, y: 30, z: 30 }, colorTheme: '#5B8BFF', visualType: 'wireframe',
  },
  {
    id: 'systems-architecture', constellationId: 'tech-engineering',
    title: 'Systems & Architecture', titleZh: '系统架构',
    description: 'Large-system thinking and structure.', descriptionZh: '大型系统思维与结构。',
    sourceType: 'domain', filter: { domainTags: ['engineering'] },
    visualPosition: { x: 250, y: 60, z: 20 }, colorTheme: '#6BC7E0', visualType: 'cluster',
  },
  {
    id: 'research-development', constellationId: 'tech-engineering',
    title: 'Research & Development', titleZh: '研发探索',
    description: 'Prototyping, experimenting, iterating.', descriptionZh: '原型、实验、迭代。',
    sourceType: 'domain', filter: { domainTags: ['ai-tech'] },
    visualPosition: { x: 220, y: -30, z: -40 }, colorTheme: '#82B6FF', visualType: 'wireframe',
  },
  {
    id: 'data-algorithms', constellationId: 'tech-engineering',
    title: 'Data & Algorithms', titleZh: '数据算法',
    description: 'Sorting, optimising, modelling data.', descriptionZh: '排序、优化、建模数据。',
    sourceType: 'domain', filter: { domainTags: ['ai-tech'] },
    visualPosition: { x: 240, y: 0, z: 40 }, colorTheme: '#88E0FF', visualType: 'nebula',
  },

  // ╔═══ 🟢 Business & Project (6) ════════════════════════════════════════╗
  {
    id: 'business-foundations', constellationId: 'business-project',
    title: 'Business Foundations', titleZh: '商务基础',
    description: 'Markets, customers, products.', descriptionZh: '市场、客户、产品。',
    sourceType: 'domain', filter: { domainTags: ['business'] },
    visualPosition: { x: -210, y: 60, z: -10 }, colorTheme: '#6BE0A0', visualType: 'cluster',
  },
  {
    id: 'project-management', constellationId: 'business-project',
    title: 'Project Management', titleZh: '项目管理',
    description: 'Planning, scope, milestones, delivery.', descriptionZh: '计划、范围、里程碑、交付。',
    sourceType: 'theme', filter: { themeTags: ['project-management'] },
    visualPosition: { x: -240, y: 0, z: -30 }, colorTheme: '#5FE0C0', visualType: 'wireframe',
  },
  {
    id: 'business-communication', constellationId: 'business-project',
    title: 'Business Communication', titleZh: '商务沟通',
    description: 'Emails, meetings, presentations.', descriptionZh: '邮件、会议、汇报。',
    sourceType: 'domain', filter: { domainTags: ['business', 'communication'] },
    visualPosition: { x: -200, y: 30, z: 30 }, colorTheme: '#6BE0D6', visualType: 'cluster',
  },
  {
    id: 'strategy-decisions', constellationId: 'business-project',
    title: 'Strategy & Decisions', titleZh: '战略决策',
    description: 'Frameworks for choosing what to do.', descriptionZh: '决策框架与选择的词汇。',
    sourceType: 'domain', filter: { domainTags: ['business'] },
    visualPosition: { x: -250, y: 60, z: 20 }, colorTheme: '#9BB6FF', visualType: 'wireframe',
  },
  {
    id: 'finance-numbers', constellationId: 'business-project',
    title: 'Finance & Numbers', titleZh: '财务数字',
    description: 'Money, metrics, measurement.', descriptionZh: '金钱、指标、度量。',
    sourceType: 'domain', filter: { domainTags: ['business'] },
    visualPosition: { x: -220, y: -30, z: -40 }, colorTheme: '#B79BFF', visualType: 'cluster',
  },
  {
    id: 'leadership', constellationId: 'business-project',
    title: 'Leadership', titleZh: '领导力',
    description: 'Vision, alignment, delegation.', descriptionZh: '远景、对齐、授权。',
    sourceType: 'domain', filter: { domainTags: ['business'] },
    visualPosition: { x: -240, y: 0, z: 40 }, colorTheme: '#82B6FF', visualType: 'spiral',
  },

  // ╔═══ 🟡 Exam Targets (8) ══════════════════════════════════════════════╗
  {
    id: 'toefl-core', constellationId: 'exam-targets',
    title: 'TOEFL', titleZh: 'TOEFL 托福',
    description: 'High-frequency TOEFL vocabulary.', descriptionZh: '托福高频词汇集群。',
    sourceType: 'exam', filter: { examTags: ['TOEFL'] },
    visualPosition: { x: -40, y: 60, z: 200 }, colorTheme: '#FFD66B', visualType: 'cluster',
  },
  {
    id: 'ielts-core', constellationId: 'exam-targets',
    title: 'IELTS', titleZh: 'IELTS 雅思',
    description: 'High-frequency IELTS vocabulary.', descriptionZh: '雅思高频词汇集群。',
    sourceType: 'exam', filter: { examTags: ['IELTS'] },
    visualPosition: { x: 40, y: 60, z: 200 }, colorTheme: '#FFC861', visualType: 'cluster',
  },
  {
    id: 'cet-4-core', constellationId: 'exam-targets',
    title: 'CET-4', titleZh: '大学英语四级',
    description: 'CET-4 core vocabulary.', descriptionZh: '大学英语四级核心词汇。',
    sourceType: 'exam', filter: { examTags: ['CET-4'] },
    visualPosition: { x: -80, y: 30, z: 220 }, colorTheme: '#FFB070', visualType: 'cluster',
  },
  {
    id: 'cet-6-core', constellationId: 'exam-targets',
    title: 'CET-6', titleZh: '大学英语六级',
    description: 'CET-6 core vocabulary.', descriptionZh: '大学英语六级核心词汇。',
    sourceType: 'exam', filter: { examTags: ['CET-6'] },
    visualPosition: { x: 80, y: 30, z: 220 }, colorTheme: '#E8C877', visualType: 'cluster',
  },
  {
    id: 'postgraduate-cn', constellationId: 'exam-targets',
    title: 'Postgraduate Entrance', titleZh: '考研词汇',
    description: 'Chinese postgrad-entrance exam vocabulary.', descriptionZh: '研究生入学考试词汇。',
    sourceType: 'exam', filter: { examTags: ['postgraduate'] },
    visualPosition: { x: -30, y: 0, z: 240 }, colorTheme: '#FFA85A', visualType: 'cluster',
  },
  {
    id: 'gaokao-cn', constellationId: 'exam-targets',
    title: 'Gaokao', titleZh: '高考词汇',
    description: 'Chinese college-entrance vocabulary.', descriptionZh: '高考核心词汇。',
    sourceType: 'exam', filter: { examTags: ['gaokao'] },
    visualPosition: { x: 30, y: 0, z: 240 }, colorTheme: '#F8B85C', visualType: 'cluster',
  },
  {
    id: 'mixed-exam-prep', constellationId: 'exam-targets',
    title: 'Mixed Exam Prep', titleZh: '综合应试',
    description: 'Words common across TOEFL + IELTS.', descriptionZh: '跨考试通用高频词。',
    sourceType: 'custom', filter: { examTags: ['IELTS', 'TOEFL'] },
    visualPosition: { x: -60, y: -30, z: 210 }, colorTheme: '#FFB050', visualType: 'nebula',
  },
  {
    id: 'advanced-exam-vocab', constellationId: 'exam-targets',
    title: 'Advanced Test Vocabulary', titleZh: '高阶考试词汇',
    description: 'C1+ vocabulary that surfaces in advanced tests.', descriptionZh: 'C1+ 级别的高阶考试词汇。',
    sourceType: 'custom', filter: { examTags: ['IELTS', 'TOEFL'], cefrLevels: ['C1', 'C2'] },
    visualPosition: { x: 60, y: -30, z: 210 }, colorTheme: '#FF9E6B', visualType: 'wireframe',
  },

  // ╔═══ 🟢 CEFR Ladder (6) ═══════════════════════════════════════════════╗
  {
    id: 'cefr-a1', constellationId: 'cefr-ladder',
    title: 'CEFR A1', titleZh: 'A1 入门',
    description: 'Beginner — first 500 words.', descriptionZh: '入门级 · 首 500 词。',
    sourceType: 'cefr', filter: { cefrLevels: ['A1'] },
    visualPosition: { x: 0, y: -150, z: -220 }, colorTheme: '#9CFFB0', visualType: 'cluster',
  },
  {
    id: 'cefr-a2', constellationId: 'cefr-ladder',
    title: 'CEFR A2', titleZh: 'A2 基础',
    description: 'Elementary — survival vocabulary.', descriptionZh: '基础级 · 生存词汇。',
    sourceType: 'cefr', filter: { cefrLevels: ['A2'] },
    visualPosition: { x: 0, y: -90, z: -220 }, colorTheme: '#6BE0A0', visualType: 'cluster',
  },
  {
    id: 'cefr-b1', constellationId: 'cefr-ladder',
    title: 'CEFR B1', titleZh: 'B1 中级',
    description: 'Intermediate — fluent everyday use.', descriptionZh: '中级 · 流利日常使用。',
    sourceType: 'cefr', filter: { cefrLevels: ['B1'] },
    visualPosition: { x: 0, y: -30, z: -220 }, colorTheme: '#5FE0D6', visualType: 'cluster',
  },
  {
    id: 'cefr-b2', constellationId: 'cefr-ladder',
    title: 'CEFR B2', titleZh: 'B2 中高级',
    description: 'Upper-intermediate — abstract topics.', descriptionZh: '中高级 · 抽象话题表达。',
    sourceType: 'cefr', filter: { cefrLevels: ['B2'] },
    visualPosition: { x: 0, y: 30, z: -220 }, colorTheme: '#5FB6E0', visualType: 'cluster',
  },
  {
    id: 'cefr-c1', constellationId: 'cefr-ladder',
    title: 'CEFR C1', titleZh: 'C1 高级',
    description: 'Advanced — nuanced expression.', descriptionZh: '高级 · 细腻表达。',
    sourceType: 'cefr', filter: { cefrLevels: ['C1'] },
    visualPosition: { x: 0, y: 90, z: -220 }, colorTheme: '#7BAFFF', visualType: 'wireframe',
  },
  {
    id: 'cefr-c2', constellationId: 'cefr-ladder',
    title: 'CEFR C2', titleZh: 'C2 精通',
    description: 'Mastery — near-native subtlety.', descriptionZh: '精通级 · 近母语水准。',
    sourceType: 'cefr', filter: { cefrLevels: ['C2'] },
    visualPosition: { x: 0, y: 150, z: -220 }, colorTheme: '#B79BFF', visualType: 'wireframe',
  },
]

// ── helpers ──────────────────────────────────────────────────────────────
export function getGalaxyById(id: string): LexiverseGalaxy | undefined {
  return GALAXIES.find(g => g.id === id)
}
export function getConstellationById(id: string): LexiverseConstellation | undefined {
  return CONSTELLATIONS.find(c => c.id === id)
}
export function getGalaxiesInConstellation(constellationId: string): LexiverseGalaxy[] {
  return GALAXIES.filter(g => g.constellationId === constellationId)
}
