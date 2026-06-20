/* ════════════════════════════════════════════════════════════════════════
   gen-exam-questions.ts — 真题题型生成（B 层 · DeepSeek 对标格式 / 内容 100% 原创）
   合规：不抓取/存储任何真题原文；只学「题型+考点+难度」，用我们自有词库让 AI 写
   全新题。默认 status='draft' + is_reviewed=false（我 Opus 抽审后再转 active）。
   单句完形题：type=cloze_choice（WORD_UNIVERSE 有效题型）。
   注意：退役题型 cet_cloze 已不再生成（Phase 11）；本脚本一律产 cloze_choice。
   用法：npx tsx scripts/gen-exam-questions.ts <level=4> <count=24> [--apply]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
const getEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'))
const DS = getEnv('DEEPSEEK_API_KEY')

const LEVEL = Number(process.argv[2] || 4)
const COUNT = Number(process.argv[3] || 24)
const APPLY = process.argv.includes('--apply')
// 档→对标考试（belt: 1初中 2高中 3四级 4六级 5考研 6托福 7 SAT）
const EXAM = ({ 3: 'CET-4', 4: 'CET-6', 5: 'KAOYAN', 6: 'TOEFL', 7: 'SAT' } as Record<number, string>)[LEVEL] ?? 'CET-4'
const SET = `LexiOcean-${EXAM.replace('-', '')}-Practice-A`

type Item = { word: string; sentence: string; options: string[]; answer: string; explanation_zh: string }

async function gen(words: { word: string; zh: string }[]): Promise<Item[]> {
  const list = words.map(w => `${w.word}（${w.zh}）`).join('；')
  const prompt = `你是 ${EXAM} 命题专家。为下面每个目标词出一道「${EXAM} 完形填空(单句)」风格题，全新原创、地道、不得抄袭任何真题：
- 用目标词写 1 个约 15-25 词的英文句子，把目标词挖空成 ____（只挖这一个空）。
- 给 4 个选项：1 个正解=目标词（用句中应有的正确形态），3 个干扰=形近/近义/搭配易混的真实英文词，难度贴近 ${EXAM}。
- 中文解析 ≤30 字：为何选正解、干扰项为何不对。
只输出 JSON 数组、无其它文字：[{"word":"目标词原形","sentence":"...____...","options":["...","...","...","..."],"answer":"正解选项文本","explanation_zh":"..."}]
目标词：${list}`
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST', headers: { Authorization: 'Bearer ' + DS, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.4, messages: [{ role: 'user', content: prompt }] }),
  })
  if (!res.ok) { console.error('  DeepSeek HTTP', res.status); return [] }
  const j = await res.json() as { choices?: { message?: { content?: string } }[] }
  const txt = (j.choices?.[0]?.message?.content || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim()
  try {
    const arr = JSON.parse(txt) as Item[]
    return Array.isArray(arr) ? arr.filter(x => x.word && x.sentence && Array.isArray(x.options) && x.options.length === 4 && x.answer) : []
  } catch { console.error('  JSON parse fail'); return [] }
}

function rng(seed: number) { return () => { let t = (seed += 0x6D2B79F5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
function shuffle<T>(a: T[], r: () => number) { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [x[i], x[j]] = [x[j], x[i]] } return x }

async function main() {
  console.log(`[exam] ${EXAM} (lv${LEVEL}) count=${COUNT} ${APPLY ? 'APPLY' : 'dry-run'}`)
  if (!DS) { console.error('DEEPSEEK_API_KEY missing'); process.exit(1) }
  // 取该档中频核心词（按 frequency_rank 取中段，避开极生僻）
  const { data, error } = await db.from('dictionary_words')
    .select('id, word, frequency_rank, dictionary_definitions(definition_zh, order_index)')
    .eq('primary_level', LEVEL).not('frequency_rank', 'is', null)
    .order('frequency_rank', { ascending: true }).range(0, COUNT * 4)
  if (error) { console.error(error); process.exit(1) }
  // 跳过明显的英式拼写变体（-isation/-our/-tre/-logue/-ae-/-oe-），减少「两个都对」源头
  const isVariant = (w: string) => /(isation|tre|logue)$/.test(w) || /(colour|honour|favour|labour|behaviour|neighbour|odour|humour|vapour|rumour|flavour|harbour|valour|tumour|armour)/.test(w) || /(ae|oe)/.test(w)
  const pool = (data ?? []).map(w => ({
    id: w.id as string, word: w.word as string,
    zh: ([...(w.dictionary_definitions ?? [])].sort((a, b) => a.order_index - b.order_index)[0]?.definition_zh ?? '').trim(),
  })).filter(w => w.zh && /^[a-zA-Z]{4,}$/.test(w.word) && !isVariant(w.word.toLowerCase())).slice(0, COUNT)
  console.log(`[exam] target words: ${pool.length}`)

  const items: { wid: string; it: Item }[] = []
  for (let i = 0; i < pool.length; i += 8) {
    const batch = pool.slice(i, i + 8)
    const got = await gen(batch)
    for (const it of got) {
      const m = batch.find(b => b.word.toLowerCase() === it.word.toLowerCase())
      if (m) items.push({ wid: m.id, it })
    }
    process.stdout.write(`\r[exam] generated ${items.length}/${pool.length}`)
  }
  console.log()

  // 拼写孪生（英/美变体）归一化，用于剔除「两个都对」的无效干扰项
  const norm = (s: string) => s.toLowerCase().trim().replace(/-/g, '')
    .replace(/isation/g, 'ization').replace(/ise(d|s|r|rs)?\b/g, 'ize$1')
    .replace(/our/g, 'or').replace(/ae/g, 'e').replace(/oe/g, 'e').replace(/re\b/g, 'er')
  const reject = { blank: 0, dup: 0, twin: 0, noans: 0 }
  const rows = items.map(({ wid, it }) => {
    const r = rng(hash(wid))
    const blanked = it.sentence.replace(/_{2,}/, '[BLANK]')
    const texts = it.options.map(t => String(t).trim())
    const opts = shuffle(texts, r).map((t, i) => ({ id: 'abcd'[i], text: t }))
    const ansText = String(it.answer).trim().toLowerCase()
    const answer = opts.find(o => o.text.toLowerCase() === ansText)?.id
    // 校验：1 个空 / 4 个不重复选项 / 答案在选项中 / 答案无拼写孪生干扰项
    if (!blanked.includes('[BLANK]')) { reject.blank++; return null }
    if (new Set(texts.map(t => t.toLowerCase())).size !== 4) { reject.dup++; return null }
    if (!answer) { reject.noans++; return null }
    if (texts.some(t => t.toLowerCase() !== ansText && norm(t) === norm(ansText))) { reject.twin++; return null }
    return {
      id: `cloze_choice-${EXAM.toLowerCase().replace('-', '')}-${wid}`,
      type: 'cloze_choice', input_mode: 'choice',
      source_type: 'ai_generated_practice', source_exam: SET,
      source_note: `DeepSeek draft · ${EXAM} 完形(单句) 原创`,
      word_id: wid, normalized_word: it.word.toLowerCase(),
      difficulty_level: Math.min(Math.max(LEVEL, 1), 5), question_difficulty: 4, bloom_level: 'apply',
      prompt: blanked, prompt_zh: null, choices: opts, answer,
      explanation_zh: it.explanation_zh ?? '', exam_tags: [EXAM], theme_tags: [`lv${LEVEL}`],
      status: 'draft', is_reviewed: false, version: 'exam-v1',
    }
  }).filter((r): r is NonNullable<typeof r> => r !== null)

  console.log(`[exam] valid rows: ${rows.length}  rejected:`, reject)
  console.log('--- sample ---')
  for (const r of rows.slice(0, 5)) {
    console.log(`\n${r.normalized_word}  [${r.exam_tags[0]}]`)
    console.log(`  ${r.prompt}`)
    console.log(`  ${r.choices.map(c => `${c.id}.${c.text}`).join('  ')}  ✓${r.answer}`)
    console.log(`  解析：${r.explanation_zh}`)
  }
  if (!APPLY) { console.log('\ndry-run，未写库。加 --apply 写入（status=draft）。'); return }

  for (let i = 0; i < rows.length; i += 200) {
    const { error: e } = await db.from('question_bank').upsert(rows.slice(i, i + 200), { onConflict: 'id' })
    if (e) { console.error('[exam] upsert err', e.message); process.exit(1) }
  }
  console.log(`\n[exam] 已写入 ${rows.length} 条 draft（${EXAM}）。待 Opus 抽审 → 转 active。`)
}
main()
