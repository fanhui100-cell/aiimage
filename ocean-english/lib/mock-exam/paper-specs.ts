/* ════════════════════════════════════════════════════════════════════════
   paper-specs.ts — 5 档国内考试「真实结构」模拟卷规格（仅客观题；写作/翻译/读后续写
   按既定决策不做）。结构=各考试公开的题型/题量/分值（公开事实），题目全部来自本项目
   原创题库（LexiOcean-* / AI 生成），不含任何真题版权内容。
   组卷器据此从 question_bank 按 类型+等级 抽题装配整卷。
   ════════════════════════════════════════════════════════════════════════ */

import { isDeprecatedQuestionType } from '@/lib/question-bank/question-type-taxonomy'

export interface MockSection {
  key: string
  label: string          // 区名（中）
  en: string
  types: string[]        // 候选题型（按优先级：第一个在该档有货就用，否则回退下一个）
  /** 取题方式：passages=按整篇取（阅读/听力，语篇连贯）；rows=按行取（单句/多空题，1 行=1 题组） */
  mode: 'passages' | 'rows'
  passages?: number      // mode=passages：取几篇（阅读约 3 题/篇）
  rows?: number          // mode=rows：取几行
  questions: number      // 该区计分小题数（用于展示/总分核对）
  points: number         // 该区分值
  note?: string
}

export interface MockPaperSpec {
  exam: string           // id
  level: number          // lv1-7
  zh: string             // 卷名
  cnExam: string         // 对应考试
  minutes: number        // 客观部分建议时长
  objectivePoints: number
  fullPoints: number     // 真卷满分（含未做的写作/翻译，仅标注）
  skipped: string[]      // 未含的主观题区
  comingSoon?: boolean   // 题库建设中：选卷台置灰、不可开始（托福/SAT）
  sections: MockSection[]
}

