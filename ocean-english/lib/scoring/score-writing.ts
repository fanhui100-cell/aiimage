/* scoring/score-writing.ts — 写作评分（Phase 12）。rubric 驱动，AI/mock 自动回退。 */
import { getRubric } from './rubrics'
import { runRubricScoring, type EngineOpts } from './score-engine'
import type { ScoreInput, SubjectiveScore } from './rubric-types'

export type WritingScoreResult = SubjectiveScore | { error: 'no_writing_rubric' }

export async function scoreWriting(input: ScoreInput, opts?: EngineOpts): Promise<WritingScoreResult> {
  const rubric = getRubric(input.examId, 'writing')
  if (!rubric) return { error: 'no_writing_rubric' }   // 如 SAT：不提供写作评分
  return runRubricScoring(rubric, input, opts)
}
