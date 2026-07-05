/* ════════════════════════════════════════════════════════════════════════
   gen-paramatch.ts — 长篇阅读匹配 para_match · CET-4/6 / 考研段落匹配
   一篇多段长文（每段聚焦一要点）+ 10 个陈述句，每句匹配含其信息的段落（段可重复）。
   整篇存 1 行：audio_ref=带 [A][B].. 段标的长文，
   hint={statements:[10], answers:[10 段下标 0-based], paras:N}。
   合规：100% 原创。档位：CET-4(3)/CET-6(4)/考研(5)。
   用法：npx tsx scripts/gen-paramatch.ts <level=3> <count=14> [--apply] [--active]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
const getEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'))
const DS = getEnv('DEEPSEEK_API_KEY')

const LEVEL = Number(process.argv[2] || 3)
const COUNT = Number(process.argv[3] || 14)
const APPLY = process.argv.includes('--apply')
const ACTIVE = process.argv.includes('--active')
const EXAM = ({ 3: 'CET-4', 4: 'CET-6', 5: 'KAOYAN' } as Record<number, string>)[LEVEL] ?? 'CET-4'
const LET = 'ABCDEFGHIJKLMN'

type P = { title: string; paragraphs: string[]; statements: string[]; answers: number[]; zh: string }

async function gen(tryN = 0): Promise<P | null> {
  const prompt = `你是 ${EXAM} 长篇阅读匹配命题专家。写 1 篇**全新原创**英语长文（8-10 段、约 400-520 词，每段聚焦一个要点），再给 10 个英文陈述句 statements，每句对应文中**含该信息的某一段**（同一段可被多个陈述匹配）。
**关键准确性要求**：对每个陈述，必须先在文中定位真正包含该信息的那一段，answers 给出其 0-based 段下标；并在 evidence 给出该段中支持该陈述的英文原句片段（≤15 词，必须确实出自所标段落）。务必逐条核对：所标段落确实包含该陈述信息，答案唯一无歧义。不得抄袭真题。
只输出 JSON、无其它文字：
{"title":"","paragraphs":["第0段正文","第1段正文",...],"statements":["陈述1",...,"陈述10"],"answers":[十个段下标],"evidence":["支持句1",...,"支持句10"],"zh":"全文中文翻译"}
注意：statements 必须 10 句、answers 必须 10 个且取值在 0..paragraphs.length-1、evidence 10 条且每条出自对应段落。`
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
    return (Array.isArray(p.paragraphs) && Array.isArray(p.statements) && Array.isArray(p.answers)) ? p : null
  } catch { console.error('  parse fail'); return null }
}

function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
function rng(seed: number) { return () => { let t = (seed += 0x6D2B79F5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function shuffleIdx(n: number, r: () => number) { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a }

async function main() {
  console.log(`[match] ${EXAM} (lv${LEVEL}) passages=${COUNT} ${APPLY ? (ACTIVE ? 'APPLY+ACTIVE' : 'APPLY(draft)') : 'dry-run'}`)
  if (!DS) { console.error('DEEPSEEK_API_KEY missing'); process.exit(1) }
  const rows: Record<string, unknown>[] = []
  for (let i = 0; i < COUNT; i++) {
    const p = await gen()
    if (p) {
      const paras = p.paragraphs.map(x => String(x).trim()).filter(Boolean)
      const stmts = p.statements.map(x => String(x).trim()).filter(Boolean)
      const ans = (p.answers ?? []).map(Number)
      const ok = paras.length >= 6 && paras.length <= 14 && stmts.length === 10 && ans.length === 10 && ans.every(a => a >= 0 && a < paras.length)
      if (ok) {
        const passage = paras.map((t, k) => `[${LET[k]}] ${t}`).join('\n\n')
        const pid = `mp-${EXAM.toLowerCase().replace('-', '')}-${hash(passage).toString(36).slice(0, 8)}`
        // 打乱陈述顺序（连同答案），避免 DeepSeek 按段序出题导致答案恒为 [0,1,2..]
        const ord = shuffleIdx(stmts.length, rng(hash(pid + 's')))
        const stmtsS = ord.map(i => stmts[i]); const ansS = ord.map(i => ans[i])
        rows.push({
          id: `para_match-${pid}`, type: 'para_match', input_mode: 'choice',
          source_type: 'ai_generated_practice', source_exam: `LexiOcean-${EXAM.replace('-', '')}-ParaMatch`,
          source_note: `DeepSeek 原创长篇匹配 · ${EXAM}`,
          word_id: null, normalized_word: pid, difficulty_level: Math.min(Math.max(LEVEL, 1), 5), question_difficulty: 4, bloom_level: 'analyze',
          prompt: '', prompt_zh: '长篇阅读匹配 · 为每个陈述选出含其信息的段落（段落可重复）',
          choices: null, answer: null, audio_ref: passage,
          hint: { statements: stmtsS, answers: ansS, paras: paras.length }, explanation_zh: '', exam_tags: [EXAM], theme_tags: [`lv${LEVEL}`],
          skill_tags: ['reading'], status: ACTIVE ? 'active' : 'draft', is_reviewed: ACTIVE, version: 'match-v2',
        })
      }
    }
    process.stdout.write(`\r[match] ${rows.length}/${COUNT}`)
  }
  console.log(`\n[match] valid: ${rows.length}`)
  if (rows[0]) { const h = rows[0].hint as { statements: string[]; paras: number }; console.log(`  e.g. ${h.paras} 段 · 陈述如「${h.statements[0].slice(0, 50)}…」`) }
  if (!APPLY) { console.log('\ndry-run，未写库。加 --apply（再加 --active 上架）。'); return }
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await db.from('question_bank').upsert(rows.slice(i, i + 100), { onConflict: 'id' })
    if (error) { console.error('[match] upsert err', error.message); process.exit(1) }
  }
  console.log(`[match] 已写入 ${rows.length} 篇长篇匹配（${EXAM}，${ACTIVE ? 'active' : 'draft'}）。`)
}
main().catch(e => { console.error('[match] fatal', e?.message ?? e); process.exit(1) })
