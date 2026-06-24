/* ════════════════════════════════════════════════════════════════════════
   smoke-paper-e2e.ts — R11 整卷端到端冒烟：生成 → 持久化 → 提交 → 判分 → 校验 → 清理

   用 service-role + 现有 profile 作测试用户，全程自建自删（删 instance 前先删
   question_attempts，因其 FK ON DELETE SET NULL 不级联）。断言：
   - 全对提交 → objectiveAwarded ≈ objectiveMax；paper_attempts 1 行；question_attempts
     行数=作答数且客观题 is_correct=true；instance→submitted。
   - 重复提交 → already_submitted（status 409）。
   - 错答提交 → objectiveAwarded < objectiveMax；存在 is_correct=false。
   - productive(若有)→ needsManualOrAi=true，且其 question_attempt is_correct=null。
   退出码：0 全过，1 任一失败。
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { loadDotenv } from './load-dotenv'
import { generatePaper, toClientPaper } from '@/lib/papers/paper-generator'
import { submitPaper } from '@/lib/papers/submit-paper'
import type { GeneratedPaper, ItemResponse } from '@/lib/papers/paper-types'

loadDotenv() // signAudioPath 依赖 process.env（听力音频签名）
const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))

let failures = 0
function check(cond: boolean, msg: string) {
  if (cond) console.log('  ✓', msg)
  else { console.log('  ✗', msg); failures++ }
}

/** 用快照重建一份「客户端视图」的卷（含 item/answerKey 来自原 paper，便于构造作答）。 */
function buildResponses(paper: GeneratedPaper, kind: 'correct' | 'wrong'): ItemResponse[] {
  const out: ItemResponse[] = []
  for (const s of paper.sections) {
    if (s.subjective) continue
    for (const it of s.items) {
      if (typeof it.answerKey === 'string') {
        if (kind === 'correct') out.push({ questionItemId: it.questionItemId, answer: it.answerKey })
        else {
          const other = (it.choices ?? []).map((c) => c.id).find((cid) => cid !== it.answerKey) ?? '__wrong__'
          out.push({ questionItemId: it.questionItemId, answer: other })
        }
      }
    }
  }
  return out
}

async function makeInstance(userId: string, paper: GeneratedPaper): Promise<string> {
  const clientPaper = toClientPaper(paper)
  const { data: inst, error } = await db.from('paper_instances').insert({
    user_id: userId, exam_id: null, seed: paper.seed, mode: paper.mode, status: 'in_progress',
    score: { snapshot: clientPaper },
  }).select('id').single()
  if (error) throw new Error('instance insert: ' + error.message)
  return (inst as { id: string }).id
}

async function cleanup(instanceId: string) {
  await db.from('question_attempts').delete().eq('paper_instance_id', instanceId)
  await db.from('paper_instances').delete().eq('id', instanceId) // CASCADE: paper_sections, paper_attempts
}

