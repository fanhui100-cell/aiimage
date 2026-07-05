/* 把 dictionary_mnemonics（生成器误写的表）迁移到 word_mnemonics（App 实际读取的表）。
   列映射：style→mnemonic_style，补 source_type。跳过 word_mnemonics 已有的 word_id。
   用法：npx tsx scripts/migrate-mnemonics.ts [--apply] */
import { createClient } from '@supabase/supabase-js'; import { readFileSync } from 'fs'; import { randomUUID } from 'crypto'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const APPLY = process.argv.includes('--apply')
async function pageAll<T>(t: string, c: string): Promise<T[]> { const o: T[] = []; for (let f = 0; ; f += 1000) { const { data } = await db.from(t).select(c).range(f, f + 999); const r = (data ?? []) as T[]; o.push(...r); if (r.length < 1000) break } return o }
async function legacyMnemonicTableExists(): Promise<boolean> {
  const { error } = await db.from('dictionary_mnemonics').select('word_id').limit(1)
  return error?.code !== 'PGRST205'
}
async function main() {
  if (!(await legacyMnemonicTableExists())) {
    console.log('dictionary_mnemonics is not present; canonical mnemonic data is already word_mnemonics.')
    return
  }

  const have = new Set((await pageAll<{ word_id: string }>('word_mnemonics', 'word_id')).map(r => r.word_id))
  const src = await pageAll<{ word_id: string; mnemonic_en: string | null; mnemonic_zh: string | null; style: string; order_index: number }>('dictionary_mnemonics', 'word_id, mnemonic_en, mnemonic_zh, style, order_index')
  const rows = src.filter(r => !have.has(r.word_id) && (r.mnemonic_zh ?? '').trim())
    .map(r => ({ id: randomUUID(), word_id: r.word_id, mnemonic_en: r.mnemonic_en, mnemonic_zh: r.mnemonic_zh, mnemonic_style: r.style || 'standard', is_ai_generated: true, is_reviewed: false, order_index: r.order_index ?? 0, source_type: 'ai-generated' }))
  console.log(`源 ${src.length}　word_mnemonics 已有 ${have.size}　待迁 ${rows.length}　${APPLY ? 'APPLY' : 'dry-run'}`)
  if (!APPLY) { console.log('dry-run。加 --apply。'); return }
  let n = 0
  for (let i = 0; i < rows.length; i += 500) { const { error, count } = await db.from('word_mnemonics').insert(rows.slice(i, i + 500), { count: 'exact' }); if (error) { console.error('insert err', error.message); process.exit(1) } n += count ?? 0; process.stdout.write(`\r迁移 ${Math.min(i + 500, rows.length)}/${rows.length}`) }
  console.log(`\n已迁移 ${n} 条到 word_mnemonics。`)
}
main().catch(e => { console.error('fatal', e?.message ?? e); process.exit(1) })
