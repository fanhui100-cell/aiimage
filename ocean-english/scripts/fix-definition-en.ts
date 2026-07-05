/* ════════════════════════════════════════════════════════════════════════
   fix-definition-en.ts — 清洗 definition_en「中文当英文」污染（dictionary_definitions）
   现状：~56,465 条 definition_en 含中文或与 definition_zh 完全相同（= 假英文释义）。
   处理：把「含中文 或 与 definition_zh 相同」的 definition_en 置为空串（保留真英文 ~137 条）；
   definition_zh 不动。让英文释义覆盖回归诚实，避免词条页「中文当英文」重复显示、
   以及题库/AI 把中文当英文用。默认 dry-run；--apply 写库。
   用法：npx tsx scripts/fix-definition-en.ts [--apply]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'; import { readFileSync } from 'fs'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const APPLY = process.argv.includes('--apply')
const CJK = /[一-鿿぀-ゟ゠-ヿ]/

async function main() {
  const bad: string[] = []; let total = 0, realEn = 0
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('dictionary_definitions').select('id, definition_en, definition_zh').order('id', { ascending: true }).range(from, from + 999)
    if (error) { console.error(error.message); process.exit(1) }
    const rows = (data ?? []) as { id: string; definition_en: string | null; definition_zh: string | null }[]
    if (!rows.length) break
    for (const r of rows) {
      total++
      const en = String(r.definition_en ?? '').trim(); const zh = String(r.definition_zh ?? '').trim()
      if (!en) continue
      if (CJK.test(en) || en === zh) bad.push(r.id)
      else realEn++
    }
    if (rows.length < 1000) break
  }
  console.log(`释义总数 ${total}　真英文(保留) ${realEn}　污染待清(中文/重复) ${bad.length}　${APPLY ? 'APPLY' : 'dry-run'}`)
  if (!APPLY) { console.log('dry-run。加 --apply 把污染的 definition_en 置空。'); return }
  let n = 0
  for (let i = 0; i < bad.length; i += 200) {
    const { error, count } = await db.from('dictionary_definitions').update({ definition_en: '' }, { count: 'exact' }).in('id', bad.slice(i, i + 200))
    if (error) { console.error('update err', error.message); process.exit(1) }
    n += count ?? 0; process.stdout.write(`\r清洗 ${Math.min(i + 200, bad.length)}/${bad.length}`)
  }
  console.log(`\n已清洗 ${n} 条 definition_en（置空，保留 ${realEn} 条真英文）。`)
}
main().catch(e => { console.error('fatal', e?.message ?? e); process.exit(1) })
