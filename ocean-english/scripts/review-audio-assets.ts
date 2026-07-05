/* ════════════════════════════════════════════════════════════════════════
   review-audio-assets.ts — 人工听审晋升器（R6, decision #10）

   音频只能经人工试听后逐条晋升，且必须留下听审记录：
     machine_checked ──(--approve --by <name>)──▶ human_checked ──(--activate --by <name>)──▶ active

   - 没有 reviewed_by/reviewed_at 记录，绝不允许 active（DB CHECK 也强制）。
   - --dry-run（默认）：列出待审 machine_checked / human_checked 资产 + 短时签名试听 URL（私有桶）。
   - 绝不自动晋升；--apply 类操作必须显式指定 id + --by。

   用法：
     npx tsx scripts/review-audio-assets.ts --dry-run [--exam=cet4]
     npx tsx scripts/review-audio-assets.ts --approve <assetId> --by="fanhui"
     npx tsx scripts/review-audio-assets.ts --activate <assetId> --by="fanhui"
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = (() => { try { return readFileSync('.env.local', 'utf8') } catch { return '' } })()
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))
const BUCKET = readEnv('SUPABASE_AUDIO_BUCKET')

const argValue = (n: string) => { const h = process.argv.find((a) => a.startsWith(`${n}=`)); return h ? h.slice(n.length + 1) : null }
const flagValue = (n: string) => { const i = process.argv.indexOf(n); return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : null }
const APPROVE = flagValue('--approve')
const ACTIVATE = flagValue('--activate')
const BY = (argValue('--by') || '').trim()
const EXAM = (argValue('--exam') || '').trim()

type Row = { id: string; stimulus_id: string | null; storage_path: string | null; url: string | null; accent: string | null; voice_id: string | null; duration_ms: number | null; qa_status: string; reviewed_by: string | null }

async function signed(path: string | null): Promise<string> {
  if (!path || !BUCKET) return '(no signed url)'
  const { data } = await db.storage.from(BUCKET).createSignedUrl(path, 3600)
  return data?.signedUrl ?? '(sign failed)'
}

async function promote(id: string, from: string, to: string) {
  if (!BY) { console.error(`review: ${to} 需 --by="<reviewer>"（必须留听审记录）`); process.exit(1) }
  const { data: rows, error } = await db.from('audio_assets').select('id, qa_status, reviewed_by').eq('id', id)
  if (error) { console.error(error.message); process.exit(1) }
  if (!rows || !rows.length) { console.error(`review: asset ${id} 不存在`); process.exit(1) }
  const a = rows[0] as { qa_status: string }
  if (a.qa_status !== from) { console.error(`review: asset ${id} 当前 ${a.qa_status}，需先处于 ${from} 才能 → ${to}`); process.exit(1) }
  const patch: Record<string, unknown> = { qa_status: to, reviewed_by: BY, reviewed_at: new Date().toISOString() }
  const { error: uErr } = await db.from('audio_assets').update(patch).eq('id', id).eq('qa_status', from)
  if (uErr) { console.error(`review: 更新失败 ${uErr.message}`); process.exit(1) }
  console.log(`✓ asset ${id}: ${from} → ${to}（reviewed_by=${BY}）`)
}

async function main() {
  if (APPROVE) return promote(APPROVE, 'machine_checked', 'human_checked')   // 人工试听通过
  if (ACTIVATE) return promote(ACTIVATE, 'human_checked', 'active')           // 上架（已有听审记录）

  // default: dry-run listing of pending review
  let q = db.from('audio_assets').select('id, stimulus_id, storage_path, url, accent, voice_id, duration_ms, qa_status, reviewed_by').in('qa_status', ['machine_checked', 'human_checked']).order('qa_status', { ascending: true }).limit(200)
  const { data, error } = await q
  if (error) { console.error(error.message); process.exit(1) }
  let rows = (data ?? []) as Row[]
  // exam filter via stimulus→set is optional; skip heavy join, just report all pending
  void EXAM
  console.log(`review-audio-assets (dry-run)：待审 ${rows.length}（machine_checked ${rows.filter(r => r.qa_status === 'machine_checked').length} / human_checked ${rows.filter(r => r.qa_status === 'human_checked').length}）`)
  for (const r of rows.slice(0, 50)) {
    const url = await signed(r.storage_path ?? r.url)
    console.log(`  [${r.qa_status}] ${r.id} · ${r.accent}/${r.voice_id} · ${r.duration_ms}ms\n      ${url}`)
  }
  console.log('\n听审后：--approve <id> --by="<name>"（→human_checked），确认无误再 --activate <id> --by="<name>"（→active）。')
}
main().catch((e) => { console.error('review-audio-assets fatal', e?.message ?? e); process.exit(1) })
