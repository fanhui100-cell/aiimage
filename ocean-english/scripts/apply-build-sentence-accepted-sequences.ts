/* ════════════════════════════════════════════════════════════════════════
   apply-build-sentence-accepted-sequences.ts — 给 build_a_sentence pilot draft 写入
   accepted-sequence 判分契约（2026-07-05 Phase 10，幂等、manifest 式，draft-only）

   源清单：data/generated-question-sets/toefl-build-sentence-accepted-sequences-2026-07-05.json
   （人工审定的每句 canonical + 可接受语序下标集合）。

   对每条 entry（按 legacy_id 定位 draft set 的唯一 item）：
   - 校验：choices 数 = 下标长度；canonicalIdx 与 DB 现存 legacy 排列一致（防错配）；
     acceptedIdx 全为合法全排列且含 canonical；转换为词块文本后过 isBuildSentenceAnswer。
   - --apply：item.answer ← 契约对象 {canonical, acceptedSequences, scoring:'accepted_sequence_exact',
     official:false}；set.qa_flags 删除 scoring_not_ready、加 scoringContract:'accepted_sequence_exact'。
   - 不改 status（保持 draft）；不 promote；幂等（已带合法契约且 flag 已清 → dup-skip）。

   用法：
     npx tsx scripts/apply-build-sentence-accepted-sequences.ts --dry-run   # 默认亦 dry-run
     npx tsx scripts/apply-build-sentence-accepted-sequences.ts --apply
   报告：reports/build-sentence-accepted-sequences-apply-report.json
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { isBuildSentenceAnswer } from '@/lib/papers/scoring'

const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))
const SRC = 'data/generated-question-sets/toefl-build-sentence-accepted-sequences-2026-07-05.json'
const OUT = 'reports/build-sentence-accepted-sequences-apply-report.json'
const APPLY = process.argv.includes('--apply')

interface Entry { legacyId: string; sentence: string; canonicalIdx: number[]; acceptedIdx: number[][]; why_single?: string }
interface Manifest { entries: Entry[] }

const isPermutation = (seq: number[], n: number) =>
  seq.length === n && seq.every((x) => Number.isInteger(x) && x >= 0 && x < n) && new Set(seq).size === n

async function main() {
  const manifest = JSON.parse(readFileSync(SRC, 'utf8')) as Manifest
  const results: { legacyId: string; action: string; detail?: string }[] = []
  let updated = 0, skipped = 0, failed = 0

  for (const e of manifest.entries) {
    const { data: sets, error } = await db.from('question_sets')
      .select('id, legacy_id, status, qa_flags, question_items(id, choices, answer, status)')
      .eq('task_type', 'build_a_sentence').eq('legacy_id', e.legacyId)
    if (error) { results.push({ legacyId: e.legacyId, action: 'error', detail: error.message }); failed++; continue }
    const set = (sets ?? [])[0] as { id: string; status: string; qa_flags: Record<string, unknown> | null; question_items: { id: string; choices: unknown; answer: unknown; status: string }[] } | undefined
    if (!set) { results.push({ legacyId: e.legacyId, action: 'error', detail: 'set_not_found' }); failed++; continue }
    if (set.status !== 'draft') { results.push({ legacyId: e.legacyId, action: 'error', detail: `set_not_draft:${set.status}` }); failed++; continue }
    const item = set.question_items?.[0]
    if (!item || set.question_items.length !== 1) { results.push({ legacyId: e.legacyId, action: 'error', detail: 'expect_exactly_one_item' }); failed++; continue }

    const choices = Array.isArray(item.choices) ? (item.choices as { id: string; text: string }[]) : []
    const n = choices.length
    // 幂等：已带合法契约且 flag 已清 → skip
    const flags = (set.qa_flags ?? {}) as Record<string, unknown>
    if (isBuildSentenceAnswer(item.answer) && flags.scoring_not_ready !== true) {
      results.push({ legacyId: e.legacyId, action: 'dup-skip' }); skipped++; continue
    }
    // 校验清单与 DB 一致性
    if (!isPermutation(e.canonicalIdx, n)) { results.push({ legacyId: e.legacyId, action: 'error', detail: 'canonical_not_permutation' }); failed++; continue }
    if (Array.isArray(item.answer)) {
      const dbAns = (item.answer as unknown[]).map((x) => Number(x))
      if (JSON.stringify(dbAns) !== JSON.stringify(e.canonicalIdx)) {
        results.push({ legacyId: e.legacyId, action: 'error', detail: `canonical_mismatch_db:[${dbAns}] manifest:[${e.canonicalIdx}]` }); failed++; continue
      }
    }
    if (!Array.isArray(e.acceptedIdx) || e.acceptedIdx.length < 1 || e.acceptedIdx.length > 4
      || e.acceptedIdx.some((seq) => !isPermutation(seq, n))) {
      results.push({ legacyId: e.legacyId, action: 'error', detail: 'accepted_idx_invalid' }); failed++; continue
    }
    const toTokens = (idx: number[]) => idx.map((i) => String(choices[i].text))
    const seqs = e.acceptedIdx.map(toTokens)
    const canonical = toTokens(e.canonicalIdx)
    const key = (t: string[]) => t.join('').toLowerCase()
    if (!seqs.some((s) => key(s) === key(canonical))) seqs.unshift(canonical)
    const contract = { canonical, acceptedSequences: seqs, scoring: 'accepted_sequence_exact', official: false }
    if (!isBuildSentenceAnswer(contract)) { results.push({ legacyId: e.legacyId, action: 'error', detail: 'contract_failed_validation' }); failed++; continue }
    // 句子完整性：canonical 连接后应与清单 sentence 一致（忽略大小写/尾标点）
    const joined = canonical.join(' ').toLowerCase().replace(/[.!?]+$/, '')
    const expect = e.sentence.toLowerCase().replace(/[.!?]+$/, '')
    if (joined !== expect) { results.push({ legacyId: e.legacyId, action: 'error', detail: `sentence_mismatch:"${joined}"!="${expect}"` }); failed++; continue }

    if (APPLY) {
      const { error: e1 } = await db.from('question_items').update({ answer: contract }).eq('id', item.id).eq('status', 'draft')
      if (e1) { results.push({ legacyId: e.legacyId, action: 'error', detail: `item_update:${e1.message}` }); failed++; continue }
      const newFlags = { ...flags, scoringContract: 'accepted_sequence_exact' }
      delete (newFlags as Record<string, unknown>).scoring_not_ready
      const { error: e2 } = await db.from('question_sets').update({ qa_flags: newFlags }).eq('id', set.id).eq('status', 'draft')
      if (e2) { results.push({ legacyId: e.legacyId, action: 'error', detail: `set_update:${e2.message}` }); failed++; continue }
      results.push({ legacyId: e.legacyId, action: 'updated', detail: `${seqs.length} accepted sequence(s)` }); updated++
    } else {
      results.push({ legacyId: e.legacyId, action: 'would-update', detail: `${seqs.length} accepted sequence(s)` })
    }
  }

  const report = { generatedAt: new Date().toISOString(), apply: APPLY, source: SRC, entries: manifest.entries.length, updated, dupSkipped: skipped, failed, results }
  writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n', 'utf8')
  console.log(`apply-build-sentence-accepted-sequences ${APPLY ? 'APPLY' : 'DRY-RUN'}`)
  console.log(`  entries ${manifest.entries.length} · updated ${updated} · dup-skip ${skipped} · failed ${failed}`)
  for (const r of results) if (r.action === 'error') console.error(`  ERROR ${r.legacyId}: ${r.detail}`)
  console.log(`  报告：${OUT}`)
  process.exitCode = failed ? 1 : 0
}

main().catch((e) => { console.error('fatal', e?.message ?? e); process.exitCode = 1 })
