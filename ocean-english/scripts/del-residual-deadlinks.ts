/* 删除扩库后仍指向「不在词库」的残余 同义/反义 死链（ECDICT 也无收录的生僻/垃圾词）
   用法：npx tsx scripts/del-residual-deadlinks.ts [--apply] */
import { createClient } from '@supabase/supabase-js'; import { readFileSync } from 'fs'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const APPLY = process.argv.includes('--apply')
const WORDRE = /^[a-z][a-z'-]*$/
async function pageAll<T>(t: string, c: string): Promise<T[]> { const o: T[] = []; for (let f = 0; ; f += 1000) { const { data } = await db.from(t).select(c).range(f, f + 999); const r = (data ?? []) as T[]; o.push(...r); if (r.length < 1000) break } return o }
async function main() {
  const words = await pageAll<{ word: string }>('dictionary_words', 'word')
  const wordSet = new Set(words.map(w => w.word.toLowerCase().trim()))
  const synDel: string[] = [], antDel: string[] = []
  for (const r of await pageAll<{ id: string; word_id: string; synonym: string }>('dictionary_synonyms', 'id, synonym')) { const s = String((r as any).synonym ?? '').toLowerCase().trim(); if (!s || (WORDRE.test(s) && !wordSet.has(s)) || !WORDRE.test(s)) { if (s && !wordSet.has(s)) synDel.push(r.id) } }
  for (const r of await pageAll<{ id: string; antonym: string }>('dictionary_antonyms', 'id, antonym')) { const s = String((r as any).antonym ?? '').toLowerCase().trim(); if (s && !wordSet.has(s)) antDel.push(r.id) }
  console.log(`残余死链：同义 ${synDel.length}　反义 ${antDel.length}　${APPLY ? 'APPLY' : 'dry-run'}`)
  if (!APPLY) { console.log('dry-run。加 --apply。'); return }
  let s = 0, a = 0
  for (let i = 0; i < synDel.length; i += 100) { const { count } = await db.from('dictionary_synonyms').delete({ count: 'exact' }).in('id', synDel.slice(i, i + 100)); s += count ?? 0 }
  for (let i = 0; i < antDel.length; i += 100) { const { count } = await db.from('dictionary_antonyms').delete({ count: 'exact' }).in('id', antDel.slice(i, i + 100)); a += count ?? 0 }
  console.log(`已删 同义 ${s}　反义 ${a}`)
}
main().catch(e => { console.error('fatal', e?.message ?? e); process.exit(1) })
