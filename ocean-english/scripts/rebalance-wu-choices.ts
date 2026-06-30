/* ════════════════════════════════════════════════════════════════════════
   rebalance-wu-choices.ts — 重排 word-universe draft 的选项位置，消除答案位置偏斜

   背景：Claude 撰写时答案位置不均（def 偏 B、synonym 偏 B、confusable 偏 A），直接上线会露规律。
   本脚本对指定 stage 的 draft 题重排 choices，使每题型 A/B/C/D 答案位置基本均衡。

   契约（严格）：
   - 只改 question_items.choices（选项顺序）与 answer（字母）；不改题干/释义/target word/status/题型。
   - 选项文本集合不变（只换位置），答案词不变。
   - 确定性 + 幂等：目标位置由 (task_type 内按 set_id 排序的序号 % 4) 决定；干扰项按文本字母序填充。
     → apply 后再次 dry-run 改动数必为 0（收敛证明）。
   - 默认 dry-run；仅 --apply 写库。只动 status='draft'。

   用法：
     npx tsx scripts/rebalance-wu-choices.ts --stage=wu-pz-2026-07-01
     npx tsx scripts/rebalance-wu-choices.ts --stage=wu-pz-2026-07-01 --apply
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db: SupabaseClient = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))

const argValue = (n: string) => { const h = process.argv.find((a) => a.startsWith(`${n}=`)); return h ? h.slice(n.length + 1) : null }
const APPLY = process.argv.includes('--apply')
const STAGE = argValue('--stage') ?? 'wu-pz-2026-07-01'
const LETTER_IDS = ['a', 'b', 'c', 'd']

interface Choice { id: string; text: string }
interface Row { set_id: string; task_type: string; item_id: string; choices: Choice[]; answerId: string }

function rebalance(choices: Choice[], answerId: string, targetIdx: number): { newChoices: Choice[]; newAnswerId: string } {
  const answerText = choices.find((c) => c.id === answerId)!.text
  const distractors = choices.filter((c) => c.id !== answerId).map((c) => c.text).sort((a, b) => a.localeCompare(b))
  const out: string[] = []
  let di = 0
  for (let i = 0; i < 4; i++) out.push(i === targetIdx ? answerText : distractors[di++])
  return { newChoices: out.map((text, i) => ({ id: LETTER_IDS[i], text })), newAnswerId: LETTER_IDS[targetIdx] }
}

async function main() {
  // 读 stage 下 draft 题（每 set 1 item）
  const { data: setsData, error } = await db.from('question_sets')
    .select('id, task_type, question_items(id, choices, answer)')
    .eq('status', 'draft').contains('qa_flags', { stage: STAGE })
  if (error) throw new Error(error.message)
  const rows: Row[] = []
  for (const s of (setsData ?? []) as { id: string; task_type: string; question_items: { id: string; choices: Choice[]; answer: unknown }[] }[]) {
    const it = s.question_items?.[0]
    if (!it) continue
    rows.push({ set_id: s.id, task_type: s.task_type, item_id: it.id, choices: it.choices, answerId: String(it.answer) })
  }

  // 按 task_type 分组，组内按 set_id 排序 → 序号 % 4 = 目标位置
  const byType = new Map<string, Row[]>()
  for (const r of rows) { const a = byType.get(r.task_type) ?? []; a.push(r); byType.set(r.task_type, a) }
  for (const a of byType.values()) a.sort((x, y) => x.set_id.localeCompare(y.set_id))

  let changed = 0
  const beforeDist: Record<string, Record<string, number>> = {}
  const afterDist: Record<string, Record<string, number>> = {}
  const bump = (d: Record<string, Record<string, number>>, tt: string, id: string) => { d[tt] = d[tt] ?? {}; d[tt][id] = (d[tt][id] ?? 0) + 1 }

  for (const [tt, arr] of byType) {
    for (let i = 0; i < arr.length; i++) {
      const r = arr[i]
      bump(beforeDist, tt, r.answerId)
      const targetIdx = i % 4
      const { newChoices, newAnswerId } = rebalance(r.choices, r.answerId, targetIdx)
      bump(afterDist, tt, newAnswerId)
      const isSame = newAnswerId === r.answerId && JSON.stringify(newChoices) === JSON.stringify(r.choices)
      if (isSame) continue
      changed++
      if (APPLY) {
        const { error: uerr } = await db.from('question_items').update({ choices: newChoices, answer: newAnswerId }).eq('id', r.item_id)
        if (uerr) { console.error(`  update ${r.set_id}: ${uerr.message}`); process.exitCode = 1; return }
      }
    }
  }

  console.log(`rebalance ${APPLY ? 'APPLY' : 'DRY-RUN'} stage=${STAGE}: rows ${rows.length} · changed ${changed}`)
  for (const tt of byType.keys()) {
    const b = beforeDist[tt] ?? {}; const a = afterDist[tt] ?? {}
    const fmt = (d: Record<string, number>) => LETTER_IDS.map((l) => `${l.toUpperCase()}${d[l] ?? 0}`).join('/')
    console.log(`  ${tt}: before ${fmt(b)} → after ${fmt(a)}`)
  }
}
main().catch((e) => { console.error('rebalance fatal', e?.message ?? e); process.exitCode = 1 })
