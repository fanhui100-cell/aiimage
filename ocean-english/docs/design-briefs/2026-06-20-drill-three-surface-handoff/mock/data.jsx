/* data.jsx — 真实题库结构 + canonical exam-specs（移植自 drill-data.ts / exam-specs/specs.ts）
   仅做白名单过滤与 task 三态推导，数据本身不改。 */

/* ───────── 等级（7 档，列序与 LEVEL_IDX 对齐） ───────── */
const LEVELS = [
  { key: 'zhongkao', zh: '中考', cefr: 'A2', total: 25456, rec: false },
  { key: 'gaokao', zh: '高考', cefr: 'B1', total: 27812, rec: false },
  { key: 'cet4', zh: 'CET-4', cefr: 'B1', total: 17116, rec: true },
  { key: 'cet6', zh: 'CET-6', cefr: 'B2', total: 24283, rec: false },
  { key: 'kaoyan', zh: '考研', cefr: 'B2', total: 4906, rec: false },
  { key: 'toefl', zh: '托福', cefr: 'C1', total: 47474, rec: false },
  { key: 'sat', zh: 'SAT', cefr: 'C1', total: 21551, rec: false },
]
const L_ORDER = ['zhongkao', 'gaokao', 'cet4', 'cet6', 'kaoyan', 'toefl', 'sat']
const LEVEL_IDX = Object.fromEntries(L_ORDER.map((k, i) => [k, i]))

/* ───────── 题型库（含各等级题量 by[]） ───────── */
const TYPES = [
  { key: 'en_to_zh', zh: '英译中', fam: 'recognize', total: 14538, by: [2164, 2437, 1400, 2157, 90, 4446, 1844] },
  { key: 'zh_to_en', zh: '中译英', fam: 'recognize', total: 14510, by: [2136, 2420, 1443, 2161, 84, 4427, 1839] },
  { key: 'def_to_word', zh: '看释义选词', fam: 'recognize', total: 14551, by: [2122, 2416, 1450, 2165, 84, 4460, 1854] },
  { key: 'synonym_choice', zh: '近义词', fam: 'recognize', total: 10913, by: [1800, 1920, 1219, 1710, 76, 2781, 1407] },
  { key: 'synonym_substitute', zh: '同义替换', fam: 'recognize', total: 8962, by: [1371, 1613, 934, 1360, 56, 2421, 1207] },
  { key: 'confusable_choice', zh: '易混辨析', fam: 'recognize', total: 2467, by: [1032, 470, 173, 251, 0, 492, 49] },
  { key: 'collocation_choice', zh: '搭配', fam: 'recognize', total: 541, by: [96, 96, 96, 86, 96, 71, 0] },
  { key: 'cloze_choice', zh: '单句完形·选', fam: 'recognize', total: 14095, by: [2078, 2300, 1381, 2049, 87, 4375, 1825] },
  { key: 'zh_to_word_spell', zh: '看中文拼写', fam: 'spell', total: 14594, by: [2149, 2396, 1485, 2164, 97, 4450, 1853] },
  { key: 'cloze_spell', zh: '单句完形·拼', fam: 'spell', total: 14040, by: [2045, 2253, 1391, 2070, 107, 4345, 1829] },
  { key: 'word_form', zh: '词形变化', fam: 'spell', total: 10169, by: [1727, 1923, 1082, 1649, 95, 2697, 996] },
  { key: 'grammar_fill', zh: '语法填空', fam: 'spell', total: 139, by: [0, 139, 0, 0, 0, 0, 0] },
  { key: 'listen_to_meaning', zh: '听音选义', fam: 'listen', total: 14440, by: [2136, 2368, 1419, 2137, 101, 4424, 1855] },
  { key: 'dictation_spell', zh: '听写', fam: 'listen', total: 14481, by: [2164, 2356, 1439, 2126, 100, 4421, 1875] },
  { key: 'listening_comprehension', zh: '听力理解', fam: 'listen', total: 3938, by: [180, 788, 104, 207, 1153, 1278, 228] },
  { key: 'reading_comprehension', zh: '阅读理解', fam: 'read', total: 13541, by: [1825, 1679, 1510, 1531, 2125, 2155, 2716] },
  { key: 'cloze_passage', zh: '篇章完形', fam: 'read', total: 218, by: [179, 0, 0, 0, 39, 0, 0] },
  { key: 'seven_select', zh: '七选五', fam: 'read', total: 516, by: [163, 163, 0, 0, 190, 0, 0] },
  { key: 'banked_cloze', zh: '选词填空', fam: 'read', total: 324, by: [0, 0, 0, 180, 144, 0, 0] },
  { key: 'para_match', zh: '段落匹配', fam: 'read', total: 398, by: [0, 0, 144, 108, 146, 0, 0] },
]
const TYPE_BY_KEY = Object.fromEntries(TYPES.map(t => [t.key, t]))

