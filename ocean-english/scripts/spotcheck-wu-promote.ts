/* 只读抽查：promote 后 /api/practice/session（buildPracticeSession）能否抽到新 active word-universe 题。
   确认：能抽到题、字段完整、word-universe 无 stimulus 泄露、answer 为学习模式即时反馈（choice id）。
   用法：npx tsx scripts/spotcheck-wu-promote.ts */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { buildPracticeSession } from '@/lib/practice/session-builder'

const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))

async function main() {
  let errors = 0
  for (const tt of ['def_to_word', 'synonym_choice', 'confusable_choice']) {
    const r = await buildPracticeSession(db, { mode: 'task', examId: 'toefl', taskType: tt, level: 6, count: 5 })
    console.log(`\n=== ${tt}: source=${r.source} items=${r.items.length} warnings=[${r.warnings.join(',')}] ===`)
    if (r.items.length === 0) { console.error(`  ERROR ${tt} 抽不到题`); errors++ }
    for (const it of r.items) {
      const choices = (it.choices ?? []).map((c) => c.text).join('/')
      const hasStim = !!it.stimulus
      console.log(`  - "${it.prompt}" | [${choices}] | answer=${JSON.stringify(it.answer)} | stimulus=${hasStim} | type=${it.type}`)
      // word-universe 不应带 stimulus（无篇章/无 transcript 泄露）
      if (hasStim) { console.error(`    ERROR ${tt} 不应带 stimulus`); errors++ }
      // 结构完整：prompt + 4 choices + answer
      if (!it.prompt || (it.choices?.length ?? 0) !== 4 || it.answer == null) { console.error(`    ERROR ${tt} 字段不完整`); errors++ }
    }
  }
  console.log(`\nspotcheck-wu-promote · 错误 ${errors}`)
  process.exit(errors ? 1 : 0)
}
main().catch((e) => { console.error('spotcheck fatal', e?.message ?? e); process.exit(1) })
