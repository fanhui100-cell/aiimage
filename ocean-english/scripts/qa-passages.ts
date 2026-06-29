/* ════════════════════════════════════════════════════════════════════════
   qa-passages.ts — 短文/篇章题大规模质量抽查
   ① 客观难度（免费/确定性）：按档抽样，算 难词率(ECDICT 词频) + 平均句长，
      验证「难度随档位单调上升」→ 证明分级真实有效。
   ② AI 评审抽查：每(题型×档)抽样若干，DeepSeek 判 等级契合/英文质量/答案正确，
      汇总通过率并列出被标记的问题项。
   用法：npx tsx scripts/qa-passages.ts [--judge N]   （N=每题型每档评审样本数，默认 2；0=只跑客观）
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, createReadStream } from 'fs'
import readline from 'node:readline'

const env = readFileSync('.env.local', 'utf8')
const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const DS = g('DEEPSEEK_API_KEY')
const JUDGE_N = process.argv.includes('--judge') ? Number(process.argv[process.argv.indexOf('--judge') + 1] || 2) : 2

const EXAM = ['', '中考', '高考', 'CET-4', 'CET-6', '考研', 'TOEFL', 'SAT', '雅思']
const PASSAGE_TYPES = ['listening_comprehension', 'reading_comprehension', 'cloze_passage', 'seven_select', 'banked_cloze', 'para_match', 'grammar_fill']
const STOP = new Set('the a an and or but of to in on at for with as is are was were be been being it its this that these those he she they we you i his her their our your by from not no so if then than too very can will would should could may might must do does did have has had'.split(' '))

// ── ECDICT 词频（rank 越小越常用；缺失视为生僻）──
async function loadFreq(): Promise<Map<string, number>> {
  const m = new Map<string, number>()
  const p = 'scripts/.vocab-cache/ecdict.csv'
  try {
    const rl = readline.createInterface({ input: createReadStream(p), crlfDelay: Infinity })
    let header = true, bi = 8, fi = 9
    const parse = (line: string) => { const o: string[] = []; let c = '', q = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (q) { if (ch === '"') { if (line[i + 1] === '"') { c += '"'; i++ } else q = false } else c += ch } else { if (ch === '"') q = true; else if (ch === ',') { o.push(c); c = '' } else c += ch } } o.push(c); return o }
    for await (const line of rl) { if (header) { const h = parse(line); bi = h.indexOf('bnc'); fi = h.indexOf('frq'); header = false; continue } const f = parse(line); const w = f[0]?.toLowerCase(); if (!w) continue; const r = [Number(f[bi]), Number(f[fi])].filter(n => Number.isFinite(n) && n > 0); if (r.length) m.set(w, Math.min(...r)) }
  } catch { /* 退化：无 freq 文件 */ }
  return m
}

