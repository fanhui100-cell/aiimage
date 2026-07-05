/* ════════════════════════════════════════════════════════════════════════
   align-collocation-questions.ts — 让 collocation_choice 题答案被词条搭配资料支撑
   把每道 collocation_choice 题的正确答案（真实搭配短语）回填进 dictionary_collocations
   （该词尚无此短语时才加），实现「搭配题里有的，词条详情也有」。
   用法：npx tsx scripts/align-collocation-questions.ts [--apply]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'; import { readFileSync } from 'fs'; import { randomUUID } from 'crypto'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const APPLY = process.argv.includes('--apply')
async function pageAll<T>(t: string, c: string, f?: (q: any) => any): Promise<T[]> { const o: T[] = []; for (let from = 0; ; from += 1000) { let q: any = db.from(t).select(c).order('id', { ascending: true }).range(from, from + 999); if (f) q = f(q); const { data } = await q; const r = (data ?? []) as T[]; o.push(...r); if (r.length < 1000) break } return o }

async function main() {
  const wordIds = new Set((await pageAll<{ id: string }>('dictionary_words', 'id')).map(r => r.id))
  // 现有搭配：word_id → set(phrase 小写)
  const have = new Map<string, Set<string>>(); const maxOi = new Map<string, number>()
  for (const c of await pageAll<{ word_id: string; phrase: string; order_index: number }>('dictionary_collocations', 'word_id, phrase, order_index')) {
    if (!have.has(c.word_id)) have.set(c.word_id, new Set())
    have.get(c.word_id)!.add(String(c.phrase ?? '').toLowerCase().trim())
    maxOi.set(c.word_id, Math.max(maxOi.get(c.word_id) ?? -1, c.order_index ?? 0))
  }
  const qs = await pageAll<{ word_id: string | null; normalized_word: string | null; choices: { id: string; text: string }[] | null; answer: string | null; answer_text: string | null; explanation_zh: string | null }>(
    'question_bank', 'word_id, normalized_word, choices, answer, answer_text, explanation_zh', (q: any) => q.eq('type', 'collocation_choice').eq('status', 'active'))
  console.log(`collocation_choice 题 ${qs.length}`)
  const add: Record<string, unknown>[] = []; let already = 0, noWord = 0
  for (const q of qs) {
    const wid = q.word_id && wordIds.has(q.word_id) ? q.word_id : (q.normalized_word && wordIds.has(q.normalized_word) ? q.normalized_word : null)
    if (!wid) { noWord++; continue }
    const ans = String(q.answer_text ?? (q.choices ?? []).find(c => c.id === q.answer)?.text ?? '').trim()
    if (!ans || !/[a-z]/i.test(ans)) continue
    const set = have.get(wid) ?? new Set(); if (set.has(ans.toLowerCase())) { already++; continue }
    const oi = (maxOi.get(wid) ?? -1) + 1; maxOi.set(wid, oi); set.add(ans.toLowerCase()); have.set(wid, set)
    add.push({ id: randomUUID(), word_id: wid, phrase: ans, example_en: null, example_zh: String(q.explanation_zh ?? '').trim() || null, order_index: oi })
  }
  console.log(`需新增搭配 ${add.length}（题答案已在词条 ${already}，答案词不在库 ${noWord}）　${APPLY ? 'APPLY' : 'dry-run'}`)
  console.log('样例:', add.slice(0, 6).map(r => `${r.word_id}:${r.phrase}`).join(' | '))
  if (!APPLY) { console.log('\ndry-run。加 --apply。'); return }
  for (let i = 0; i < add.length; i += 500) { const { error } = await db.from('dictionary_collocations').insert(add.slice(i, i + 500)); if (error) { console.error('insert err', error.message); process.exit(1) } }
  console.log(`已回填 ${add.length} 条搭配（题→词条对齐）。`)
}
main().catch(e => { console.error('fatal', e?.message ?? e); process.exit(1) })
