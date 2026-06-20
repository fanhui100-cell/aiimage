/* exam-task-data.ts — 考试专项的 task 标签 / skill 视觉 / 三态推导（Phase 6）
   数据真源：lib/exam-specs（结构）+ drill-data.typeCount（题量占位）+ taxonomy（题型分类）。
   三态逻辑与后端 /api/practice/session 空池判定一致；可练卡点击仍以 session 真值兜底。
   题量为 drill-data 静态占位；精确 itemAvailable 待后端 exam-specs 接口补字段（follow-up）。 */
import { typeCount } from '@/components/screens/drill/drill-data'
import { isExamTaskType } from '@/lib/question-bank/question-type-taxonomy'
import { PRODUCTIVE_TASK_TYPES, type ExamSpec, type ExamSectionSpec } from '@/lib/exam-specs'

const PROD_SET = new Set<string>(PRODUCTIVE_TASK_TYPES)
export const isProductiveTaskType = (t: string): boolean => PROD_SET.has(t)

export const TASK_LABELS: Record<string, [string, string]> = {
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
export const taskLabel = (t: string): [string, string] => TASK_LABELS[t] ?? [t, t]

export interface SkillMeta { ic: string; color: string; bg: string; zh: string }
export const SKILL_META: Record<string, SkillMeta> = {
  vocabulary: { ic: 'eye', color: '#0c9b8e', bg: 'rgba(18,179,163,.12)', zh: '词汇' },
  grammar: { ic: 'pen', color: '#c08a2a', bg: 'rgba(192,138,42,.12)', zh: '语法' },
  reading: { ic: 'book', color: '#7c57d8', bg: 'rgba(139,110,224,.13)', zh: '阅读' },
  listening: { ic: 'ear', color: '#4b6ed6', bg: 'rgba(75,110,214,.12)', zh: '听力' },
  speaking: { ic: 'mic', color: '#bf4a30', bg: 'rgba(191,74,48,.12)', zh: '口语' },
  writing: { ic: 'pen', color: '#e0608a', bg: 'rgba(224,96,138,.1)', zh: '写作' },
  translation: { ic: 'list', color: '#c08a2a', bg: 'rgba(192,138,42,.12)', zh: '翻译' },
  integrated: { ic: 'list', color: '#0c9b8e', bg: 'rgba(18,179,163,.12)', zh: '综合' },
}
export const skillMeta = (skill: string): SkillMeta => SKILL_META[skill] ?? SKILL_META.vocabulary

export const GROUP_MODE_ZH: Record<string, string> = { single: '单题', rows: '按行取', passages: '按整篇', paper: '整卷' }

export type TaskState = 'ok' | 'build' | 'plan'
export interface TaskStateInfo { state: TaskState; count: number }

/** task 三态：draft 档→build；生产性→plan；客观任务→有池 ok（带题量）/ 空池 build。 */
export function deriveTaskState(exam: ExamSpec, task: string): TaskStateInfo {
  if (exam.status === 'draft') return { state: 'build', count: 0 }
  if (isProductiveTaskType(task)) return { state: 'plan', count: 0 }
  if (isExamTaskType(task)) {
    const cnt = typeCount(task, exam.id)
    return cnt > 0 ? { state: 'ok', count: cnt } : { state: 'build', count: 0 }
  }
  return { state: 'build', count: 0 }
}

/** section 候选 taskTypes 里第一个可练的（与组卷优先级一致）。 */
export function bestTask(exam: ExamSpec, section: ExamSectionSpec): string {
  for (const t of section.taskTypes) if (deriveTaskState(exam, t).state === 'ok') return t
  return section.taskTypes[0]
}

/** section 整体态：任一候选 ok→ok；全 plan→plan；否则 build。 */
export function deriveSectionState(exam: ExamSpec, section: ExamSectionSpec): TaskState {
  const states = section.taskTypes.map((t) => deriveTaskState(exam, t).state)
  if (states.includes('ok')) return 'ok'
  if (states.every((s) => s === 'plan')) return 'plan'
  return 'build'
}
