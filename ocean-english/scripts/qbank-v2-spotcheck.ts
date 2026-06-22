/* ════════════════════════════════════════════════════════════════════════
   qbank-v2-spotcheck.ts — v2 题组结构抽检（只读）

   按 task_type 抽样若干 set，打印结构 + 对结构化题型做轻量一致性断言：
   - banked_cloze / seven_select：answer 为索引数组，落在 bank/option 范围内、不重复
   - para_match：answer 为段落索引数组，范围合法
   - cloze_passage：answer 为每空 {options,answer}，answer ∈ options
   - grammar_fill：answer 为每空 {answer, acceptable?}，answer 非空
   - reading_comprehension：choice，answer 命中某 choice id；有 stimulus
   - listening_comprehension：有 stimulus（transcript 仅复审用）
   绝不写库。用法：npx tsx scripts/qbank-v2-spotcheck.ts --task=banked_cloze --n=3
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))

const argValue = (n: string) => { const h = process.argv.find((a) => a.startsWith(`${n}=`)); return h ? h.slice(n.length + 1) : null }
const TASK = argValue('--task') || 'banked_cloze'
const N = Number(argValue('--n') || '3')

const trunc = (s: string, n = 160) => (s.length > n ? s.slice(0, n) + '…' : s)

async function main() {
  const { data: sets, error } = await db
    .from('question_sets')
    .select('id, legacy_id, level, status, task_type, stimulus_id, qa_flags')
    .eq('task_type', TASK)
    .limit(N)
  if (error) throw new Error(error.message)
  if (!sets?.length) { console.log(`(no sets for ${TASK})`); return }

  let issues = 0
  for (const s of sets) {
    const { data: items } = await db.from('question_items').select('id, input_mode, choices, answer').eq('question_set_id', s.id).order('order_index', { ascending: true })
    type Stim = { kind: string; word_count: number | null; text_en: string | null }
    let stim: Stim | null = null
    if (s.stimulus_id) {
      const { data } = await db.from('stimuli').select('kind, word_count, text_en').eq('id', s.stimulus_id).single()
      stim = (data as Stim) ?? null
    }
    const it = items?.[0]
    const ans = it?.answer
    const choices = Array.isArray(it?.choices) ? (it!.choices as unknown[]) : []
    const notes: string[] = []

    if (TASK === 'reading_comprehension' || TASK === 'listening_comprehension') {
      if (!stim) notes.push('NO_STIMULUS')
      if (it?.input_mode === 'choice') {
        const ok = typeof ans === 'string' && choices.some((c) => String((c as { id: string }).id) === ans)
        if (!ok) notes.push('answer_not_in_choices')
      }
    } else if (TASK === 'banked_cloze' || TASK === 'seven_select') {
      // answer 为「bank/options 索引数组」：整数、互不重复、落在 [0, choices.length)
      const arr = Array.isArray(ans) ? (ans as number[]) : null
      const expectAns = TASK === 'banked_cloze' ? 10 : 5
      const expectOpt = TASK === 'banked_cloze' ? 15 : 7
      if (!arr) notes.push('answer_not_array')
      else {
        if (arr.length !== expectAns) notes.push(`answer_count_${arr.length}!=${expectAns}`)
        if (choices.length !== expectOpt) notes.push(`option_count_${choices.length}!=${expectOpt}`)
        if (new Set(arr).size !== arr.length) notes.push('dup_answer_index')
        if (arr.some((x) => !Number.isInteger(x))) notes.push('non_integer_index')
        if (arr.some((x) => x < 0 || x >= choices.length)) notes.push('answer_index_out_of_range')
      }
    } else if (TASK === 'para_match') {
      // answer 为「段落索引数组」：长度=statements 数；整数、落在 [0, paras)；可重复（多句可指同段）
      const arr = Array.isArray(ans) ? (ans as number[]) : null
      const paras = Number((s.qa_flags as { paras?: number } | null)?.paras ?? NaN)
      if (!arr) notes.push('answer_not_array')
      else {
        if (!Number.isInteger(paras)) notes.push('missing_qa_flags_paras')
        else if (arr.some((x) => !Number.isInteger(x) || x < 0 || x >= paras)) notes.push(`answer_out_of_para_range_0..${paras - 1}`)
        // para_match statements 数应等于 answers 数（choices 此处为 statements）
        if (choices.length && arr.length !== choices.length) notes.push(`answer_count_${arr.length}!=statements_${choices.length}`)
      }
    } else if (TASK === 'cloze_passage') {
      // 每空 {answer, options}：answer 为「options 索引字符串」或「option 文本」，二者皆合法。
      const arr = Array.isArray(ans) ? (ans as { options?: string[]; answer?: string }[]) : null
      if (!arr) notes.push('answer_not_array')
      else for (const b of arr) {
        const opts = b.options ?? []
        const a = b.answer
        if (a == null) { notes.push('blank_missing_answer'); break }
        const asIdx = Number(a)
        const idxOk = Number.isInteger(asIdx) && asIdx >= 0 && asIdx < opts.length
        const textOk = opts.includes(String(a))
        if (!idxOk && !textOk) { notes.push('blank_answer_unresolvable'); break }
      }
    } else if (TASK === 'grammar_fill') {
      // 两种合法形：扁平字符串数组，或 {answer, acceptable?} 对象数组。
      const arr = Array.isArray(ans) ? (ans as unknown[]) : null
      if (!arr) notes.push('answer_not_array')
      else for (const b of arr) {
        const v = typeof b === 'string' ? b : (b as { answer?: string })?.answer
        if (!v || !String(v).trim()) { notes.push('empty_blank_answer'); break }
      }
    }

    if (notes.length) issues++
    console.log(`• ${s.legacy_id} lv${s.level} [${s.status}] items=${items?.length ?? 0} stim=${stim ? `${stim.kind}/${stim.word_count ?? '?'}w` : 'none'} ${notes.length ? 'ISSUES=' + notes.join(',') : 'OK'}`)
    console.log(`    item0 mode=${it?.input_mode} choices=${choices.length} answer=${trunc(JSON.stringify(ans ?? null))}`)
  }
  console.log(`spotcheck ${TASK}: sampled ${sets.length}, sets_with_issues ${issues}`)
}
main().catch((e) => { console.error('spotcheck fatal', e?.message ?? e); process.exit(1) })
