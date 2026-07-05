/* ════════════════════════════════════════════════════════════════════════
   practice/skill-task-map.ts — skillKey → 考试题型 task_type 映射（Phase 13 修复）

   skill_states 的 skillKey 来自 subskills（优先）/ sectionId / taskType（见 skill-state-updater
   的 skillKeysFor），是异质的；且单个 subskill 跨题型歧义（如 inference 既见于阅读也见于听力）。
   今日/Review 的「薄弱板块专练」过去把 skillKey 直接当 taskType 传给 /quiz，导致查不到 v2 题、
   进空池。

   本函数做 best-effort 归类：
   - skillKey 本身就是合法考试题型 → 直接用；
   - 按关键词归到最可能的题型（listening/seven_select/banked_cloze/cloze_passage/para_match/
     grammar_fill/reading_comprehension）；
   - 归不到（写作/口语等产出技能，或未知）→ 返回 undefined，调用方据此**不传 taskType**，
     让 session 按 examId(+level) 抽该考试的混合 active 题，避免空池。skillKey 仍可作 subskill 提示。
   ════════════════════════════════════════════════════════════════════════ */
import { isExamTaskType, type ExamTaskType } from '@/lib/question-bank/question-type-taxonomy'

export function skillKeyToTaskType(skillKey: string | null | undefined, examId?: string | null): ExamTaskType | undefined {
  if (!skillKey) return undefined
  const k = skillKey.toLowerCase()
  if (isExamTaskType(k)) return k as ExamTaskType
  // SAT 是 Digital RW 短文本 MCQ：四大 domain（含 Standard English Conventions 的 boundaries/verb_tense/
  // form_structure_sense/transitions 等）实际题型全是 reading_comprehension（见 exam-specs SAT sections），
  // 不是独立 grammar_fill；故 SAT 下任何 subskill 都回 reading_comprehension，避免将来开放后误路由/空池。
  if ((examId ?? '').toLowerCase() === 'sat') return 'reading_comprehension'
  // 听力专有（同名 inference/detail 等歧义项默认归阅读，故听力放最前按专有词命中）
  if (/listen|conversation|lecture/.test(k)) return 'listening_comprehension'
  if (/seven|topic_sentence|logical_flow|^cohesion$|reference/.test(k)) return 'seven_select'
  if (/banked|^collocation$|pos_consistency/.test(k)) return 'banked_cloze'
  if (/cloze|word_discrimination|context_coherence|logical_cohesion|discourse/.test(k)) return 'cloze_passage'
  if (/para_?match|info_matching|scanning/.test(k)) return 'para_match'
  if (/grammar|verb_tense|finite|agreement|article|preposition|pronoun|connective|comparative|modifier|parallelism|punctuation|boundaries|form_structure|word_order|sentence_structure|conventions|transitions/.test(k)) return 'grammar_fill'
  if (/read|inference|main_idea|detail|vocab|paraphrase|gist|attitude|purpose|argument|evidence|central_idea|text_structure|words_in_context|rhetor|comprehension|locate_information|literal/.test(k)) return 'reading_comprehension'
  return undefined   // 写作/口语等产出技能 + 未知 → 不映射，调用方按 examId 抽混合题
}
