/* ════════════════════════════════════════════════════════════════════════
   validate-exam-specs.ts — 七档考试规格不变量校验（Phase 1）。

   失败（非零退出码）条件：
   - 不是恰好 7 档
   - exam id 重复
   - level 不是 1-7 各恰好一次
   - 任一 section 没有 taskTypes
   - 任一 section 含退役题型 antonym_choice / cet_cloze
   - 任一 taskTypes 既不是考试任务类型（ALL_EXAM_TASK_TYPES），也不是「带 notes 说明的
     临时 word-universe 回退」
   - 任一 sourceUrls 为空
   - kaoyan 含 listening/speaking
   - sat 含 listening/speaking
   - toefl 缺 reading/listening/speaking/writing
   - sat 分制不是 fullScore 800 + scoringScale '200-800'（RW 单科 200-800，非总分 400-1600）
   - normalizeExamId('ielts') / normalizeExamId('gre') 不为 null（IELTS/GRE 不是 7 档别名）
   ════════════════════════════════════════════════════════════════════════ */
import { ALL_EXAM_TASK_TYPES, EXAM_SPECS, getExamSpec, normalizeExamId } from '@/lib/exam-specs'
import { isDeprecatedQuestionType, isWordUniverseType } from '@/lib/question-bank/question-type-taxonomy'

const errors: string[] = []
const allTaskTypes = new Set<string>(ALL_EXAM_TASK_TYPES)

// 1) 恰好 7 档
if (EXAM_SPECS.length !== 7) errors.push(`期望 7 档考试，实际 ${EXAM_SPECS.length}`)

// 2) exam id 唯一
const ids = EXAM_SPECS.map((s) => s.id)
const dupIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))]
if (dupIds.length) errors.push(`exam id 重复: ${dupIds.join(', ')}`)

// 3) level 1-7 各恰好一次
const levels = EXAM_SPECS.map((s) => s.level).sort((a, b) => a - b)
const expectedLevels = [1, 2, 3, 4, 5, 6, 7]
if (levels.length !== 7 || expectedLevels.some((v, i) => levels[i] !== v)) {
  errors.push(`level 必须 1-7 各恰好一次，实际 [${levels.join(', ')}]`)
}

for (const spec of EXAM_SPECS) {
  // sourceUrls 非空
  if (!Array.isArray(spec.sourceUrls) || spec.sourceUrls.length === 0) {
    errors.push(`${spec.id}: sourceUrls 为空`)
  }

  const skills = new Set(spec.sections.map((s) => s.skill))

  for (const sec of spec.sections) {
    // 4) taskTypes 非空
    if (!Array.isArray(sec.taskTypes) || sec.taskTypes.length === 0) {
      errors.push(`${spec.id}/${sec.id}: 没有 taskTypes`)
      continue
    }
    for (const t of sec.taskTypes) {
      // 5) 退役题型
      if (isDeprecatedQuestionType(t)) {
        errors.push(`${spec.id}/${sec.id}: 含退役题型 "${t}"`)
        continue
      }
      // 6) 合法考试任务类型
      if (allTaskTypes.has(t)) continue
      // 6b) 允许的临时 word-universe 回退（必须有 notes 说明）
      if (isWordUniverseType(t)) {
        if (!sec.notes || !sec.notes.trim()) {
          errors.push(`${spec.id}/${sec.id}: 临时 word-universe 回退 "${t}" 必须在 notes 说明`)
        }
        continue
      }
      errors.push(`${spec.id}/${sec.id}: taskType "${t}" 既非考试任务类型，也非允许的临时回退`)
    }
  }

  // 7) kaoyan / sat 不得含 listening / speaking
  if (spec.id === 'kaoyan' && (skills.has('listening') || skills.has('speaking'))) {
    errors.push('kaoyan 不应包含 listening/speaking section')
  }
  if (spec.id === 'sat' && (skills.has('listening') || skills.has('speaking'))) {
    errors.push('sat 不应包含 listening/speaking section')
  }

  // 8) toefl 必须四技能齐全
  if (spec.id === 'toefl') {
    for (const need of ['reading', 'listening', 'speaking', 'writing'] as const) {
      if (!skills.has(need)) errors.push(`toefl 缺少 ${need} section`)
    }
  }
}

// 9) SAT 分制：RW 单科 200-800（400-1600 是 SAT 总分，不是 RW 单科）
const sat = getExamSpec('sat')
if (!sat || sat.fullScore !== 800 || sat.scoringScale !== '200-800') {
  errors.push(`sat 分制应为 fullScore 800 + scoringScale '200-800'，实际 ${sat?.fullScore}/${sat?.scoringScale}`)
}

// 10) normalizeExamId 不得把 IELTS/GRE 误映射为 toefl/sat（它们不是 7 档别名）
for (const wrong of ['ielts', 'gre']) {
  if (normalizeExamId(wrong) !== null) {
    errors.push(`normalizeExamId("${wrong}") 应返回 null（IELTS/GRE 不是 7 档考试别名）`)
  }
}

console.log('exam-specs validation')
console.log(`  specs: ${EXAM_SPECS.length}`)
for (const spec of EXAM_SPECS) {
  console.log(`  - ${spec.id} (lv${spec.level}, ${spec.status}): ${spec.sections.length} sections`)
}
console.log(`  errors: ${errors.length}`)
for (const error of errors) console.error(`ERROR ${error}`)

if (errors.length > 0) {
  process.exit(1)
}

console.log(`exam specs ok: ${EXAM_SPECS.length} exams`)
