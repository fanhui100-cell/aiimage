/* ════════════════════════════════════════════════════════════════════════
   audit-toefl-reading-semantics.ts — F2 TOEFL Reading 语义审计（只读，机械可判部分）

   范围：DB 中 level 6 · task_type ∈ {read_daily_life, reading_comprehension} · status='draft'
   （= pilot 20 + F1 扩容 180 = 200 套）。绝不写库。

   机械检查（errors → exit 1）：
   1. 总数：read_daily_life=100、reading_comprehension=100，全部 draft；
   2. 每 item 恰 4 个互异选项；answer 命中恰一个 choice id；
   3. stimulus 词数在模板上下限内（DL 12-70、AC 120-200）；
   4. 题数：DL 每套 2-3、AC 每套 4；
   5. 完全重复 passage（归一化后哈希相同）＝ 0；
   6. 陈旧措辞（"last sentence" / "the chart" / "the diagram" / "paragraph above" / "as shown above"）＝ 0；
   7. 无退役题型。

   启发式警告（warnings → 不 fail，供人工复核；语义终审由 LLM 对抗复审承担）：
   a. 近重复 passage：token-set Jaccard ≥ 0.60 的套对；
   b. 正确项位置分布：每 task_type 每位置占比须在 15%-35%；
   c. 纯词面重叠可解：正确项与 passage 内容词重叠 ≥3 且所有干扰项重叠 =0 的 item。

   输出：reports/toefl-reading-semantic-audit-2026-07-03.json（机器部分）。
   人工/LLM 语义结论由 reports/toefl-reading-semantic-audit-2026-07-03.md 汇总。
   用法：npx tsx scripts/audit-toefl-reading-semantics.ts
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { countWords } from '@/lib/exam-task-templates/shape'

const OUT = 'reports/toefl-reading-semantic-audit-2026-07-03.json'
const TASKS = [
  { taskType: 'read_daily_life', expect: 100, itemsRange: [2, 3] as [number, number], words: [12, 70] as [number, number] },
  { taskType: 'reading_comprehension', expect: 100, itemsRange: [4, 4] as [number, number], words: [120, 200] as [number, number] },
]
const STALE = [/last sentence/i, /the chart/i, /the diagram/i, /paragraph above/i, /as shown above/i]
const STOP = new Set(['the', 'a', 'an', 'of', 'to', 'in', 'on', 'at', 'for', 'and', 'or', 'is', 'are', 'was', 'were', 'be', 'it', 'its', 'their', 'they', 'that', 'this', 'with', 'by', 'from', 'as', 'not', 'but', 'have', 'has', 'can', 'may', 'will', 'must'])

const env = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : ''
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))

const errors: string[] = []
const warnings: string[] = []
const tokens = (t: string) => new Set((t.toLowerCase().match(/[a-z][a-z'’-]*/g) || []).filter((w) => !STOP.has(w) && w.length > 2))
const jaccard = (a: Set<string>, b: Set<string>) => { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i || 1) }

