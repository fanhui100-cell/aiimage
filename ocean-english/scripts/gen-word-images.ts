/* ════════════════════════════════════════════════════════════════════════
   gen-word-images.ts — 单词配图（Task 3.1）
   给高频词生成一张极简插画，存 Supabase Storage，回填 dictionary_words.image_url。
   ⚠️ 需要图像生成 API（.env 现仅有 DeepSeek 文本）。配齐下列任一后即可 --apply：
       IMAGE_API_KEY=...                 （必填）
       IMAGE_API_URL=https://api.openai.com/v1/images/generations  （默认，OpenAI 兼容）
       IMAGE_MODEL=gpt-image-1           （默认）
   还需在 Supabase 建公开 bucket：word-images
   用法：npx tsx scripts/gen-word-images.ts <level=3> <count=20> [--apply]
   合规：AI 原创插画，非版权图片。image_source 记 'ai'。
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
const getEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'))
const IMG_KEY = getEnv('IMAGE_API_KEY') || process.env.IMAGE_API_KEY || ''
const IMG_URL = getEnv('IMAGE_API_URL') || 'https://api.openai.com/v1/images/generations'
const IMG_MODEL = getEnv('IMAGE_MODEL') || 'gpt-image-1'
const BUCKET = 'word-images'

const LEVEL = Number(process.argv[2] || 3)
const COUNT = Number(process.argv[3] || 20)
const APPLY = process.argv.includes('--apply')

interface WordRow { id: string; word: string; dictionary_definitions?: { definition_zh: string | null; order_index: number }[] }

async function genImage(word: string, zh: string): Promise<Buffer | null> {
  const prompt = `A simple, clean, flat minimal illustration representing the English word "${word}" (${zh}). Centered subject, soft palette, no text, no letters, white background.`
  try {
    const res = await fetch(IMG_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${IMG_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: IMG_MODEL, prompt, size: '512x512', n: 1 }),
    })
    if (!res.ok) { console.error('  image API', res.status); return null }
    const j = await res.json() as { data?: { b64_json?: string; url?: string }[] }
    const item = j.data?.[0]
    if (item?.b64_json) return Buffer.from(item.b64_json, 'base64')
    if (item?.url) { const img = await fetch(item.url); return Buffer.from(await img.arrayBuffer()) }
    return null
  } catch (e) { console.error('  gen fail', (e as Error).message); return null }
}

async function main() {
  console.log(`[img] lv${LEVEL} count=${COUNT} ${APPLY ? 'APPLY' : 'dry-run'}`)
  if (APPLY && !IMG_KEY) { console.error('缺 IMAGE_API_KEY，无法生成。请在 .env.local 配置后重试。'); process.exit(1) }

  const { data, error } = await db.from('dictionary_words')
    .select('id, word, dictionary_definitions(definition_zh, order_index)')
    .eq('primary_level', LEVEL).is('image_url', null)
    .order('frequency_rank', { ascending: true, nullsFirst: false })
    .limit(COUNT)
  if (error) { console.error(error.message); process.exit(1) }
  const rows = (data ?? []) as WordRow[]
  console.log(`[img] 待配图 ${rows.length} 词`)

  if (!APPLY) {
    console.log('dry-run：未生成、未写库。示例：', rows.slice(0, 5).map(r => r.word).join(', '))
    console.log('配齐 IMAGE_API_KEY + Supabase bucket「word-images」后加 --apply。')
    return
  }

  let done = 0
  for (const r of rows) {
    const zh = (r.dictionary_definitions ?? []).sort((a, b) => a.order_index - b.order_index)[0]?.definition_zh ?? r.word
    const buf = await genImage(r.word, zh)
    if (!buf) continue
    const path = `${r.id}.png`
    const up = await db.storage.from(BUCKET).upload(path, buf, { contentType: 'image/png', upsert: true })
    if (up.error) { console.error('  upload', r.id, up.error.message); continue }
    const { data: pub } = db.storage.from(BUCKET).getPublicUrl(path)
    await db.from('dictionary_words').update({ image_url: pub.publicUrl, image_source: 'ai' }).eq('id', r.id)
    done++; process.stdout.write(`\r[img] ${done}/${rows.length}`)
  }
  console.log(`\n[img] 完成 ${done} 张。`)
}
main()
