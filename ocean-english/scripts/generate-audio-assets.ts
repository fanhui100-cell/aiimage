/* ════════════════════════════════════════════════════════════════════════
   generate-audio-assets.ts — 听力稳定音频生成管线（Phase 9，默认 dry-run）

   安全契约：
   - 默认 dry-run：只读 v2 listening 材料，列出「缺稳定音频」的清单，不合成、不上传、不写库。
   - 仅 --apply 才合成音频、写 Supabase Storage、插 audio_assets 行。
   - v2 表未建：dry-run 报 not_applied 退出 0；--apply 拒绝退出 1。
   - 缺存储/Provider 配置（SUPABASE_AUDIO_BUCKET / AUDIO_TTS_API_KEY）：--apply 拒绝退出 1。
   - 新音频行 qa_status 默认 machine_checked，绝不 active（上架须经人工/校验）。
   - 不动词级发音/TTS 兜底；不批量重生成内容。

   用法：
     npx tsx scripts/generate-audio-assets.ts [--apply] [--limit=N] [--exam=cet4] \
       [--task=listening_comprehension] [--provider=azure]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'

const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const SUPABASE_URL = readEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_ROLE = readEnv('SUPABASE_SERVICE_ROLE_KEY')

const REPORT_JSON = 'reports/audio-assets-generation-report.json'

const argValue = (name: string): string | null => {
  const hit = process.argv.find((a) => a.startsWith(`${name}=`))
  return hit ? hit.slice(name.length + 1) : null
}
const APPLY = process.argv.includes('--apply')
const LIMIT = (() => { const n = Number(argValue('--limit')); return Number.isFinite(n) && n > 0 ? Math.floor(n) : null })()
const EXAM = (argValue('--exam') || '').trim()
const TASK = (argValue('--task') || 'listening_comprehension').trim()
const PROVIDER = (argValue('--provider') || readEnv('AUDIO_TTS_PROVIDER') || 'azure').trim()

// 写入目标 + 依赖表
const NEEDED_TABLES = ['question_sets', 'stimuli', 'audio_assets'] as const

// 音频生成所需配置（缺任一 → --apply 拒绝）
const AUDIO_BUCKET = readEnv('SUPABASE_AUDIO_BUCKET')
const TTS_API_KEY = readEnv('AUDIO_TTS_API_KEY')
function audioConfigMissing(): string[] {
  const m: string[] = []
  if (!AUDIO_BUCKET) m.push('SUPABASE_AUDIO_BUCKET')
  if (!TTS_API_KEY) m.push('AUDIO_TTS_API_KEY')
  return m
}

type SetRow = { id: string; exam_id: string | null; level: number | null; task_type: string; stimulus_id: string | null; status: string }
type StimRow = { id: string; kind: string; text_en: string | null; level: number | null; legacy_id: string | null }

async function tableExists(db: SupabaseClient, t: string): Promise<boolean> {
  const { error } = await db.from(t).select('*').limit(1)
  return !error
}

interface Plan {
  stimulusId: string
  level: number | null
  examIds: string[]
  hasTranscriptSource: boolean
  setStatuses: string[]
}

function writeReport(payload: Record<string, unknown>) {
  writeFileSync(REPORT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), ...payload }, null, 2) + '\n', 'utf8')
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.log('generate-audio: 缺少 Supabase 凭据，按 not_applied 处理')
    writeReport({ schema: 'not_applied', apply: false, reason: 'missing_supabase_credentials', provider: PROVIDER, stimuliNeedingAudio: 0, samples: [] })
    process.exit(0)
  }
  const db = createClient(SUPABASE_URL, SERVICE_ROLE)

  // 1) 探测 v2 表
  const present: string[] = []
  const missing: string[] = []
  for (const t of NEEDED_TABLES) (await tableExists(db, t) ? present : missing).push(t)
  const schema = missing.length === 0 ? 'applied' : present.length === 0 ? 'not_applied' : 'partial_applied'

  const cfgMissing = audioConfigMissing()
  if (APPLY && schema !== 'applied') {
    console.error(`generate-audio: --apply 被拒绝 —— v2 表未完整建立（${schema}）。missing: ${missing.join(', ') || 'none'}`)
    console.error('请先在 Supabase SQL Editor 执行 supabase/sql/p4-question-bank-v2.sql。')
    process.exit(1)
  }
  if (APPLY && cfgMissing.length) {
    console.error(`generate-audio: --apply 被拒绝 —— 缺音频配置: ${cfgMissing.join(', ')}（存储桶 + TTS Provider 密钥）。`)
    process.exit(1)
  }
  // 即便 schema/配置齐备，当前也未接入真实 TTS 合成 + Storage 上传 + audio_assets 写入。
  // 硬拒绝 --apply（exit 1），避免「成功退出但写 0」误导后续流程。实现合成/上传/写行后再放开。
  if (APPLY) {
    console.error('generate-audio: --apply 暂不可用 —— 尚未接入真实 TTS Provider 合成 / Supabase Storage 上传 / audio_assets 写入；本脚本当前仅为 dry-run 规划器。')
    console.error('启用步骤：实现 synthesize()+storage.upload()+audio_assets.insert(qa_status=machine_checked) 后，再放开本拦截。')
    process.exit(1)
  }

  if (schema === 'not_applied') {
    console.log('generate-audio: v2 表尚未应用（not_applied），无 listening 材料可处理')
    writeReport({ schema, apply: false, provider: PROVIDER, audioConfigMissing: cfgMissing, stimuliNeedingAudio: 0, byExam: {}, byLevel: {}, samples: [], note: 'v2 未应用，无可生成项。' })
    process.exit(0)
  }
  if (schema === 'partial_applied') {
    console.error('generate-audio: v2 schema 半应用（partial_applied）')
    writeReport({ schema, apply: false, provider: PROVIDER, audioConfigMissing: cfgMissing, missingTables: missing, stimuliNeedingAudio: 0, samples: [] })
    process.exit(1)
  }

  // 2) 取 listening 题组 → 材料
  const sets: SetRow[] = []
  for (let from = 0; ; from += 1000) {
    let q = db.from('question_sets').select('id, exam_id, level, task_type, stimulus_id, status').eq('task_type', TASK).range(from, from + 999)
    if (EXAM) q = q.eq('exam_id', EXAM)
    const { data, error } = await q
    if (error) throw new Error(`question_sets: ${error.message}`)
    const rows = (data ?? []) as SetRow[]
    sets.push(...rows)
    if (rows.length < 1000) break
  }
  const stimulusIds = [...new Set(sets.map((s) => s.stimulus_id).filter((x): x is string => !!x))]

  // 3) 已有 active 音频的材料（排除）
  const withActiveAudio = new Set<string>()
  for (let i = 0; i < stimulusIds.length; i += 200) {
    const chunk = stimulusIds.slice(i, i + 200)
    if (!chunk.length) break
    const { data } = await db.from('audio_assets').select('stimulus_id, qa_status').in('stimulus_id', chunk).eq('qa_status', 'active')
    for (const a of (data ?? []) as { stimulus_id: string | null }[]) if (a.stimulus_id) withActiveAudio.add(a.stimulus_id)
  }

  // 4) 材料元数据
  const stimById = new Map<string, StimRow>()
  for (let i = 0; i < stimulusIds.length; i += 200) {
    const chunk = stimulusIds.slice(i, i + 200)
    if (!chunk.length) break
    const { data } = await db.from('stimuli').select('id, kind, text_en, level, legacy_id').in('id', chunk)
    for (const s of (data ?? []) as StimRow[]) stimById.set(s.id, s)
  }

  // 5) 组装「缺音频」计划（按材料去重；记录引用它的考试 / set 状态）
  const planByStim = new Map<string, Plan>()
  for (const set of sets) {
    if (!set.stimulus_id || withActiveAudio.has(set.stimulus_id)) continue
    const stim = stimById.get(set.stimulus_id)
    if (!stim) continue
    const p = planByStim.get(set.stimulus_id) ?? {
      stimulusId: set.stimulus_id, level: stim.level ?? set.level,
      examIds: [], hasTranscriptSource: !!(stim.text_en && stim.text_en.trim()), setStatuses: [],
    }
    if (set.exam_id && !p.examIds.includes(set.exam_id)) p.examIds.push(set.exam_id)
    p.setStatuses.push(set.status)
    planByStim.set(set.stimulus_id, p)
  }
  let plans = [...planByStim.values()]
  if (LIMIT) plans = plans.slice(0, LIMIT)

  const byExam: Record<string, number> = {}
  const byLevel: Record<string, number> = {}
  for (const p of plans) {
    for (const e of p.examIds.length ? p.examIds : ['(none)']) byExam[e] = (byExam[e] ?? 0) + 1
    const lk = p.level == null ? '(none)' : `lv${p.level}`
    byLevel[lk] = (byLevel[lk] ?? 0) + 1
  }

  // 仅 dry-run 抵达此处（--apply 已在上方被硬拒绝）。只产出「缺稳定音频」规划，绝不写库。
  writeReport({
    schema, apply: false, provider: PROVIDER, task: TASK, exam: EXAM || null,
    audioConfigMissing: cfgMissing,
    stimuliNeedingAudio: plans.length,
    withTranscriptSource: plans.filter((p) => p.hasTranscriptSource).length,
    byExam, byLevel,
    samples: plans.slice(0, 20).map((p) => ({ stimulusId: p.stimulusId, level: p.level, examIds: p.examIds, hasTranscriptSource: p.hasTranscriptSource })),
    note: 'dry-run：仅规划缺稳定音频的材料；--apply 当前被硬拒绝（未接入真实合成/上传/写入）。',
  })

  console.log(`generate-audio: schema=${schema} apply=false provider=${PROVIDER} task=${TASK}${EXAM ? ' exam=' + EXAM : ''}`)
  console.log(`  缺稳定音频材料 ${plans.length}（有原文 ${plans.filter((p) => p.hasTranscriptSource).length}）· byLevel ${JSON.stringify(byLevel)}`)
  console.log('  dry-run：未写库。--apply 当前被硬拒绝（管线未接入真实合成/上传/写入）。')
  console.log(`  报告：${REPORT_JSON}`)
  process.exit(0)
}

main().catch((e) => {
  console.error('generate-audio fatal', e?.message ?? e)
  writeReport({ schema: 'error', apply: APPLY, message: String(e?.message ?? e) })
  process.exit(1)
})
