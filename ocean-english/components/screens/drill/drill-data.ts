/* ════════════════════════════════════════════════════════════════════
   drill-data.ts — 真实题库结构（移植自原型 data.jsx，数据一字不改，仅加类型 + export）
   ════════════════════════════════════════════════════════════════════ */

export interface LevelDef { key: string; zh: string; cefr: string; total: number; rec: boolean; desc: string }
export interface TypeDef { key: string; zh: string; fam: string; total: number; by: number[]; ai?: boolean }
export interface FamilyDef { key: string; zh: string; en: string; color: string; bg: string; ic: string; ai?: boolean; isNew?: boolean; was?: string }
export interface MockSectionSpec { key: string; label: string; en: string; types: string[]; mode: 'rows' | 'passages'; passages?: number; questions: number; points: number; note?: string }
export interface PaperSpec { exam: string; level: number; zh: string; cnExam: string; minutes: number; objectivePoints: number; fullPoints: number; skipped: string[]; comingSoon?: boolean; sections: MockSectionSpec[] }

// 7 个等级（列序：中考/高考/CET4/CET6/考研/托福/SAT）
const LEVELS: LevelDef[] = [
  { key: 'zhongkao', zh: '中考', cefr: 'A2', total: 25456, rec: false, desc: '基础词汇起步' },
  { key: 'gaokao', zh: '高考', cefr: 'B1', total: 27812, rec: false, desc: '高考核心词' },
  { key: 'cet4', zh: 'CET-4', cefr: 'B1', total: 17116, rec: true, desc: '四级应试应用' },
  { key: 'cet6', zh: 'CET-6', cefr: 'B2', total: 24283, rec: false, desc: '六级进阶词' },
  { key: 'kaoyan', zh: '考研', cefr: 'B2', total: 4906, rec: false, desc: '考研大纲词' },
  { key: 'toefl', zh: '托福', cefr: 'C1', total: 47474, rec: false, desc: '留学学术词' },
  { key: 'sat', zh: 'SAT', cefr: 'C1', total: 21551, rec: false, desc: '北美学术顶配' },
]
const L_ORDER = ['zhongkao', 'gaokao', 'cet4', 'cet6', 'kaoyan', 'toefl', 'sat']

const TYPES: TypeDef[] = [
  { key: 'en_to_zh', zh: '英译中', fam: 'recognize', total: 14538, by: [2164, 2437, 1400, 2157, 90, 4446, 1844] },
  { key: 'zh_to_en', zh: '中译英', fam: 'recognize', total: 14510, by: [2136, 2420, 1443, 2161, 84, 4427, 1839] },
  { key: 'def_to_word', zh: '看释义选词', fam: 'recognize', total: 14551, by: [2122, 2416, 1450, 2165, 84, 4460, 1854] },
  { key: 'synonym_choice', zh: '近义词', fam: 'recognize', total: 10913, by: [1800, 1920, 1219, 1710, 76, 2781, 1407] },
  { key: 'synonym_substitute', zh: '同义替换', fam: 'recognize', total: 8962, by: [1371, 1613, 934, 1360, 56, 2421, 1207] },
  // antonym_choice 已退役（Phase 0A/0B taxonomy）：从可见题型卡移除，不再可选
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
  // cet_cloze 已退役（Phase 0A/0B taxonomy）：从可见题型卡移除；篇章完形用 cloze_passage
  { key: 'cloze_passage', zh: '篇章完形', fam: 'read', total: 218, by: [179, 0, 0, 0, 39, 0, 0] },
  { key: 'seven_select', zh: '七选五', fam: 'read', total: 516, by: [163, 163, 0, 0, 190, 0, 0] },
  { key: 'banked_cloze', zh: '选词填空', fam: 'read', total: 324, by: [0, 0, 0, 180, 144, 0, 0] },
  { key: 'para_match', zh: '段落匹配', fam: 'read', total: 398, by: [0, 0, 144, 108, 146, 0, 0] },

  // 界面优化2·导航合并：口说 / 产出 两族（AI 生成、各等级恒可用，无 by[] 题量）
  { key: 'pron_score', zh: '发音评分', fam: 'speak', total: 0, by: [], ai: true },
  { key: 'speak_scene', zh: 'AI 口语', fam: 'speak', total: 0, by: [], ai: true },
  { key: 'sentence_make', zh: '用词造句', fam: 'produce', total: 0, by: [], ai: true },
  { key: 'sentence_polish', zh: 'AI 润色', fam: 'produce', total: 0, by: [], ai: true },
]

