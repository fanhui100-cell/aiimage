/* ════════════════════════════════════════════════════════════════════════
   validate-audio-assets.ts — 听力音频资产质量门（Phase 9，只读）

   - v2 表未建 → not_applied，退出 0。
   - active 听力 set 必须有 active 音频；否则失败。
   - draft 听力 set 可以没有音频（允许）。
   - 有音频行处校验 url/transcript/duration/checksum/provider 形状。
   - 校验 audio-asset-client 的「练习模式列不含 transcript、复习模式才含」契约
     （答题前不向客户端暴露原文）。
   有错误退出 1，否则 0。用法：npm run validate:audio-assets
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { QBANK_V2_QA_STATUSES, QBANK_V2_TABLES } from '@/lib/question-bank-v2/schema'
import { AUDIO_PRACTICE_COLUMNS, AUDIO_REVIEW_COLUMNS, isPlayableAudioUrl } from '@/lib/audio/audio-asset-client'

const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const SUPABASE_URL = readEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_ROLE = readEnv('SUPABASE_SERVICE_ROLE_KEY')
const OUT = 'reports/audio-assets-validation.json'

const AUDIO_TABLES = ['question_sets', 'question_items', 'stimuli', 'audio_assets'] as const

function writeOut(p: Record<string, unknown>) {
  writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), ...p }, null, 2) + '\n', 'utf8')
}

async function tableExists(db: SupabaseClient, t: string): Promise<boolean> {
  const { error } = await db.from(t).select('*').limit(1)
  return !error
}
async function pageCol<T>(db: SupabaseClient, table: string, cols: string): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select(cols).order('id', { ascending: true }).range(from, from + 999)
    if (error) throw new Error(`${table}: ${error.message}`)
    const rows = (data ?? []) as T[]
    out.push(...rows)
    if (rows.length < 1000) break
  }
  return out
}

type SetRow = { id: string; task_type: string; stimulus_id: string | null; status: string }
type ItemRow = { id: string; question_set_id: string; input_mode: string; status: string }
type AudioRow = { id: string; stimulus_id: string | null; url: string | null; transcript: string | null; duration_ms: number | null; checksum: string | null; provider: string | null; qa_status: string }

function checkClientTranscriptContract(errors: string[]) {
  // 练习模式列绝不含 transcript；复习模式才含。守住「答题前不暴露原文」。
  if (/(^|[\s,])transcript($|[\s,])/.test(AUDIO_PRACTICE_COLUMNS)) errors.push('audio-asset-client 练习模式列竟包含 transcript（答题前会暴露原文）')
  if (!/(^|[\s,])transcript($|[\s,])/.test(AUDIO_REVIEW_COLUMNS)) errors.push('audio-asset-client 复习模式列缺少 transcript')
}

/** 静态契约：练习 session 的类型与 session-builder 查询都不得携带 transcript。 */
function checkPracticePayloadContract(errors: string[]) {
  try {
    const types = readFileSync('lib/practice/session-types.ts', 'utf8')
    const m = types.match(/audio\?:\s*\{[^}]*\}/)
    if (m && /transcript/.test(m[0])) errors.push('PracticeItem.audio 类型仍含 transcript（练习载荷会下发原文）')
  } catch { /* 文件缺失则跳过 */ }
  try {
    const sb = readFileSync('lib/practice/session-builder.ts', 'utf8')
    const sels = sb.match(/from\('audio_assets'\)\s*\.select\(([^)]*)\)/g) ?? []
    for (const s of sels) if (/transcript/.test(s)) errors.push('session-builder audio_assets.select 仍含 transcript（练习载荷会下发原文）')
  } catch { /* 跳过 */ }
}

/** 可选 API 级断言：BASE 可达时，校验真实 practice payload 不含 audio.transcript。 */
async function checkLivePracticePayload(errors: string[]): Promise<boolean> {
  const base = process.env.BASE
  if (!base) return false
  try {
    const r = await fetch(`${base}/api/practice/session?mode=task&taskType=listening_comprehension&level=3&count=3`)
    if (!r.ok) return false
    const j = (await r.json()) as { items?: { audio?: Record<string, unknown> }[] }
    for (const it of j.items ?? []) {
      if (it.audio && typeof it.audio.transcript === 'string' && it.audio.transcript.trim()) {
        errors.push('live practice payload 的 item.audio.transcript 非空（答题前暴露原文）')
      }
    }
    return true
  } catch {
    return false
  }
}