/* ───────── 题型分类（taxonomy 唯一真源） ───────── */
const WORD_UNIVERSE_TYPES = ['en_to_zh', 'zh_to_en', 'def_to_word', 'cloze_choice', 'cloze_spell',
  'zh_to_word_spell', 'word_form', 'listen_to_meaning', 'dictation_spell', 'synonym_choice',
  'synonym_substitute', 'collocation_choice', 'confusable_choice']
const EXAM_TASK_TYPES = ['reading_comprehension', 'listening_comprehension', 'banked_cloze',
  'seven_select', 'para_match', 'cloze_passage', 'grammar_fill']
const PRODUCTIVE_TASK_TYPES = ['applied_writing', 'continuation_writing', 'essay_writing',
  'translation_zh_en', 'translation_en_zh', 'build_a_sentence', 'email_writing', 'academic_discussion',
  'complete_the_words', 'read_daily_life', 'choose_a_response', 'listen_and_repeat', 'interview_speaking']
const DEPRECATED_QUESTION_TYPES = ['antonym_choice', 'cet_cloze']
const WU_SET = new Set(WORD_UNIVERSE_TYPES)
const EXAM_SET = new Set(EXAM_TASK_TYPES)
const PROD_SET = new Set(PRODUCTIVE_TASK_TYPES)
const DEP_SET = new Set(DEPRECATED_QUESTION_TYPES)
const isWordUniverse = t => WU_SET.has(t)
const isExamTask = t => EXAM_SET.has(t)
const isProductive = t => PROD_SET.has(t)
const isDeprecated = t => DEP_SET.has(t)

/* ───────── 单词宇宙练习：白名单过滤后的技能族 + 题型 ───────── */
const WU_FAMILIES = [
  { key: 'recognize', zh: '识记 · 选择', en: 'Recognize', color: '#0c9b8e', bg: 'rgba(18,179,163,.12)', ic: 'eye' },
  { key: 'spell', zh: '拼写 · 词形', en: 'Spell', color: '#c08a2a', bg: 'rgba(192,138,42,.12)', ic: 'pen' },
  { key: 'listen', zh: '听辨', en: 'Listen', color: '#4b6ed6', bg: 'rgba(75,110,214,.12)', ic: 'ear' },
]
// 双保险：只保留 word-universe 白名单题型，退役/考试任务题型一律不进单词宇宙
const WU_TYPES = TYPES.filter(t => isWordUniverse(t.key) && !isDeprecated(t.key))

function typeAvail(typeKey, levelKey) {
  const t = TYPE_BY_KEY[typeKey]
  if (!t) return false
  if (!levelKey) return true
  return t.by[LEVEL_IDX[levelKey]] > 0
}
function typeCount(typeKey, levelKey) {
  const t = TYPE_BY_KEY[typeKey]
  if (!t) return 0
  return levelKey ? t.by[LEVEL_IDX[levelKey]] : t.total
}
const wuFamTypes = famKey => WU_TYPES.filter(t => t.fam === famKey)
const fmt = n => n.toLocaleString('en-US')
const levelZh = key => { const l = LEVELS.find(x => x.key === key); return l ? l.zh : '' }
function typeSummary(sel) {
  if (!sel.length) return '未选题型'
  if (sel.length <= 2) return sel.map(k => (TYPE_BY_KEY[k] || {}).zh || k).join(' · ')
  return `${(TYPE_BY_KEY[sel[0]] || {}).zh || sel[0]} 等 ${sel.length} 种题型`
}

