/* ════════════════════════════════════════════════════════════════════════
   fix-listening-explanation-letters.ts — 修 5 题听力解析末尾错误的「选X」字母（一次性）

   背景：normalize-listening-answer-positions 跳过的 5 题，解析末尾「，因此选X/故选X/选X」引错字母
   （经人工对照原文：答案键全部正确、解析推理文字也正确，仅末尾字母是历史复制粘贴笔误，多为「选B」）。
   方案 B（owner 选定）：删掉末尾这句字母引用 —— 解析前半句已说清内容；与其余 666 道无字母引用的
   听力解析一致；且不再受选项位置变化影响。**只改 explanation_zh，绝不动 answer/choices/音频。**
   用法：npx tsx scripts/fix-listening-explanation-letters.ts            （dry-run）
        npx tsx scripts/fix-listening-explanation-letters.ts -- --apply （写库）
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { loadDotenv } from './load-dotenv'

loadDotenv()
const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))
const APPLY = process.argv.includes('--apply')

const IDS = [
  '0bd75a6e-2ec9-4262-93c2-9800f4310c31',
  '3a68762f-b246-49f9-a2ca-9480e1d09d95',
  '5e651287-da85-4309-9ee6-93265ff0a081',
  '613f5eca-59f8-4b67-9ffd-4535384b6912',
  '7db483bb-f6fc-4dc3-8483-198f35950aab',
]
// 末尾「，/、 [因此/故/所以] 选 X [。]」整句删除（仅锚定结尾）
const TAIL = /[，,、]\s*(因此|故|所以)?\s*选\s*[A-D]\s*[。.]?\s*$/i
// 任意位置的选项字母引用（用于自检：修后必须不再命中）
const ANY_LETTER = /[（(]\s*[A-D]\s*[）)]|\b[A-D]\b项|选\s*[A-D]|答案\s*[是为：:]?\s*[A-D]|option\s*[A-D]|\b[A-D][.)）、]/i

async function main() {
  const { data: items } = await db.from('question_items').select('id, answer, choices, explanation_zh').in('id', IDS)
  let violations = 0
  const changes: { id: string; from: string; to: string }[] = []

  for (const id of IDS) {
    const it = (items ?? []).find((x) => x.id === id)
    if (!it) { console.error(`✗ ${id} 不存在`); violations++; continue }
    const old = String(it.explanation_zh ?? '')
    if (!TAIL.test(old)) { console.error(`✗ ${id} 末尾未匹配「选X」句，跳过（请人工核查）：${old.slice(-30)}`); violations++; continue }
    let next = old.replace(TAIL, '。').replace(/。。$/, '。')
    if (!/[。.！!？?]$/.test(next)) next += '。'
    // 自检：① 删除的只是末尾字母句（前缀保持）② 修后不再含任何选项字母引用
    const removed = old.slice(0, old.length) // for display
    const prefixOk = old.startsWith(next.replace(/。$/, '')) // 新文本（去尾句号）应是原文前缀
    const noLetter = !ANY_LETTER.test(next)
    if (!prefixOk || !noLetter) {
      console.error(`✗ ${id} 自检失败 prefixOk=${prefixOk} noLetter=${noLetter}`)
      violations++
      continue
    }
    void removed
    changes.push({ id, from: old, to: next })
    console.log(`\n${id}  (answer=${String(it.answer).toUpperCase()}，未改)`)
    console.log(`  旧: ${old}`)
    console.log(`  新: ${next}`)
  }

  console.log(`\n变更 ${changes.length} / ${IDS.length} · 自检违例 ${violations}`)
  if (violations > 0) { console.error('自检未全过，拒绝写库。'); process.exit(1) }
  if (!APPLY) { console.log('(dry-run：未写库。加 --apply 写入。)'); return }

  for (const ch of changes) {
    const { error } = await db.from('question_items').update({ explanation_zh: ch.to }).eq('id', ch.id)
    if (error) { console.error('  ✗', ch.id, error.message); process.exit(1) }
  }
  console.log(`✓ 写入 ${changes.length} 题（仅 explanation_zh）`)
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