const FAMILIES: FamilyDef[] = [
  { key: 'recognize', zh: '识记 · 选择', en: 'Recognize', color: '#0c9b8e', bg: 'rgba(18,179,163,.12)', ic: 'eye' },
  { key: 'spell', zh: '拼写 · 词形', en: 'Spell', color: '#c08a2a', bg: 'rgba(192,138,42,.12)', ic: 'pen' },
  { key: 'listen', zh: '听力', en: 'Listen', color: '#4b6ed6', bg: 'rgba(75,110,214,.12)', ic: 'ear' },
  { key: 'read', zh: '阅读 · 篇章', en: 'Read', color: '#7c57d8', bg: 'rgba(139,110,224,.13)', ic: 'book' },
  // 新并入：原「发音 · 口语」「造句」入口
  { key: 'speak', zh: '口说 · 发音 + 口语', en: 'Speak', color: '#bf4a30', bg: 'rgba(191,74,48,.12)', ic: 'mic', ai: true, isNew: true, was: '发音 · 口语' },
  { key: 'produce', zh: '产出 · 造句', en: 'Produce', color: '#2f8f6b', bg: 'rgba(47,143,107,.12)', ic: 'sprout', ai: true, isNew: true, was: '造句' },
]

const TYPE_BY_KEY: Record<string, TypeDef> = Object.fromEntries(TYPES.map(t => [t.key, t]))
const LEVEL_IDX: Record<string, number> = Object.fromEntries(L_ORDER.map((k, i) => [k, i]))

function typeAvail(typeKey: string, levelKey: string | null): boolean {
  const t = TYPE_BY_KEY[typeKey]
  if (!t) return false
  if (t.ai) return true   // AI 题型各等级恒可用
  if (!levelKey) return true
  return t.by[LEVEL_IDX[levelKey]] > 0
}
function typeCount(typeKey: string, levelKey?: string | null): number {
  const t = TYPE_BY_KEY[typeKey]
  if (!t || t.ai) return 0   // AI 题型无固定题量
  return levelKey ? t.by[LEVEL_IDX[levelKey]] : t.total
}
function famTypes(famKey: string, levelKey?: string | null): TypeDef[] {
  return TYPES.filter(t => t.fam === famKey && (!levelKey || t.by[LEVEL_IDX[levelKey]] > 0))
}
function famAll(famKey: string): TypeDef[] { return TYPES.filter(t => t.fam === famKey) }

const fmt = (n: number) => n.toLocaleString('en-US')

