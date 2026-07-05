/* ════════════════════════════════════════════════════════════════════════
   gen-banked.ts — 选词填空(banked cloze) banked_cloze · CET-4/6
   一篇短文 10 空（(1)..(10)），15 词词库（10 正确 + 5 干扰），每词至多用一次。
   整篇存 1 行：audio_ref=带空短文，hint={bank:[15词], answers:[10下标 0-14]}。
   为保证可判分：空处直接填候选词原形（不变形）。合规：100% 原创。
   档位：选词填空属 CET-4(3)/CET-6(4)。
   用法：npx tsx scripts/gen-banked.ts <level=3> <count=16> [--apply] [--active]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
const getEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'))
const DS = getEnv('DEEPSEEK_API_KEY')

const LEVEL = Number(process.argv[2] || 3)
const COUNT = Number(process.argv[3] || 16)
const APPLY = process.argv.includes('--apply')
const ACTIVE = process.argv.includes('--active')
const EXAM = ({ 3: 'CET-4', 4: 'CET-6' } as Record<number, string>)[LEVEL] ?? 'CET-4'

type P = { title: string; passage: string; zh: string; bank: string[]; answers: number[] }

async function gen(tryN = 0): Promise<P | null> {
  const prompt = `你是 ${EXAM} 选词填空(banked cloze)命题专家。写 1 篇**全新原创**英语短文（约 250-280 词，难度贴近 ${EXAM}），挖 10 个空，空位按顺序标成 (1) (2) … (10)。给 15 个候选词 bank（涵盖名/动/形/副，10 个为正确填词、5 个为干扰），answers 为 10 个空依次对应的候选词下标（0-14，互不相同）。
关键：为保证可判分，**空格处直接填入候选词的原形**（句子要写得让原形能直接填入、语法通顺，不要变形）。不得抄袭真题。
只输出 JSON、无其它文字：
{"title":"","passage":"...(1)...(10)...","zh":"全文中文翻译","bank":["w1",...,"w15"],"answers":[十个下标]}
注意：bank 必须 15 词、answers 必须 10 个且取值 0-14 不重复、与文中 (1)-(10) 一一对应。`
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
    const p = JSON.parse(txt) as P
    return (p.passage && Array.isArray(p.bank) && Array.isArray(p.answers)) ? p : null
  } catch { console.error('  parse fail'); return null }
}

function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
function rng(seed: number) { return () => { let t = (seed += 0x6D2B79F5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function shuffleIdx(n: number, r: () => number) { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a }

async function main() {
  console.log(`[banked] ${EXAM} (lv${LEVEL}) passages=${COUNT} ${APPLY ? (ACTIVE ? 'APPLY+ACTIVE' : 'APPLY(draft)') : 'dry-run'}`)
  if (!DS) { console.error('DEEPSEEK_API_KEY missing'); process.exit(1) }
  const rows: Record<string, unknown>[] = []
  for (let i = 0; i < COUNT; i++) {
    const p = await gen()
    if (p) {
      const rawBank = p.bank.map(w => String(w).trim()).filter(Boolean)
      const rawAns = (p.answers ?? []).map(Number)
      const ok = rawBank.length === 15 && rawAns.length === 10 && new Set(rawAns).size === 10 && rawAns.every(a => a >= 0 && a < 15)
      if (ok) {
        const pid = `bp-${EXAM.toLowerCase().replace('-', '')}-${hash(p.passage).toString(36).slice(0, 8)}`
        // 打乱词库顺序，避免 DeepSeek 把正确词排在前 10 导致答案恒为 [0..9]
        const perm = shuffleIdx(15, rng(hash(pid + 'b')))   // perm[newIdx] = oldIdx
        const oldToNew = new Array(15); perm.forEach((oldI, newI) => { oldToNew[oldI] = newI })
        const bank = perm.map(oldI => rawBank[oldI])
        const ans = rawAns.map(a => oldToNew[a])
        rows.push({
          id: `banked_cloze-${pid}`, type: 'banked_cloze', input_mode: 'choice',
          source_type: 'ai_generated_practice', source_exam: `LexiOcean-${EXAM.replace('-', '')}-Banked`,
          source_note: `DeepSeek 原创选词填空 · ${EXAM}`,
          word_id: null, normalized_word: pid, difficulty_level: Math.min(Math.max(LEVEL, 1), 5), question_difficulty: 4, bloom_level: 'apply',
          prompt: '', prompt_zh: '选词填空 · 从 15 词词库为每空选词（每词至多用一次）',
          choices: null, answer: null, audio_ref: p.passage,
          hint: { bank, answers: ans }, explanation_zh: '', exam_tags: [EXAM], theme_tags: [`lv${LEVEL}`],
          skill_tags: ['cloze'], status: ACTIVE ? 'active' : 'draft', is_reviewed: ACTIVE, version: 'banked-v1',
        })
      }
    }
    process.stdout.write(`\r[banked] ${rows.length}/${COUNT}`)
  }
  console.log(`\n[banked] valid: ${rows.length}`)
  if (rows[0]) console.log(`  e.g. ${(rows[0].audio_ref as string).slice(0, 90)}…`)
  if (!APPLY) { console.log('\ndry-run，未写库。加 --apply（再加 --active 上架）。'); return }
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await db.from('question_bank').upsert(rows.slice(i, i + 100), { onConflict: 'id' })
    if (error) { console.error('[banked] upsert err', error.message); process.exit(1) }
  }
  console.log(`[banked] 已写入 ${rows.length} 篇选词填空（${EXAM}，${ACTIVE ? 'active' : 'draft'}）。`)
}
main().catch(e => { console.error('[banked] fatal', e?.message ?? e); process.exit(1) })
