/* 清理线上词库里确认的坏词/拼写错/元素符号混入条目（审计确认在 dictionary_words）。
   删除该词及其子表行（释义/同义/反义/词源/助记/关系/题库）。先报告，--apply 执行。
   用法：npx tsx scripts/del-bad-words.ts [--apply] */
import { createClient } from '@supabase/supabase-js'; import { readFileSync } from 'fs'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const APPLY = process.argv.includes('--apply')
// id（=slug）→ 正确形式（仅供报告，删除时若正确形式已存在则放心删）
const BAD: Record<string, string> = {
  'aluminumal': 'aluminum', 'phosphorusp': 'phosphorus', 'iron-fe': 'iron', 'oxygen-o': 'oxygen',
  'undersize-d': 'undersized', 'sulfur-disoxide': 'sulfur dioxide', 'rusia': 'russia', 'guilde': 'guild',
  'lvory': 'ivory', 'distingusihed': 'distinguished',
}
async function main() {
  const ids = Object.keys(BAD)
  // 实际存在的坏词
  const { data: present } = await db.from('dictionary_words').select('id, word').in('id', ids)
  const have = (present ?? []) as { id: string; word: string }[]
  // 正确形式是否已在库（删了不丢覆盖）
  const correctSlugs = [...new Set(Object.values(BAD).map(v => v.toLowerCase().replace(/[^a-z0-9]+/g, '-')))]
  const { data: corr } = await db.from('dictionary_words').select('id').in('id', correctSlugs)
  const haveCorrect = new Set((corr ?? []).map((r: any) => r.id))
  console.log(`坏词在库 ${have.length}/${ids.length}　${APPLY ? 'APPLY' : 'dry-run'}`)
  for (const w of have) { const cs = BAD[w.id].toLowerCase().replace(/[^a-z0-9]+/g, '-'); console.log(`  ${w.id}「${w.word}」→ 正确「${BAD[w.id]}」${haveCorrect.has(cs) ? '（正确形式已在库 ✓）' : '（正确形式不在库，将仅删坏词）'}`) }
  if (!have.length) { console.log('无坏词，已干净。'); return }
  if (!APPLY) { console.log('\ndry-run。加 --apply 删除坏词及其子表行。'); return }
  const delIds = have.map(w => w.id)
  const childByWordId = ['dictionary_definitions', 'dictionary_synonyms', 'dictionary_antonyms', 'dictionary_etymology', 'word_mnemonics']
  for (const t of childByWordId) { const { error } = await db.from(t).delete().in('word_id', delIds); if (error) console.log(`  ${t}: ${error.message}`) }
  await db.from('word_relations').delete().in('word_id', delIds)
  await db.from('word_relations').delete().in('related_id', delIds)
  await db.from('question_bank').delete().in('word_id', delIds)
  const { error, count } = await db.from('dictionary_words').delete({ count: 'exact' }).in('id', delIds)
  if (error) { console.error('words delete err', error.message); process.exit(1) }
  console.log(`已删除 ${count ?? 0} 个坏词及其子表行。`)
}
main().catch(e => { console.error('fatal', e?.message ?? e); process.exit(1) })
