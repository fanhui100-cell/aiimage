/* ════════════════════════════════════════════════════════════════════════
   scoring/rubrics.ts — 可复用评分维度 + 各档 rubric 预设（Phase 12）

   覆盖 zhongkao/gaokao/cet4/cet6/kaoyan/toefl 的生产性任务（写作/翻译/口语）。
   SAT 不做写作/口语评分（其 R&W 全为客观 MCQ，无生产性 section）。
   ════════════════════════════════════════════════════════════════════════ */
import { getExamSpec, PRODUCTIVE_TASK_TYPES, type ExamSectionSpec } from '@/lib/exam-specs'
import type { Rubric, RubricDimension, RubricDimensionKey, ScoringSkill } from './rubric-types'

const PRODUCTIVE = new Set<string>(PRODUCTIVE_TASK_TYPES)

// ── 可复用维度（labels + scale 0..5 + 分档描述）────────────────────────────────
const DIM_META: Record<RubricDimensionKey, { zh: string; en: string; desc: string }> = {
  task_achievement: { zh: '任务完成度', en: 'Task Achievement', desc: '是否完成题目要求（要点齐全、文体得当、字数达标）' },
  accuracy: { zh: '准确性', en: 'Accuracy', desc: '语言整体准确、无明显事实/表达错误' },
  vocabulary: { zh: '词汇', en: 'Vocabulary', desc: '词汇丰富度与用词准确、地道、贴合语域' },
  grammar: { zh: '语法', en: 'Grammar', desc: '句法结构正确、时态一致、错误密度低' },
  organization: { zh: '篇章结构', en: 'Organization', desc: '结构清晰、段落安排合理、起承转合' },
  coherence: { zh: '连贯衔接', en: 'Coherence', desc: '逻辑连贯、衔接自然、指代清楚' },
  pronunciation: { zh: '发音', en: 'Pronunciation', desc: '音准、重音、语调清晰可懂（基于转写近似评估）' },
  fluency: { zh: '流利度', en: 'Fluency', desc: '表达连贯、停顿/重复少、节奏自然' },
  translation_accuracy: { zh: '译文准确', en: 'Translation Accuracy', desc: '忠实原文、信息无遗漏/曲解、术语恰当' },
}

function dim(key: RubricDimensionKey, weight: number): RubricDimension {
  const m = DIM_META[key]
  return {
    key, labelZh: m.zh, labelEn: m.en, description: m.desc, weight,
    scale: { min: 0, max: 5 },
    bands: [
      { score: 5, descriptor: '优秀：基本无误，表达地道' },
      { score: 4, descriptor: '良好：偶有小误，不影响理解' },
      { score: 3, descriptor: '合格：有一些错误，整体可懂' },
      { score: 2, descriptor: '偏弱：错误较多，影响表达' },
      { score: 1, descriptor: '待提升：错误密集，难以理解' },
      { score: 0, descriptor: '未作答 / 跑题' },
    ],
  }
}

const WRITING_DIMS = (): RubricDimension[] => [dim('task_achievement', 0.3), dim('vocabulary', 0.2), dim('grammar', 0.2), dim('organization', 0.15), dim('coherence', 0.15)]
const SHORT_WRITING_DIMS = (): RubricDimension[] => [dim('task_achievement', 0.35), dim('vocabulary', 0.25), dim('grammar', 0.25), dim('coherence', 0.15)]
const TRANSLATION_DIMS = (): RubricDimension[] => [dim('translation_accuracy', 0.4), dim('vocabulary', 0.25), dim('grammar', 0.2), dim('coherence', 0.15)]
const SPEAKING_DIMS = (): RubricDimension[] => [dim('pronunciation', 0.2), dim('fluency', 0.2), dim('vocabulary', 0.15), dim('grammar', 0.15), dim('coherence', 0.15), dim('task_achievement', 0.15)]

