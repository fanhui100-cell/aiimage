/* ============================================================================
   scripts/import-vocabulary.ts — 7 档词库注入管线（P2-1）
   源：KyleBing/english-vocabulary json_original/json-sentence（富格式：
   音标/释义/短语/例句），按 7 档教材文件分组下载。

   用法：
     npx tsx scripts/import-vocabulary.ts --dry-run     # 只下载+合并+报告，不写库
     npx tsx scripts/import-vocabulary.ts               # 真实导入（需 SERVICE_ROLE）
     npx tsx scripts/import-vocabulary.ts --resume      # 断点续传

   环境：.env.local 需 NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
   前置：supabase/sql/final-p2-vocab-schema.sql 已在 SQL Editor 执行
   ============================================================================ */

import fs from 'node:fs'
import path from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ── 配置 ────────────────────────────────────────────────────────────────────
const RAW_BASE = 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json_original/json-sentence'
const CACHE_DIR = path.join(__dirname, '.vocab-cache')
const PROGRESS_FILE = path.join(CACHE_DIR, 'import-progress.json')
const REPORT_FILE = path.join(CACHE_DIR, 'import-report.json')
const BATCH = 500

/** 7 档 → json-sentence 源文件（文件名前缀_分卷数） */
const LEVEL_SOURCES: { level: number; zh: string; files: string[] }[] = [
  { level: 1, zh: '初中', files: ['ChuZhong_2.json', 'ChuZhong_3.json'] },
  { level: 2, zh: '高中', files: ['GaoZhong_2.json', 'GaoZhong_3.json'] },
  { level: 3, zh: '四级', files: ['CET4_1.json', 'CET4_2.json', 'CET4_3.json'] },
  { level: 4, zh: '六级', files: ['CET6_1.json', 'CET6_2.json', 'CET6_3.json'] },
  { level: 5, zh: '考研', files: ['KaoYan_1.json', 'KaoYan_2.json', 'KaoYan_3.json'] },
  { level: 6, zh: '托福', files: ['TOEFL_2.json', 'TOEFL_3.json'] },
  { level: 7, zh: 'SAT',  files: ['SAT_2.json', 'SAT_3.json'] },
]

const LEVEL_EXAM_TAG: Record<number, string | null> = {
  1: null, 2: 'GAOKAO', 3: 'CET-4', 4: 'CET-6', 5: 'KAOYAN', 6: 'TOEFL', 7: 'SAT',
}
const LEVEL_CEFR: Record<number, string> = {
  1: 'A2', 2: 'B1', 3: 'B1', 4: 'B2', 5: 'B2', 6: 'C1', 7: 'C1',
}

// ── 源数据类型 ──────────────────────────────────────────────────────────────
interface SourceWord {
  word: string
  us?: string
  uk?: string
  translations?: { translation: string; type?: string }[]
  phrases?: { phrase: string; translation?: string }[]
  sentences?: { sentence: string; translation?: string }[]
}

interface MergedWord {
  id: string                 // slug
  word: string
  us: string
  uk: string
  levels: number[]
  primaryLevel: number
  seq: number                // 在最低档文件中的出现序（频率估算用）
  translations: { translation: string; type: string }[]
  phrases: { phrase: string; translation?: string }[]
  sentences: { sentence: string; translation?: string }[]
}

// ── 工具 ────────────────────────────────────────────────────────────────────
function loadEnvLocal(): Record<string, string> {
  const file = path.join(__dirname, '..', '.env.local')
  const out: Record<string, string> = {}
  if (!fs.existsSync(file)) return out
  for (const line of fs.readFileSync(file, 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) out[m[1]] = m[2].trim()
  }
  return out
}

function slugify(word: string): string {
  return word.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

async function download(file: string): Promise<SourceWord[]> {
  const dest = path.join(CACHE_DIR, file)
  if (!fs.existsSync(dest)) {
    process.stdout.write(`  下载 ${file} … `)
    const res = await fetch(`${RAW_BASE}/${encodeURIComponent(file)}`)
    if (!res.ok) throw new Error(`download ${file}: HTTP ${res.status}`)
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()))
    console.log('ok')
  }
  return JSON.parse(fs.readFileSync(dest, 'utf-8'))
}

