/* ════════════════════════════════════════════════════════════════════════
   normalize-authored-answer-positions.ts — 修正 Claude-authored 题目答案位置偏置

   背景（ledger R2-answer-position-bias）：本 run Claude 撰写的 reading_multi(C/D/E/F)
   与 cloze_passage(B) 的正确项位置严重偏向某一固定位（多为 'B' / 索引 1），虽答案唯一、
   干扰项合理、QA 全过，但位置分布不像真实考试，promote 后易被识破规律。

   本脚本只重排「选项顺序」并同步更新答案位置，绝不改写题面/选项文本/正确答案本身：
   - input_mode='choice'（reading_multi / single_choice）：重排 choices[].text，
     id 仍按 a,b,c,d 顺序；answer 指向同一正确文本的新位置字母。
   - cloze_passage（answer 为 [{options[],answer:"<idx>"}]）：逐空重排 options，
     answer 索引指向同一正确文本的新位置。

   幂等保证：先把选项按文本规范排序（canonical），再用 legacy_id 派生的确定性种子
   Fisher-Yates 打乱。无论当前库内顺序如何，结果始终一致 → 可安全重复执行。
   选项内出现重复文本时跳过该题/该空（避免定位歧义），并在报告中标注。

   安全契约：默认 dry-run（只统计 + 打印重排前后位置分布，绝不写库）；仅 --apply 写回。
   只动 status='draft' 且 qa_flags.provider='claude-authored' 的 set。set id 不变 →
   不破坏导入幂等。grammar_fill(multi_blank gblanks) / para_match / bank_answers 不处理。

   用法：
     npx tsx scripts/normalize-authored-answer-positions.ts            # dry-run
     npx tsx scripts/normalize-authored-answer-positions.ts --apply    # 写回
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const SUPABASE_URL = readEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_ROLE = readEnv('SUPABASE_SERVICE_ROLE_KEY')
const APPLY = process.argv.includes('--apply')

const db: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE)

function hashStr(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
function mulberry32(a: number) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function seededShuffle<T>(arr: T[], seed: number): T[] { const rng = mulberry32(seed); const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
const hasDup = (a: string[]) => new Set(a.map((x) => x.toLowerCase())).size !== a.length

interface Item { id: string; legacy_id: string; input_mode: string; choices: unknown; answer: unknown }

type ChoiceObj = { id: string; text: string }

async function pageSets(): Promise<{ id: string; qa_flags: Record<string, unknown> | null }[]> {
  const out: { id: string; qa_flags: Record<string, unknown> | null }[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('question_sets').select('id, qa_flags, status').eq('status', 'draft').order('id', { ascending: true }).range(from, from + 999)
    if (error) throw new Error(`question_sets: ${error.message}`)
    const rows = (data ?? []) as { id: string; qa_flags: Record<string, unknown> | null }[]
    out.push(...rows)
    if (rows.length < 1000) break
  }
  return out.filter((s) => (s.qa_flags as { provider?: string } | null)?.provider === 'claude-authored')
}

async function main() {
  const sets = await pageSets()
  const setIds = sets.map((s) => s.id)
  // letter distribution before/after for choice items; index distribution for cloze
  const before: Record<string, number> = {}
  const after: Record<string, number> = {}
  const clozeBefore: Record<string, number> = {}
  const clozeAfter: Record<string, number> = {}
  let choiceItems = 0, clozeBlanks = 0, skippedDup = 0, updated = 0

  for (let i = 0; i < setIds.length; i += 100) {
    const chunk = setIds.slice(i, i + 100)
    const { data: items, error } = await db.from('question_items').select('id, legacy_id, input_mode, choices, answer').in('question_set_id', chunk)
    if (error) throw new Error(`question_items: ${error.message}`)
    for (const it of (items ?? []) as Item[]) {
      // ── choice (reading_multi / single_choice) ──
      if (it.input_mode === 'choice' && Array.isArray(it.choices)) {
        const choices = it.choices as ChoiceObj[]
        const texts = choices.map((c) => String(c.text))
        const correctLetter = String(it.answer)
        const correctText = choices.find((c) => c.id === correctLetter)?.text
        if (correctText == null) continue
        before[correctLetter] = (before[correctLetter] ?? 0) + 1
        choiceItems++
        if (hasDup(texts)) { skippedDup++; after[correctLetter] = (after[correctLetter] ?? 0) + 1; continue }
        const canonical = [...choices].sort((a, b) => String(a.text).localeCompare(String(b.text)))
        const shuffled = seededShuffle(canonical, hashStr(it.legacy_id))
        const newChoices = shuffled.map((c, idx) => ({ id: 'abcd'[idx], text: c.text }))
        const newLetter = 'abcd'[newChoices.findIndex((c) => c.text === correctText)]
        after[newLetter] = (after[newLetter] ?? 0) + 1
        if (APPLY) {
          const { error: uerr } = await db.from('question_items').update({ choices: newChoices, answer: newLetter }).eq('id', it.id)
          if (uerr) { console.error(`  item ${it.id} update: ${uerr.message}`); process.exit(1) }
          updated++
        }
        continue
      }
      // ── cloze_passage (answer = [{options[], answer:"<idx>"}]) ──
      if (it.input_mode === 'multi_blank' && Array.isArray(it.answer) && (it.answer as unknown[]).every((b) => b && typeof b === 'object' && Array.isArray((b as { options?: unknown }).options))) {
        const blanks = it.answer as { options: string[]; answer: string }[]
        const newBlanks: { options: string[]; answer: string }[] = []
        let blankChanged = false
        for (let bi = 0; bi < blanks.length; bi++) {
          const bl = blanks[bi]
          const opts = bl.options.map((x) => String(x))
          const correctIdx = parseInt(String(bl.answer), 10)
          const correctText = opts[correctIdx]
          clozeBlanks++
          clozeBefore[String(correctIdx)] = (clozeBefore[String(correctIdx)] ?? 0) + 1
          if (correctText == null || hasDup(opts)) { skippedDup++; newBlanks.push({ options: opts, answer: String(correctIdx) }); clozeAfter[String(correctIdx)] = (clozeAfter[String(correctIdx)] ?? 0) + 1; continue }
          const canonical = [...opts].sort((a, b) => a.localeCompare(b))
          const shuffled = seededShuffle(canonical, hashStr(it.legacy_id + ':' + bi))
          const newIdx = shuffled.findIndex((o) => o === correctText)
          newBlanks.push({ options: shuffled, answer: String(newIdx) })
          clozeAfter[String(newIdx)] = (clozeAfter[String(newIdx)] ?? 0) + 1
          if (newIdx !== correctIdx) blankChanged = true
        }
        if (APPLY && blankChanged) {
          const { error: uerr } = await db.from('question_items').update({ answer: newBlanks }).eq('id', it.id)
          if (uerr) { console.error(`  cloze ${it.id} update: ${uerr.message}`); process.exit(1) }
          updated++
        }
        continue
      }
    }
  }

  const pct = (d: Record<string, number>, total: number) => Object.keys(d).sort().map((k) => `${k}:${d[k]}(${total ? Math.round((d[k] / total) * 100) : 0}%)`).join(' ')
  console.log(`mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`)
  console.log(`claude-authored sets: ${sets.length}`)
  console.log(`\n[choice items] count=${choiceItems}`)
  console.log(`  BEFORE letters: ${pct(before, choiceItems)}`)
  console.log(`  AFTER  letters: ${pct(after, choiceItems)}`)
  console.log(`\n[cloze blanks] count=${clozeBlanks}`)
  console.log(`  BEFORE index: ${pct(clozeBefore, clozeBlanks)}`)
  console.log(`  AFTER  index: ${pct(clozeAfter, clozeBlanks)}`)
  console.log(`\nskipped (duplicate options, kept as-is): ${skippedDup}`)
  console.log(`items updated: ${APPLY ? updated : '(dry-run, 0)'}`)
}

main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exit(1) })