function metrics(passage: string, freq: Map<string, number>) {
  const text = passage.replace(/\[[A-Z]\]|\(\d+\)|_{2,}/g, ' ')
  const words = (text.toLowerCase().match(/[a-z][a-z'-]+/g) ?? []).filter(w => w.length >= 3 && !STOP.has(w))
  const sents = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.split(/\s+/).length >= 3)
  let hard = 0
  for (const w of words) { const r = freq.get(w); if (r == null || r > 8000) hard++ }
  const avgWordLen = words.reduce((s, w) => s + w.length, 0) / Math.max(1, words.length)
  const avgSentLen = sents.length ? (text.split(/\s+/).filter(Boolean).length / sents.length) : 0
  return { hardPct: words.length ? hard / words.length : 0, avgWordLen, avgSentLen, n: words.length }
}

type SRow = { id: string; passage: string; hint: unknown; prompt: string | null; choices: { id: string; text: string }[] | null; answer: string | null }
async function sample(type: string, lv: number, n: number): Promise<SRow[]> {
  const { data } = await db.from('question_bank').select('id, audio_ref, hint, prompt, choices, answer')
    .eq('status', 'active').eq('type', type).contains('theme_tags', [`lv${lv}`]).limit(n * 4)
  const rows = (data ?? []) as { id: string; audio_ref: string | null; hint: unknown; prompt: string | null; choices: { id: string; text: string }[] | null; answer: string | null }[]
  for (let i = rows.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[rows[i], rows[j]] = [rows[j], rows[i]] }
  return rows.slice(0, n).filter(r => r.audio_ref).map(r => ({ id: r.id, passage: r.audio_ref as string, hint: r.hint, prompt: r.prompt, choices: r.choices, answer: r.answer }))
}
const LL = 'ABCDEFGHIJKLMNO'

// ── AI 评审 ──
async function judge(exam: string, type: string, passage: string, qa: string): Promise<{ level: number; english: number; answers: boolean; issue: string } | null> {
  const prompt = `你是英语考试质检专家。评审下面这道「${exam} ${type}」题（原创练习题）：
1) level：难度/题材是否贴合 ${exam}（1=完全不符 5=非常贴合）
2) english：英文是否地道无误（1-5）
3) answers：所给答案是否全部正确无歧义（true/false）
4) issue：若有问题简述（≤20字），否则空串
只输出 JSON：{"level":n,"english":n,"answers":true/false,"issue":""}
【短文】${passage.slice(0, 3600)}
【题与答案】${qa.slice(0, 800)}`
  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', { method: 'POST', headers: { Authorization: 'Bearer ' + DS, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'deepseek-chat', temperature: 0, messages: [{ role: 'user', content: prompt }] }) })
    if (!res.ok) return null
    const j = await res.json() as { choices?: { message?: { content?: string } }[] }
    let t = (j.choices?.[0]?.message?.content || '').replace(/```json|```/g, '').trim(); const mm = t.match(/\{[\s\S]*\}/); if (mm) t = mm[0]
    const v = JSON.parse(t); return { level: Number(v.level), english: Number(v.english), answers: !!v.answers, issue: String(v.issue ?? '') }
  } catch { return null }
}
function qaText(r: SRow, type: string): string {
  const h = r.hint as Record<string, unknown> | null
  if (type === 'cloze_passage') { const b = (h?.blanks ?? []) as { options: string[]; answer: number }[]; return b.slice(0, 12).map((x, i) => `(${i + 1}) ${x.options.join('/')} → ${x.options[x.answer]}`).join('; ') }
  if (type === 'seven_select' || type === 'banked_cloze') { const bank = (h?.bank ?? []) as string[]; const ans = (h?.answers ?? []) as number[]; return `候选(${bank.map((b, i) => LL[i] + '.' + b).join(' ')}); 各空答案:${ans.map(a => LL[a]).join(',')}` }
  if (type === 'para_match') { const st = (h?.statements ?? []) as string[]; const ans = (h?.answers ?? []) as number[]; return st.map((s, i) => `${s} → 段${LL[ans[i]]}`).join('; ') }
  if (type === 'grammar_fill') { const b = (h?.gblanks ?? []) as { answer: string; hint?: string }[]; return b.map((x, i) => `(${i + 1})${x.hint ? `[${x.hint}]` : ''}=${x.answer}`).join('; ') }
  // listening / reading_comprehension：题面 + 选项 + 标记答案
  const opts = (r.choices ?? []).map(c => `${c.id}.${c.text}`).join('  ')
  return `${r.prompt ?? ''}\n选项: ${opts}\n标记答案: ${r.answer ?? ''}`
}

async function main() {
  console.log('═══ 短文/篇章 质量抽查 ═══\n')
  const freq = await loadFreq()
  console.log(`ECDICT 词频载入 ${freq.size} 词\n`)

  // ① 客观难度随档位
  console.log('① 客观难度（每档抽样汇总；难词率/句长应随档位上升）')
  console.log('档位'.padEnd(8) + '难词率%'.padStart(9) + '平均词长'.padStart(10) + '平均句长'.padStart(10) + '样本词数'.padStart(10))
  for (let lv = 1; lv <= 8; lv++) {
    const rows: { passage: string }[] = []
    for (const t of PASSAGE_TYPES) rows.push(...await sample(t, lv, 6))
    if (!rows.length) { console.log(EXAM[lv].padEnd(8) + '（无样本）'.padStart(9)); continue }
    const ms = rows.map(r => metrics(r.passage, freq))
    const avg = (f: (m: ReturnType<typeof metrics>) => number) => ms.reduce((s, m) => s + f(m), 0) / ms.length
    console.log(EXAM[lv].padEnd(8) + (avg(m => m.hardPct) * 100).toFixed(1).padStart(9) + avg(m => m.avgWordLen).toFixed(2).padStart(10) + avg(m => m.avgSentLen).toFixed(1).padStart(10) + String(ms.reduce((s, m) => s + m.n, 0)).padStart(10))
  }

  if (JUDGE_N <= 0 || !DS) { console.log('\n（跳过 AI 评审）'); return }

  // ② AI 评审抽查
  console.log(`\n② AI 评审抽查（每题型每档抽 ${JUDGE_N} 篇；level/english 取 1-5，≥4 记通过）`)
  let pass = 0, total = 0; const flags: string[] = []
  const byType: Record<string, { pass: number; total: number; lvSum: number }> = {}
  for (const t of PASSAGE_TYPES) {
    byType[t] = { pass: 0, total: 0, lvSum: 0 }
    for (let lv = 1; lv <= 8; lv++) {
      const rows = await sample(t, lv, JUDGE_N)
      for (const r of rows) {
        const v = await judge(EXAM[lv], t, r.passage, qaText(r, t))
        if (!v) continue
        total++; byType[t].total++; byType[t].lvSum += v.level
        const ok = v.level >= 4 && v.english >= 4 && v.answers
        if (ok) { pass++; byType[t].pass++ } else flags.push(`  ⚠ ${EXAM[lv]} ${t} ${r.id.slice(-10)} level=${v.level} en=${v.english} ans=${v.answers} ${v.issue}`)
      }
    }
    const b = byType[t]; if (b.total) console.log(`  ${t.padEnd(24)} 通过 ${b.pass}/${b.total}  平均等级契合 ${(b.lvSum / b.total).toFixed(2)}/5`)
  }
  console.log(`\n总通过率：${pass}/${total} = ${total ? Math.round(pass / total * 100) : 0}%`)
  if (flags.length) { console.log(`被标记 ${flags.length} 项：`); flags.slice(0, 25).forEach(f => console.log(f)) } else console.log('无标记项 ✓')
}
main().catch(e => { console.error('✗', e?.message ?? e); process.exit(1) })
