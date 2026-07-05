/* ════════════════════════════════════════════════════════════════════════
   fix-choice-prefixes.ts — 清洗阅读/听力选择题选项里「烤进去的字母前缀」
   bug：gen-reading/gen-listening 把 DeepSeek 的 "A. xxx/B. xxx" 选项原样入库，
   App 再叠加 A/B/C/D 标号 → 双字母「B. C. xxx」；且解析里「故选X」是洗牌前的字母。
   修：① 去掉每个 choice.text 开头的 [A-D][.、):：] 前缀（answer 是 id，不受影响）
       ② 去掉 explanation_zh 末尾不可靠的「故选X/答案为X/选X」字母引用（保留推理）
   用法：npx tsx scripts/fix-choice-prefixes.ts [--apply]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'; import { readFileSync } from 'fs'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const APPLY = process.argv.includes('--apply')
const TYPES = ['reading_comprehension', 'listening_comprehension']
const PREFIX = /^\s*[A-Da-d]\s*[.、)）:：]\s*/
// 去掉解析里洗牌前的字母引用：「，故选B」「故选 B。」「答案为C」「正确答案是D」「选B」(结尾)。非全局，避免 .test() 有状态
const LETREF = /[，,。]?\s*(故选|应选|正确答案[为是]?|答案[为是]|选)\s*[A-Da-d]\s*[）)。.]?\s*$/

async function pageAll<T>(t: string, c: string, ty: string): Promise<T[]> {
  const o: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data } = await db.from(t).select(c).eq('type', ty).order('id', { ascending: true }).range(from, from + 999)
    const r = (data ?? []) as T[]; o.push(...r); if (r.length < 1000) break
  }
  return o
}

async function main() {
  let scanned = 0, fixedChoices = 0, fixedExp = 0
  const updates: { id: string; choices?: unknown; explanation_zh?: string }[] = []
  for (const ty of TYPES) {
    const rows = await pageAll<{ id: string; choices: { id: string; text: string }[] | null; explanation_zh: string | null }>('question_bank', 'id, choices, explanation_zh', ty)
    for (const r of rows) {
      scanned++
      let changed = false
      const upd: { id: string; choices?: unknown; explanation_zh?: string } = { id: r.id }
      if (Array.isArray(r.choices)) {
        const hasPref = r.choices.some(c => PREFIX.test(String(c.text ?? '')))
        if (hasPref) { upd.choices = r.choices.map(c => ({ ...c, text: String(c.text ?? '').replace(PREFIX, '').trim() })); fixedChoices++; changed = true }
      }
      const exp = String(r.explanation_zh ?? '')
      if (LETREF.test(exp)) { upd.explanation_zh = exp.replace(LETREF, '').trim(); fixedExp++; changed = true }
      if (changed) updates.push(upd)
    }
  }
  console.log(`扫描 ${scanned}（阅读+听力）· 选项需修 ${fixedChoices} · 解析字母引用需清 ${fixedExp} · 待更新 ${updates.length}　${APPLY ? 'APPLY' : 'dry-run'}`)
  if (updates[0]) console.log('样例修后:', JSON.stringify((updates.find(u => u.choices)?.choices as any)?.slice?.(0, 2)))
  if (!APPLY) { console.log('dry-run。加 --apply。'); return }
  let n = 0, errs = 0
  // 并行分批更新（每批 25 条）提速：~12k 条几十秒
  for (let i = 0; i < updates.length; i += 25) {
    const batch = updates.slice(i, i + 25)
    const res = await Promise.all(batch.map(u => {
      const patch: Record<string, unknown> = {}
      if (u.choices) patch.choices = u.choices
      if (u.explanation_zh !== undefined) patch.explanation_zh = u.explanation_zh
      return db.from('question_bank').update(patch).eq('id', u.id)
    }))
    for (const r of res) { if (r.error) { errs++; if (errs <= 3) console.error('upd err', r.error.message) } else n++ }
    process.stdout.write(`\r更新 ${n}/${updates.length}（err ${errs}）`)
  }
  console.log(`\n已更新 ${n} 题（去前缀 ${fixedChoices}、清字母引用 ${fixedExp}）· 失败 ${errs}`)
}
main().catch(e => { console.error('fatal', e?.message ?? e); process.exit(1) })
