/* ════════════════════════════════════════════════════════════════════════
   generate-audio-assets.ts — 听力稳定音频生成管线（R6，默认 dry-run）

   Provider: Azure AI Speech Neural TTS (免费档 F0, 0.5M 字符/月)。口音=命名声本身
   (en-CA-ClaraNeural 即加拿大音)。输出 mp3。私有桶 qbank-audio。

   安全契约：
   - 默认 dry-run：列出「缺稳定音频」的材料，并预估字符数/文件数/音频分钟/成本（vs 免费档），不合成/不写。
   - 仅 --apply 才合成→校验产物→上传私有桶→插 audio_assets（qa_status=machine_checked，绝不 active）。
   - 幂等：按 (transcript+voice+accent+provider+format+rate) checksum 跳过已存在（DB 还有 UNIQUE(checksum)）。
   - 失败补偿：先 upload 成功再 insert；insert 失败则删除刚上传的对象，绝不留悬挂行/孤儿文件。
   - 每类(exam)首批最多 20 条（decision #8）。
   - 缺配置（SUPABASE_AUDIO_BUCKET / AZURE_SPEECH_KEY / AZURE_SPEECH_REGION）：--apply 拒绝退出 1。
   - API key 仅内存使用，绝不写报告/日志。
   - v2 表未建：dry-run 报 not_applied 退出 0；--apply 拒绝退出 1。

   用法：
     npx tsx scripts/generate-audio-assets.ts --exam=cet4 --task=listening_comprehension          # dry-run + 成本预览
     npx tsx scripts/generate-audio-assets.ts --exam=cet4 --task=listening_comprehension --limit=5 --apply
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { assignVoice } from '@/lib/audio/voice-pools'
import { computeChecksum, deterministicStoragePath, countWords, verifySynthOutput, type SynthSettings } from '@/lib/audio/checksum'
import { synthesizeAzure, AZURE_MP3_FORMAT, type AzureCreds } from '@/lib/audio/providers/azure'

const env = (() => { try { return readFileSync('.env.local', 'utf8') } catch { return '' } })() // degrade to not_applied if absent
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
const PROVIDER = 'azure'
const MAX_PER_CELL = (() => { const n = Number(argValue('--cap')); return Number.isFinite(n) && n > 0 ? Math.floor(n) : 20 })() // decision #8: first batch ≤20; --cap raises it for a human-validated cell
const FREE_TIER_CHARS = 500_000                           // Azure F0: 0.5M chars/month free
const RATE_USD_PER_1M = 15                                // Azure Neural Std beyond free tier
const MAX_CHARS = (() => { const n = Number(argValue('--max-chars')); return Number.isFinite(n) && n > 0 ? Math.floor(n) : FREE_TIER_CHARS })()

const NEEDED_TABLES = ['question_sets', 'stimuli', 'audio_assets'] as const
const AUDIO_BUCKET = readEnv('SUPABASE_AUDIO_BUCKET')
const AZURE_KEY = readEnv('AZURE_SPEECH_KEY')
const AZURE_REGION = readEnv('AZURE_SPEECH_REGION')
function audioConfigMissing(): string[] {
  const m: string[] = []
  if (!AUDIO_BUCKET) m.push('SUPABASE_AUDIO_BUCKET')
  if (!AZURE_KEY) m.push('AZURE_SPEECH_KEY')
  if (!AZURE_REGION) m.push('AZURE_SPEECH_REGION')
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
  transcript: string | null
  setStatuses: string[]
}

function writeReport(payload: Record<string, unknown>) {
  // NOTE: never include any API key in the report.
  writeFileSync(REPORT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), ...payload }, null, 2) + '\n', 'utf8')
}

// rough audio minutes from words (≈150 wpm; slower exam pace inflates a bit)
const estMinutes = (words: number) => words / 140
const estCostUsd = (chars: number) => (Math.max(0, chars) / 1_000_000) * RATE_USD_PER_1M

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.log('generate-audio: 缺少 Supabase 凭据，按 not_applied 处理')
    writeReport({ schema: 'not_applied', apply: false, reason: 'missing_supabase_credentials', provider: PROVIDER, stimuliNeedingAudio: 0, samples: [] })
    process.exit(0)
  }
  const db = createClient(SUPABASE_URL, SERVICE_ROLE)

  const present: string[] = []
  const missing: string[] = []
  for (const t of NEEDED_TABLES) (await tableExists(db, t) ? present : missing).push(t)
  const schema = missing.length === 0 ? 'applied' : present.length === 0 ? 'not_applied' : 'partial_applied'

  const cfgMissing = audioConfigMissing()
  if (APPLY && schema !== 'applied') {
    console.error(`generate-audio: --apply 被拒绝 —— v2 表未完整建立（${schema}）。missing: ${missing.join(', ') || 'none'}`)
    process.exit(1)
  }
  if (APPLY && cfgMissing.length) {
    console.error(`generate-audio: --apply 被拒绝 —— 缺配置: ${cfgMissing.join(', ')}（私有桶 + Azure Speech key/region）。`)
    process.exit(1)
  }

  if (schema === 'not_applied') {
    console.log('generate-audio: v2 表尚未应用（not_applied）')
    writeReport({ schema, apply: false, provider: PROVIDER, audioConfigMissing: cfgMissing, stimuliNeedingAudio: 0, samples: [] })
    process.exit(0)
  }
  if (schema === 'partial_applied') {
    console.error('generate-audio: v2 schema 半应用（partial_applied）')
    writeReport({ schema, apply: false, provider: PROVIDER, missingTables: missing, stimuliNeedingAudio: 0, samples: [] })
    process.exit(1)
  }

  // 1) listening 题组 → 材料
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

  // 2) 已有任意音频行的材料（按 checksum 幂等，但这里先排除「已有 active 音频」的材料）
  const withActiveAudio = new Set<string>()
  for (let i = 0; i < stimulusIds.length; i += 200) {
    const chunk = stimulusIds.slice(i, i + 200)
    if (!chunk.length) break
    const { data } = await db.from('audio_assets').select('stimulus_id, qa_status').in('stimulus_id', chunk).eq('qa_status', 'active')
    for (const a of (data ?? []) as { stimulus_id: string | null }[]) if (a.stimulus_id) withActiveAudio.add(a.stimulus_id)
  }

  // 3) 材料元数据（transcript = text_en）
  const stimById = new Map<string, StimRow>()
  for (let i = 0; i < stimulusIds.length; i += 200) {
    const chunk = stimulusIds.slice(i, i + 200)
    if (!chunk.length) break
    const { data } = await db.from('stimuli').select('id, kind, text_en, level, legacy_id').in('id', chunk)
    for (const s of (data ?? []) as StimRow[]) stimById.set(s.id, s)
  }

  // 4) 「缺音频」计划（按材料去重）
  const planByStim = new Map<string, Plan>()
  for (const set of sets) {
    if (!set.stimulus_id || withActiveAudio.has(set.stimulus_id)) continue
    const stim = stimById.get(set.stimulus_id)
    if (!stim) continue
    const p = planByStim.get(set.stimulus_id) ?? {
      stimulusId: set.stimulus_id, level: stim.level ?? set.level,
      examIds: [], transcript: stim.text_en && stim.text_en.trim() ? stim.text_en : null, setStatuses: [],
    }
    if (set.exam_id && !p.examIds.includes(set.exam_id)) p.examIds.push(set.exam_id)
    p.setStatuses.push(set.status)
    planByStim.set(set.stimulus_id, p)
  }
  // per-cell cap (decision #8): ≤20 per exam-cell; then global --limit
  const perExamCount = new Map<string, number>()
  let plans: Plan[] = []
  for (const p of [...planByStim.values()]) {
    const key = (EXAM || p.examIds[0] || '(none)')
    const n = perExamCount.get(key) ?? 0
    if (n >= MAX_PER_CELL) continue
    perExamCount.set(key, n + 1)
    plans.push(p)
  }
  if (LIMIT) plans = plans.slice(0, LIMIT)

  const synthPlans = plans.filter((p) => p.transcript)
  const noTranscript = plans.length - synthPlans.length
  const totalChars = synthPlans.reduce((a, p) => a + (p.transcript ? p.transcript.length : 0), 0)
  const totalWords = synthPlans.reduce((a, p) => a + countWords(p.transcript ?? ''), 0)
  const byLevel: Record<string, number> = {}
  for (const p of plans) { const lk = p.level == null ? '(none)' : `lv${p.level}`; byLevel[lk] = (byLevel[lk] ?? 0) + 1 }

  // ── DRY-RUN：预估 + 退出（绝不写）──
  if (!APPLY) {
    writeReport({
      schema, apply: false, provider: PROVIDER, task: TASK, exam: EXAM || null,
      audioConfigMissing: cfgMissing,
      stimuliNeedingAudio: plans.length, synthesizable: synthPlans.length, noTranscript,
      estimate: { plannedFiles: synthPlans.length, totalChars, freeTierChars: FREE_TIER_CHARS, withinFreeTier: totalChars <= FREE_TIER_CHARS, estMinutes: Math.round(estMinutes(totalWords)), estCostUsdBeyondFree: Number(estCostUsd(totalChars - FREE_TIER_CHARS).toFixed(2)) },
      byLevel,
      samples: synthPlans.slice(0, 20).map((p) => ({ stimulusId: p.stimulusId, level: p.level, examIds: p.examIds, chars: p.transcript?.length ?? 0 })),
      note: 'dry-run：仅规划 + 成本预估；--apply 才合成/上传/写 machine_checked。',
    })
    console.log(`generate-audio: schema=${schema} apply=false provider=${PROVIDER} task=${TASK}${EXAM ? ' exam=' + EXAM : ''}`)
    console.log(`  缺音频材料 ${plans.length}（可合成 ${synthPlans.length}，无原文 ${noTranscript}）· byLevel ${JSON.stringify(byLevel)}`)
    console.log(`  预估：文件 ${synthPlans.length} · 字符 ${totalChars}（免费档 ${FREE_TIER_CHARS}/月，${totalChars <= FREE_TIER_CHARS ? '在额度内' : '超额'}）· ~${Math.round(estMinutes(totalWords))} 分钟 · 超额成本 $${estCostUsd(totalChars - FREE_TIER_CHARS).toFixed(2)}`)
    console.log(`  报告：${REPORT_JSON}`)
    process.exit(0)
  }

  // ── APPLY：合成→校验→上传(私有)→插 machine_checked（绝不 active）──
  if (totalChars > MAX_CHARS) {
    console.error(`generate-audio: --apply 被拒绝 —— 预计字符 ${totalChars} 超过上限 ${MAX_CHARS}（免费档 0.5M/月）。用 --limit 缩小或 --max-chars 调整。`)
    process.exit(1)
  }
  const creds: AzureCreds = { key: AZURE_KEY, region: AZURE_REGION }
  let synthesized = 0, skipped = 0, uploaded = 0, inserted = 0, failed = 0
  const failures: string[] = []

  for (const p of synthPlans) {
    const transcript = p.transcript as string
    const pick = assignVoice(EXAM || p.examIds[0] || null, p.stimulusId)
    const settings: SynthSettings = { provider: PROVIDER, voiceShortName: pick.voiceShortName, accent: pick.accent, outputFormat: AZURE_MP3_FORMAT, rate: pick.rate }
    const checksum = computeChecksum(transcript, settings)

    // 幂等：checksum 已存在则跳过
    const { data: existing } = await db.from('audio_assets').select('id').eq('checksum', checksum).limit(1)
    if (existing && existing.length) { skipped++; continue }

    const storagePath = deterministicStoragePath(settings, checksum)
    let out
    try {
      out = await synthesizeAzure({ text: transcript, voiceShortName: pick.voiceShortName, accent: pick.accent, rate: pick.rate }, creds)
      synthesized++
    } catch (e) { failed++; failures.push(`${p.stimulusId}: synth failed (${(e as Error).message})`); continue }

    const vErr = verifySynthOutput(out)
    if (vErr) { failed++; failures.push(`${p.stimulusId}: bad output (${vErr})`); continue }

    // upload (private bucket, no upsert → duplicate path errors instead of silently overwriting)
    let didUpload = false
    const up = await db.storage.from(AUDIO_BUCKET).upload(storagePath, out.bytes, { contentType: 'audio/mpeg', upsert: false })
    if (up.error) {
      // already-uploaded object for this checksum is fine (idempotent); other errors fail
      if (!/exists|duplicate/i.test(up.error.message)) { failed++; failures.push(`${p.stimulusId}: upload failed (${up.error.message})`); continue }
    } else { uploaded++; didUpload = true }

    const { error: insErr } = await db.from('audio_assets').insert({
      stimulus_id: p.stimulusId,
      url: storagePath,                 // private bucket: stored value is the object PATH (served via signed URL)
      storage_path: storagePath,
      transcript,                       // DB must store transcript; never in practice payload
      duration_ms: out.durationMs,
      accent: pick.accent,
      voice_id: pick.voiceShortName,
      provider: PROVIDER,
      checksum,
      synth_instructions: JSON.stringify({ ...settings, rate: pick.rate }),
      qa_status: 'machine_checked',     // NEVER active here
    })
    if (insErr) {
      // compensating delete: ONLY remove an object THIS iteration freshly uploaded (never a pre-existing
      // object that another row may reference). Keyed on the per-iteration flag, not the run-wide counter.
      if (didUpload) await db.storage.from(AUDIO_BUCKET).remove([storagePath]).catch(() => {})
      // a UNIQUE(checksum) race → treat as skip, not failure
      if (/duplicate|unique/i.test(insErr.message)) { skipped++; continue }
      failed++; failures.push(`${p.stimulusId}: insert failed (${insErr.message})`); continue
    }
    inserted++
  }

  writeReport({
    schema, apply: true, provider: PROVIDER, task: TASK, exam: EXAM || null,
    counts: { plannedSynthesizable: synthPlans.length, synthesized, skippedExisting: skipped, uploaded, inserted, failed },
    totalChars, qaStatus: 'machine_checked', neverActive: true,
    failures: failures.slice(0, 50),
    note: 'apply：所有新行 machine_checked，绝不 active；幂等按 checksum 跳过；失败补偿删除。',
  })
  console.log(`generate-audio APPLY: task=${TASK}${EXAM ? ' exam=' + EXAM : ''} provider=${PROVIDER}`)
  console.log(`  synthesizable ${synthPlans.length} · synthesized ${synthesized} · skipped(existing) ${skipped} · uploaded ${uploaded} · inserted ${inserted}(machine_checked) · failed ${failed}`)
  if (failures.length) for (const f of failures.slice(0, 20)) console.error(`  ✗ ${f}`)
  console.log(`  报告：${REPORT_JSON}`)
  process.exit(failed > 0 && inserted === 0 ? 1 : 0)
}

main().catch((e) => {
  console.error('generate-audio fatal', e?.message ?? e)
  writeReport({ schema: 'error', apply: APPLY, message: String(e?.message ?? e) })
  process.exit(1)
})
