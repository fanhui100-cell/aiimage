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
import { loadDotenv } from './load-dotenv'
import type { PracticeItem } from '@/lib/practice/session-types'

loadDotenv()

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
  // word 会话固定取一个真实词（≥4 字母纯字母，order 确定）验证「真实目标词可建 word 会话且有题」，
  // 不用随机/单字母停用词，红绿稳定（P2-7）。
  // ⚠ 范围说明：active v2 题库当前没有「真实词 + active set」的 question_target_words（实测 0 行——真实词
  //   目标题多在 draft 档），故此 word 会话实际验证的是 v1 word fallback 链路（source 通常为 v1）；
  //   待相应档位 v2 题库 promote 后，同一断言会自然覆盖 v2 word 链路。
  const { data: sample } = await db.from('question_bank').select('normalized_word')
    .eq('status', 'active').eq('is_reviewed', true).not('normalized_word', 'is', null)
    .order('normalized_word').limit(500)
  const realWords = [...new Set(((sample ?? []) as { normalized_word: string }[]).map((r) => r.normalized_word).filter((w) => /^[a-z]{4,}$/i.test(w)))].sort()
  const sampleWord = realWords[0]
  check(!!sampleWord, '无法从 question_bank 取到真实样本词（≥4 字母）')

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

  // 5) TOEFL/SAT 已开放（spec status=active，第二轮）：考试专项能出 active 题，不再 exam_not_active 空池
  const satTask = await buildPracticeSession(db, { mode: 'task', examId: 'sat', taskType: 'reading_comprehension', level: 7, count: 4 })
  check(satTask.items.length > 0, `task(sat reading_comprehension) 应有题（实际 ${satTask.items.length}，warnings=${satTask.warnings.join(',')}）`)
  console.log(`  task(sat/reading_comprehension): source=${satTask.source} items=${satTask.items.length}`)
  const toeflTask = await buildPracticeSession(db, { mode: 'task', examId: 'toefl', taskType: 'complete_the_words', level: 6, count: 4 })
  check(toeflTask.items.length > 0, `task(toefl complete_the_words) 应有题（实际 ${toeflTask.items.length}，warnings=${toeflTask.warnings.join(',')}）`)
  console.log(`  task(toefl/complete_the_words): source=${toeflTask.source} items=${toeflTask.items.length}`)
  // 审计 P1：complete_the_words 的 stimulus 文本含完整答案词；session payload 绝不能把答案词下发到客户端。
  for (const it of toeflTask.items) {
    const ans = typeof it.answer === 'string' ? it.answer.toLowerCase().trim() : ''
    const stimText = it.stimulus ? JSON.stringify(it.stimulus).toLowerCase() : ''
    check(!it.stimulus, `complete_the_words 不应下发 stimulus（item ${it.questionItemId} 仍带 stimulus）`)
    check(!ans || !stimText.includes(ans), `complete_the_words payload 的 stimulus 含完整答案词「${ans}」= 答案泄露（item ${it.questionItemId}）`)
  }

  // 6) TOEFL listening active 专项：必须从 v2 出题、带 signed audio URL，且练习态不下发 transcript/textEn。
  for (const taskType of ['choose_a_response', 'listening_comprehension']) {
    const listenTask = await buildPracticeSession(db, { mode: 'task', examId: 'toefl', taskType, level: 6, count: 4 })
    check(listenTask.source === 'v2', `task(toefl ${taskType}) 应走 v2 active 池，实际 source=${listenTask.source}`)
    check(listenTask.items.length > 0, `task(toefl ${taskType}) 应有题（实际 ${listenTask.items.length}，warnings=${listenTask.warnings.join(',')}）`)
    for (const it of listenTask.items) {
      check(it.inputMode === 'listen', `task(toefl ${taskType}) item ${it.questionItemId} inputMode=${it.inputMode}，应为 listen`)
      check(!!it.audio?.url, `task(toefl ${taskType}) item ${it.questionItemId} 缺 audio.url`)
      check(!it.stimulus?.textEn && !it.stimulus?.textZh, `task(toefl ${taskType}) item ${it.questionItemId} 练习态不应下发 transcript/text`)
      check(!JSON.stringify(it).toLowerCase().includes('transcript'), `task(toefl ${taskType}) item ${it.questionItemId} payload 泄露 transcript 字段`)
    }
    console.log(`  task(toefl/${taskType}): source=${listenTask.source} items=${listenTask.items.length} audio=${listenTask.items.filter((it) => !!it.audio?.url).length}`)
  }

  console.log(`\npractice-session validation · 错误 ${errors.length}`)
  for (const e of errors) console.error(`ERROR ${e}`)
  if (errors.length > 0) process.exit(1)
  console.log('practice session ok')
}

main().catch((e) => {
  console.error('fatal', e?.message ?? e)
  process.exit(1)
})
