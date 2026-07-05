/* ════════════════════════════════════════════════════════════════════════
   smoke-active-serve.ts — 上线服务回归守卫（R13）

   防的是「set/items 已 active 但 stimulus 仍 draft」→ session-builder 按 qa_status='active'
   取 stimulus,draft 即不下发 → 阅读无 passage、听力无 audioUrl（曾全 691 active 受此影响）。
   断言：① 无 active set 的 stimulus 仍非 active；② 阅读会话真带 passage(stimulus.textEn)；
   ③ 听力会话真带 signed audioUrl 且不泄露 transcript。只读。用法：npm run smoke:active-serve
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { loadDotenv } from './load-dotenv'
import { buildPracticeSession } from '@/lib/practice/session-builder'
loadDotenv()
const env = readFileSync('.env.local', 'utf8')
const rd = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]!.trim()
const db = createClient(rd('NEXT_PUBLIC_SUPABASE_URL'), rd('SUPABASE_SERVICE_ROLE_KEY'))

let fails = 0
const check = (c: boolean, m: string) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++ }

async function firstActiveExamFor(taskType: string): Promise<{ examId: string; level: number } | null> {
  const L2E: Record<number, string> = { 1: 'zhongkao', 2: 'gaokao', 3: 'cet4', 4: 'cet6', 5: 'kaoyan', 7: 'sat' }
  const { data } = await db.from('question_sets').select('level').eq('status', 'active').eq('task_type', taskType).limit(1)
  if (!data || !data.length) return null
  const lvl = (data[0] as { level: number }).level
  return { examId: L2E[lvl] ?? '', level: lvl }
}

async function main() {
  console.log('smoke-active-serve: 上线服务回归守卫')

  // ① 无 active set 的 stimulus 仍非 active
  let sets: { stimulus_id: string | null }[] = []
  for (let f = 0; ; f += 1000) { const { data } = await db.from('question_sets').select('stimulus_id').eq('status', 'active').not('stimulus_id', 'is', null).range(f, f + 999); if (!data || !data.length) break; sets = sets.concat(data as { stimulus_id: string | null }[]); if (data.length < 1000) break }
  const ids = [...new Set(sets.map((s) => s.stimulus_id).filter(Boolean))] as string[]
  let nonActive = 0
  for (let i = 0; i < ids.length; i += 100) { const { data } = await db.from('stimuli').select('qa_status').in('id', ids.slice(i, i + 100)); for (const x of data || []) if ((x as { qa_status: string }).qa_status !== 'active') nonActive++ }
  check(nonActive === 0, `active set 的 stimulus 全 active（非 active=${nonActive}/${ids.length}）`)

  // ② 阅读会话带 passage
  const r = await firstActiveExamFor('reading_comprehension')
  if (r) {
    const res = await buildPracticeSession(db, { mode: 'task', examId: r.examId, taskType: 'reading_comprehension', level: r.level, count: 2 })
    const withPassage = res.items.filter((it) => (it as { stimulus?: { textEn?: string } }).stimulus?.textEn)
    check(res.items.length > 0 && withPassage.length === res.items.length, `阅读(${r.examId})会话每题带 passage（${withPassage.length}/${res.items.length}）`)
  } else check(false, '无 active 阅读可测')

  // ③ 听力会话带 signed audioUrl 且无 transcript 泄露
  const l = await firstActiveExamFor('listening_comprehension')
  if (l) {
    const res = await buildPracticeSession(db, { mode: 'task', examId: l.examId, taskType: 'listening_comprehension', level: l.level, count: 2 })
    const withAudio = res.items.filter((it) => (it as { stimulus?: { audioUrl?: string } }).stimulus?.audioUrl)
    const leak = res.items.filter((it) => (it as { stimulus?: { textEn?: string } }).stimulus?.textEn)
    check(res.items.length > 0 && withAudio.length === res.items.length, `听力(${l.examId})会话每题带 signed audioUrl（${withAudio.length}/${res.items.length}）`)
    check(leak.length === 0, '听力会话不下发 transcript(textEn)')
  } else check(false, '无 active 听力可测')

  console.log(fails === 0 ? '\nsmoke-active-serve PASS' : `\nsmoke-active-serve FAIL（${fails}）`)
  if (fails) process.exitCode = 1
}
main().catch((e) => { console.error('fatal', e?.message ?? e); process.exit(1) })
