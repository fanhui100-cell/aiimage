/* ════════════════════════════════════════════════════════════════════════
   exam-specs/specs.ts — 七档考试「真实结构」规格（唯一真源，Phase 1）

   结构=各考试公开的板块/题型/题量/分值（公开事实），不含任何真题版权内容。
   - 客观题 task type 复用 taxonomy 的 EXAM_TASK_TYPES。
   - 写作/翻译/口语等生产性板块作为「目标结构」先确立位（v1 暂无题库，留待 v2/生成）。
   - 退役题型 antonym_choice / cet_cloze 一律不出现。
   - TOEFL/SAT 标 status='draft'：官方结构明确，但产品题库仍在建设（coming soon）。
   - 分值口径：CET=710 制按官方占比折算；TOEFL=2026 新 1-6 量表（分项不计固定分，
     section.points 置 0）；SAT RW=200-800 模块自适应 IRT（分项不计固定分，points 置 0）。
     具体题量/分值以各考试官方说明为准，详见 sourceUrls。
   ════════════════════════════════════════════════════════════════════════ */

import type { ExamSpec } from './types'

export const EXAM_SPECS: ExamSpec[] = [
  // ── lv1 中考 ───────────────────────────────────────────────────────────
  {
    id: 'zhongkao',
    level: 1,
    labelZh: '中考',
    labelEn: 'Zhongkao (Junior High Exit Exam)',
    version: 'compulsory-edu-2022',
    sourceUrls: [
      'https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582349487953.pdf',
      'https://www.bjeea.cn/html/ksb/zhongzhaozhuanban/2025/1016/87326.html',
      'https://www.shmeea.edu.cn/page/03500/20240618/18593.html',
    ],
    totalMinutes: 100,
    fullScore: 120,
    scoringScale: 'raw',
    status: 'active',
    sections: [
      { id: 'listening', labelZh: '听力理解', labelEn: 'Listening', skill: 'listening', taskTypes: ['listening_comprehension'], groupMode: 'rows', itemCount: 20, points: 25, requiresAudio: true, notes: '无全国统一卷；地区差异大（北京含听后选择/回答/转述/朗读等听说机考）。' },
      { id: 'language_use', labelZh: '语言运用', labelEn: 'Language Use', skill: 'grammar', taskTypes: ['grammar_fill'], groupMode: 'rows', itemCount: 15, points: 15, notes: '中考语言运用：单项选择 / 语法填空，按地区版本。grammar_fill 为最接近的客观题型。' },
      { id: 'cloze', labelZh: '完形填空', labelEn: 'Cloze', skill: 'integrated', taskTypes: ['cloze_passage'], groupMode: 'rows', itemCount: 12, points: 15, notes: '整篇完形 8-15 空，四选一。' },
      { id: 'reading', labelZh: '阅读理解', labelEn: 'Reading', skill: 'reading', taskTypes: ['reading_comprehension'], groupMode: 'passages', itemCount: 15, points: 35, notes: '信息匹配/细节/推断/主旨/词义猜测；部分地区含「阅读表达」开放回答（待生产性任务支持）。' },
      { id: 'writing', labelZh: '书面表达', labelEn: 'Writing', skill: 'writing', taskTypes: ['applied_writing'], groupMode: 'single', itemCount: 1, points: 15, requiresRubric: true, notes: '50-100 词应用文/邮件/留言/建议；需 rubric。题库待生产性任务支持。' },
    ],
  },

  // ── lv2 高考（新课标全国卷） ─────────────────────────────────────────────
  {
    id: 'gaokao',
    level: 2,
    labelZh: '高考',
    labelEn: 'Gaokao (NMET, New Curriculum)',
    version: 'nmet-new-curriculum',
    sourceUrls: [
      'https://www.neea.edu.cn/xhtml1/report/2401/499-1.htm',
      'https://gaokao.neea.edu.cn/res/Home/structure/ef1746d46e7129defd766cc21029b521.pdf',
      'https://www.moe.gov.cn/srcsite/A26/s8001/202006/t20200603_462199.html',
    ],
    totalMinutes: 120,
    fullScore: 150,
    scoringScale: '150',
    status: 'active',
    sections: [
      { id: 'listening', labelZh: '听力', labelEn: 'Listening', skill: 'listening', taskTypes: ['listening_comprehension'], groupMode: 'rows', itemCount: 20, points: 30, requiresAudio: true, notes: '短对话/长对话/独白 MCQ。' },
      { id: 'reading', labelZh: '阅读理解', labelEn: 'Reading A', skill: 'reading', taskTypes: ['reading_comprehension'], groupMode: 'passages', itemCount: 15, points: 35, notes: '4 篇左右；细节/推断/主旨/态度/词义。' },
      { id: 'seven_select', labelZh: '七选五', labelEn: 'Reading B (7→5)', skill: 'reading', taskTypes: ['seven_select'], groupMode: 'rows', itemCount: 5, points: 10, notes: '篇章结构/衔接/主题句。' },
      { id: 'cloze', labelZh: '完形填空', labelEn: 'Cloze', skill: 'integrated', taskTypes: ['cloze_passage'], groupMode: 'rows', itemCount: 15, points: 20, notes: '整篇完形，四选一，语境+逻辑+搭配。题量/分值随省份版本，以官方为准。' },
      { id: 'grammar_fill', labelZh: '语法填空', labelEn: 'Grammar Fill', skill: 'grammar', taskTypes: ['grammar_fill'], groupMode: 'rows', itemCount: 10, points: 15, notes: '10 空，无提示词/词形变化；需支持可接受答案集与词形判定。' },
      { id: 'applied_writing', labelZh: '应用文写作', labelEn: 'Applied Writing', skill: 'writing', taskTypes: ['applied_writing'], groupMode: 'single', itemCount: 1, points: 15, requiresRubric: true, notes: '通知/邀请/建议/投稿/活动介绍。' },
      { id: 'continuation_writing', labelZh: '读后续写', labelEn: 'Continuation Writing', skill: 'writing', taskTypes: ['continuation_writing'], groupMode: 'single', itemCount: 1, points: 25, requiresRubric: true, notes: '材料 + 两段续写；情节合理性/衔接/语言质量。新课标卷已取消短文改错。' },
    ],
  },

  // ── lv3 CET-4 ──────────────────────────────────────────────────────────
  {
    id: 'cet4',
    level: 3,
    labelZh: 'CET-4',
    labelEn: 'CET-4',
    version: 'cet4-current',
    sourceUrls: [
      'https://cet.neea.edu.cn/xhtml1/report/16123/196-1.htm',
      'https://cet.neea.edu.cn/',
    ],
    totalMinutes: 130,
    fullScore: 710,
    scoringScale: '710',
    status: 'active',
    sections: [
      { id: 'writing', labelZh: '写作', labelEn: 'Writing', skill: 'writing', taskTypes: ['essay_writing'], groupMode: 'single', itemCount: 1, points: 106, requiresRubric: true, notes: '短文写作（约 120-180 词），占 15%。' },
      { id: 'listening', labelZh: '听力理解', labelEn: 'Listening', skill: 'listening', taskTypes: ['listening_comprehension'], groupMode: 'rows', itemCount: 25, points: 249, requiresAudio: true, notes: '短篇新闻 + 长对话 + 听力篇章三类，占 35%。' },
      { id: 'banked_cloze', labelZh: '选词填空', labelEn: 'Banked Cloze', skill: 'reading', taskTypes: ['banked_cloze'], groupMode: 'rows', itemCount: 10, points: 35, notes: '15 词选 10 空；需存 bank_words/blank_positions/answer_by_blank/pos_tags，避免答案键错位。' },
      { id: 'long_match', labelZh: '长篇阅读（段落匹配）', labelEn: 'Long Reading Matching', skill: 'reading', taskTypes: ['para_match'], groupMode: 'rows', itemCount: 10, points: 71, notes: '10 句信息匹配到段落，需足够强的同义改写。' },
      { id: 'careful_reading', labelZh: '仔细阅读', labelEn: 'Careful Reading', skill: 'reading', taskTypes: ['reading_comprehension'], groupMode: 'passages', itemCount: 10, points: 142, notes: '2 篇文章各 5 题；细节/推断/态度/主旨。' },
      { id: 'translation', labelZh: '翻译', labelEn: 'Translation', skill: 'translation', taskTypes: ['translation_zh_en'], groupMode: 'single', itemCount: 1, points: 107, requiresRubric: true, notes: '汉译英段落（中国文化/社会主题），占 15%。' },
    ],
  },

  // ── lv4 CET-6 ──────────────────────────────────────────────────────────
  {
    id: 'cet6',
    level: 4,
    labelZh: 'CET-6',
    labelEn: 'CET-6',
    version: 'cet6-current',
    sourceUrls: [
      'https://cet.neea.edu.cn/xhtml1/report/16123/201-1.htm',
      'https://cet.neea.edu.cn/xhtml1/folder/16113/1586-1.htm',
    ],
    totalMinutes: 130,
    fullScore: 710,
    scoringScale: '710',
    status: 'active',
    sections: [
      { id: 'writing', labelZh: '写作', labelEn: 'Writing', skill: 'writing', taskTypes: ['essay_writing'], groupMode: 'single', itemCount: 1, points: 106, requiresRubric: true, notes: '议论文/图表/社会议题，论证深度高于四级。' },
      { id: 'listening', labelZh: '听力理解', labelEn: 'Listening', skill: 'listening', taskTypes: ['listening_comprehension'], groupMode: 'rows', itemCount: 25, points: 249, requiresAudio: true, notes: '长对话 + 听力篇章 + 讲话/报道/讲座（CET6 特色），占 35%。' },
      { id: 'banked_cloze', labelZh: '选词填空', labelEn: 'Banked Cloze', skill: 'reading', taskTypes: ['banked_cloze'], groupMode: 'rows', itemCount: 10, points: 35, notes: '抽象主题 15 选 10；词汇/句法更难。' },
      { id: 'long_match', labelZh: '长篇阅读（段落匹配）', labelEn: 'Long Reading Matching', skill: 'reading', taskTypes: ['para_match'], groupMode: 'rows', itemCount: 10, points: 71, notes: '同义转述跨度更大。' },
      { id: 'careful_reading', labelZh: '仔细阅读', labelEn: 'Careful Reading', skill: 'reading', taskTypes: ['reading_comprehension'], groupMode: 'passages', itemCount: 10, points: 142, notes: '学术/评论类文章；态度/论证/推理。' },
      { id: 'translation', labelZh: '翻译', labelEn: 'Translation', skill: 'translation', taskTypes: ['translation_zh_en'], groupMode: 'single', itemCount: 1, points: 107, requiresRubric: true, notes: '更复杂的中国文化/社会/科技主题段落汉译英。' },
    ],
  },

  // ── lv5 考研（笔试，无听力/口语） ────────────────────────────────────────
  {
    id: 'kaoyan',
    level: 5,
    labelZh: '考研',
    labelEn: 'Kaoyan (Postgraduate English)',
    version: 'kaoyan-en-current',
    sourceUrls: [
      'https://yz.chsi.com.cn/kyzx/en/201209/20120918/343670177.html',
      'https://yz.chsi.com.cn/kyzx/en/201210/20121023/353891830.html',
    ],
    totalMinutes: 180,
    fullScore: 100,
    scoringScale: '100',
    status: 'active',
    sections: [
      { id: 'use_of_english', labelZh: '英语知识运用（完形）', labelEn: 'Use of English (Cloze)', skill: 'integrated', taskTypes: ['cloze_passage'], groupMode: 'rows', itemCount: 20, points: 10, notes: '约 240-350 词，20 空四选一；逻辑/搭配/语篇连贯。' },
      { id: 'reading_a', labelZh: '阅读理解 Part A', labelEn: 'Reading Part A', skill: 'reading', taskTypes: ['reading_comprehension'], groupMode: 'passages', itemCount: 20, points: 40, notes: '4 篇 × 5 题（考研最大分值区）。' },
      { id: 'reading_b', labelZh: '新题型 Part B', labelEn: 'Reading Part B (New Type)', skill: 'reading', taskTypes: ['seven_select', 'para_match'], groupMode: 'rows', itemCount: 5, points: 10, notes: '七选五/排序/小标题匹配等变体；需按变体细分。' },
      { id: 'translation', labelZh: '翻译', labelEn: 'Translation', skill: 'translation', taskTypes: ['translation_en_zh'], groupMode: 'single', itemCount: 1, points: 10, requiresRubric: true, notes: '英译汉：英语一为划线长难句，英语二为段落（待拆分英一/英二）。' },
      { id: 'writing_small', labelZh: '小作文', labelEn: 'Short Writing', skill: 'writing', taskTypes: ['applied_writing'], groupMode: 'single', itemCount: 1, points: 10, requiresRubric: true, notes: '书信/通知/告示/纪要等应用文。' },
      { id: 'writing_large', labelZh: '大作文', labelEn: 'Essay Writing', skill: 'writing', taskTypes: ['essay_writing'], groupMode: 'single', itemCount: 1, points: 20, requiresRubric: true, notes: '英语一图画/议论文；英语二图表/数据说明议论。' },
    ],
  },

  // ── lv6 TOEFL iBT 2026（四技能；题库建设中） ─────────────────────────────
  {
    id: 'toefl',
    level: 6,
    labelZh: 'TOEFL',
    labelEn: 'TOEFL iBT (2026)',
    version: 'toefl-ibt-2026',
    sourceUrls: [
      'https://www.ets.org/toefl/test-takers/ibt/about/content.html',
      'https://www.ets.org/toefl/test-takers/ibt/prepare/sample-test-jan-2026-1.html',
    ],
    totalMinutes: 120,
    fullScore: 6,
    scoringScale: '1-6',
    status: 'draft',
    sections: [
      { id: 'reading', labelZh: '阅读 Reading', labelEn: 'Reading', skill: 'reading', taskTypes: ['complete_the_words', 'read_daily_life', 'reading_comprehension'], groupMode: 'passages', itemCount: 50, points: 0, notes: 'Complete the Words / Read in Daily Life / Academic Passage；后者用 reading_comprehension，前两类待生产性任务支持。' },
      { id: 'listening', labelZh: '听力 Listening', labelEn: 'Listening', skill: 'listening', taskTypes: ['choose_a_response', 'listening_comprehension'], groupMode: 'rows', itemCount: 47, points: 0, requiresAudio: true, notes: 'Listen and Choose a Response / Conversation / Announcement / Academic Talk；后三类用 listening_comprehension 子类，choose_a_response 待支持。' },
      { id: 'writing', labelZh: '写作 Writing', labelEn: 'Writing', skill: 'writing', taskTypes: ['build_a_sentence', 'email_writing', 'academic_discussion'], groupMode: 'single', itemCount: 12, points: 0, requiresRubric: true, notes: 'Build a Sentence / Write an Email / Write for an Academic Discussion。' },
      { id: 'speaking', labelZh: '口语 Speaking', labelEn: 'Speaking', skill: 'speaking', taskTypes: ['listen_and_repeat', 'interview_speaking'], groupMode: 'single', itemCount: 11, points: 0, requiresAudio: true, requiresRubric: true, notes: 'Listen and Repeat / Take an Interview。需录音转写 + 评分。' },
    ],
  },

  // ── lv7 SAT（Digital RW；题库建设中） ────────────────────────────────────
  {
    id: 'sat',
    level: 7,
    labelZh: 'SAT',
    labelEn: 'SAT (Digital Reading & Writing)',
    version: 'sat-digital',
    sourceUrls: [
      'https://satsuite.collegeboard.org/sat/whats-on-the-test/structure',
      'https://satsuite.collegeboard.org/sat/whats-on-the-test/reading-writing',
      'https://satsuite.collegeboard.org/media/pdf/digital-sat-sample-questions.pdf',
    ],
    totalMinutes: 64,
    fullScore: 800,
    scoringScale: '200-800',
    status: 'draft',
    sections: [
      { id: 'information_and_ideas', labelZh: '信息与观点', labelEn: 'Information and Ideas', skill: 'reading', taskTypes: ['reading_comprehension'], groupMode: 'single', itemCount: 14, points: 0, notes: 'Central Ideas/Details、Command of Evidence（文本+图表/数据）、Inference；25-150 词短文本单题。' },
      { id: 'craft_and_structure', labelZh: '表达技巧与结构', labelEn: 'Craft and Structure', skill: 'reading', taskTypes: ['reading_comprehension'], groupMode: 'single', itemCount: 15, points: 0, notes: 'Words in Context（语境词义，非孤立同义词）、Text Structure and Purpose、Cross-Text Connections。' },
      { id: 'expression_of_ideas', labelZh: '观点表达', labelEn: 'Expression of Ideas', skill: 'writing', taskTypes: ['reading_comprehension'], groupMode: 'single', itemCount: 11, points: 0, notes: 'Transitions、Rhetorical Synthesis；MCQ 改写，非 essay 写作。' },
      { id: 'standard_english_conventions', labelZh: '标准英语规范', labelEn: 'Standard English Conventions', skill: 'grammar', taskTypes: ['reading_comprehension'], groupMode: 'single', itemCount: 14, points: 0, notes: 'Boundaries（句界/标点/run-on）、Form/Structure/Sense（动词/代词/修饰/平行/主谓一致）。' },
    ],
  },

  // ── lv8 IELTS Academic（仅词库/学习档已建；整卷题库未做 → coming_soon，组卷/专项一律拒，UI 显示建设中） ──
  {
    id: 'ielts',
    level: 8,
    labelZh: '雅思',
    labelEn: 'IELTS Academic',
    version: 'ielts-academic-2026',
    sourceUrls: [
      'https://www.ielts.org/about-ielts/ielts-academic',
    ],
    totalMinutes: 165,
    fullScore: 9,
    scoringScale: '1-9',
    status: 'coming_soon',
    sections: [
      { id: 'listening', labelZh: '听力 Listening', labelEn: 'Listening', skill: 'listening', taskTypes: ['listening_comprehension'], groupMode: 'rows', itemCount: 40, points: 0, requiresAudio: true, notes: '4 段（日常对话/独白 + 学术讨论/讲座），40 题。整卷题库待建（coming_soon）。' },
      { id: 'reading', labelZh: '阅读 Reading', labelEn: 'Reading', skill: 'reading', taskTypes: ['reading_comprehension'], groupMode: 'passages', itemCount: 40, points: 0, notes: '3 篇学术长文，40 题（判断/匹配/填空/选择）。整卷题库待建。' },
      { id: 'writing', labelZh: '写作 Writing', labelEn: 'Writing', skill: 'writing', taskTypes: ['essay_writing'], groupMode: 'single', itemCount: 2, points: 0, requiresRubric: true, notes: 'Task 1 图表描述 + Task 2 议论文。整卷题库待建。' },
      { id: 'speaking', labelZh: '口语 Speaking', labelEn: 'Speaking', skill: 'speaking', taskTypes: ['interview_speaking'], groupMode: 'single', itemCount: 3, points: 0, requiresAudio: true, requiresRubric: true, notes: '3 部分面试。整卷题库待建。' },
    ],
  },
]

export function getExamSpec(id: string): ExamSpec | null {
  return EXAM_SPECS.find((spec) => spec.id === id) ?? null
}

export function listExamSpecs(): ExamSpec[] {
  return EXAM_SPECS
}