async function main() {
  type SetRow = { id: string; legacy_id: string | null; task_type: string; status: string; stimulus_id: string | null; qa_flags: Record<string, unknown> | null }
  const sets: SetRow[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('question_sets').select('id, legacy_id, task_type, status, stimulus_id, qa_flags').eq('level', 6).in('task_type', TASKS.map((t) => t.taskType)).range(from, from + 999)
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as SetRow[]
    sets.push(...rows); if (rows.length < 1000) break
  }
  const stimIds = [...new Set(sets.map((s) => s.stimulus_id).filter((x): x is string => !!x))]
  const stimText = new Map<string, string>()
  for (let i = 0; i < stimIds.length; i += 100) {
    const { data, error } = await db.from('stimuli').select('id, text_en').in('id', stimIds.slice(i, i + 100))
    if (error) throw new Error(error.message)
    for (const r of (data ?? []) as { id: string; text_en: string | null }[]) stimText.set(r.id, r.text_en ?? '')
  }
  type ItemRow = { question_set_id: string; choices: unknown; answer: unknown; prompt: string | null; status: string }
  const itemsBySet = new Map<string, ItemRow[]>()
  const setIds = sets.map((s) => s.id)
  for (let i = 0; i < setIds.length; i += 100) {
    const { data, error } = await db.from('question_items').select('question_set_id, choices, answer, prompt, status').in('question_set_id', setIds.slice(i, i + 100))
    if (error) throw new Error(error.message)
    for (const r of (data ?? []) as ItemRow[]) { const arr = itemsBySet.get(r.question_set_id) ?? itemsBySet.set(r.question_set_id, []).get(r.question_set_id)!; arr.push(r) }
  }

  const perTask: Record<string, { draft: number; nonDraft: number; items: number; pos: Record<string, number>; wordViolations: number }> = {}
  const passages: { setLegacy: string; task: string; toks: Set<string>; norm: string }[] = []

  for (const t of TASKS) {
    const mine = sets.filter((s) => s.task_type === t.taskType)
    const draft = mine.filter((s) => s.status === 'draft')
    const nonDraft = mine.filter((s) => s.status !== 'draft')
    if (draft.length !== t.expect) errors.push(`${t.taskType}: draft ${draft.length} ≠ ${t.expect}`)
    if (nonDraft.length) errors.push(`${t.taskType}: 存在非 draft 行 ${nonDraft.length}（F2 审计时应全部 draft）`)
    const pos: Record<string, number> = { a: 0, b: 0, c: 0, d: 0 }
    let itemCount = 0, wordViolations = 0
    for (const s of draft) {
      const legacy = s.legacy_id ?? s.id
      const passage = s.stimulus_id ? (stimText.get(s.stimulus_id) ?? '') : ''
      if (!passage.trim()) errors.push(`${t.taskType} ${legacy}: stimulus 缺失/为空`)
      const wc = countWords(passage)
      if (wc < t.words[0] || wc > t.words[1]) { wordViolations++; errors.push(`${t.taskType} ${legacy}: 词数 ${wc} 出界 ${t.words[0]}-${t.words[1]}`) }
      for (const re of STALE) if (re.test(passage)) errors.push(`${t.taskType} ${legacy}: 陈旧措辞 ${re}`)
      const its = itemsBySet.get(s.id) ?? []
      if (its.length < t.itemsRange[0] || its.length > t.itemsRange[1]) errors.push(`${t.taskType} ${legacy}: 题数 ${its.length} 出界`)
      for (const it of its) {
        itemCount++
        if (it.status !== 'draft') errors.push(`${t.taskType} ${legacy}: item 非 draft`)
        const ch = Array.isArray(it.choices) ? (it.choices as { id: string; text: string }[]) : []
        if (ch.length !== 4) { errors.push(`${t.taskType} ${legacy}: 选项数 ${ch.length}`); continue }
        const texts = ch.map((c) => c.text.trim().toLowerCase())
        if (new Set(texts).size !== 4) errors.push(`${t.taskType} ${legacy}: 选项重复`)
        const ans = String(it.answer)
        const hit = ch.filter((c) => String(c.id) === ans)
        if (hit.length !== 1) errors.push(`${t.taskType} ${legacy}: answer ${ans} 命中 ${hit.length} 个选项`)
        else {
          pos[ans] = (pos[ans] ?? 0) + 1
          for (const re of STALE) if (re.test(it.prompt ?? '') || re.test(hit[0].text)) errors.push(`${t.taskType} ${legacy}: item 陈旧措辞`)
          // 纯词面重叠启发式
          const ptoks = tokens(passage)
          const overlap = (txt: string) => { let n = 0; for (const w of tokens(txt)) if (ptoks.has(w)) n++; return n }
          const correctOv = overlap(hit[0].text)
          const maxDistractorOv = Math.max(...ch.filter((c) => String(c.id) !== ans).map((c) => overlap(c.text)))
          if (correctOv >= 3 && maxDistractorOv === 0) warnings.push(`${t.taskType} ${legacy}: 可能纯词面重叠可解（正确项重叠 ${correctOv}，干扰项 0）`)
        }
      }
      passages.push({ setLegacy: legacy, task: t.taskType, toks: tokens(passage), norm: passage.toLowerCase().replace(/\s+/g, ' ').trim() })
    }
    // 位置分布 15%-35%
    for (const k of ['a', 'b', 'c', 'd']) {
      const share = itemCount ? (pos[k] ?? 0) / itemCount : 0
      if (share < 0.15 || share > 0.35) warnings.push(`${t.taskType}: 正确项位置 ${k.toUpperCase()} 占比 ${(share * 100).toFixed(1)}%（期望 15-35%）`)
    }
    perTask[t.taskType] = { draft: draft.length, nonDraft: nonDraft.length, items: itemCount, pos, wordViolations }
  }

  // 完全重复 + 近重复
  const byNorm = new Map<string, string>()
  for (const p of passages) {
    if (byNorm.has(p.norm)) errors.push(`完全重复 passage：${p.setLegacy} == ${byNorm.get(p.norm)}`)
    else byNorm.set(p.norm, p.setLegacy)
  }
  let nearDupPairs = 0
  for (let i = 0; i < passages.length; i++) for (let j = i + 1; j < passages.length; j++) {
    if (passages[i].task !== passages[j].task) continue
    const sim = jaccard(passages[i].toks, passages[j].toks)
    if (sim >= 0.6) { nearDupPairs++; warnings.push(`近重复(${sim.toFixed(2)})：${passages[i].setLegacy} ~ ${passages[j].setLegacy}`) }
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    scope: 'toefl lv6 read_daily_life + reading_comprehension, status=draft',
    perTask, nearDupPairs,
    errors, warnings,
    ok: errors.length === 0,
  }
  writeFileSync(OUT, JSON.stringify(summary, null, 2) + '\n', 'utf8')
  console.log(`audit-toefl-reading-semantics: sets ${passages.length} · errors ${errors.length} · warnings ${warnings.length} · 近重复对 ${nearDupPairs}`)
  for (const t of TASKS) { const p = perTask[t.taskType]; console.log(`  ${t.taskType}: draft ${p.draft} · items ${p.items} · 位置 a=${p.pos.a} b=${p.pos.b} c=${p.pos.c} d=${p.pos.d}`) }
  if (warnings.length) { console.log('  警告（人工复核，不阻断）：'); for (const w of warnings.slice(0, 20)) console.log(`   ⚠ ${w}`) }
  if (errors.length) { console.error('  错误：'); for (const e of errors.slice(0, 40)) console.error(`   ✗ ${e}`); process.exitCode = 1 }
  else console.log(`✓ 机械语义审计通过 · 报告 ${OUT}`)
}
main().catch((e) => { console.error('audit-toefl-reading-semantics fatal', e?.message ?? e); process.exitCode = 1 })
