/* ════════════════════════════════════════════════════════════════════════
   audit-word-universe-source-distribution.ts — word-universe 来源分布审计（只读）

   统计 def_to_word / synonym_choice / confusable_choice 三型的来源分布，
   用于防止 qb:(DeepSeek) 误上线、监控 active 全为 gen: Claude 原创。

   参数：
     --status=active|draft|all   默认 active
     --fail-on-qb-active         若目标集合(active)中 qb>0 → exit 1（门禁用）
     --json                      控制台打印 JSON（并始终写 reports/word-universe-source-distribution.json）

   来源判定：gen(legacy_id gen:) / qb(legacy_id qb:) / migrated_v1(qa_flags.migrated 或 source=migrated_v1) / other。
   badProvenance：legacy_id 前缀与 qa_flags(source/authored/provider) 不一致的条目。

   用法：
     npx tsx scripts/audit-word-universe-source-distribution.ts --status=active --fail-on-qb-active
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'

const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))

const argValue = (n: string) => { const h = process.argv.find((a) => a.startsWith(`${n}=`)); return h ? h.slice(n.length + 1) : null }
const STATUS = argValue('--status') ?? 'active'
const FAIL_ON_QB = process.argv.includes('--fail-on-qb-active')
const JSON_OUT = process.argv.includes('--json')
const TYPES = ['def_to_word', 'synonym_choice', 'confusable_choice']

interface Flags { source?: string; authored?: string; provider?: string; migrated?: boolean }
type Src = 'gen' | 'qb' | 'migrated_v1' | 'other'

function srcOf(legacyId: string | null, f: Flags): Src {
  if (legacyId?.startsWith('gen:')) return 'gen'
  if (legacyId?.startsWith('qb:')) return 'qb'
  if (f.migrated === true || f.source === 'migrated_v1') return 'migrated_v1'
  return 'other'
}
function claudeFlags(f: Flags): boolean { return f.source === 'original_authored' && f.authored === 'claude' && f.provider === 'claude-authored' }
function badProvenance(legacyId: string | null, f: Flags): boolean {
  const genPrefix = !!legacyId?.startsWith('gen:')
  if (genPrefix && !claudeFlags(f)) return true   // gen 前缀但 flags 不完整
  if (!genPrefix && claudeFlags(f)) return true   // 非 gen 前缀却标 claude
  return false
}

async function main() {
  let q = db.from('question_sets').select('id, legacy_id, task_type, exam_id, level, qa_flags, question_items(question_target_words(surface))').in('task_type', TYPES)
  if (STATUS !== 'all') q = q.eq('status', STATUS)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as { id: string; legacy_id: string | null; task_type: string; exam_id: string | null; level: number | null; qa_flags: Flags | null; question_items: { question_target_words: { surface: string | null }[] }[] }[]

  const bySource: Record<Src, number> = { gen: 0, qb: 0, migrated_v1: 0, other: 0 }
  const byTaskType: Record<string, Record<Src, number>> = {}
  const byExam: Record<string, number> = {}
  const byLevel: Record<string, number> = {}
  const byLetter: Record<string, number> = {}
  const activeBadProvenance: { id: string; legacy_id: string | null; task_type: string }[] = []
  const qbActiveSamples: { id: string; legacy_id: string | null; task_type: string }[] = []

  for (const r of rows) {
    const f = r.qa_flags ?? {}
    const src = srcOf(r.legacy_id, f)
    bySource[src]++
    byTaskType[r.task_type] = byTaskType[r.task_type] ?? { gen: 0, qb: 0, migrated_v1: 0, other: 0 }
    byTaskType[r.task_type][src]++
    if (r.exam_id) byExam[r.exam_id] = (byExam[r.exam_id] ?? 0) + 1
    if (r.level != null) byLevel[String(r.level)] = (byLevel[String(r.level)] ?? 0) + 1
    const surface = r.question_items?.[0]?.question_target_words?.[0]?.surface
    if (surface && /^[A-Za-z]/.test(surface)) { const l = surface[0].toLowerCase(); byLetter[l] = (byLetter[l] ?? 0) + 1 }
    if (badProvenance(r.legacy_id, f)) activeBadProvenance.push({ id: r.id, legacy_id: r.legacy_id, task_type: r.task_type })
    if (STATUS === 'active' && src === 'qb' && qbActiveSamples.length < 20) qbActiveSamples.push({ id: r.id, legacy_id: r.legacy_id, task_type: r.task_type })
  }

  const report = { generatedAt: new Date().toISOString(), status: STATUS, total: rows.length, bySource, byTaskType, byExam, byLevel, byLetter, activeBadProvenance, qbActiveSamples }
  writeFileSync('reports/word-universe-source-distribution.json', JSON.stringify(report, null, 2) + '\n', 'utf8')

  if (JSON_OUT) console.log(JSON.stringify(report, null, 2))
  else {
    console.log(`word-universe source distribution · status=${STATUS} · total ${rows.length}`)
    console.log(`  bySource: gen ${bySource.gen} / qb ${bySource.qb} / migrated_v1 ${bySource.migrated_v1} / other ${bySource.other}`)
    for (const [tt, s] of Object.entries(byTaskType)) console.log(`  ${tt}: gen ${s.gen} / qb ${s.qb} / migrated_v1 ${s.migrated_v1} / other ${s.other}`)
    console.log(`  badProvenance: ${activeBadProvenance.length}`)
    console.log(`  报告：reports/word-universe-source-distribution.json`)
  }

  const qbInTarget = bySource.qb
  if (FAIL_ON_QB && STATUS === 'active' && qbInTarget > 0) {
    console.error(`FAIL: active word-universe 含 qb 来源 ${qbInTarget} 条（应为 0）`)
    process.exitCode = 1
    return
  }
  process.exitCode = 0
}
main().catch((e) => { console.error('audit-source fatal', e?.message ?? e); process.exitCode = 1 })
