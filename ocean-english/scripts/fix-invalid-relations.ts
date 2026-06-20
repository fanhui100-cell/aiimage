/* 删除 audit-relations 标记的格式非法/疑似编造 同义/反义行（scripts/.audit-flags.json）
   用法：npx tsx scripts/fix-invalid-relations.ts [--apply] */
import { createClient } from '@supabase/supabase-js'; import { readFileSync } from 'fs'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const APPLY = process.argv.includes('--apply')
async function delIds(table: string, ids: string[]) {
  let n = 0
  for (let i = 0; i < ids.length; i += 100) { const part = ids.slice(i, i + 100); const { error, count } = await db.from(table).delete({ count: 'exact' }).in('id', part); if (error) { console.error(table, error.message); process.exit(1) } n += count ?? 0 }
  return n
}
async function main() {
  const flags = JSON.parse(readFileSync('scripts/.audit-flags.json', 'utf8')) as { syn: string[]; ant: string[] }
  console.log(`待删 同义 ${flags.syn.length}　反义 ${flags.ant.length}　${APPLY ? 'APPLY' : 'dry-run'}`)
  if (!APPLY) { console.log('dry-run，未删。加 --apply 执行。'); return }
  const s = await delIds('dictionary_synonyms', flags.syn)
  const a = await delIds('dictionary_antonyms', flags.ant)
  console.log(`已删 同义 ${s}　反义 ${a}`)
}
main().catch(e => { console.error('fatal', e?.message ?? e); process.exit(1) })