// ── 合并去重 ────────────────────────────────────────────────────────────────
async function buildMerged(): Promise<{ merged: MergedWord[]; perLevelRaw: Record<number, number> }> {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  const map = new Map<string, MergedWord>()
  const perLevelRaw: Record<number, number> = {}

  for (const src of LEVEL_SOURCES) {
    let seq = 0
    let rawCount = 0
    for (const file of src.files) {
      const entries = await download(file)
      for (const e of entries) {
        if (!e.word || !/[a-zA-Z]/.test(e.word)) continue
        rawCount++
        const id = slugify(e.word)
        if (!id) continue
        seq++
        const existing = map.get(id)
        if (existing) {
          if (!existing.levels.includes(src.level)) existing.levels.push(src.level)
          if (src.level < existing.primaryLevel) {
            existing.primaryLevel = src.level
            existing.seq = seq
          }
          // 只补空：音标/短语/例句缺则补
          if (!existing.us && e.us) existing.us = e.us
          if (!existing.uk && e.uk) existing.uk = e.uk
          if (existing.phrases.length === 0 && e.phrases?.length) {
            existing.phrases = e.phrases.slice(0, 6)
          }
          if (existing.sentences.length === 0 && e.sentences?.length) {
            existing.sentences = e.sentences.slice(0, 3)
          }
          // 释义合并去重
          for (const t of e.translations ?? []) {
            if (!t.translation) continue
            if (!existing.translations.some(x => x.translation === t.translation)) {
              existing.translations.push({ translation: t.translation, type: t.type ?? '' })
            }
          }
        } else {
          map.set(id, {
            id,
            word: e.word.trim(),
            us: e.us ?? '',
            uk: e.uk ?? '',
            levels: [src.level],
            primaryLevel: src.level,
            seq,
            translations: (e.translations ?? [])
              .filter(t => t.translation)
              .map(t => ({ translation: t.translation, type: t.type ?? '' })),
            phrases: (e.phrases ?? []).slice(0, 6),
            sentences: (e.sentences ?? []).slice(0, 3),
          })
        }
      }
    }
    perLevelRaw[src.level] = rawCount
  }

  const merged = [...map.values()].sort((a, b) => a.id.localeCompare(b.id))
  // frequencyRank 估算：最低档为主、出现档数越多越靠前、档内按出现序
  for (const w of merged) {
    ;(w as MergedWord & { frequencyRank: number }).frequencyRank =
      w.primaryLevel * 100000 - w.levels.length * 10000 + w.seq
  }
  return { merged, perLevelRaw }
}

// ── 映射到 DB 行 ────────────────────────────────────────────────────────────
function toWordRow(w: MergedWord) {
  const examTags = [...new Set(w.levels.map(l => LEVEL_EXAM_TAG[l]).filter(Boolean))] as string[]
  return {
    id: w.id,
    word: w.word,
    normalized_word: w.word.toLowerCase(),
    phonetic_ipa: w.uk ? `/${w.uk}/` : (w.us ? `/${w.us}/` : null),  // 英音优先
    part_of_speech: w.translations[0]?.type || null,
    cefr_level: LEVEL_CEFR[w.primaryLevel] ?? null,
    level: w.primaryLevel <= 2 ? 'elementary' : w.primaryLevel <= 4 ? 'intermediate' : 'advanced',
    difficulty: Math.min(5, Math.max(1, Math.ceil(w.primaryLevel * 5 / 7))),
    frequency_rank: (w as MergedWord & { frequencyRank: number }).frequencyRank,
    is_exam_word: examTags.length > 0,
    tags: examTags,
    levels: w.levels.slice().sort((a, b) => a - b),
    primary_level: w.primaryLevel,
    phrases: w.phrases,
    source_type: 'public-domain',
    source_note: 'KyleBing/english-vocabulary (json-sentence)',
    license: 'public-domain',
    updated_at: new Date().toISOString(),
  }
}