/* ───────── canonical exam-specs（七档 exam → section → taskTypes） ───────── */
const EXAM_SPECS = [
  { id: 'zhongkao', level: 1, labelZh: '中考', labelEn: 'Junior High Exit', totalMinutes: 100, fullScore: 120, scoringScale: 'raw', status: 'active', sections: [
    { id: 'listening', labelZh: '听力理解', labelEn: 'Listening', skill: 'listening', taskTypes: ['listening_comprehension'], groupMode: 'rows', itemCount: 20, points: 25, requiresAudio: true },
    { id: 'language_use', labelZh: '语言运用', labelEn: 'Language Use', skill: 'grammar', taskTypes: ['grammar_fill'], groupMode: 'rows', itemCount: 15, points: 15, notes: '单项选择 / 语法填空；grammar_fill 为最接近客观题型。' },
    { id: 'cloze', labelZh: '完形填空', labelEn: 'Cloze', skill: 'integrated', taskTypes: ['cloze_passage'], groupMode: 'rows', itemCount: 12, points: 15 },
    { id: 'reading', labelZh: '阅读理解', labelEn: 'Reading', skill: 'reading', taskTypes: ['reading_comprehension'], groupMode: 'passages', itemCount: 15, points: 35 },
    { id: 'writing', labelZh: '书面表达', labelEn: 'Writing', skill: 'writing', taskTypes: ['applied_writing'], groupMode: 'single', itemCount: 1, points: 15, requiresRubric: true },
  ] },
  { id: 'gaokao', level: 2, labelZh: '高考', labelEn: 'Gaokao (NMET)', totalMinutes: 120, fullScore: 150, scoringScale: '150', status: 'active', sections: [
    { id: 'listening', labelZh: '听力', labelEn: 'Listening', skill: 'listening', taskTypes: ['listening_comprehension'], groupMode: 'rows', itemCount: 20, points: 30, requiresAudio: true },
    { id: 'reading', labelZh: '阅读理解', labelEn: 'Reading A', skill: 'reading', taskTypes: ['reading_comprehension'], groupMode: 'passages', itemCount: 15, points: 35 },
    { id: 'seven_select', labelZh: '七选五', labelEn: 'Reading B (7→5)', skill: 'reading', taskTypes: ['seven_select'], groupMode: 'rows', itemCount: 5, points: 10 },
    { id: 'cloze', labelZh: '完形填空', labelEn: 'Cloze', skill: 'integrated', taskTypes: ['cloze_passage'], groupMode: 'rows', itemCount: 15, points: 20 },
    { id: 'grammar_fill', labelZh: '语法填空', labelEn: 'Grammar Fill', skill: 'grammar', taskTypes: ['grammar_fill'], groupMode: 'rows', itemCount: 10, points: 15 },
    { id: 'applied_writing', labelZh: '应用文写作', labelEn: 'Applied Writing', skill: 'writing', taskTypes: ['applied_writing'], groupMode: 'single', itemCount: 1, points: 15, requiresRubric: true },
    { id: 'continuation', labelZh: '读后续写', labelEn: 'Continuation', skill: 'writing', taskTypes: ['continuation_writing'], groupMode: 'single', itemCount: 1, points: 25, requiresRubric: true },
  ] },
  { id: 'cet4', level: 3, labelZh: 'CET-4', labelEn: 'CET-4', totalMinutes: 130, fullScore: 710, scoringScale: '710', status: 'active', sections: [
    { id: 'writing', labelZh: '写作', labelEn: 'Writing', skill: 'writing', taskTypes: ['essay_writing'], groupMode: 'single', itemCount: 1, points: 106, requiresRubric: true },
    { id: 'listening', labelZh: '听力理解', labelEn: 'Listening', skill: 'listening', taskTypes: ['listening_comprehension'], groupMode: 'rows', itemCount: 25, points: 249, requiresAudio: true },
    { id: 'banked_cloze', labelZh: '选词填空', labelEn: 'Banked Cloze', skill: 'reading', taskTypes: ['banked_cloze'], groupMode: 'rows', itemCount: 10, points: 35 },
    { id: 'long_match', labelZh: '长篇阅读（段落匹配）', labelEn: 'Long Matching', skill: 'reading', taskTypes: ['para_match'], groupMode: 'rows', itemCount: 10, points: 71 },
    { id: 'careful_reading', labelZh: '仔细阅读', labelEn: 'Careful Reading', skill: 'reading', taskTypes: ['reading_comprehension'], groupMode: 'passages', itemCount: 10, points: 142 },
    { id: 'translation', labelZh: '翻译', labelEn: 'Translation', skill: 'translation', taskTypes: ['translation_zh_en'], groupMode: 'single', itemCount: 1, points: 107, requiresRubric: true },
  ] },
  { id: 'cet6', level: 4, labelZh: 'CET-6', labelEn: 'CET-6', totalMinutes: 130, fullScore: 710, scoringScale: '710', status: 'active', sections: [
    { id: 'writing', labelZh: '写作', labelEn: 'Writing', skill: 'writing', taskTypes: ['essay_writing'], groupMode: 'single', itemCount: 1, points: 106, requiresRubric: true },
    { id: 'listening', labelZh: '听力理解', labelEn: 'Listening', skill: 'listening', taskTypes: ['listening_comprehension'], groupMode: 'rows', itemCount: 25, points: 249, requiresAudio: true },
    { id: 'banked_cloze', labelZh: '选词填空', labelEn: 'Banked Cloze', skill: 'reading', taskTypes: ['banked_cloze'], groupMode: 'rows', itemCount: 10, points: 35 },
    { id: 'long_match', labelZh: '长篇阅读（段落匹配）', labelEn: 'Long Matching', skill: 'reading', taskTypes: ['para_match'], groupMode: 'rows', itemCount: 10, points: 71 },
    { id: 'careful_reading', labelZh: '仔细阅读', labelEn: 'Careful Reading', skill: 'reading', taskTypes: ['reading_comprehension'], groupMode: 'passages', itemCount: 10, points: 142 },
    { id: 'translation', labelZh: '翻译', labelEn: 'Translation', skill: 'translation', taskTypes: ['translation_zh_en'], groupMode: 'single', itemCount: 1, points: 107, requiresRubric: true },
  ] },
  { id: 'kaoyan', level: 5, labelZh: '考研', labelEn: 'Postgraduate', totalMinutes: 180, fullScore: 100, scoringScale: '100', status: 'active', sections: [
    { id: 'use_of_english', labelZh: '英语知识运用', labelEn: 'Use of English', skill: 'integrated', taskTypes: ['cloze_passage'], groupMode: 'rows', itemCount: 20, points: 10 },
    { id: 'reading_a', labelZh: '阅读理解 Part A', labelEn: 'Reading A', skill: 'reading', taskTypes: ['reading_comprehension'], groupMode: 'passages', itemCount: 20, points: 40 },
    { id: 'reading_b', labelZh: '新题型 Part B', labelEn: 'Reading B', skill: 'reading', taskTypes: ['seven_select', 'para_match'], groupMode: 'rows', itemCount: 5, points: 10, notes: '七选五 / 段落匹配等变体，按候选优先级。' },
    { id: 'translation', labelZh: '翻译', labelEn: 'Translation', skill: 'translation', taskTypes: ['translation_en_zh'], groupMode: 'single', itemCount: 1, points: 10, requiresRubric: true },
    { id: 'writing_small', labelZh: '小作文', labelEn: 'Short Writing', skill: 'writing', taskTypes: ['applied_writing'], groupMode: 'single', itemCount: 1, points: 10, requiresRubric: true },
    { id: 'writing_large', labelZh: '大作文', labelEn: 'Essay', skill: 'writing', taskTypes: ['essay_writing'], groupMode: 'single', itemCount: 1, points: 20, requiresRubric: true },
  ] },
  { id: 'toefl', level: 6, labelZh: 'TOEFL', labelEn: 'TOEFL iBT 2026', totalMinutes: 120, fullScore: 6, scoringScale: '1-6', status: 'draft', sections: [
    { id: 'reading', labelZh: '阅读 Reading', labelEn: 'Reading', skill: 'reading', taskTypes: ['complete_the_words', 'read_daily_life', 'reading_comprehension'], groupMode: 'passages', itemCount: 50, points: 0 },
    { id: 'listening', labelZh: '听力 Listening', labelEn: 'Listening', skill: 'listening', taskTypes: ['choose_a_response', 'listening_comprehension'], groupMode: 'rows', itemCount: 47, points: 0, requiresAudio: true },
    { id: 'writing', labelZh: '写作 Writing', labelEn: 'Writing', skill: 'writing', taskTypes: ['build_a_sentence', 'email_writing', 'academic_discussion'], groupMode: 'single', itemCount: 12, points: 0, requiresRubric: true },
    { id: 'speaking', labelZh: '口语 Speaking', labelEn: 'Speaking', skill: 'speaking', taskTypes: ['listen_and_repeat', 'interview_speaking'], groupMode: 'single', itemCount: 11, points: 0, requiresAudio: true, requiresRubric: true },
  ] },
  { id: 'sat', level: 7, labelZh: 'SAT', labelEn: 'SAT Digital R&W', totalMinutes: 64, fullScore: 800, scoringScale: '200-800', status: 'draft', sections: [
    { id: 'information_and_ideas', labelZh: '信息与观点', labelEn: 'Information & Ideas', skill: 'reading', taskTypes: ['reading_comprehension'], groupMode: 'single', itemCount: 14, points: 0 },
    { id: 'craft_and_structure', labelZh: '表达技巧与结构', labelEn: 'Craft & Structure', skill: 'reading', taskTypes: ['reading_comprehension'], groupMode: 'single', itemCount: 15, points: 0 },
    { id: 'expression_of_ideas', labelZh: '观点表达', labelEn: 'Expression of Ideas', skill: 'writing', taskTypes: ['reading_comprehension'], groupMode: 'single', itemCount: 11, points: 0 },
    { id: 'standard_english_conventions', labelZh: '标准英语规范', labelEn: 'Standard English Conventions', skill: 'grammar', taskTypes: ['reading_comprehension'], groupMode: 'single', itemCount: 14, points: 0 },
  ] },
]
const getExamSpec = id => EXAM_SPECS.find(s => s.id === id) || null

