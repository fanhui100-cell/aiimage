/* 删除「该词无同义/反义词」却硬造的垃圾题：选项里有字面 "null" 占位，或解析为
   「…无清晰反义词/无明确反义词」。这类题答案是 null，毫无意义。
   用法：npx tsx scripts/del-null-questions.ts [--apply] */
import { createClient } from '@supabase/supabase-js'; import { readFileSync } from 'fs'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const APPLY = process.argv.includes('--apply')
const BAD = /无清晰|无明确(反义|近义)|无反义|无近义/

async function main() {
  // 仅关系类题型可能出现 "null" 占位；按 id 排序翻页（稳定，避免并发下漏读/重读）
  const TYPES = ['antonym_choice', 'synonym_choice', 'synonym_substitute', 'collocation_choice', 'confusable_choice']
  const flagged: string[] = []; const byType: Record<string, number> = {}; const ex: string[] = []
  let scanned = 0, after = ''
  for (; ;) {
    let q = db.from('question_bank').select('id, type, prompt, choices, explanation_zh').in('type', TYPES).order('id', { ascending: true }).limit(1000)
    if (after) q = q.gt('id', after)
    const { data, error } = await q
    if (error) { console.error(error.message); process.exit(1) }
    const rows = (data ?? []) as any[]; scanned += rows.length; if (!rows.length) break; after = rows[rows.length - 1].id
    for (const r of rows) {
      const nullOpt = Array.isArray(r.choices) && r.choices.some((c: any) => String(c?.text ?? '').trim().toLowerCase() === 'null')
      const badExp = r.explanation_zh && BAD.test(r.explanation_zh)
      if (nullOpt || badExp) { flagged.push(r.id); byType[r.type] = (byType[r.type] ?? 0) + 1; if (ex.length < 12) ex.push(`${r.prompt}「${r.explanation_zh ?? ''}」`) }
    }
    if (rows.length < 1000) break
  }
  console.log(`扫描 ${scanned} 题，判为垃圾（无同义/反义硬造）${flagged.length} 题　${APPLY ? 'APPLY' : 'dry-run'}`)
  console.log('按题型:', Object.entries(byType).map(([t, n]) => `${t} ${n}`).join(' · '))
  console.log('样例:', ex.join(' | '))
  if (!APPLY) { console.log('\ndry-run。加 --apply 删除。'); return }
  let n = 0
  for (let i = 0; i < flagged.length; i += 100) { const { count } = await db.from('question_bank').delete({ count: 'exact' }).in('id', flagged.slice(i, i + 100)); n += count ?? 0 }
  console.log(`已删除 ${n} 题。`)
}
main().catch(e => { console.error('fatal', e?.message ?? e); process.exit(1) })
