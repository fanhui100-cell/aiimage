/* scoring/score-translation.ts — 翻译评分（Phase 12）。源文(sourceText)+译文(text)，rubric 驱动。 */
import { getRubric } from './rubrics'
import { runRubricScoring, type EngineOpts } from './score-engine'
import type { ScoreInput, SubjectiveScore } from './rubric-types'

export type TranslationScoreResult = SubjectiveScore | { error: 'no_translation_rubric' }

export async function scoreTranslation(input: ScoreInput, opts?: EngineOpts): Promise<TranslationScoreResult> {
  const rubric = getRubric(input.examId, 'translation')
  if (!rubric) return { error: 'no_translation_rubric' }
  const score = await runRubricScoring(rubric, input, opts)
  // 缺源文 → 仍可估分，但提示译文准确维度不可靠
  if (!input.sourceText) score.warnings = [...score.warnings, 'missing_source_text']
  return score
}
