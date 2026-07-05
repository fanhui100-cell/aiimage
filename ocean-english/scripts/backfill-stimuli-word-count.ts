/* ════════════════════════════════════════════════════════════════════════
   backfill-stimuli-word-count.ts — 回填 stimuli.word_count

   背景：早期 importer 写 stimuli 时未保存 word_count（spotcheck 显示 '?w'）。
   本脚本对 word_count IS NULL 且 text_en 非空的 stimuli，用统一词数口径（shape.countWords）
   计算并回填，供 spotcheck / coverage audit / 篇幅 QA 使用。

   默认 dry-run（只统计待回填条数）；--apply 才写库（仅 UPDATE word_count，不动其它列）。
   用法：npx tsx scripts/backfill-stimuli-word-count.ts [--apply]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { countWords } from '@/lib/exam-task-templates/shape'

const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))
const APPLY = process.argv.includes('--apply')

async function main() {
  let updated = 0, nullNoText = 0, scanned = 0
  // 反复拉「word_count IS NULL」的一批；apply 模式下每次回填后该批退出 NULL 集合，循环至清空。
  for (let guard = 0; guard < 100; guard++) {
    const { data, error } = await db.from('stimuli').select('id, text_en, word_count').is('word_count', null).limit(1000)
    if (error) throw new Error(`stimuli select: ${error.message}`)
    const rows = (data ?? []) as { id: string; text_en: string | null; word_count: number | null }[]
    if (!rows.length) break
    scanned += rows.length
    for (const r of rows) {
      if (!r.text_en) { nullNoText++; continue }
      if (APPLY) {
        const wc = countWords(r.text_en)
        const { error: uerr } = await db.from('stimuli').update({ word_count: wc }).eq('id', r.id)
        if (uerr) throw new Error(`update ${r.id}: ${uerr.message}`)
        updated++
      }
    }
    if (!APPLY) break // dry-run：只看一批样本，不写
  }
  console.log(`mode: ${APPLY ? 'APPLY' : 'DRY-RUN(sample first 1000)'}`)
  console.log(`scanned word_count=NULL rows: ${scanned}`)
  console.log(`null text_en (skipped, e.g. audio stimuli): ${nullNoText}`)
  console.log(`updated word_count: ${APPLY ? updated : '(dry-run, 0)'}`)
}

main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exitCode = 1 })
