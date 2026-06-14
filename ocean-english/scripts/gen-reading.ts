/* ════════════════════════════════════════════════════════════════════════
   gen-reading.ts — 读短文→选择（reading_comprehension）· 与 gen-listening 平行
   DeepSeek 写**全新原创**分级短文 + 3 道阅读理解单选题（主旨/细节/推断）。
   短文存进 question_bank.audio_ref（试炼/练习按屏显文本渲染，不走 TTS）。
   合规：100% 原创，非真题。默认 status='draft'；加 --active 直接转 active。
   用法：npx tsx scripts/gen-reading.ts <level=3> <count=8> [--apply] [--active]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
const getEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'))
const DS = getEnv('DEEPSEEK_API_KEY')

const LEVEL = Number(process.argv[2] || 3)
const COUNT = Number(process.argv[3] || 8)
const APPLY = process.argv.includes('--apply')
const ACTIVE = process.argv.includes('--active')
// belt: 1 初中(中考) 2 高中(高考) 3 四级 4 六级 5 考研 6 托福 7 SAT
const EXAM = ({ 1: '中考', 2: '高考', 3: 'CET-4', 4: 'CET-6', 5: 'KAOYAN', 6: 'TOEFL', 7: 'SAT' } as Record<number, string>)[LEVEL] ?? 'CET-4'
const WORDS = ({ 1: '约 80-120 词', 2: '约 120-160 词', 3: '约 180-220 词', 4: '约 220-260 词', 5: '约 250-300 词', 6: '约 280-340 词', 7: '约 320-400 词' } as Record<number, string>)[LEVEL] ?? '约 200 词'

type Q = { q: string; options: string[]; answer: string; explain_zh: string }
type Passage = { title: string; title_zh?: string; passage: string; zh: string; questions: Q[] }

async function gen(n: number, tryN = 0): Promise<Passage[]> {
  const prompt = `你是 ${EXAM} 阅读命题专家。请写 ${n} 篇**全新原创**的英语短文（${WORDS}，难度/题材贴近 ${EXAM}，话题多样：科技/环境/文化/社会/校园/职场/历史等），每篇配 3 道阅读理解单选题（主旨大意 / 细节理解 / 推断 各一），全部不得抄袭任何真题。
要求：题目和选项用英文；解析用中文（≤30字）；每题 4 个不重复选项、仅 1 个正确；正确答案文本须与某个选项完全一致。
只输出 JSON 数组、无其它文字：
[{"title":"英文标题","title_zh":"中文标题","passage":"完整短文","zh":"短文中文翻译","questions":[{"q":"英文问题","options":["A文本","B文本","C文本","D文本"],"answer":"正确选项的文本","explain_zh":"中文解析"}]}]`
  let res: Response
  try {
    res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST', headers: { Authorization: 'Bearer ' + DS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.6, messages: [{ role: 'user', content: prompt }] }),
    })
  } catch { if (tryN < 2) { await new Promise(r => setTimeout(r, 1200)); return gen(n, tryN + 1) } return [] }
  if (!res.ok) { if (tryN < 2) { await new Promise(r => setTimeout(r, 1200)); return gen(n, tryN + 1) } console.error('  DeepSeek HTTP', res.status); return [] }
  const j = await res.json() as { choices?: { message?: { content?: string } }[] }
  let txt = (j.choices?.[0]?.message?.content || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim()
  const m = txt.match(/\[[\s\S]*\]/)
  if (m) txt = m[0]
  try {
    const arr = JSON.parse(txt) as Passage[]
    return Array.isArray(arr) ? arr.filter(p => p.passage && Array.isArray(p.questions) && p.questions.length) : []
  } catch { console.error('  JSON parse fail'); return [] }
}

function rng(seed: number) { return () => { let t = (seed += 0x6D2B79F5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
function shuffle<T>(a: T[], r: () => number) { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1));[x[i], x[j]] = [x[j], x[i]] } return x }

async function main() {
  console.log(`[read] ${EXAM} (lv${LEVEL}) passages=${COUNT} ${APPLY ? (ACTIVE ? 'APPLY+ACTIVE' : 'APPLY(draft)') : 'dry-run'}`)
  if (!DS) { console.error('DEEPSEEK_API_KEY missing'); process.exit(1) }
  const passages: Passage[] = []
  for (let i = 0; i < COUNT; i++) { passages.push(...await gen(1)); process.stdout.write(`\r[read] generated ${passages.length}/${COUNT}`) }
  console.log(`\n[read] generated passages: ${passages.length}`)

  const qRows: Record<string, unknown>[] = []
  const passageRows: Record<string, unknown>[] = []
  for (const p of passages) {
    const pid = `rp-${EXAM.toLowerCase().replace('-', '')}-${hash(p.passage).toString(36).slice(0, 8)}`
    passageRows.push({
      id: pid, title: p.title ?? null, title_zh: p.title_zh ?? null,
      passage_en: p.passage, passage_zh: p.zh ?? null,
      level: LEVEL, exam_tags: [EXAM],
      minutes: Math.max(1, Math.round(p.passage.split(/\s+/).length / 200)),
      source_type: 'ai_generated_practice', status: ACTIVE ? 'active' : 'draft',
    })
    p.questions.forEach((qq, k) => {
      const texts = (qq.options ?? []).map(t => String(t).trim())
      if (texts.length !== 4 || new Set(texts.map(t => t.toLowerCase())).size !== 4) return
      const r = rng(hash(pid + k))
      const opts = shuffle(texts, r).map((t, i) => ({ id: 'abcd'[i], text: t }))
      const ans = opts.find(o => o.text.toLowerCase() === String(qq.answer).trim().toLowerCase())?.id
      if (!ans) return
      qRows.push({
        id: `reading_comprehension-${pid}-q${k}`, type: 'reading_comprehension', input_mode: 'choice',
        source_type: 'ai_generated_practice', source_exam: `LexiOcean-${EXAM.replace('-', '')}-Reading`,
        source_note: `DeepSeek 原创阅读短文 · ${EXAM}`,
        normalized_word: pid, difficulty_level: Math.min(Math.max(LEVEL, 1), 5), question_difficulty: 4, bloom_level: 'understand',
        prompt: qq.q, prompt_zh: '阅读短文，回答下面的问题', choices: opts, answer: ans,
        audio_ref: p.passage, explanation_zh: qq.explain_zh ?? '', exam_tags: [EXAM], theme_tags: [`lv${LEVEL}`],
        skill_tags: ['reading'], status: ACTIVE ? 'active' : 'draft', is_reviewed: ACTIVE, version: 'read-v1',
      })
    })
  }
  console.log(`[read] valid: ${passages.length} passages, ${qRows.length} questions`)
  for (const p of passages.slice(0, 1)) console.log(`  e.g. 《${p.title}》(${p.passage.split(/\s+/).length}词) ${p.passage.slice(0, 90)}…`)
  if (!APPLY) { console.log('\ndry-run，未写库。加 --apply（再加 --active 直接上架）。'); return }

  for (let i = 0; i < passageRows.length; i += 200) {
    const { error } = await db.from('reading_passages').upsert(passageRows.slice(i, i + 200), { onConflict: 'id' })
    if (error) { console.error('[read] passage upsert err', error.message); process.exit(1) }
  }
  for (let i = 0; i < qRows.length; i += 200) {
    const { error } = await db.from('question_bank').upsert(qRows.slice(i, i + 200), { onConflict: 'id' })
    if (error) { console.error('[read] q upsert err', error.message); process.exit(1) }
  }
  console.log(`[read] 已写入 ${passageRows.length} 篇 + ${qRows.length} 题（${EXAM}，${ACTIVE ? 'active 上架' : 'draft 待审'}）。`)
}
main()