async function main() {
  const errors: string[] = []
  // 静态契约（与 DB 是否就绪无关，先跑）：客户端列契约 + 练习 payload/类型不含 transcript。
  checkClientTranscriptContract(errors)
  checkPracticePayloadContract(errors)
  const liveChecked = await checkLivePracticePayload(errors)

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.log('validate-audio-assets: 缺少 Supabase 凭据，按 not_applied 处理')
    writeOut({ status: 'not_applied', reason: 'missing_supabase_credentials', livePayloadChecked: liveChecked, contractErrors: errors })
    process.exit(errors.length ? 1 : 0)
  }
  const db = createClient(SUPABASE_URL, SERVICE_ROLE)

  // 探测 v2 表
  const missingAll: string[] = []
  for (const t of QBANK_V2_TABLES) if (!(await tableExists(db, t))) missingAll.push(t)
  if (missingAll.length === QBANK_V2_TABLES.length) {
    console.log('validate-audio-assets: v2 表尚未应用（not_applied）')
    writeOut({ status: 'not_applied', missingTables: missingAll, livePayloadChecked: liveChecked, contractErrors: errors })
    process.exit(errors.length ? 1 : 0)
  }
  const missingAudio = AUDIO_TABLES.filter((t) => missingAll.includes(t))
  if (missingAudio.length) {
    console.error(`validate-audio-assets: 音频相关表半应用: ${missingAudio.join(', ')}`)
    writeOut({ status: 'partial_applied', missingTables: missingAudio, clientContractErrors: errors })
    process.exit(1)
  }

  const sets = await pageCol<SetRow>(db, 'question_sets', 'id, task_type, stimulus_id, status')
  const items = await pageCol<ItemRow>(db, 'question_items', 'id, question_set_id, input_mode, status')
  const audio = await pageCol<AudioRow>(db, 'audio_assets', 'id, stimulus_id, url, transcript, duration_ms, checksum, provider, qa_status')

  const listenSetIds = new Set(items.filter((i) => i.input_mode === 'listen').map((i) => i.question_set_id))
  const isListening = (s: SetRow) => s.task_type === 'listening_comprehension' || listenSetIds.has(s.id)
  const activeAudioStim = new Set(audio.filter((a) => a.qa_status === 'active' && a.stimulus_id).map((a) => a.stimulus_id as string))

  // 1) active 听力 set 必须有 active 音频；draft 的允许没有
  const listeningSets = sets.filter(isListening)
  let draftWithoutAudio = 0
  for (const s of listeningSets) {
    if (s.status === 'active') {
      if (!s.stimulus_id || !activeAudioStim.has(s.stimulus_id)) errors.push(`active listening set ${s.id} 无 active audio_assets`)
    } else if (!s.stimulus_id || !activeAudioStim.has(s.stimulus_id)) {
      draftWithoutAudio++   // 允许：草稿听力可暂无音频
    }
  }

  // 2) 有音频行处校验 url/transcript/duration/checksum/provider 形状 + qa_status 枚举
  const QA = new Set<string>(QBANK_V2_QA_STATUSES)
  for (const a of audio) {
    if (!a.url || !isPlayableAudioUrl(a.url)) errors.push(`audio_asset ${a.id} url 非法或非可播放: ${a.url ?? 'null'}`)
    if (!a.transcript || !a.transcript.trim()) errors.push(`audio_asset ${a.id} transcript 缺失（DB 必须存原文）`)
    if (a.duration_ms != null && (!Number.isInteger(a.duration_ms) || a.duration_ms <= 0)) errors.push(`audio_asset ${a.id} duration_ms 非正整数: ${a.duration_ms}`)
    if (!a.checksum || !a.checksum.trim()) errors.push(`audio_asset ${a.id} checksum 缺失`)
    if (!a.provider || !a.provider.trim()) errors.push(`audio_asset ${a.id} provider 缺失`)
    if (!QA.has(a.qa_status)) errors.push(`audio_asset ${a.id} qa_status 非法: ${a.qa_status}`)
  }

  const summary = {
    status: 'applied' as const,
    counts: {
      listeningSets: listeningSets.length,
      activeListeningSets: listeningSets.filter((s) => s.status === 'active').length,
      draftListeningWithoutAudio: draftWithoutAudio,
      audioRows: audio.length,
      activeAudioRows: audio.filter((a) => a.qa_status === 'active').length,
    },
    clientTranscriptContract: 'enforced',
    practicePayloadContract: 'enforced',
    livePayloadChecked: liveChecked,
    errors,
    ok: errors.length === 0,
  }
  writeOut(summary)
  console.log('validate-audio-assets: applied')
  console.log(`  listening sets ${listeningSets.length}（active ${summary.counts.activeListeningSets}）· audio rows ${audio.length} · 草稿无音频 ${draftWithoutAudio} · 错误 ${errors.length}`)
  for (const e of errors.slice(0, 50)) console.error(`ERROR ${e}`)
  process.exit(errors.length ? 1 : 0)
}

main().catch((e) => {
  console.error('validate-audio-assets fatal', e?.message ?? e)
  writeOut({ status: 'error', message: String(e?.message ?? e) })
  process.exit(1)
})