/* ───────── task 友好标签 + skill 视觉 ───────── */
const TASK_LABELS = {
  reading_comprehension: ['阅读理解', 'Reading'], listening_comprehension: ['听力理解', 'Listening'],
  banked_cloze: ['选词填空', 'Banked Cloze'], seven_select: ['七选五', '7-Select'],
  para_match: ['段落匹配', 'Matching'], cloze_passage: ['篇章完形', 'Cloze'], grammar_fill: ['语法填空', 'Grammar Fill'],
  applied_writing: ['应用文写作', 'Applied Writing'], continuation_writing: ['读后续写', 'Continuation'],
  essay_writing: ['议论文 / 大作文', 'Essay'], translation_zh_en: ['汉译英', 'Translation ZH→EN'],
  translation_en_zh: ['英译汉', 'Translation EN→ZH'], build_a_sentence: ['Build a Sentence', 'Build a Sentence'],
  email_writing: ['写邮件', 'Write an Email'], academic_discussion: ['学术讨论写作', 'Academic Discussion'],
  complete_the_words: ['Complete the Words', 'Complete the Words'], read_daily_life: ['日常阅读', 'Read in Daily Life'],
  choose_a_response: ['听后选答', 'Choose a Response'], listen_and_repeat: ['听后复述', 'Listen & Repeat'],
  interview_speaking: ['面试口语', 'Take an Interview'],
}
const taskLabel = t => TASK_LABELS[t] || [t, t]
const SKILL_META = {
  vocabulary: { ic: 'eye', color: '#0c9b8e', bg: 'rgba(18,179,163,.12)', zh: '词汇' },
  grammar: { ic: 'pen', color: '#c08a2a', bg: 'rgba(192,138,42,.12)', zh: '语法' },
  reading: { ic: 'book', color: '#7c57d8', bg: 'rgba(139,110,224,.13)', zh: '阅读' },
  listening: { ic: 'ear', color: '#4b6ed6', bg: 'rgba(75,110,214,.12)', zh: '听力' },
  speaking: { ic: 'mic', color: '#bf4a30', bg: 'rgba(191,74,48,.12)', zh: '口语' },
  writing: { ic: 'pen', color: '#e0608a', bg: 'rgba(224,96,138,.1)', zh: '写作' },
  translation: { ic: 'list', color: '#c08a2a', bg: 'rgba(192,138,42,.12)', zh: '翻译' },
  integrated: { ic: 'list', color: '#0c9b8e', bg: 'rgba(18,179,163,.12)', zh: '综合' },
}
const GROUP_MODE_ZH = { single: '单题', rows: '按行取', passages: '按整篇', paper: '整卷' }

