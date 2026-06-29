/* ════════════════════════════════════════════════════════════════════════
   validate-practice-session.ts — Practice Session API 校验（Phase 4，只读）

   直接调用 lib/practice/session-builder（service role 连库，不经 HTTP），验证：
   - word 会话可建、item 形状正确
   - task 会话（cet4 reading）可建、不含退役题型
   - 退役题型请求 → 空池、绝不输出退役题
   有断言失败退出 1。
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { buildPracticeSession } from '@/lib/practice/session-builder'
import { isDeprecatedQuestionType } from '@/lib/question-bank/question-type-taxonomy'
import type { PracticeItem } from '@/lib/practice/session-types'

const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const url = readEnv('NEXT_PUBLIC_SUPABASE_URL')
const key = readEnv('SUPABASE_SERVICE_ROLE_KEY')
if (!url || !key) {
  console.error('缺少 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const db = createClient(url, key)

const errors: string[] = []
function check(cond: boolean, msg: string) {
  if (!cond) errors.push(msg)
}

function checkItemShape(item: PracticeItem, ctx: string) {
  check(typeof item.id === 'string' && item.id.length > 0, `${ctx}: item.id 缺失`)
  check(typeof item.type === 'string' && item.type.length > 0, `${ctx}: item.type 缺失`)
  check(typeof item.inputMode === 'string' && item.inputMode.length > 0, `${ctx}: item.inputMode 缺失`)
  check(typeof item.prompt === 'string', `${ctx}: item.prompt 缺失`)
  check(Array.isArray(item.targetWords), `${ctx}: item.targetWords 非数组`)
  check(Array.isArray(item.subskills), `${ctx}: item.subskills 非数组`)
  check(!isDeprecatedQuestionType(item.type), `${ctx}: item.type 为退役题型 "${item.type}"`)
}

async function main() {
  // 取一个「确定有 active 题」的目标词做 word 会话：先取 active question_items，再查其
  // question_target_words 的 surface（与 session-builder word mode 的 target-first 同口径）；
  // 兜底退回 question_bank 第一个 active 词。全程 order 保证确定，避免随机抽到无题词致红绿不稳（P2-7）。
  let sampleWord: string | undefined
  const { data: actItems } = await db.from('question_items').select('id').eq('status', 'active').order('id').limit(100)
  const actIds = (actItems ?? []).map((r) => (r as { id: string }).id)
  if (actIds.length) {
    const { data: tw } = await db.from('question_target_words').select('surface').in('question_item_id', actIds).not('surface', 'is', null).order('surface').limit(1)
    sampleWord = (tw?.[0] as { surface: string } | undefined)?.surface
  }
  if (!sampleWord) {
    const { data: sample } = await db.from('question_bank').select('normalized_word').eq('status', 'active').eq('is_reviewed', true).not('normalized_word', 'is', null).order('normalized_word').limit(1)
    sampleWord = (sample?.[0] as { normalized_word: string } | undefined)?.normalized_word
  }
  check(!!sampleWord, '无法取到有题的样本词（v2 target words 与 v1 题库均空）')

  // 1) word 会话
  if (sampleWord) {
    const wordRes = await buildPracticeSession(db, { mode: 'word', word: sampleWord, count: 6 })
    check(wordRes.ok === true, 'word 会话 ok 应为 true')
    check(['v1', 'v2', 'empty'].includes(wordRes.source), 'word 会话 source 非法')
    check(wordRes.items.length > 0, `word 会话「${sampleWord}」应有题（实际 ${wordRes.items.length}）`)
    wordRes.items.forEach((it, i) => checkItemShape(it, `word#${i}`))
    console.log(`  word("${sampleWord}"): source=${wordRes.source} items=${wordRes.items.length} warnings=[${wordRes.warnings.join(',')}]`)
  }

  // 2) task 会话：cet4 仔细阅读
  const taskRes = await buildPracticeSession(db, { mode: 'task', examId: 'cet4', taskType: 'reading_comprehension', level: 3, count: 6 })
  check(taskRes.ok === true, 'task 会话 ok 应为 true')
  check(taskRes.items.length > 0, `task(cet4 reading_comprehension) 应有题（实际 ${taskRes.items.length}）`)
  taskRes.items.forEach((it, i) => {
    checkItemShape(it, `task#${i}`)
    check(it.type === 'reading_comprehension', `task#${i}: type 应为 reading_comprehension，实际 ${it.type}`)
  })
  console.log(`  task(cet4/reading_comprehension): source=${taskRes.source} items=${taskRes.items.length} warnings=[${taskRes.warnings.join(',')}]`)

  // 3) 退役题型 → 空池，绝不输出退役题
  const depRes = await buildPracticeSession(db, { mode: 'task', taskType: 'antonym_choice', level: 1, count: 6 })
  check(depRes.ok === true, '退役题型会话 ok 应为 true')
  check(depRes.items.length === 0, `退役题型应返回空（实际 ${depRes.items.length}）`)
  check(depRes.source === 'empty', `退役题型 source 应为 empty，实际 ${depRes.source}`)
  console.log(`  task(antonym_choice deprecated): source=${depRes.source} items=${depRes.items.length} warnings=[${depRes.warnings.join(',')}]`)

  // 4) cet_cloze 退役同样为空
  const dep2 = await buildPracticeSession(db, { mode: 'task', taskType: 'cet_cloze', level: 5, count: 6 })
  check(dep2.items.length === 0 && dep2.source === 'empty', 'cet_cloze 退役应返回空')

  console.log(`\npractice-session validation · 错误 ${errors.length}`)
  for (const e of errors) console.error(`ERROR ${e}`)
  if (errors.length > 0) process.exit(1)
  console.log('practice session ok')
}

main().catch((e) => {
  console.error('fatal', e?.message ?? e)
  process.exit(1)
})
