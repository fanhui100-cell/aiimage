/* ════════════════════════════════════════════════════════════════════════
   gen-vocab-ai.ts — AI 生搭配题（collocation_choice）
   注意：antonym_choice 已退役（Phase 11），本脚本不再生成反义词题（含 --active）。
   规则层产量受词典搭配数据稀疏所限；此处用 DeepSeek 为本档核心词写全新原创搭配题。
   合规：100% 原创，非真题。默认 draft；加 --active 直接上架。
   用法：npx tsx scripts/gen-vocab-ai.ts <level=3> <count=48> [--apply] [--active]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
const getEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'))
const DS = getEnv('DEEPSEEK_API_KEY')

const LEVEL = Number(process.argv[2] || 3)
const COUNT = Number(process.argv[3] || 48)
const APPLY = process.argv.includes('--apply')
const ACTIVE = process.argv.includes('--active')
const EXAM = ({ 1: '中考', 2: '高考', 3: 'CET-4', 4: 'CET-6', 5: 'KAOYAN', 6: 'TOEFL', 7: 'SAT' } as Record<number, string>)[LEVEL] ?? 'CET-4'

type ColloQ = { phrase: string; options: string[]; answer: string; explain?: string } | null
type Item = { word: string; collocation: ColloQ }

async function gen(words: { word: string; zh: string }[], tryN = 0): Promise<Item[]> {
  const list = words.map(w => `${w.word}（${w.zh}）`).join('；')
  const prompt = `你是 ${EXAM} 词汇命题专家。为下面每个目标词出一道**全新原创**搭配选择题，地道、不抄真题、难度贴近 ${EXAM}：
搭配题 collocation：写出 1 个含该词的地道搭配短语（2-4 词）作为正确项，再编 3 个把该词与错误词搭配的短语作干扰；options 含这 4 个短语，answer=正确短语。
中文解析 explain ≤20 字。只输出 JSON 数组、无其它文字：
[{"word":"原形","collocation":{"phrase":"正确搭配","options":["正确搭配","错搭1","错搭2","错搭3"],"answer":"正确搭配","explain":""}}]
目标词：${list}`
  let res: Response
  try {
    res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST', headers: { Authorization: 'Bearer ' + DS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.5, messages: [{ role: 'user', content: prompt }] }),
    })
  } catch { if (tryN < 2) { await new Promise(r => setTimeout(r, 1200)); return gen(words, tryN + 1) } return [] }
  if (!res.ok) { if (tryN < 2) { await new Promise(r => setTimeout(r, 1200)); return gen(words, tryN + 1) } console.error('  DeepSeek HTTP', res.status); return [] }
  const j = await res.json() as { choices?: { message?: { content?: string } }[] }
  let txt = (j.choices?.[0]?.message?.content || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim()
  const m = txt.match(/\[[\s\S]*\]/); if (m) txt = m[0]
  try { const arr = JSON.parse(txt) as Item[]; return Array.isArray(arr) ? arr.filter(x => x.word) : [] }
  catch { console.error('  JSON parse fail'); return [] }
}

function rng(seed: number) { return () => { let t = (seed += 0x6D2B79F5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
function shuffle<T>(a: T[], r: () => number) { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1));[x[i], x[j]] = [x[j], x[i]] } return x }
const uniq4 = (a: string[]) => a.length === 4 && new Set(a.map(t => t.trim().toLowerCase())).size === 4

async function main() {
  console.log(`[vocab-ai] ${EXAM} (lv${LEVEL}) words=${COUNT} ${APPLY ? (ACTIVE ? 'APPLY+ACTIVE' : 'APPLY(draft)') : 'dry-run'}`)
  if (!DS) { console.error('DEEPSEEK_API_KEY missing'); process.exit(1) }
  const { data, error } = await db.from('dictionary_words')
    .select('id, word, frequency_rank, dictionary_definitions(definition_zh, order_index)')
    .eq('primary_level', LEVEL).not('frequency_rank', 'is', null)
    .order('frequency_rank', { ascending: true }).range(0, COUNT * 4)
  if (error) { console.error(error); process.exit(1) }
  const pool = (data ?? []).map(w => ({
    id: w.id as string, word: w.word as string,
    zh: ([...(w.dictionary_definitions ?? [])].sort((a, b) => a.order_index - b.order_index)[0]?.definition_zh ?? '').trim(),
  })).filter(w => w.zh && /^[a-zA-Z]{3,}$/.test(w.word)).slice(0, COUNT)
  console.log(`[vocab-ai] target words: ${pool.length}`)

  const items: { wid: string; word: string; it: Item }[] = []
  for (let i = 0; i < pool.length; i += 8) {
    const batch = pool.slice(i, i + 8)
    for (const it of await gen(batch)) {
      const m = batch.find(b => b.word.toLowerCase() === it.word.toLowerCase())
      if (m) items.push({ wid: m.id, word: m.word, it })
    }
    process.stdout.write(`\r[vocab-ai] ${items.length} words processed`)
  }
  console.log()

  const rows: Record<string, unknown>[] = []
  const base = (wid: string, word: string) => ({
    word_id: wid, normalized_word: word.toLowerCase(),
    source_type: 'ai_generated_practice', source_exam: `LexiOcean-${EXAM.replace('-', '')}-Vocab`,
    difficulty_level: Math.min(Math.max(LEVEL, 1), 5), question_difficulty: 3, bloom_level: 'understand',
    exam_tags: [EXAM], theme_tags: [`lv${LEVEL}`], status: ACTIVE ? 'active' : 'draft', is_reviewed: ACTIVE,
    version: 'vocab-ai-v1', input_mode: 'choice',
  })
  for (const { wid, word, it } of items) {
    // antonym_choice 已退役（Phase 11）：不再生成，连 --active 也不写。
    // collocation_choice
    const c = it.collocation
    if (c && c.answer && Array.isArray(c.options) && c.options.length === 4) {
      const texts = c.options.map(t => String(t).trim())
      if (uniq4(texts)) {
        const r2 = rng(hash(wid + 'c'))
        const opts = shuffle(texts, r2).map((t, i) => ({ id: 'abcd'[i], text: t }))
        const answer = opts.find(o => o.text.toLowerCase() === c.answer.trim().toLowerCase())?.id
        if (answer) rows.push({ ...base(wid, word), id: `collocation_choice-ai-${wid}`, type: 'collocation_choice', skill_tags: ['collocation'], prompt: word, prompt_zh: `选出含「${word}」的正确搭配`, choices: opts, answer, explanation_zh: c.explain || `正确搭配：${c.answer}` })
      }
    }
  }
  const byType: Record<string, number> = {}
  for (const r of rows) byType[r.type as string] = (byType[r.type as string] ?? 0) + 1
  console.log(`[vocab-ai] valid rows: ${rows.length}`, byType)
  for (const r of rows.slice(0, 4)) console.log(`  ${r.type} · ${r.normalized_word}: ${(r.choices as { text: string }[]).map(c => c.text).join(' / ')} ✓${r.answer}`)
  if (!APPLY) { console.log('\ndry-run，未写库。加 --apply（再加 --active 上架）。'); return }

  for (let i = 0; i < rows.length; i += 200) {
    const { error: e } = await db.from('question_bank').upsert(rows.slice(i, i + 200), { onConflict: 'id' })
    if (e) { console.error('[vocab-ai] upsert err', e.message); process.exit(1) }
  }
  console.log(`[vocab-ai] 已写入 ${rows.length} 题（${EXAM}，${ACTIVE ? 'active 上架' : 'draft 待审'}）。`)
}
main()
