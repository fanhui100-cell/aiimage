/* ════════════════════════════════════════════════════════════════════════
   gen-grammar.ts — 语法填空 grammar_fill · 高考
   一篇短文 10 空（(1)..(10)）：部分给提示词(括号内原形，需变形)、部分纯空(填冠词/介词/连词等)。
   整篇存 1 行：audio_ref=带空短文，hint={blanks:[{answer, hint?, explain?}]}（自由作答，按答案判分）。
   合规：100% 原创。档位：语法填空属 高考(2)。
   用法：npx tsx scripts/gen-grammar.ts <level=2> <count=16> [--apply] [--active]
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
const EXAM = ({ 2: '高考' } as Record<number, string>)[LEVEL] ?? '高考'

type Blank = { answer: string; hint?: string; explain?: string }
type P = { title: string; passage: string; zh: string; blanks: Blank[] }

async function gen(tryN = 0): Promise<P | null> {
  const prompt = `你是 ${EXAM} 语法填空命题专家。写 1 篇**全新原创**英语短文（约 180-230 词，难度贴近 ${EXAM}），挖 10 个空，空位按顺序标成 (1) (2) … (10)。其中约 6 空给出提示词（hint，括号内动词/形容词原形，需考生变形：时态/语态/非谓语/比较级/词性派生等），约 4 空为纯空（填冠词/介词/连词/代词/关系词等，hint 留空）。answer 为该空应填入的**唯一正确单词**（单个词；纯空答案也须唯一确定）。不得抄袭真题。
中文解析 explain ≤15 字。只输出 JSON、无其它文字：
{"title":"","passage":"...(1)...(10)...","zh":"全文中文翻译","blanks":[{"answer":"正确填词","hint":"(give) 或 留空","explain":"为何这样填"}]}
注意：blanks 必须 10 个、与文中 (1)-(10) 一一对应；answer 为单个英文词。`
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
    return (p.passage && Array.isArray(p.blanks) && p.blanks.length) ? p : null
  } catch { console.error('  parse fail'); return null }
}

function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }

async function main() {
  console.log(`[grammar] ${EXAM} (lv${LEVEL}) passages=${COUNT} ${APPLY ? (ACTIVE ? 'APPLY+ACTIVE' : 'APPLY(draft)') : 'dry-run'}`)
  if (!DS) { console.error('DEEPSEEK_API_KEY missing'); process.exit(1) }
  const rows: Record<string, unknown>[] = []
  for (let i = 0; i < COUNT; i++) {
    const p = await gen()
    if (p) {
      const blanks = p.blanks.slice(0, 10).map(b => {
        const answer = String(b.answer ?? '').trim()
        // 仅排除空答案 / 明显非词（句子）；单词含撇号连字符皆可（判分按精确匹配，宽容形态）
        if (!answer || answer.length > 24 || /[.?!;:,，。]/.test(answer)) return null
        const hint = String(b.hint ?? '').trim().replace(/^[（(]|[)）]$/g, '').trim()  // 规整括号
        return { answer, hint: hint || undefined, explain: b.explain ?? '' }
      })
      if (blanks.length !== 10 || blanks.some(b => b === null)) { process.stdout.write(`\r[grammar] ${rows.length}/${COUNT} (跳过)`); continue }
      const pid = `gp-${EXAM.toLowerCase().replace('-', '')}-${hash(p.passage).toString(36).slice(0, 8)}`
      rows.push({
        id: `grammar_fill-${pid}`, type: 'grammar_fill', input_mode: 'choice',
        source_type: 'ai_generated_practice', source_exam: `LexiOcean-${EXAM.replace('-', '')}-Grammar`,
        source_note: `DeepSeek 原创语法填空 · ${EXAM}`,
        word_id: null, normalized_word: pid, difficulty_level: Math.min(Math.max(LEVEL, 1), 5), question_difficulty: 4, bloom_level: 'apply',
        prompt: '', prompt_zh: `语法填空 · 用括号词的正确形式或恰当词填空（共 ${blanks.length} 空）`,
        choices: null, answer: null, audio_ref: p.passage,
        hint: { gblanks: blanks }, explanation_zh: '', exam_tags: [EXAM], theme_tags: [`lv${LEVEL}`],
        skill_tags: ['word_form'], status: ACTIVE ? 'active' : 'draft', is_reviewed: ACTIVE, version: 'grammar-v1',
      })
    }
    process.stdout.write(`\r[grammar] ${rows.length}/${COUNT}`)
  }
  console.log(`\n[grammar] valid: ${rows.length}`)
  if (rows[0]) { const h = rows[0].hint as { gblanks: Blank[] }; console.log(`  e.g. ${(rows[0].audio_ref as string).slice(0, 80)}… (${h.gblanks.length}空; 答案如 ${h.gblanks.slice(0, 3).map(b => b.answer).join('/')})`) }
  if (!APPLY) { console.log('\ndry-run，未写库。加 --apply（再加 --active 上架）。'); return }
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await db.from('question_bank').upsert(rows.slice(i, i + 100), { onConflict: 'id' })
    if (error) { console.error('[grammar] upsert err', error.message); process.exit(1) }
  }
  console.log(`[grammar] 已写入 ${rows.length} 篇语法填空（${EXAM}，${ACTIVE ? 'active' : 'draft'}）。`)
}
main().catch(e => { console.error('[grammar] fatal', e?.message ?? e); process.exit(1) })
