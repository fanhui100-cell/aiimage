/* ════════════════════════════════════════════════════════════════════════
   normalize-listening-answer-positions.ts — 听力答案位置归一化（只重排选项，不改语义）

   背景：active listening_comprehension 题的正确答案位置严重偏置（B≈47%、D≈7%）。
   做法：每题保持 choices 数组顺序 a,b,c,d（显示标签=数组下标，与 id 对齐），把 4 个选项的
        「文本」在 4 个槽位间重排，使正确文本落到「按等级均衡分配」的目标槽位，answer 置为该槽 id。
        —— 只移动选项文本位置；题干/音频/正确答案的语义内容完全不变；正确文本仍是同一段文本。
   安全红线：
     - 仅处理 choices=4 / id=abcd / answer 为单字母 的规范题。
     - 跳过「解析(explanation_zh)引用了选项字母」的题（这类已存在 解析↔答案 不一致的历史缺陷，
       重排会与解析字母冲突；单独报告交 owner 修，绝不在此盲改解析内容）。
   均衡：按等级分组，对每级用「最少使用槽位优先」的确定性分配（near-exact 25%/槽），
        处理顺序按 seed 洗牌（避免 id 顺序形成可察觉的循环模式）。确定性 → 幂等、dry-run==apply。
   用法：npm run normalize:listening-answers           （dry-run，打印收敛证明，不写库）
        npm run normalize:listening-answers -- --apply （写库）
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { loadDotenv } from './load-dotenv'

loadDotenv()
const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db: SupabaseClient = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))
const APPLY = process.argv.includes('--apply')
const LETTERS = ['a', 'b', 'c', 'd']

// ── 确定性 RNG（与 paper-generator 同款）──
function hashStr(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
function mulberry32(seed: number): () => number { return () => { let t = (seed += 0x6D2B79F5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function seededShuffle<T>(arr: T[], rnd: () => number): T[] { const x = [...arr]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1));[x[i], x[j]] = [x[j], x[i]] } return x }

interface Item { id: string; setId: string; level: number; choices: { id: string; text: string }[]; answer: string; explanationZh: string }
const EXPL_LETTER_RE = /[（(]\s*[A-D]\s*[）)]|\b[A-D]\b项|选\s*[A-D]|答案\s*[是为：:]?\s*[A-D]|option\s*[A-D]|\b[A-D][.)）、]/i

function pct(n: number, total: number) { return total ? (n / total * 100).toFixed(0) + '%' : '0%' }
function dist(items: { answer: string }[]): Record<string, number> { const d: Record<string, number> = { a: 0, b: 0, c: 0, d: 0 }; for (const it of items) d[it.answer] = (d[it.answer] ?? 0) + 1; return d }
function fmtDist(items: { answer: string }[]): string { const d = dist(items); const t = items.length; return LETTERS.map((l) => `${l.toUpperCase()} ${d[l]}(${pct(d[l], t)})`).join(' · ') }

async function main() {
  const { data: sets } = await db.from('question_sets').select('id, level').eq('status', 'active').eq('task_type', 'listening_comprehension').order('id', { ascending: true }).limit(1000)
  const setIds = (sets ?? []).map((s) => s.id as string)
  const levelBySet = new Map((sets ?? []).map((s) => [s.id as string, Number(s.level)]))

  const raw: Item[] = []
  for (let i = 0; i < setIds.length; i += 100) {
    const { data } = await db.from('question_items').select('id, question_set_id, choices, answer, explanation_zh').eq('status', 'active').in('question_set_id', setIds.slice(i, i + 100)).order('id', { ascending: true })
    for (const it of (data ?? [])) {
      const choices = Array.isArray(it.choices) ? (it.choices as { id: string; text: string }[]) : []
      raw.push({ id: it.id as string, setId: it.question_set_id as string, level: levelBySet.get(it.question_set_id as string) ?? 0, choices, answer: String(it.answer ?? '').trim().toLowerCase(), explanationZh: String(it.explanation_zh ?? '') })
    }
  }

  // 资格筛选
  const eligible: Item[] = []
  const skipped: { id: string; reason: string }[] = []
  for (const it of raw) {
    if (it.choices.length !== 4 || it.choices.map((c) => c.id).join('') !== 'abcd') { skipped.push({ id: it.id, reason: 'choices_not_abcd4' }); continue }
    if (!/^[a-d]$/.test(it.answer)) { skipped.push({ id: it.id, reason: 'answer_not_single_letter' }); continue }
    if (EXPL_LETTER_RE.test(it.explanationZh)) { skipped.push({ id: it.id, reason: 'explanation_references_letter' }); continue }
    eligible.push(it)
  }

  console.log(`active listening items: ${raw.length} · eligible: ${eligible.length} · skipped: ${skipped.length}`)
  console.log('\n── BEFORE（全部 active）──')
  console.log('  global:', fmtDist(raw))
  for (const lv of [...new Set(raw.map((r) => r.level))].sort()) console.log(`  lv${lv}:`, fmtDist(raw.filter((r) => r.level === lv)))

  // ── 按等级「最少使用槽位优先」均衡分配目标位置；处理顺序按 seed 洗牌 ──
  const changes: { id: string; newChoices: { id: string; text: string }[]; newAnswer: string; from: string; to: string }[] = []
  for (const lv of [...new Set(eligible.map((r) => r.level))].sort()) {
    // 确定性处理顺序：先按 id 稳定排序，再 seed 洗牌（避免 fetch 顺序不稳 + id 循环模式）→ 目标分配可复现、幂等
    const levelItems = eligible.filter((r) => r.level === lv).sort((a, b) => a.id.localeCompare(b.id))
    const order = seededShuffle(levelItems, mulberry32(hashStr(`listen-normalize:lv${lv}`)))
    const used: Record<string, number> = { a: 0, b: 0, c: 0, d: 0 }
    for (const it of order) {
      // 目标槽：当前用得最少的字母（并列取字母序最小）→ near-exact 均衡
      const target = LETTERS.reduce((best, l) => (used[l] < used[best] ? l : best), 'a')
      used[target]++
      const targetIdx = LETTERS.indexOf(target)
      // 正确文本（按 isCorrect 身份跟踪，兼容重复文本）
      const objs = it.choices.map((c) => ({ text: c.text, correct: c.id === it.answer }))
      const correct = objs.find((o) => o.correct)!
      // 干扰项排列：纯按文本确定性排序（与当前存储顺序无关）→ 重排是「内容的纯函数」，再次运行得同一结果（幂等）
      const others = objs.filter((o) => !o.correct).sort((a, b) => a.text.localeCompare(b.text))
      const slots: { text: string; correct: boolean }[] = new Array(4)
      slots[targetIdx] = correct
      let oi = 0
      for (let s = 0; s < 4; s++) if (s !== targetIdx) slots[s] = others[oi++]
      const newChoices = slots.map((o, i) => ({ id: LETTERS[i], text: o.text }))
      const newAnswer = target
      if (newAnswer !== it.answer || newChoices.some((c, i) => c.text !== it.choices[i].text)) {
        changes.push({ id: it.id, newChoices, newAnswer, from: it.answer, to: newAnswer })
      }
    }
  }

  // AFTER 预测分布（eligible 用新 answer；skipped 保持原 answer）
  const afterEligible = eligible.map((it) => ({ ...it, answer: changes.find((c) => c.id === it.id)?.newAnswer ?? it.answer }))
  const afterAll = [...afterEligible, ...raw.filter((r) => !eligible.some((e) => e.id === r.id))]
  console.log('\n── AFTER（预测；eligible 重排后，skipped 不变）──')
  console.log('  global:', fmtDist(afterAll))
  for (const lv of [...new Set(afterAll.map((r) => r.level))].sort()) console.log(`  lv${lv}:`, fmtDist(afterAll.filter((r) => r.level === lv)))

  console.log(`\nchanges: ${changes.length} 题将重排`)
  const skipReasons = skipped.reduce((m, s) => { m[s.reason] = (m[s.reason] ?? 0) + 1; return m }, {} as Record<string, number>)
  console.log('skipped reasons:', JSON.stringify(skipReasons))
  const letterRefs = skipped.filter((s) => s.reason === 'explanation_references_letter')
  if (letterRefs.length) {
    console.log(`\n⚠ ${letterRefs.length} 题因「解析引用选项字母」跳过（多为既有 解析↔答案 不一致，建议单独人工复核）：`)
    for (const s of letterRefs) console.log('   ·', s.id)
  }

  // ── 完整性自检：每题重排后必须 (1)选项文本集合不变 (2)正确文本不变（只移位置）──
  const byId = new Map(eligible.map((it) => [it.id, it]))
  let violations = 0
  for (const ch of changes) {
    const orig = byId.get(ch.id)!
    const oldTexts = [...orig.choices.map((c) => c.text)].sort()
    const newTexts = [...ch.newChoices.map((c) => c.text)].sort()
    const sameSet = oldTexts.length === newTexts.length && oldTexts.every((t, i) => t === newTexts[i])
    const oldCorrect = orig.choices.find((c) => c.id === orig.answer)?.text
    const newCorrect = ch.newChoices.find((c) => c.id === ch.newAnswer)?.text
    if (!sameSet || oldCorrect !== newCorrect) {
      violations++
      if (violations <= 5) console.error(`  ✗ integrity ${ch.id}: sameSet=${sameSet} correctPreserved=${oldCorrect === newCorrect}`)
    }
  }
  console.log(`\n完整性自检：${changes.length} 题，违例 ${violations}（须为 0：选项文本集合不变 + 正确文本不变，仅位置变）`)
  if (violations > 0) { console.error('整完整性自检失败，拒绝写库。'); process.exit(1) }

  if (!APPLY) { console.log('\n(dry-run：未写库。加 --apply 写入。)'); return }

  console.log('\n── APPLY：写入 question_items.choices + answer ──')
  let done = 0
  for (const ch of changes) {
    const { error } = await db.from('question_items').update({ choices: ch.newChoices, answer: ch.newAnswer }).eq('id', ch.id)
    if (error) { console.error('  ✗', ch.id, error.message); continue }
    if (++done % 100 === 0) console.log(`  …${done}/${changes.length}`)
  }
  console.log(`✓ 写入 ${done}/${changes.length} 题`)
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
