/* ════════════════════════════════════════════════════════════════════════
   audit-passage-answers.ts — 整篇多空题「答案键结构」确定性审查（无需 AI）
   抓的是确凿错误（QA 标记的「段J不存在」即此类）：
     · para_match：answer 段下标 ≥ 短文实际段落数（[A][B]… 标记）/ 越界 / statements 与 answers 数量不符
     · seven_select：answer ≥ 候选库长 / 越界 / 答案重复（7选5 应各不相同）
     · banked_cloze：answer ≥ 词库长 / 越界
   命中=答案键确凿损坏，--apply 删除。
   用法：npx tsx scripts/audit-passage-answers.ts [--apply]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'; import { readFileSync } from 'fs'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const APPLY = process.argv.includes('--apply')

type Row = { id: string; normalized_word: string | null; hint: any; audio_ref: string | null }
async function pageAll(ty: string): Promise<Row[]> {
  const o: Row[] = []
  for (let f = 0; ; f += 1000) {
    const { data } = await db.from('question_bank').select('id, normalized_word, hint, audio_ref').eq('type', ty).eq('status', 'active').order('id', { ascending: true }).range(f, f + 999)
    const r = (data ?? []) as Row[]; o.push(...r); if (r.length < 1000) break
  }
  return o
}
const intArr = (a: unknown): number[] => Array.isArray(a) ? a.map(Number).filter(n => Number.isInteger(n)) : []

async function main() {
  const bad: { id: string; why: string }[] = []
  // para_match
  for (const r of await pageAll('para_match')) {
    const h = r.hint || {}; const ans = intArr(h.answers); const st = Array.isArray(h.statements) ? h.statements : []
    const marks = new Set((String(r.audio_ref ?? '').match(/\[([A-Z])\]/g) ?? []).map(m => m)); const realParas = marks.size
    const paras = Number(h.paras) || realParas
    const cap = Math.min(paras || realParas || 0, realParas || paras || 0) || Math.max(paras, realParas)
    if (!ans.length || !cap) bad.push({ id: r.id, why: 'para 无答案/无段落' })
    else if (ans.some(a => a < 0 || a >= cap)) bad.push({ id: r.id, why: `para 段越界(段${cap} 答案max${Math.max(...ans)})` })
    else if (st.length && st.length !== ans.length) bad.push({ id: r.id, why: `para 陈述${st.length}≠答案${ans.length}` })
  }
  // seven_select
  for (const r of await pageAll('seven_select')) {
    const h = r.hint || {}; const ans = intArr(h.answers); const bank = Array.isArray(h.bank) ? h.bank : []
    if (!ans.length || !bank.length) bad.push({ id: r.id, why: 'seven 无答案/无库' })
    else if (ans.some(a => a < 0 || a >= bank.length)) bad.push({ id: r.id, why: `seven 越界(库${bank.length})` })
    else if (new Set(ans).size !== ans.length) bad.push({ id: r.id, why: 'seven 答案重复' })
  }
  // banked_cloze
  for (const r of await pageAll('banked_cloze')) {
    const h = r.hint || {}; const ans = intArr(h.answers); const bank = Array.isArray(h.bank) ? h.bank : []
    if (!ans.length || !bank.length) bad.push({ id: r.id, why: 'banked 无答案/无库' })
    else if (ans.some(a => a < 0 || a >= bank.length)) bad.push({ id: r.id, why: `banked 越界(库${bank.length})` })
  }
  console.log(`确凿答案键损坏 ${bad.length} 题　${APPLY ? 'APPLY' : 'dry-run'}`)
  const byWhy: Record<string, number> = {}; for (const b of bad) { const k = b.why.split('(')[0]; byWhy[k] = (byWhy[k] || 0) + 1 }
  console.log('分类:', JSON.stringify(byWhy))
  console.log('样例:', bad.slice(0, 10).map(b => b.why).join(' | '))
  if (!APPLY) { console.log('dry-run。加 --apply 删除。'); return }
  let n = 0; const ids = bad.map(b => b.id)
  for (let i = 0; i < ids.length; i += 100) { const { count } = await db.from('question_bank').delete({ count: 'exact' }).in('id', ids.slice(i, i + 100)); n += count ?? 0 }
  console.log(`已删除 ${n} 道答案键损坏的整篇题。`)
}
main().catch(e => { console.error('fatal', e?.message ?? e); process.exit(1) })
