/* ════════════════════════════════════════════════════════════════════════
   audit-answer-position.ts — 答案位置 A/B/C/D 分布守卫（补 QA 盲区）

   背景：现有 QA 查结构/状态/退役/answer 命中，但不拦截「答案位置偏斜」——
   某题型答案几乎集中在某个字母会被用户摸出规律。本脚本按 stage × status × task_type
   统计 choice 题答案位置分布，单位置占比超阈值即判偏斜（退出码 1），可用于 promote 后守卫/报告。

   只读。用法：
     npx tsx scripts/audit-answer-position.ts --stage=wu-pz-2026-07-01
     npx tsx scripts/audit-answer-position.ts --stage=wu-pz-2026-07-01 --status=active --max-share=0.45
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))

const argValue = (n: string) => { const h = process.argv.find((a) => a.startsWith(`${n}=`)); return h ? h.slice(n.length + 1) : null }
const STAGE = argValue('--stage') ?? 'wu-pz-2026-07-01'
const STATUS = argValue('--status') // 不填=active+draft 分组
const MAX_SHARE = Number(argValue('--max-share') || '0.40') // 单位置占比上限（4 选均衡=0.25）
const LETTERS = ['a', 'b', 'c', 'd']

async function main() {
  let q = db.from('question_sets').select('status, task_type, question_items(input_mode, answer)').contains('qa_flags', { stage: STAGE })
  if (STATUS) q = q.eq('status', STATUS)
  const { data, error } = await q
  if (error) throw new Error(error.message)

  // dist[status|task_type][letter] = count
  const dist = new Map<string, Record<string, number>>()
  for (const s of (data ?? []) as { status: string; task_type: string; question_items: { input_mode: string; answer: unknown }[] }[]) {
    for (const it of s.question_items ?? []) {
      if (it.input_mode !== 'choice') continue
      const ans = String(it.answer)
      if (!LETTERS.includes(ans)) continue
      const key = `${s.status}|${s.task_type}`
      const rec = dist.get(key) ?? {}
      rec[ans] = (rec[ans] ?? 0) + 1
      dist.set(key, rec)
    }
  }

  let skewed = 0
  console.log(`answer-position audit · stage=${STAGE}${STATUS ? ` · status=${STATUS}` : ''} · max-share=${MAX_SHARE}`)
  for (const key of [...dist.keys()].sort()) {
    const rec = dist.get(key)!
    const total = LETTERS.reduce((a, l) => a + (rec[l] ?? 0), 0)
    if (!total) continue
    const top = Math.max(...LETTERS.map((l) => rec[l] ?? 0))
    const share = top / total
    const bad = share > MAX_SHARE
    if (bad) skewed++
    const fmt = LETTERS.map((l) => `${l.toUpperCase()}${rec[l] ?? 0}`).join('/')
    console.log(`  ${bad ? '✗' : '✓'} ${key}: ${fmt} (n=${total}, 最高位占比 ${(share * 100).toFixed(0)}%)`)
  }
  console.log(skewed ? `\n偏斜组数 ${skewed} —— 不达上线均衡标准` : `\n全部均衡（无单位置超 ${(MAX_SHARE * 100).toFixed(0)}%）`)
  process.exitCode = skewed ? 1 : 0
}
main().catch((e) => { console.error('audit-answer-position fatal', e?.message ?? e); process.exitCode = 1 })
