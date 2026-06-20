/* ════════════════════════════════════════════════════════════════════════
   gen-sevenselect.ts — 七选五 / 阅读填句 seven_select
   一篇短文抽掉 5 句（空位 (1)..(5)），给 7 个候选句（5 正确 + 2 干扰）。
   整篇存 1 行：audio_ref=带空短文，hint={bank:[7句], answers:[5个下标 0-6]}。
   合规：100% 原创，非真题。默认 draft；--active 上架。
   档位：七选五属 高考(2)/考研新题型(5)/中考(1)。
   用法：npx tsx scripts/gen-sevenselect.ts <level=2> <count=16> [--apply] [--active]
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
const EXAM = ({ 1: '中考', 2: '高考', 5: 'KAOYAN' } as Record<number, string>)[LEVEL] ?? '高考'
const WORDS = ({ 1: '约 180-220 词', 2: '约 250-300 词', 5: '约 280-340 词' } as Record<number, string>)[LEVEL] ?? '约 260 词'

type P = { title: string; passage: string; zh: string; options: string[]; answers: number[] }

async function gen(tryN = 0): Promise<P | null> {
  const prompt = `你是 ${EXAM} 七选五命题专家。写 1 篇**全新原创**英语短文（${WORDS}，难度/题材贴近 ${EXAM}，结构清晰、衔接自然），从文中抽掉 5 个完整句子，空位按顺序标成 (1) (2) (3) (4) (5)。再给 7 个候选句（options，5 个为被抽掉的正确句、2 个为合理干扰句），answers 为 5 个空依次对应的候选句下标（0-6，互不相同）。不得抄袭任何真题。
只输出 JSON、无其它文字：
{"title":"","passage":"...(1)... (2)...","zh":"全文中文翻译","options":["句1","句2","句3","句4","句5","句6","句7"],"answers":[下标,下标,下标,下标,下标]}
注意：options 必须 7 句、answers 必须 5 个且取值 0-6 不重复、与文中 (1)-(5) 一一对应。`
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
    return (p.passage && Array.isArray(p.options) && Array.isArray(p.answers)) ? p : null
  } catch { console.error('  parse fail'); return null }
}

function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }

async function main() {
  console.log(`[7sel] ${EXAM} (lv${LEVEL}) passages=${COUNT} ${APPLY ? (ACTIVE ? 'APPLY+ACTIVE' : 'APPLY(draft)') : 'dry-run'}`)
  if (!DS) { console.error('DEEPSEEK_API_KEY missing'); process.exit(1) }
  const rows: Record<string, unknown>[] = []
  for (let i = 0; i < COUNT; i++) {
    const p = await gen()
    if (p) {
      const opts = p.options.map(o => String(o).trim()).filter(Boolean)
      const ans = (p.answers ?? []).map(Number)
      const okShape = opts.length === 7 && ans.length === 5 && new Set(ans).size === 5 && ans.every(a => a >= 0 && a < 7)
      if (okShape) {
        const pid = `sp-${EXAM.toLowerCase().replace('-', '')}-${hash(p.passage).toString(36).slice(0, 8)}`
        rows.push({
          id: `seven_select-${pid}`, type: 'seven_select', input_mode: 'choice',
          source_type: 'ai_generated_practice', source_exam: `LexiOcean-${EXAM.replace('-', '')}-SevenSelect`,
          source_note: `DeepSeek 原创七选五 · ${EXAM}`,
          word_id: null, normalized_word: pid, difficulty_level: Math.min(Math.max(LEVEL, 1), 5), question_difficulty: 4, bloom_level: 'analyze',
          prompt: '', prompt_zh: '七选五 · 从 7 个选项中为每空选最佳句子（多 2 个干扰）',
          choices: null, answer: null, audio_ref: p.passage,
          hint: { bank: opts, answers: ans }, explanation_zh: '', exam_tags: [EXAM], theme_tags: [`lv${LEVEL}`],
          skill_tags: ['reading'], status: ACTIVE ? 'active' : 'draft', is_reviewed: ACTIVE, version: 'sevensel-v1',
        })
      }
    }
    process.stdout.write(`\r[7sel] ${rows.length}/${COUNT}`)
  }
  console.log(`\n[7sel] valid: ${rows.length}`)
  if (rows[0]) console.log(`  e.g. ${(rows[0].audio_ref as string).slice(0, 90)}…`)
  if (!APPLY) { console.log('\ndry-run，未写库。加 --apply（再加 --active 上架）。'); return }
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await db.from('question_bank').upsert(rows.slice(i, i + 100), { onConflict: 'id' })
    if (error) { console.error('[7sel] upsert err', error.message); process.exit(1) }
  }
  console.log(`[7sel] 已写入 ${rows.length} 篇七选五（${EXAM}，${ACTIVE ? 'active' : 'draft'}）。`)
}
main().catch(e => { console.error('[7sel] fatal', e?.message ?? e); process.exit(1) })