async function main() {
  console.log('smoke-paper-e2e: R11 整卷提交/判分端到端')

  const { data: prof } = await db.from('profiles').select('id').limit(1)
  const userId = prof && prof[0] ? (prof[0] as { id: string }).id : null
  if (!userId) { console.log('  ⚠ 无 profile，跳过（需至少一个用户）'); return }

  // 选一个「客观区有题且分值>0」的考试（SAT 用 200-800 缩放、section points=0，不适合分值断言）
  let paper: GeneratedPaper | null = null
  for (const ex of ['gaokao', 'cet4', 'cet6', 'kaoyan', 'zhongkao']) {
    const g = await generatePaper(db, { examId: ex, mode: 'full' })
    const objMax = (g.paper?.sections ?? []).filter((s) => !s.subjective).reduce((a, s) => a + (s.points || 0), 0)
    const objN = (g.paper?.sections ?? []).filter((s) => !s.subjective).reduce((a, s) => a + s.items.length, 0)
    if (g.paper && objMax > 0 && objN > 0) { paper = g.paper; console.log(`  · 选用 ${ex} full（objectiveMax=${objMax}）`); break }
  }
  if (!paper) { console.log('  ✗ 无可用考试（客观区有题且分值>0）'); failures++; return }
  const objItems = paper.sections.filter((s) => !s.subjective).flatMap((s) => s.items).filter((it) => typeof it.answerKey === 'string')
  check(objItems.length > 0, `full 卷有客观题可判分（实际 ${objItems.length}）`)
  const hasSubjective = paper.sections.some((s) => s.subjective)

  // ── Test 1：全对 ──
  let instA = ''
  try {
    instA = await makeInstance(userId, paper)
    // 全对应得「已填充客观区」的满分（空池客观区计入 objectiveMax 但无题可得分）
    const filledObjMax = paper.sections.filter((s) => !s.subjective && s.items.length > 0).reduce((a, s) => a + s.points, 0)
    const r1 = await submitPaper(db, userId, instA, buildResponses(paper, 'correct'))
    check(r1.ok && r1.status === 200, `全对提交 ok（status ${r1.status}）`)
    check(!!r1.score && Math.abs(r1.score.objectiveAwarded - filledObjMax) < 0.5, `全对得已填充客观区满分（${r1.score?.objectiveAwarded}/${filledObjMax}，objectiveMax=${r1.score?.objectiveMax}）`)
    if (hasSubjective) check(!!r1.score?.needsManualOrAi, '含主观区 → needsManualOrAi=true')
    // 持久化校验
    const { count: paCount } = await db.from('paper_attempts').select('*', { count: 'exact', head: true }).eq('paper_instance_id', instA)
    check(paCount === 1, `paper_attempts 1 行（实际 ${paCount}）`)
    const { data: qa } = await db.from('question_attempts').select('is_correct, score').eq('paper_instance_id', instA)
    check((qa?.length ?? 0) === objItems.length, `question_attempts=作答数 ${objItems.length}（实际 ${qa?.length}）`)
    check((qa ?? []).every((x) => x.is_correct === true), '全对 → 每题 is_correct=true')
    const { data: instRow } = await db.from('paper_instances').select('status').eq('id', instA).single()
    check((instRow as { status: string })?.status === 'submitted', 'instance → submitted')
    // ── Test 2：重复提交 ──
    const r2 = await submitPaper(db, userId, instA, buildResponses(paper, 'correct'))
    check(!r2.ok && r2.status === 409 && r2.error === 'already_submitted', `重复提交被拒（status ${r2.status} ${r2.error}）`)
    const { count: paCount2 } = await db.from('paper_attempts').select('*', { count: 'exact', head: true }).eq('paper_instance_id', instA)
    check(paCount2 === 1, `重复提交未新增 paper_attempts（仍 ${paCount2}）`)
  } finally { if (instA) await cleanup(instA) }

  // ── Test 3：错答 ──
  let instB = ''
  try {
    instB = await makeInstance(userId, paper)
    const r3 = await submitPaper(db, userId, instB, buildResponses(paper, 'wrong'))
    check(r3.ok && !!r3.score && r3.score.objectiveAwarded < r3.score.objectiveMax, `错答 objectiveAwarded<objectiveMax（${r3.score?.objectiveAwarded}/${r3.score?.objectiveMax}）`)
    const { data: qaW } = await db.from('question_attempts').select('is_correct').eq('paper_instance_id', instB)
    check((qaW ?? []).some((x) => x.is_correct === false), '错答 → 存在 is_correct=false')
  } finally { if (instB) await cleanup(instB) }

  // ── Test 4：未登录/不存在 ──
  const rAnon = await submitPaper(db, null, 'x', [])
  check(!rAnon.ok && rAnon.status === 401, '未登录提交 → 401')
  const rMissing = await submitPaper(db, userId, '00000000-0000-0000-0000-000000000000', [])
  check(!rMissing.ok && rMissing.status === 404, '不存在实例 → 404')

  console.log(failures === 0 ? '\nsmoke-paper-e2e PASS' : `\nsmoke-paper-e2e FAIL（${failures} 项）`)
  if (failures) process.exitCode = 1
}
main().catch((e) => { console.error('smoke-paper-e2e fatal', e?.message ?? e); process.exit(1) })