/* ───────── task 三态推导（模拟 /api/practice/session 的 source:'empty'）─────────
   真实实现：前端点击任务时调 GET /api/practice/session(mode:'task') 取真值；
   此处用 taxonomy + 题量在选卡台预先标注，逻辑与后端空池判定一致：
   - draft 考试（toefl/sat）：整档建设中
   - 生产性任务（写作/翻译/口语）：v1 客观题库无支撑 → 规划中（待 v2 / 生成）
   - 客观任务：该 examLevel 有 active 题池 → 可练（带题量）；否则 → 题库建设中 */
function deriveTaskState(exam, task) {
  if (exam.status === 'draft') return { state: 'build', count: 0, reason: 'draft-exam' }
  if (isProductive(task)) return { state: 'plan', count: 0, reason: 'productive' }
  if (isExamTask(task)) {
    const cnt = typeCount(task, exam.id)
    if (cnt > 0) return { state: 'ok', count: cnt, reason: 'pool' }
    return { state: 'build', count: 0, reason: 'empty-pool' }
  }
  return { state: 'build', count: 0, reason: 'unknown' }
}
// section → 候选 taskTypes 里第一个可练的（与 sectionType 优先级一致）
function bestTask(exam, section) {
  for (const t of section.taskTypes) {
    const s = deriveTaskState(exam, t)
    if (s.state === 'ok') return t
  }
  return section.taskTypes[0]
}
// section 整体状态：任一候选可练 → ok；全是生产性 → plan；否则 build
function deriveSectionState(exam, section) {
  const states = section.taskTypes.map(t => deriveTaskState(exam, t).state)
  if (states.includes('ok')) return 'ok'
  if (states.every(s => s === 'plan')) return 'plan'
  return 'build'
}

Object.assign(window, {
  LEVELS, L_ORDER, LEVEL_IDX, TYPES, TYPE_BY_KEY, WORD_UNIVERSE_TYPES, EXAM_TASK_TYPES,
  PRODUCTIVE_TASK_TYPES, DEPRECATED_QUESTION_TYPES, isWordUniverse, isExamTask, isProductive, isDeprecated,
  WU_FAMILIES, WU_TYPES, wuFamTypes, typeAvail, typeCount, fmt, levelZh, typeSummary,
  EXAM_SPECS, getExamSpec, TASK_LABELS, taskLabel, SKILL_META, GROUP_MODE_ZH,
  deriveTaskState, bestTask, deriveSectionState,
})
