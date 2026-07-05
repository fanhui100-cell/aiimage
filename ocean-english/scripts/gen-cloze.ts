/* ════════════════════════════════════════════════════════════════════════
   gen-cloze.ts — 完形填空(整篇) cloze_passage · 一篇短文多空、每空 4 选
   DeepSeek 写**全新原创**分级短文，挖 N 空，每空 4 选项+解析。整篇存 1 行：
   audio_ref=带 (1)(2).. 空位的短文，hint.blanks=[{options[4],answer(0-3),explain}]。
   合规：100% 原创，非真题。默认 draft；--active 直接上架。
   档位：完形填空属 中考(1)/高考(2)/考研(5)。
   用法：npx tsx scripts/gen-cloze.ts <level=2> <count=16> [--apply] [--active]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
const getEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'))
const DS = getEnv('DEEPSEEK_API_KEY')

const LEVEL = Number(process.argv[2] || 2)
const COUNT = Number(process.argv[3] || 16)
const APPLY = process.argv.includes('--apply')
const ACTIVE = process.argv.includes('--active')
const EXAM = ({ 1: '中考', 2: '高考', 3: 'CET-4', 4: 'CET-6', 5: 'KAOYAN', 6: 'TOEFL', 7: 'SAT' } as Record<number, string>)[LEVEL] ?? '高考'
// 各档完形空数 / 文长（贴近真实）
const NB = ({ 1: 10, 2: 15, 5: 20 } as Record<number, number>)[LEVEL] ?? 10   // 高考完形真实 15 空、考研 20 空
const WORDS = ({ 1: '约 120-160 词', 2: '约 200-260 词', 5: '约 240-300 词' } as Record<number, string>)[LEVEL] ?? '约 200 词'

type Blank = { options: string[]; answer: string; explain?: string }
type Passage = { title: string; passage: string; zh: string; blanks: Blank[] }

async function gen(tryN = 0): Promise<Passage | null> {
  const prompt = `你是 ${EXAM} 完形填空命题专家。写 1 篇**全新原创**英语短文（${WORDS}，难度/题材贴近 ${EXAM}），在文中挖 ${NB} 个空，空位按顺序标成 (1) (2) … (${NB})。每空给 4 个选项、仅 1 个正确（考点：词义辨析/搭配/语法/逻辑衔接，干扰项需有迷惑性）。不得抄袭任何真题。
中文解析 explain ≤15 字。只输出 JSON、无其它文字：
{"title":"","passage":"...(1)...(2)...","zh":"全文中文翻译","blanks":[{"options":["A文本","B文本","C文本","D文本"],"answer":"正确选项文本","explain":""}]}
注意：blanks 数组长度必须正好 ${NB}，与文中空位一一对应。`
  let res: Response
  try {
    res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST', headers: { Authorization: 'Bearer ' + DS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.6, messages: [{ role: 'user', content: prompt }] }),
    })
  } catch { if (tryN < 2) { await new Promise(r => setTimeout(r, 1200)); return gen(tryN + 1) } return null }
  if (!res.ok) { if (tryN < 2) { await new Promise(r => setTimeout(r, 1200)); return gen(tryN + 1) } console.error('  HTTP', res.status); return null }
  try {
    const j = await res.json() as { choices?: { message?: { content?: string } }[] }
    let txt = (j.choices?.[0]?.message?.content || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim()
    const m = txt.match(/\{[\s\S]*\}/); if (m) txt = m[0]
    const p = JSON.parse(txt) as Passage
    return (p.passage && Array.isArray(p.blanks) && p.blanks.length) ? p : null
  } catch { console.error('  parse/json fail'); return null }
}

function rng(seed: number) { return () => { let t = (seed += 0x6D2B79F5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
function shuffle<T>(a: T[], r: () => number) { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1));[x[i], x[j]] = [x[j], x[i]] } return x }

async function main() {
  console.log(`[cloze] ${EXAM} (lv${LEVEL}) passages=${COUNT} 空/篇=${NB} ${APPLY ? (ACTIVE ? 'APPLY+ACTIVE' : 'APPLY(draft)') : 'dry-run'}`)
  if (!DS) { console.error('DEEPSEEK_API_KEY missing'); process.exit(1) }
  const strip = (t: string) => String(t).trim().replace(/^[A-Da-d]\s*[.、):：]\s*/, '').trim()  // 去掉「A. / B、」前缀
  let ok = 0; let sample = ''
  for (let i = 0; i < COUNT; i++) {
    try {
      const p = await gen()
      if (p) {
        const pid = `cp-${EXAM.toLowerCase().replace('-', '')}-${hash(p.passage).toString(36).slice(0, 8)}`
        const blanks = p.blanks.slice(0, NB).map((b, k) => {
          const texts = (b.options ?? []).map(strip)
          if (texts.length !== 4 || new Set(texts.map(t => t.toLowerCase())).size !== 4) return null
          const sh = shuffle(texts, rng(hash(pid + k)))
          const ans = sh.findIndex(t => t.toLowerCase() === strip(b.answer).toLowerCase())
          if (ans < 0) return null
          return { options: sh, answer: ans, explain: b.explain ?? '' }
        })
        if (!blanks.some(b => b === null) && blanks.length >= Math.max(4, NB - 2)) {
          const row = {
            id: `cloze_passage-${pid}`, type: 'cloze_passage', input_mode: 'choice',
            source_type: 'ai_generated_practice', source_exam: `LexiOcean-${EXAM.replace('-', '')}-Cloze`,
            source_note: `DeepSeek 原创完形(整篇) · ${EXAM}`,
            word_id: null, normalized_word: pid, difficulty_level: Math.min(Math.max(LEVEL, 1), 5), question_difficulty: 4, bloom_level: 'apply',
            prompt: '', prompt_zh: `完形填空 · 选出每空最佳选项（共 ${blanks.length} 空）`,
            choices: null, answer: null, audio_ref: p.passage,
            hint: { blanks }, explanation_zh: '', exam_tags: [EXAM], theme_tags: [`lv${LEVEL}`],
            skill_tags: ['cloze'], status: ACTIVE ? 'active' : 'draft', is_reviewed: ACTIVE, version: 'cloze-v1',
          }
          if (APPLY) { const { error } = await db.from('question_bank').upsert([row], { onConflict: 'id' }); if (error) { console.error('[cloze] upsert err', error.message); continue } }
          ok++; if (!sample) sample = `《${p.title}》(${blanks.length}空)`
        }
      }
    } catch (e) { console.error('[cloze] iter err', (e as Error)?.message ?? e) }
    process.stdout.write(`\r[cloze] ${APPLY ? '已写' : '可写'} ${ok}（生成 ${i + 1}/${COUNT}）`)
  }
  console.log(`\n[cloze] ${EXAM} ${APPLY ? (ACTIVE ? 'active 上架' : 'draft') : 'dry-run'}：${ok} 篇　样例 ${sample}`)
  if (!APPLY) console.log('dry-run，未写库。加 --apply（再加 --active 上架）。')
}
main().catch(e => { console.error('[cloze] fatal', e?.message ?? e); process.exit(1) })
