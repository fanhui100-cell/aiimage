/* scoring/score-speaking.ts — 口语评分（Phase 12）。
   本期基于**文字转写**评分；音频转写/评分尚未就绪（audioScoring='not_ready'）。
   不接收、不存储原始麦克风音频。 */
import { getRubric } from './rubrics'
import { runRubricScoring, type EngineOpts } from './score-engine'
import type { ScoreInput, SubjectiveScore } from './rubric-types'

export type SpeakingScoreResult = SubjectiveScore | { error: 'no_speaking_rubric' | 'transcript_required' }

export async function scoreSpeaking(input: ScoreInput, opts?: EngineOpts): Promise<SpeakingScoreResult> {
  const rubric = getRubric(input.examId, 'speaking')
  if (!rubric) return { error: 'no_speaking_rubric' }
  if (!input.text || !input.text.trim()) return { error: 'transcript_required' }   // 无转写无法评分
  const score = await runRubricScoring(rubric, input, opts)
  return {
    ...score,
    transcriptUsed: true,
    audioScoring: 'not_ready',
    warnings: [...score.warnings, 'audio_scoring_not_ready', 'scored_from_text_transcript'],
  }
}