// 完形：真高考是「整篇 15 空」(cloze_passage)；该档若无则回退单句完形(cloze_choice)
export const MOCK_PAPER_SPECS: MockPaperSpec[] = [
  {
    exam: 'zhongkao', level: 1, zh: '中考英语 · 模拟卷', cnExam: '中考', minutes: 80,
    objectivePoints: 90, fullPoints: 120, skipped: ['词汇填空', '书面表达'],
    sections: [
      { key: 'listening', label: '听力理解', en: 'Listening', types: ['listening_comprehension'], mode: 'rows', rows: 15, questions: 15, points: 25 },
      { key: 'cloze', label: '完形填空', en: 'Cloze', types: ['cloze_passage', 'cloze_choice'], mode: 'rows', rows: 1, questions: 15, points: 15, note: '整篇完形；该档无整篇时回退单句完形×15' },
      { key: 'reading', label: '阅读理解', en: 'Reading', types: ['reading_comprehension'], mode: 'passages', passages: 5, questions: 15, points: 30 },
      { key: 'grammar', label: '语法选择', en: 'Usage', types: ['confusable_choice', 'synonym_choice'], mode: 'rows', rows: 20, questions: 20, points: 20, note: '基础词汇/辨析（中考单选区的原创替代）' },
    ],
  },
  {
    exam: 'gaokao', level: 2, zh: '高考英语 · 模拟卷（新高考）', cnExam: '高考', minutes: 100,
    objectivePoints: 110, fullPoints: 150, skipped: ['应用文写作', '读后续写'],
    sections: [
      { key: 'listening', label: '听力', en: 'Listening', types: ['listening_comprehension'], mode: 'rows', rows: 20, questions: 20, points: 30 },
      { key: 'reading', label: '阅读理解', en: 'Reading A', types: ['reading_comprehension'], mode: 'passages', passages: 5, questions: 15, points: 37 },
      { key: 'sevenselect', label: '七选五', en: 'Reading B (7→5)', types: ['seven_select'], mode: 'rows', rows: 1, questions: 5, points: 13 },
      { key: 'cloze', label: '完形填空', en: 'Cloze', types: ['cloze_passage', 'cloze_choice'], mode: 'rows', rows: 1, questions: 15, points: 15, note: '整篇完形；高考档暂无整篇 → 回退单句完形×15' },
      { key: 'grammar', label: '语法填空', en: 'Grammar Fill', types: ['grammar_fill'], mode: 'rows', rows: 1, questions: 10, points: 15 },
    ],
  },
  {
    exam: 'cet4', level: 3, zh: 'CET-4 · 模拟卷', cnExam: '四级', minutes: 95,
    objectivePoints: 497, fullPoints: 710, skipped: ['写作', '翻译'],
    sections: [
      { key: 'listening', label: '听力理解', en: 'Listening', types: ['listening_comprehension'], mode: 'rows', rows: 25, questions: 25, points: 249 },
      { key: 'banked', label: '选词填空', en: 'Banked Cloze', types: ['banked_cloze'], mode: 'rows', rows: 1, questions: 10, points: 35 },
      { key: 'match', label: '长篇阅读（段落匹配）', en: 'Matching', types: ['para_match'], mode: 'rows', rows: 1, questions: 10, points: 71 },
      { key: 'reading', label: '仔细阅读', en: 'Careful Reading', types: ['reading_comprehension'], mode: 'passages', passages: 4, questions: 10, points: 142 },
    ],
  },
  {
    exam: 'cet6', level: 4, zh: 'CET-6 · 模拟卷', cnExam: '六级', minutes: 95,
    objectivePoints: 497, fullPoints: 710, skipped: ['写作', '翻译'],
    sections: [
      { key: 'listening', label: '听力理解', en: 'Listening', types: ['listening_comprehension'], mode: 'rows', rows: 25, questions: 25, points: 249 },
      { key: 'banked', label: '选词填空', en: 'Banked Cloze', types: ['banked_cloze'], mode: 'rows', rows: 1, questions: 10, points: 35 },
      { key: 'match', label: '长篇阅读（段落匹配）', en: 'Matching', types: ['para_match'], mode: 'rows', rows: 1, questions: 10, points: 71 },
      { key: 'reading', label: '仔细阅读', en: 'Careful Reading', types: ['reading_comprehension'], mode: 'passages', passages: 4, questions: 10, points: 142 },
    ],
  },
  {
    exam: 'kaoyan', level: 5, zh: '考研英语 · 模拟卷', cnExam: '考研', minutes: 110,
    objectivePoints: 60, fullPoints: 100, skipped: ['翻译', '写作'],
    sections: [
      // 退役 cet_cloze（Phase 0A）：考研完形优先整篇完形 cloze_passage；该档暂无整篇时
      // 临时回退单句完形 cloze_choice（已注释标记），待 v2 考研完形题组补齐后移除该回退。
      { key: 'cloze', label: '完形填空（英语知识运用）', en: 'Cloze', types: ['cloze_passage', 'cloze_choice'], mode: 'rows', rows: 1, questions: 20, points: 10 },
      { key: 'reading', label: '阅读理解 Part A', en: 'Reading A', types: ['reading_comprehension'], mode: 'passages', passages: 7, questions: 20, points: 40 },
      { key: 'newtype', label: '新题型 Part B', en: 'Reading B', types: ['para_match', 'seven_select'], mode: 'rows', rows: 1, questions: 5, points: 10 },
    ],
  },
  // 托福 / SAT —— 题库建设中（comingSoon）：选卷台占位置灰、不可开始；结构为规划草案。
  {
    exam: 'toefl', level: 6, zh: 'TOEFL iBT · 模拟卷', cnExam: '托福', minutes: 54,
    objectivePoints: 60, fullPoints: 120, skipped: ['口语 Speaking', '写作 Writing'], comingSoon: true,
    sections: [
      { key: 'reading', label: '阅读 Reading', en: 'Reading', types: ['reading_comprehension'], mode: 'passages', passages: 7, questions: 20, points: 30 },
      { key: 'listening', label: '听力 Listening', en: 'Listening', types: ['listening_comprehension'], mode: 'rows', rows: 28, questions: 28, points: 30 },
    ],
  },
  {
    exam: 'sat', level: 7, zh: 'SAT · 模拟卷', cnExam: 'SAT', minutes: 64,
    objectivePoints: 400, fullPoints: 800, skipped: ['数学 Math（另卷）'], comingSoon: true,
    sections: [
      { key: 'reading', label: '阅读与文法 Reading & Writing', en: 'Reading & Writing', types: ['reading_comprehension', 'synonym_substitute'], mode: 'passages', passages: 18, questions: 54, points: 400 },
    ],
  },
]

// 不变量守卫（Phase 0A）：模拟卷任何 section 的候选题型都不得是退役题型。
// 静态数据，正常恒过；若未来误加回退役题型则在加载时 fail-fast。
for (const spec of MOCK_PAPER_SPECS) {
  for (const section of spec.sections) {
    const deprecated = section.types.filter(isDeprecatedQuestionType)
    if (deprecated.length) {
      throw new Error(`[paper-specs] ${spec.exam}/${section.key} 含退役题型: ${deprecated.join(', ')}`)
    }
  }
}

export const getPaperSpec = (exam: string) => MOCK_PAPER_SPECS.find(p => p.exam === exam)
