/* ════════════════════════════════════════════════════════════════════════
   smoke-grouped-cloze.ts — R3 分组完形重建冒烟（reconstructCloze 真数据校验）

   banked_cloze/grammar_fill 为 draft（session 仅服务 active），故直取真草稿数据跑
   reconstructCloze，断言：段落含 blank token、blank 数=answer 数=review.key 数、
   banked 有词库 bank 且每空正解∈bank、grammar_fill 无 bank 且提示 (hint) 文本保留、
   review.cloze.key 非空。提交前题面(clozeBody.segments)不含正解文本。只读，不写库。
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { reconstructCloze, reconstructPassageCloze, reconstructSevenSelect, reconstructParaMatch } from '@/lib/practice/session-builder'
const env = readFileSync('.env.local', 'utf8')
const rd = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]!.trim()
const db = createClient(rd('NEXT_PUBLIC_SUPABASE_URL'), rd('SUPABASE_SERVICE_ROLE_KEY'))

let failures = 0
const check = (c: boolean, m: string) => { if (c) console.log('  ✓', m); else { console.log('  ✗', m); failures++ } }

async function oneSet(taskType: string) {
  const { data: sets } = await db.from('question_sets').select('id,stimulus_id,legacy_id').eq('task_type', taskType).like('legacy_id', 'gen:%').limit(1)
  if (!sets || !sets.length) { console.log(`  ⚠ ${taskType}: 无数据，跳过`); return }
  const s = sets[0]
  const { data: st } = await db.from('stimuli').select('text_en').eq('id', (s as { stimulus_id: string }).stimulus_id)
  const { data: it } = await db.from('question_items').select('choices,answer,explanation_zh').eq('question_set_id', (s as { id: string }).id).order('order_index').limit(1)
  const item = it && it[0] ? it[0] as { choices: { id: string; text: string }[]; answer: unknown; explanation_zh: string | null } : null
  if (!item) { console.log(`  ⚠ ${taskType}: 无 item`); return }
  const passage = (st && st[0] ? (st[0] as { text_en: string }).text_en : '') || ''
  const choices = Array.isArray(item.choices) ? item.choices : []
  const r = reconstructCloze(taskType, passage, choices, item.answer, item.explanation_zh ?? '')
  console.log(`\n## ${taskType} (${(s as { legacy_id: string }).legacy_id.split(':claude:')[1]})`)
  check(!!r, `${taskType}: 重建成功`)
  if (!r) { failures++; return }
  const blanks = r.clozeBody.segments.filter((x) => typeof x === 'object').length
  const ansLen = Array.isArray(item.answer) ? item.answer.length : 0
  const keyLen = Object.keys(r.review.cloze.key).length
  check(blanks > 0, `${taskType}: segments 含 ${blanks} 个 blank`)
  check(blanks === ansLen && keyLen === ansLen, `${taskType}: blank=answer=key 数一致（${blanks}/${ansLen}/${keyLen}）`)
  check(Object.values(r.review.cloze.key).every((v) => typeof v === 'string' && v.length > 0), `${taskType}: review.key 每空非空`)
  if (taskType === 'banked_cloze') {
    check(Array.isArray(r.clozeBody.bank) && r.clozeBody.bank.length > 0, `banked: 有词库 bank（${r.clozeBody.bank?.length} 词）`)
    const bankSet = new Set(r.clozeBody.bank)
    check(Object.values(r.review.cloze.key).every((v) => bankSet.has(v)), 'banked: 每空正解 ∈ bank')
  } else {
    check(!r.clozeBody.bank, 'grammar_fill: 无 bank（自由输入）')
    // 提示 (hint) 文本应保留在 segments 文本中（如 (surprising)）
    const text = r.clozeBody.segments.filter((x) => typeof x === 'string').join(' ')
    check(/\([a-zA-Z]/.test(text), 'grammar_fill: 提示 (hint) 文本保留在题面')
    // 防 [object Object]：gblanks {answer,acceptable} 形状必须取 .answer 而非 stringify 整个对象
    check(Object.values(r.review.cloze.key).every((v) => v !== '[object Object]' && /[a-zA-Z]/.test(v)), 'grammar_fill: key 为真实词（非 [object Object]）')
  }
  // 题面文本不应直接含正解（grammar 正解词不应出现在 segments 文本——除非巧合，仅 banked 跳过因 bank 必含）
}

async function rawSet(taskType: string) {
  const { data: sets } = await db.from('question_sets').select('id,stimulus_id,legacy_id').eq('task_type', taskType).limit(1)
  if (!sets || !sets.length) { console.log(`  ⚠ ${taskType}: 无数据，跳过`); return null }
  const s = sets[0]
  const { data: st } = await db.from('stimuli').select('text_en').eq('id', (s as { stimulus_id: string }).stimulus_id)
  const { data: it } = await db.from('question_items').select('choices,answer,explanation_zh').eq('question_set_id', (s as { id: string }).id).order('order_index').limit(1)
  const item = it && it[0] ? it[0] as { choices: { id: string; text: string }[]; answer: unknown; explanation_zh: string | null } : null
  if (!item) return null
  return { tag: (s as { legacy_id: string }).legacy_id.split(':claude:')[1], passage: (st && st[0] ? (st[0] as { text_en: string }).text_en : '') || '', choices: Array.isArray(item.choices) ? item.choices : [], answer: item.answer, ex: item.explanation_zh ?? '' }
}

async function main() {
  console.log('smoke-grouped-cloze: R3 分组完形/阅读重建')
  await oneSet('banked_cloze')
  await oneSet('grammar_fill')

  // cloze_passage（逐空四选）
  const cp = await rawSet('cloze_passage')
  if (cp) {
    console.log(`\n## cloze_passage (${cp.tag})`)
    const r = reconstructPassageCloze(cp.passage, cp.answer, cp.ex)
    check(!!r, 'cloze_passage: 重建成功')
    if (r) {
      const blanks = r.passageClozeBody.segments.filter((x) => typeof x === 'object') as { blank: number; options: unknown[] }[]
      const ansLen = Array.isArray(cp.answer) ? cp.answer.length : 0
      check(blanks.length === ansLen, `cloze_passage: blank=answer 数一致（${blanks.length}/${ansLen}）`)
      check(blanks.every((b) => Array.isArray(b.options) && b.options.length === 4), '每空带 4 个选项')
      check(Object.keys(r.review.passageCloze.key).length === ansLen, 'review.key 数=空数')
    }
  }
  // seven_select（七选五）
  const sv = await rawSet('seven_select')
  if (sv) {
    console.log(`\n## seven_select (${sv.tag})`)
    const r = reconstructSevenSelect(sv.passage, sv.choices, sv.answer, sv.ex)
    check(!!r, 'seven_select: 重建成功')
    if (r) {
      const gaps = r.sevenSelectBody.segments.filter((x) => typeof x === 'object').length
      const ansLen = Array.isArray(sv.answer) ? sv.answer.length : 0
      check(gaps === ansLen, `seven_select: gap=answer 数一致（${gaps}/${ansLen}）`)
      check(r.sevenSelectBody.candidates.length > gaps, `候选句多于空（${r.sevenSelectBody.candidates.length}>${gaps}，含干扰）`)
      const ids = new Set(r.sevenSelectBody.candidates.map((c) => c.id))
      check(Object.values(r.review.sevenSelect.key).every((v) => ids.has(v)), '每空正解 ∈ 候选句 id')
    }
  }
  // para_match（段落匹配）
  const pm = await rawSet('para_match')
  if (pm) {
    console.log(`\n## para_match (${pm.tag})`)
    const r = reconstructParaMatch(pm.passage, pm.choices, pm.answer, pm.ex)
    check(!!r, 'para_match: 重建成功')
    if (r) {
      check(r.paraMatchBody.paragraphs.length > 0, `解析出 ${r.paraMatchBody.paragraphs.length} 个段落`)
      check(r.paraMatchBody.statements.length === pm.choices.length, `陈述数=${r.paraMatchBody.statements.length}`)
      const labels = new Set(r.paraMatchBody.paragraphs.map((p) => p.label))
      check(Object.values(r.review.paraMatch.key).every((v) => labels.has(v)), '每陈述正解段落 ∈ 解析段落标号')
    }
  }

  console.log(failures === 0 ? '\nsmoke-grouped-cloze PASS' : `\nsmoke-grouped-cloze FAIL（${failures}）`)
  if (failures) process.exitCode = 1
}
main().catch((e) => { console.error('fatal', e?.message ?? e); process.exit(1) })