// ── 主流程 ──────────────────────────────────────────────────────────────────
async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const resume = process.argv.includes('--resume')

  console.log('═══ 词库注入管线 ═══')
  const { merged, perLevelRaw } = await buildMerged()

  const perLevelUnique: Record<number, number> = {}
  for (const w of merged) {
    perLevelUnique[w.primaryLevel] = (perLevelUnique[w.primaryLevel] ?? 0) + 1
  }
  const report = {
    generatedAt: new Date().toISOString(),
    totalUnique: merged.length,
    totalRaw: Object.values(perLevelRaw).reduce((a, b) => a + b, 0),
    perLevelRaw,
    perLevelUniquePrimary: perLevelUnique,
    multiLevelWords: merged.filter(w => w.levels.length > 1).length,
  }
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2))
  console.log('导入报告（合并后）:')
  console.log(JSON.stringify(report, null, 2))

  if (dryRun) {
    console.log('\n--dry-run：不写库。样例映射行：')
    console.log(JSON.stringify(toWordRow(merged[1000]), null, 2))
    return
  }

  // ── Supabase 客户端（service_role）──
  const env = { ...loadEnvLocal(), ...process.env } as Record<string, string>
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('\n✗ 缺少 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY（.env.local）')
    console.error('  dictionary_words 仅 service_role 可写（RLS）。先 --dry-run 验证数据。')
    process.exit(1)
  }
  const db: SupabaseClient = createClient(url, key, { auth: { persistSession: false } })

  // 断点续传
  let startBatch = 0
  if (resume && fs.existsSync(PROGRESS_FILE)) {
    startBatch = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8')).completedBatches ?? 0
    console.log(`断点续传：从批次 ${startBatch} 开始`)
  }

  // 预取已有词（与现有 500 词冲突合并：levels/examTags 合并、只补空字段）
  console.log('预取既有词条 id …')
  const existingMeta = new Map<string, { levels: number[] | null; tags: string[] | null; phonetic_ipa: string | null; phrases: unknown[] | null }>()
  {
    const ids = merged.map(w => w.id)
    for (let i = 0; i < ids.length; i += 400) {
      const { data, error } = await db.from('dictionary_words')
        .select('id, levels, tags, phonetic_ipa, phrases')
        .in('id', ids.slice(i, i + 400))
      if (error) throw new Error('prefetch: ' + error.message)
      for (const r of data ?? []) existingMeta.set(r.id, r)
    }
  }
  console.log(`既有词条命中：${existingMeta.size}`)

  const batches = Math.ceil(merged.length / BATCH)
  let mergedExisting = 0

  for (let b = startBatch; b < batches; b++) {
    const slice = merged.slice(b * BATCH, (b + 1) * BATCH)
    const rows = slice.map(w => {
      const row = toWordRow(w)
      const ex = existingMeta.get(w.id)
      if (ex) {
        mergedExisting++
        // 合并 levels / tags(examTags)，只补空字段不覆盖
        row.levels = [...new Set([...(ex.levels ?? []), ...row.levels])].sort((a, b) => a - b)
        row.tags = [...new Set([...(ex.tags ?? []), ...row.tags])]
        if (ex.phonetic_ipa) row.phonetic_ipa = ex.phonetic_ipa
        if (Array.isArray(ex.phrases) && ex.phrases.length) row.phrases = ex.phrases as { phrase: string }[]
        // 既有精编内容不动：不覆盖 word/cefr/source 等非空策略由 upsert 行级控制有限，
        // 此处选择保留新计算的 primary_level/levels/frequency_rank（等级数据以词库为准）
      }
      return row
    })

    const { error } = await db.from('dictionary_words').upsert(rows, { onConflict: 'id' })
    if (error) throw new Error(`words batch ${b}: ${error.message}`)

    // definitions / examples：只为「无既有释义」的词插入（只补空）
    const newIds = slice.filter(w => !existingMeta.has(w.id)).map(w => w.id)
    const newSet = new Set(newIds)
    const defRows = slice.flatMap(w => newSet.has(w.id)
      ? w.translations.slice(0, 4).map((t, i) => ({
          word_id: w.id,
          part_of_speech: t.type || 'n',
          definition_en: t.translation,        // 源为中文释义；EN 列必填，存中文并以 zh 镜像
          definition_zh: t.translation,
          order_index: i,
          source_type: 'public-domain',
          source_note: 'KyleBing/english-vocabulary',
        }))
      : [])
    const exRows = slice.flatMap(w => newSet.has(w.id)
      ? w.sentences.slice(0, 2).map((s, i) => ({
          word_id: w.id,
          sentence_en: s.sentence,
          sentence_zh: s.translation ?? null,
          order_index: i,
          source_type: 'public-domain',
          source_note: 'KyleBing/english-vocabulary',
        }))
      : [])

    if (defRows.length) {
      const { error: e1 } = await db.from('dictionary_definitions').insert(defRows)
      if (e1 && !e1.message.includes('duplicate')) throw new Error(`defs batch ${b}: ${e1.message}`)
    }
    if (exRows.length) {
      const { error: e2 } = await db.from('dictionary_examples').insert(exRows)
      if (e2 && !e2.message.includes('duplicate')) throw new Error(`examples batch ${b}: ${e2.message}`)
    }

    fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ completedBatches: b + 1, totalBatches: batches }))
    console.log(`批次 ${b + 1}/${batches} ✓（词 ${rows.length}，新释义 ${defRows.length}，新例句 ${exRows.length}）`)
  }

  const finalReport = { ...report, mergedWithExisting: mergedExisting, batches, done: true }
  fs.writeFileSync(REPORT_FILE, JSON.stringify(finalReport, null, 2))
  console.log('\n═══ 导入完成 ═══')
  console.log(JSON.stringify(finalReport, null, 2))
}

main().catch(e => { console.error('✗', e.message ?? e); process.exit(1) })
