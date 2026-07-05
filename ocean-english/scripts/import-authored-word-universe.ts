/* ════════════════════════════════════════════════════════════════════════
   import-authored-word-universe.ts — Claude-authored 词汇宇宙单选题 → v2 draft

   背景：现有 word-universe draft 全是 qb:(DeepSeek 期) 且选词偏字母 a。本脚本导入
   Claude 亲自撰写的、覆盖缺失字母（尤其 p–z）的原创词汇题，仅写 **draft**。
   与 import-authored-question-sets-v2.ts 不同：本脚本支持无 stimulus 的词汇题，并写
   question_target_words（vocab 关联）——那个脚本是 passage/single_choice 用、不写 target_words。

   安全契约：
   - 默认 dry-run：只校验 + 打印计划，绝不写库。
   - 仅 --apply 才写 draft（绝不 active、绝不 promote）。
   - 退役题型（antonym_choice / cet_cloze）硬拒。
   - 每题硬校验：answer 命中某 choice；choices 恰 4 且文本去重无重复；prompt/word 非空；
     answer 词必须出现在 choices 里。任一不过 → reject，绝不写该题。
   - 幂等：legacy_id 由 (taskType|word|examId) 确定性哈希派生；已存在则 dup-skip。
   - 不调用 DeepSeek。不改前端/表结构。

   输入 JSON（data/generated-question-sets/<stage>/<file>.json）：
     { "stage": "...", "items": [
        { "taskType":"def_to_word|synonym_choice|confusable_choice",
          "examId":"toefl", "level":6, "word":"prodigal",
          "prompt":"挥霍的，浪费的",            // def_to_word/confusable_choice=中文释义；synonym_choice=英文词
          "choices":["prodigal","prudent","pristine","profound"], // 4 个英文词（含正确词）
          "answer":"prodigal",                  // 正确英文词（必须在 choices 内）
          "explainZh":"..." }                    // 可选解析
     ] }

   用法：
     npx tsx scripts/import-authored-word-universe.ts --file=data/generated-question-sets/wu-pz/word-universe.json
     npx tsx scripts/import-authored-word-universe.ts --file=... --apply
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { isDeprecatedQuestionType } from '@/lib/question-bank/question-type-taxonomy'
import { getExamSpec } from '@/lib/exam-specs'

const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const SUPABASE_URL = readEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_ROLE = readEnv('SUPABASE_SERVICE_ROLE_KEY')

const argValue = (n: string) => { const h = process.argv.find((a) => a.startsWith(`${n}=`)); return h ? h.slice(n.length + 1) : null }
const APPLY = process.argv.includes('--apply')
const FILE = argValue('--file')

const ALLOWED = new Set(['def_to_word', 'synonym_choice', 'confusable_choice'])
const LETTER_IDS = ['a', 'b', 'c', 'd']

interface RawItem { taskType: string; examId: string; level: number; word: string; prompt: string; choices: string[]; answer: string; explainZh?: string }
interface AuthoredFile { stage: string; items: RawItem[] }

function hashId(s: string): string { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0).toString(36) }

// 返回 null=通过；否则 reject 原因。
function validateItem(r: RawItem): string | null {
  if (!ALLOWED.has(r.taskType)) return `task_type_not_allowed:${r.taskType}`
  if (isDeprecatedQuestionType(r.taskType)) return `deprecated_type:${r.taskType}`
  if (!getExamSpec(r.examId)) return `unknown_exam:${r.examId}`
  if (!Number.isInteger(r.level) || r.level < 1 || r.level > 8) return `bad_level:${r.level}`
  if (!r.word || !r.word.trim()) return 'empty_word'
  if (!r.prompt || !r.prompt.trim()) return 'empty_prompt'
  if (!Array.isArray(r.choices) || r.choices.length !== 4) return `choices_not_4:${r.choices?.length}`
  if (r.choices.some((c) => !c || !c.trim())) return 'empty_choice'
  const lower = r.choices.map((c) => c.trim().toLowerCase())
  if (new Set(lower).size !== 4) return 'duplicate_choice_text'
  if (!r.answer || !r.answer.trim()) return 'empty_answer'
  if (!lower.includes(r.answer.trim().toLowerCase())) return 'answer_not_in_choices'
  // synonym_choice：英文词题干不应等于答案；def/confusable：答案词必须等于 word（被考词）
  if (r.taskType !== 'synonym_choice' && r.answer.trim().toLowerCase() !== r.word.trim().toLowerCase()) return 'answer_word_mismatch'
  return null
}

function buildChoices(r: RawItem): { choices: { id: string; text: string }[]; answerId: string } {
  const choices = r.choices.map((text, i) => ({ id: LETTER_IDS[i], text: text.trim() }))
  const answerId = choices.find((c) => c.text.toLowerCase() === r.answer.trim().toLowerCase())!.id
  return { choices, answerId }
}

async function setExists(db: SupabaseClient, legacyId: string): Promise<boolean> {
  const { data } = await db.from('question_sets').select('id').eq('legacy_id', legacyId).limit(1)
  return !!(data && data.length)
}

async function writeDraft(db: SupabaseClient, r: RawItem, stage: string, tag: string, dictIds: Set<string>): Promise<boolean> {
  const { choices, answerId } = buildChoices(r)
  const qaFlags: Record<string, unknown> = { generated: true, authored: 'claude', provider: 'claude-authored', stage, source: 'original_authored', template: r.taskType }
  if (r.explainZh) qaFlags.explainZh = r.explainZh
  // difficulty_band 受 CHECK 1..5（CEFR rank，非 level 1..8）约束；词汇题难度交由 level 表达，此处留 null（与现有 toefl 题一致）。
  const { data: setData, error: setErr } = await db.from('question_sets').insert({
    legacy_id: `gen:${r.taskType}:set:claude:${tag}`, exam_id: getExamSpec(r.examId)!.id, level: r.level, task_type: r.taskType,
    topic_tags: [], status: 'draft', qa_flags: qaFlags,
  }).select('id').single()
  if (setErr) { console.error(`  set insert (${r.word}): ${setErr.message}`); return false }
  const setId = (setData as { id: string }).id
  const { data: itemData, error: itemErr } = await db.from('question_items').insert({
    legacy_id: `gen:${r.taskType}:item:claude:${tag}`, question_set_id: setId, order_index: 0,
    input_mode: 'choice', prompt: r.prompt.trim(), choices, answer: answerId, subskills: [], status: 'draft',
  }).select('id').single()
  if (itemErr) { console.error(`  item insert (${r.word}): ${itemErr.message}`); await db.from('question_sets').delete().eq('id', setId); return false }
  const itemId = (itemData as { id: string }).id
  // word_id FK → dictionary_words(id)；仅当该词在词库时落 word_id，否则留 null（生僻补充词不在词库不应阻断；surface 仍保留）。
  const wkey = r.word.trim().toLowerCase()
  const { error: twErr } = await db.from('question_target_words').insert({
    question_item_id: itemId, surface: r.word.trim(), role: 'tested_answer', word_id: dictIds.has(wkey) ? wkey : null,
  })
  if (twErr) { console.error(`  target_word insert (${r.word}): ${twErr.message}`); await db.from('question_items').delete().eq('id', itemId); await db.from('question_sets').delete().eq('id', setId); return false }
  return true
}

async function main() {
  if (!FILE) { console.error('import-wu: 需 --file=<path>'); process.exit(1) }
  const af = JSON.parse(readFileSync(FILE, 'utf8')) as AuthoredFile
  const stage = af.stage ?? 'wu-adhoc'

  let db: SupabaseClient | null = null
  const dictIds = new Set<string>()
  if (APPLY) {
    if (!SUPABASE_URL || !SERVICE_ROLE) { console.error('import-wu: --apply 需 Supabase 凭据'); process.exit(1) }
    db = createClient(SUPABASE_URL, SERVICE_ROLE)
    // 预查词库：哪些目标词在 dictionary_words(id)。在库→落 word_id；不在→null（避免 FK 失败阻断生僻补充词）。
    const allWords = [...new Set(af.items.map((r) => r.word.trim().toLowerCase()))]
    for (let i = 0; i < allWords.length; i += 200) {
      const { data } = await db.from('dictionary_words').select('id').in('id', allWords.slice(i, i + 200))
      for (const d of (data ?? []) as { id: string }[]) dictIds.add(d.id)
    }
  }

  let ok = 0, reject = 0, wrote = 0, dup = 0
  const rejectsByReason: Record<string, number> = {}
  const byTypeLetter: Record<string, Record<string, number>> = {}

  for (const r of af.items) {
    const why = validateItem(r)
    if (why) { reject++; rejectsByReason[why] = (rejectsByReason[why] ?? 0) + 1; console.error(`  ✗ ${r.taskType} "${r.word}" reject=${why}`); continue }
    ok++
    const ltr = r.word.trim()[0].toLowerCase()
    byTypeLetter[r.taskType] = byTypeLetter[r.taskType] ?? {}
    byTypeLetter[r.taskType][ltr] = (byTypeLetter[r.taskType][ltr] ?? 0) + 1
    const tag = hashId(`${r.taskType}|${r.word.trim().toLowerCase()}|${r.examId}`)
    if (APPLY && db) {
      const legacyId = `gen:${r.taskType}:set:claude:${tag}`
      if (await setExists(db, legacyId)) { dup++; continue }
      if (await writeDraft(db, r, stage, tag, dictIds)) wrote++; else { reject++; rejectsByReason['db_write_failed'] = (rejectsByReason['db_write_failed'] ?? 0) + 1 }
    }
  }

  const reportPath = `reports/authored-word-universe-${APPLY ? 'apply' : 'dryrun'}-report.json`
  writeFileSync(reportPath, JSON.stringify({ generatedAt: new Date().toISOString(), apply: APPLY, file: FILE, stage, totals: { parsedOk: ok, reject, wrote, dupSkip: dup }, rejectsByReason, letterCoverage: byTypeLetter }, null, 2) + '\n', 'utf8')
  console.log(`import-wu ${APPLY ? 'APPLY' : 'DRY-RUN'}: ok ${ok} · reject ${reject}` + (APPLY ? ` · wrote ${wrote} · dup-skip ${dup}` : ''))
  for (const [tt, letters] of Object.entries(byTypeLetter)) {
    const ls = Object.keys(letters).sort().join(',')
    console.log(`  ${tt}: ${Object.values(letters).reduce((a, b) => a + b, 0)} 条 · 字母 [${ls}]`)
  }
  if (Object.keys(rejectsByReason).length) console.log(`  reject reasons: ${JSON.stringify(rejectsByReason)}`)
  console.log(`  报告：${reportPath}`)
  process.exitCode = (reject > 0 && ok === 0) ? 1 : 0
}

main().catch((e) => { console.error('import-wu fatal', e?.message ?? e); process.exitCode = 1 })