const PAPER_SPECS: PaperSpec[] = [
  { exam: 'zhongkao', level: 1, zh: '中考英语 · 模拟卷', cnExam: '中考', minutes: 80, objectivePoints: 90, fullPoints: 120, skipped: ['词汇填空', '书面表达'], sections: [
    { key: 'listening', label: '听力理解', en: 'Listening', types: ['listening_comprehension'], mode: 'rows', questions: 15, points: 25 },
    { key: 'cloze', label: '完形填空', en: 'Cloze', types: ['cloze_passage', 'cloze_choice'], mode: 'rows', questions: 15, points: 15, note: '整篇完形；无整篇时回退单句完形×15' },
    { key: 'reading', label: '阅读理解', en: 'Reading', types: ['reading_comprehension'], mode: 'passages', questions: 15, points: 30 },
    { key: 'grammar', label: '语法选择', en: 'Usage', types: ['confusable_choice', 'synonym_choice'], mode: 'rows', questions: 20, points: 20 },
  ] },
  { exam: 'gaokao', level: 2, zh: '高考英语 · 模拟卷（新高考）', cnExam: '高考', minutes: 100, objectivePoints: 110, fullPoints: 150, skipped: ['应用文写作', '读后续写'], sections: [
    { key: 'listening', label: '听力', en: 'Listening', types: ['listening_comprehension'], mode: 'rows', questions: 20, points: 30 },
    { key: 'reading', label: '阅读理解', en: 'Reading A', types: ['reading_comprehension'], mode: 'passages', questions: 15, points: 37 },
    { key: 'sevenselect', label: '七选五', en: 'Reading B (7→5)', types: ['seven_select'], mode: 'rows', questions: 5, points: 13 },
    { key: 'cloze', label: '完形填空', en: 'Cloze', types: ['cloze_passage', 'cloze_choice'], mode: 'rows', questions: 15, points: 15 },
    { key: 'grammar', label: '语法填空', en: 'Grammar Fill', types: ['grammar_fill'], mode: 'rows', questions: 10, points: 15 },
  ] },
  { exam: 'cet4', level: 3, zh: 'CET-4 · 模拟卷', cnExam: '四级', minutes: 95, objectivePoints: 497, fullPoints: 710, skipped: ['写作', '翻译'], sections: [
    { key: 'listening', label: '听力理解', en: 'Listening', types: ['listening_comprehension'], mode: 'rows', questions: 25, points: 249 },
    { key: 'banked', label: '选词填空', en: 'Banked Cloze', types: ['banked_cloze'], mode: 'rows', questions: 10, points: 35 },
    { key: 'match', label: '长篇阅读 · 段落匹配', en: 'Matching', types: ['para_match'], mode: 'rows', questions: 10, points: 71 },
    { key: 'reading', label: '仔细阅读', en: 'Careful Reading', types: ['reading_comprehension'], mode: 'passages', questions: 10, points: 142 },
  ] },
  { exam: 'cet6', level: 4, zh: 'CET-6 · 模拟卷', cnExam: '六级', minutes: 95, objectivePoints: 497, fullPoints: 710, skipped: ['写作', '翻译'], sections: [
    { key: 'listening', label: '听力理解', en: 'Listening', types: ['listening_comprehension'], mode: 'rows', questions: 25, points: 249 },
    { key: 'banked', label: '选词填空', en: 'Banked Cloze', types: ['banked_cloze'], mode: 'rows', questions: 10, points: 35 },
    { key: 'match', label: '长篇阅读 · 段落匹配', en: 'Matching', types: ['para_match'], mode: 'rows', questions: 10, points: 71 },
    { key: 'reading', label: '仔细阅读', en: 'Careful Reading', types: ['reading_comprehension'], mode: 'passages', questions: 10, points: 142 },
  ] },
  { exam: 'kaoyan', level: 5, zh: '考研英语 · 模拟卷', cnExam: '考研', minutes: 110, objectivePoints: 60, fullPoints: 100, skipped: ['翻译', '写作'], sections: [
    { key: 'cloze', label: '完形填空 · 英语知识运用', en: 'Cloze', types: ['cloze_passage', 'cloze_choice'], mode: 'rows', questions: 20, points: 10 },
    { key: 'reading', label: '阅读理解 Part A', en: 'Reading A', types: ['reading_comprehension'], mode: 'passages', questions: 20, points: 40 },
    { key: 'newtype', label: '新题型 Part B', en: 'Reading B', types: ['para_match', 'seven_select'], mode: 'rows', questions: 5, points: 10 },
  ] },
  { exam: 'toefl', level: 6, zh: 'TOEFL iBT · 模拟卷', cnExam: '托福', minutes: 54, objectivePoints: 60, fullPoints: 120, comingSoon: true, skipped: ['口语 Speaking', '写作 Writing'], sections: [
    { key: 'reading', label: '阅读 Reading', en: 'Reading', types: ['reading_comprehension'], mode: 'passages', questions: 20, points: 30 },
    { key: 'listening', label: '听力 Listening', en: 'Listening', types: ['listening_comprehension'], mode: 'rows', questions: 28, points: 30 },
  ] },
  { exam: 'sat', level: 7, zh: 'SAT · 模拟卷', cnExam: 'SAT', minutes: 64, objectivePoints: 400, fullPoints: 800, comingSoon: true, skipped: ['数学 Math（另卷）'], sections: [
    { key: 'reading', label: '阅读与文法 Reading & Writing', en: 'Reading & Writing', types: ['reading_comprehension', 'synonym_substitute'], mode: 'passages', questions: 54, points: 400 },
  ] },
]
const getPaperSpec = (exam: string) => PAPER_SPECS.find(p => p.exam === exam)
function sectionType(section: MockSectionSpec, levelKey: string): string {
  return section.types.find(t => typeAvail(t, levelKey)) || section.types[section.types.length - 1]
}

export { LEVELS, L_ORDER, TYPES, FAMILIES, TYPE_BY_KEY, LEVEL_IDX, typeAvail, typeCount, famTypes, famAll, fmt, PAPER_SPECS, getPaperSpec, sectionType }
