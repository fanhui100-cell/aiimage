/* 统计被同义/反义引用但不在词库的「缺失词」及其被引用次数 */
import { createClient } from '@supabase/supabase-js'; import { readFileSync, writeFileSync } from 'fs'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const WORDRE = /^[a-z][a-z'-]*$/
async function pageAll<T>(t: string, c: string): Promise<T[]> { const o: T[] = []; for (let f = 0; ; f += 1000) { const { data } = await db.from(t).select(c).range(f, f + 999); const r = (data ?? []) as T[]; o.push(...r); if (r.length < 1000) break } return o }
async function main() {
  const words = await pageAll<{ word: string }>('dictionary_words', 'word')
  const wordSet = new Set(words.map(w => w.word.toLowerCase().trim()))
  const cnt = new Map<string, number>()
  for (const r of await pageAll<{ synonym: string }>('dictionary_synonyms', 'synonym')) { const s = String(r.synonym ?? '').toLowerCase().trim(); if (WORDRE.test(s) && !wordSet.has(s)) cnt.set(s, (cnt.get(s) ?? 0) + 1) }
  for (const r of await pageAll<{ antonym: string }>('dictionary_antonyms', 'antonym')) { const s = String(r.antonym ?? '').toLowerCase().trim(); if (WORDRE.test(s) && !wordSet.has(s)) cnt.set(s, (cnt.get(s) ?? 0) + 1) }
  const arr = [...cnt].sort((a, b) => b[1] - a[1])
  const ge = (n: number) => arr.filter(([, c]) => c >= n).length
  console.log(`缺失词（distinct）：${arr.length}`)
  console.log(`  被引用 >=1: ${ge(1)}   >=2: ${ge(2)}   >=3: ${ge(3)}   >=5: ${ge(5)}`)
  console.log('Top 30 高频缺失词：')
  console.log('  ' + arr.slice(0, 30).map(([w, c]) => `${w}(${c})`).join(', '))
  writeFileSync('scripts/.missing-words.json', JSON.stringify(arr.map(([word, count]) => ({ word, count }))))
  console.log('\n已写 scripts/.missing-words.json')
}
main().catch(e => { console.error('fatal', e?.message ?? e); process.exit(1) })
