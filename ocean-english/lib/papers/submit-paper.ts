/* ════════════════════════════════════════════════════════════════════════
   papers/submit-paper.ts — 模拟卷提交与服务端权威判分（R11）

   契约（服务端权威，绝不信任客户端答案键）：
   - 校验登录 + 实例归属（RLS 之外再显式 user_id 比对，service-role 调用也安全）。
   - 状态机：仅 in_progress 可提交；submitted 再次提交 → already_submitted（防重复终判）。
   - 答案键不在客户端载荷、也不存用户可读列——提交时从 question_items.answer 现取（active 题
     answer 本就按自学模式可读，源唯一）。客户端只送 {questionItemId, answer}。
   - 客观题服务端判分（choice/spell 精确、multi_blank/matching 逐空部分）；productive(free_text/
     speak)恒 needsScoring，绝不伪造对错。
   - 持久化：paper_attempts（整卷分）+ 每题 question_attempts（is_correct/score 仅客观题）。
   - 仅记录有作答的题；未作答题不写 attempt（计 0 分由 scorePaper 处理）。
   ════════════════════════════════════════════════════════════════════════ */
import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeExamId } from '@/lib/exam-specs'
import { scorePaper } from './scoring'
import type { GeneratedPaper, ItemResponse, PaperItem, PaperScore, PaperSection } from './paper-types'

export interface SubmitPaperResult {
  ok: boolean
  status: number
  paperAttemptId?: string
  score?: PaperScore
  error?: string
  warnings: string[]
}

interface SnapshotShape {
  examId?: string
  sections?: Array<PaperSection & { items: PaperItem[] }>
}

/** 从客户端快照（无 answerKey）+ DB 现取 answer 重建可判分的 GeneratedPaper。 */
async function reconstructWithAnswerKeys(db: SupabaseClient, snapshot: SnapshotShape): Promise<GeneratedPaper> {
  const sections = Array.isArray(snapshot.sections) ? snapshot.sections : []
  const itemIds = sections.flatMap((s) => (s.items ?? []).map((it) => it.questionItemId)).filter(Boolean)
  const keyById = new Map<string, unknown>()
  for (let i = 0; i < itemIds.length; i += 200) {
    const { data } = await db.from('question_items').select('id, answer').in('id', itemIds.slice(i, i + 200))
    for (const r of (data ?? []) as { id: string; answer: unknown }[]) keyById.set(r.id, r.answer)
  }
  const rebuilt = sections.map((s) => ({
    ...s,
    items: (s.items ?? []).map((it) => ({ ...it, answerKey: keyById.get(it.questionItemId) })),
  }))
  // 仅 scorePaper 用到 sections；其余字段透传（快照携带）。
  return { ...(snapshot as unknown as GeneratedPaper), sections: rebuilt as PaperSection[] }
}

export async function submitPaper(
  db: SupabaseClient,
  userId: string | null,
  instanceId: string | null | undefined,
  responses: ItemResponse[],
): Promise<SubmitPaperResult> {
  const warnings: string[] = []
  if (!userId) return { ok: false, status: 401, error: 'unauthenticated', warnings }
  if (!instanceId) return { ok: false, status: 400, error: 'missing_id', warnings }
  if (!Array.isArray(responses)) return { ok: false, status: 400, error: 'invalid_responses', warnings }

  const { data: inst, error } = await db
    .from('paper_instances')
    .select('id, user_id, seed, mode, status, score')
    .eq('id', instanceId)
    .maybeSingle()
  if (error) {
    const notApplied = /relation|does not exist|schema cache/i.test(error.message)
    return { ok: false, status: notApplied ? 503 : 500, error: notApplied ? 'v2_not_applied' : 'query_error', warnings }
  }
  if (!inst) return { ok: false, status: 404, error: 'not_found', warnings }
  if (inst.user_id !== userId) return { ok: false, status: 403, error: 'forbidden', warnings }
  if (inst.status === 'submitted') return { ok: false, status: 409, error: 'already_submitted', warnings }
  if (inst.status !== 'in_progress') return { ok: false, status: 409, error: 'not_in_progress', warnings }

  const snapshot = ((inst.score ?? {}) as { snapshot?: SnapshotShape }).snapshot
  if (!snapshot || !Array.isArray(snapshot.sections)) return { ok: false, status: 422, error: 'no_snapshot', warnings }

  // 仅接受属于本卷的题的作答（防注入外部题）
  const paperItemIds = new Set<string>(snapshot.sections.flatMap((s) => (s.items ?? []).map((it) => it.questionItemId)))
  const valid = responses.filter((r) => r && paperItemIds.has(r.questionItemId) && r.answer != null)
  if (valid.length < responses.filter((r) => r && r.answer != null).length) warnings.push('dropped_unknown_items')

  const paper = await reconstructWithAnswerKeys(db, snapshot)
  const score = scorePaper(paper, valid)

  const { data: att, error: attErr } = await db
    .from('paper_attempts')
    .insert({ paper_instance_id: instanceId, user_id: userId, score, objective_score: score.objectiveAwarded, scaled_score: score.scaled })
    .select('id')
    .single()
  if (attErr) return { ok: false, status: 500, error: 'attempt_insert_failed', warnings }
  const paperAttemptId = (att as { id: string }).id

  // 每题 attempt：is_correct/score 仅客观题；productive 恒 null（绝不伪造对错）
  const examId = normalizeExamId(String(snapshot.examId ?? '')) // exam_specs 已 seed canonical
  const itemScoreById = new Map<string, { kind: string; awarded: number; correct?: boolean }>()
  for (const s of score.sections) for (const it of s.items) itemScoreById.set(it.questionItemId, it)
  const metaById = new Map<string, { setId: string | null; taskType: string | null; subskills: string[] }>()
  for (const s of snapshot.sections) {
    for (const it of (s.items ?? [])) {
      metaById.set(it.questionItemId, { setId: it.setId ?? null, taskType: s.taskType ?? null, subskills: (it as { subskills?: string[] }).subskills ?? [] })
    }
  }
  const rows = valid.map((r) => {
    const sc = itemScoreById.get(r.questionItemId)
    const meta = metaById.get(r.questionItemId) ?? { setId: null, taskType: null, subskills: [] }
    const objective = !!sc && sc.kind !== 'needs_manual_or_ai_scoring'
    return {
      user_id: userId,
      question_item_id: r.questionItemId,
      question_set_id: meta.setId,
      paper_instance_id: instanceId,
      exam_id: examId,
      section_id: null, // exam_sections.id 为前缀式；避免 FK 形态错配，分区信息由 paper_sections 承载
      task_type: meta.taskType,
      subskills: meta.subskills,
      answer: r.answer,
      is_correct: objective ? !!sc!.correct : null,
      score: objective ? sc!.awarded : null,
    }
  })
  if (rows.length) {
    const { error: qErr } = await db.from('question_attempts').insert(rows)
    if (qErr) warnings.push('question_attempts_insert_failed')
  }

  await db.from('paper_instances').update({ status: 'submitted', submitted_at: new Date().toISOString() }).eq('id', instanceId)

  return { ok: true, status: 200, paperAttemptId, score, warnings }
}