function rubric(examId: string, skill: ScoringSkill, taskTypes: string[], nameZh: string, fullScore: number, dimensions: RubricDimension[], notes?: string): Rubric {
  return { id: `${examId}:${skill}`, examId, skill, taskTypes, nameZh, fullScore, dimensions, notes }
}

export const RUBRICS: Rubric[] = [
  rubric('zhongkao', 'writing', ['applied_writing'], '中考 · 书面表达', 15, SHORT_WRITING_DIMS(), '50-100 词应用文/邮件/留言。'),
  rubric('gaokao', 'writing', ['applied_writing', 'continuation_writing'], '高考 · 写作（应用文/读后续写）', 25, WRITING_DIMS(), '应用文 15 分 / 读后续写 25 分；估分按本 rubric 维度，满分以所测任务为准。'),
  rubric('cet4', 'writing', ['essay_writing'], 'CET-4 · 写作', 106, WRITING_DIMS(), '短文写作（约 120-180 词），占 15%。'),
  rubric('cet4', 'translation', ['translation_zh_en'], 'CET-4 · 翻译', 107, TRANSLATION_DIMS(), '汉译英段落，占 15%。'),
  rubric('cet6', 'writing', ['essay_writing'], 'CET-6 · 写作', 106, WRITING_DIMS(), '议论文/图表/社会议题。'),
  rubric('cet6', 'translation', ['translation_zh_en'], 'CET-6 · 翻译', 107, TRANSLATION_DIMS(), '更复杂主题段落汉译英。'),
  rubric('kaoyan', 'writing', ['applied_writing', 'essay_writing'], '考研 · 写作（小作文/大作文）', 30, WRITING_DIMS(), '小作文 10 分 / 大作文 20 分。'),
  rubric('kaoyan', 'translation', ['translation_en_zh'], '考研 · 翻译', 15, TRANSLATION_DIMS(), '英译汉（英一长难句 / 英二段落）。'),
  rubric('toefl', 'writing', ['build_a_sentence', 'email_writing', 'academic_discussion'], 'TOEFL · 写作', 6, WRITING_DIMS(), 'TOEFL 2026 写作（1-6 量表近似）。'),
  rubric('toefl', 'speaking', ['listen_and_repeat', 'interview_speaking'], 'TOEFL · 口语', 6, SPEAKING_DIMS(), 'TOEFL 2026 口语（1-6 量表近似）；本期基于文字转写评分。'),
]

const BY_KEY = new Map(RUBRICS.map((r) => [r.id, r]))

/** 取某档某技能的 rubric（如 cet4:writing）。无则 null。 */
export function getRubric(examId: string, skill: ScoringSkill): Rubric | null {
  return BY_KEY.get(`${examId}:${skill}`) ?? null
}

const SUBJECTIVE_SKILLS = new Set<string>(['writing', 'translation', 'speaking'])

/** 该 section 是否需要主观 rubric：技能为写作/翻译/口语 **且** 含生产性任务。
 *  - SAT「观点表达」skill=writing 但任务是 reading_comprehension（客观 MCQ）→ false。
 *  - TOEFL reading/listening 虽含 complete_the_words/choose_a_response 等生产性任务，
 *    但技能是 reading/listening（非主观评分）→ false。 */
export function sectionNeedsRubric(section: ExamSectionSpec): boolean {
  return SUBJECTIVE_SKILLS.has(section.skill) && section.taskTypes.some((t) => PRODUCTIVE.has(t))
}

/** 为某考试 section 解析 rubric（按 examId + section.skill）。 */
export function getRubricForSection(examId: string, section: ExamSectionSpec): Rubric | null {
  const skill = section.skill
  if (skill !== 'writing' && skill !== 'translation' && skill !== 'speaking') return null
  return getRubric(examId, skill)
}

/** 列出某考试所有需 rubric 的 section。 */
export function listSubjectiveSections(examId: string): ExamSectionSpec[] {
  const spec = getExamSpec(examId)
  if (!spec) return []
  return spec.sections.filter(sectionNeedsRubric)
}
