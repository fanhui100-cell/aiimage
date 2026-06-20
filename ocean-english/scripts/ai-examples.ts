/* ============================================================================
   scripts/ai-examples.ts — AI 生僻词例句（DeepSeek → dictionary_examples）

   给"DB 里没有例句的词"（约 1057，多为托福/SAT/考研生僻词）用 DeepSeek 生成
   英中例句，写入 dictionary_examples（source_type='ai-generated'）。
   - 生成结果缓存 scripts/.vocab-cache/ai-examples.json（可断点续跑）
   - 默认生成+缓存+预览（不写库）；加 --write 才插入；插入 id 存 rollback 文件
   需 .env.local: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + DEEPSEEK_API_KEY
   用法： npx tsx scripts/ai-examples.ts            # 生成+缓存
          npx tsx scripts/ai-examples.ts --write    # 并写库
   ============================================================================ */
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const WRITE = process.argv.includes('--write')
const ROOT = path.join(__dirname, '..')
const CACHE = path.join(__dirname, '.vocab-cache')
const GEN = path.join(CACHE, 'ai-examples.json')
const RB = path.join(CACHE, 'ai-examples-rollback.json')
const CONC = 8

function env(k: string): string {
  for (const l of fs.readFileSync(path.join(ROOT, '.env.local'), 'utf-8').split(/\r?\n/)) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m && m[1] === k) return m[2].trim()
  }
  return ''
}
const URL = env('NEXT_PUBLIC_SUPABASE_URL'), KEY = env('SUPABASE_SERVICE_ROLE_KEY'), DS = env('DEEPSEEK_API_KEY')
const db = createClient(URL, KEY)

async function fetchAll(table: string, cols: string): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select(cols).range(from, from + 999)
    if (error) throw new Error(`${table}: ${error.message}`)
    out.push(...(data as unknown as Record<string, unknown>[])); if (!data || data.length < 1000) break
  }
  return out
}

async function deepseek(word: string): Promise<{ en: string; zh: string } | null> {
  const prompt = `为英语单词 "${word}" 写一个地道、长度适中(8-16词)的英文例句，并给中文翻译。只输出 JSON，不要解释：{"en":"...","zh":"..."}`
  const body = JSON.stringify({ model: 'deepseek-chat', temperature: 0.4, messages: [{ role: 'user', content: prompt }] })
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST', headers: { Authorization: 'Bearer ' + DS, 'Content-Type': 'application/json' }, body,
  })
  if (!res.ok) return null
  const j = await res.json() as { choices?: { message?: { content?: string } }[] }
  let txt = j.choices?.[0]?.message?.content?.trim() || ''
  txt = txt.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim()
  try { const o = JSON.parse(txt); if (o.en && o.zh) return { en: String(o.en), zh: String(o.zh) } } catch { /* skip */ }
  return null
}

async function main() {
  console.log(`\n=== AI 生僻词例句 (DeepSeek) ${WRITE ? '【写库】' : '【生成+预览】'} ===\n`)
  // 缺例句词 = 全词 − 有例句词
  process.stdout.write('算缺例句词… ')
  const have = new Set((await fetchAll('dictionary_examples', 'word_id')).map(r => r.word_id))
  const words = await fetchAll('dictionary_words', 'id,word,difficulty')
  const missing = words.filter(w => !have.has(w.id))
  console.log(`${missing.length} 词缺例句`)

  const gen: Record<string, { en: string; zh: string }> = fs.existsSync(GEN) ? JSON.parse(fs.readFileSync(GEN, 'utf-8')) : {}
  const todo = missing.filter(w => !gen[String(w.id)])
  console.log(`已缓存 ${Object.keys(gen).length} · 待生成 ${todo.length}`)

  let ok = 0, fail = 0
  for (let i = 0; i < todo.length; i += CONC) {
    const batch = todo.slice(i, i + CONC)
    await Promise.all(batch.map(async w => {
      const r = await deepseek(String(w.word)).catch(() => null)
      if (r) { gen[String(w.id)] = r; ok++ } else fail++
    }))
    if (i % 80 < CONC) { fs.writeFileSync(GEN, JSON.stringify(gen)); process.stdout.write(`  生成 ${ok}/${todo.length} (失败${fail})\r`) }
  }
  fs.writeFileSync(GEN, JSON.stringify(gen))
  console.log(`\n生成完成：成功 ${ok} · 失败 ${fail} · 缓存共 ${Object.keys(gen).length}`)
  // 样例
  const sample = missing.slice(0, 3).map(w => gen[String(w.id)] ? `[${w.word}] ${gen[String(w.id)].en}` : null).filter(Boolean)
  console.log('样例：\n  ' + sample.join('\n  '))

  if (!WRITE) { console.log('\n[未写库] 加 --write 插入 dictionary_examples。'); return }

  // 写库（仅插入仍缺例句的；记录插入 id 以便回退）
  const rows = missing.filter(w => gen[String(w.id)]).map(w => ({
    word_id: w.id, sentence_en: gen[String(w.id)].en, sentence_zh: gen[String(w.id)].zh,
    source_type: 'ai-generated', source_note: 'DeepSeek draft (P1 AI examples)', order_index: 0,
  }))
  console.log(`\n写 dictionary_examples：${rows.length} 条…`)
  const insertedIds: string[] = []
  for (let i = 0; i < rows.length; i += 500) {
    const { data, error } = await db.from('dictionary_examples').insert(rows.slice(i, i + 500)).select('id')
    if (error) { console.error('  插入错误：', error.message); break }
    insertedIds.push(...(data as { id: string }[]).map(r => r.id))
    process.stdout.write(`  ${Math.min(i + 500, rows.length)}/${rows.length}\r`)
  }
  fs.writeFileSync(RB, JSON.stringify({ at: new Date().toISOString(), table: 'dictionary_examples', ids: insertedIds }))
  console.log(`\n✅ 写入 ${insertedIds.length} 条例句；回退 id 存 ${path.relative(ROOT, RB)}`)
}
main().catch(e => { console.error(e); process.exit(1) })
