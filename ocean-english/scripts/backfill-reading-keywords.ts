/* ════════════════════════════════════════════════════════════════════════
   backfill-reading-keywords.ts — 让 /reading 列表秒开
   现状：列表 API 每次都拉全部 7490 题（含整篇正文）+ 逐篇分词 + 查词典词频 →
   ~30s。本脚本把「每篇 keyWords（实词∩词典）」预算好存进 reading_passages.key_words，
   并补齐缺失的篇（reading_passages 2288 < 实际 2499）。之后列表只读这张轻量表。
   用法：npx tsx scripts/backfill-reading-keywords.ts [--apply]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'; import { readFileSync } from 'fs'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const APPLY = process.argv.includes('--apply')
const STOP = new Set('the and that this these those with from they them their there have has had will would could should about which what when where while than then into over under such some many more most much also been being were was are because however your you his her its our who whom whose not but for'.split(' '))
const lvOf = (t: unknown) => Array.isArray(t) ? Number((t as string[]).map(x => /^lv(\d)/.exec(String(x))?.[1]).find(Boolean) || 0) : 0
const wc = (s: string) => (s.trim().match(/\S+/g) ?? []).length
function tokens(p: string): string[] { const s = new Set<string>(); for (const m of p.toLowerCase().matchAll(/[a-z][a-z'-]{2,}/g)) { const w = m[0].replace(/^['-]+|['-]+$/g, ''); if (w.length >= 4 && !STOP.has(w)) s.add(w) } return [...s].slice(0, 80) }
function deriveTitle(p: string): string { const first = p.split(/[.!?]/)[0]?.trim() ?? ''; const words = first.split(/\s+/).slice(0, 8).join(' '); return words.length > 4 ? words : (p.split(/\s+/).slice(0, 6).join(' ')) }
async function pageAll<T>(t: string, c: string, f?: (q: any) => any): Promise<T[]> { const o: T[] = []; for (let from = 0; ; from += 1000) { let q: any = db.from(t).select(c).order('id', { ascending: true }).range(from, from + 999); if (f) q = f(q); const { data } = await q; const r = (data ?? []) as T[]; o.push(...r); if (r.length < 1000) break } return o }

async function main() {
  // 1) 词典词 id 集（判定 keyWords ∩ 词典）
  const dictIds = new Set((await pageAll<{ id: string }>('dictionary_words', 'id')).map(r => r.id)); console.log(`词典 ${dictIds.size} 词`)
  // 2) 全部 active 阅读题 → 按 passage 去重，取正文
  const rows = await pageAll<{ normalized_word: string | null; audio_ref: string | null; theme_tags: string[] | null }>('question_bank', 'normalized_word, audio_ref, theme_tags', (q: any) => q.eq('type', 'reading_comprehension').eq('status', 'active'))
  const pass = new Map<string, { text: string; level: number }>()
  for (const r of rows) { const pid = String(r.normalized_word ?? ''); if (pid && !pass.has(pid)) pass.set(pid, { text: String(r.audio_ref ?? ''), level: lvOf(r.theme_tags) }) }
  console.log(`阅读篇 ${pass.size}（题行 ${rows.length}）`)
  // 3) 既有 reading_passages
  const existing = new Map((await pageAll<{ id: string; title: string | null; key_words: string[] | null }>('reading_passages', 'id, title, key_words')).map(r => [r.id, r]))
  // 4) 组装：插缺失 + 补 key_words
  const upserts: Record<string, unknown>[] = []
  for (const [pid, v] of pass) {
    const ex = existing.get(pid)
    const kw = tokens(v.text).filter(t => dictIds.has(t))
    const row: Record<string, unknown> = { id: pid, level: v.level, key_words: kw, status: 'active', minutes: Math.max(1, Math.round(wc(v.text) / 200)), passage_en: v.text }
    if (!ex) { row.title = deriveTitle(v.text); row.exam_tags = []; row.source_type = 'ai_generated_practice' }
    else { row.title = ex.title ?? deriveTitle(v.text) }   // 保留已有标题
    upserts.push(row)
  }
  const newCnt = [...pass.keys()].filter(p => !existing.has(p)).length
  console.log(`待 upsert ${upserts.length}（新增篇 ${newCnt}，补 key_words ${upserts.length - newCnt}）　${APPLY ? 'APPLY' : 'dry-run'}`)
  if (!APPLY) { console.log('dry-run。加 --apply。'); return }
  for (let i = 0; i < upserts.length; i += 200) { const { error } = await db.from('reading_passages').upsert(upserts.slice(i, i + 200), { onConflict: 'id' }); if (error) { console.error('upsert err', error.message); process.exit(1) } process.stdout.write(`\r写 ${Math.min(i + 200, upserts.length)}/${upserts.length}`) }
  console.log(`\n已回填 ${upserts.length} 篇的 key_words（含新增 ${newCnt} 篇）。`)
}
main().catch(e => { console.error('fatal', e?.message ?? e); process.exit(1) })
