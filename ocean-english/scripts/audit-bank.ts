/* ════════════════════════════════════════════════════════════════════════
   audit-bank.ts — 词库 + 题库 完整审查（找错漏题）
   ① 词库：dictionary_definitions 占位/空释义统计（"中文释义: X 的学习含义" 等）。
   ② 题库：全量扫 active 行，标记
      - 占位释义出现在 prompt/prompt_zh/answer_text/任一选项
      - 结构错：选择题选项<2 / 答案不在选项 / 选项重复 / 答案为空
      - 答案泄漏：选择题题面(prompt/prompt_zh)直接包含正确选项文本
   输出各缺陷计数（按题型）。用法：npx tsx scripts/audit-bank.ts [--samples]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'; import { readFileSync } from 'fs'
const env = readFileSync('.env.local', 'utf8'); const g = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'))
const SHOW = process.argv.includes('--samples')
const FIX = process.argv.includes('--fix')   // 删除所有被标记的缺陷行
const PLACEHOLDER = (s: string) => /的学习含义|^\s*中文释义\s*[:：]/.test(s)
const PASSAGE = new Set(['listening_comprehension', 'reading_comprehension', 'cloze_passage', 'seven_select', 'banked_cloze', 'para_match', 'grammar_fill'])

interface Row { id: string; type: string; input_mode: string | null; prompt: string | null; prompt_zh: string | null; answer: string | null; answer_text: string | null; choices: { id: string; text: string }[] | null }

async function auditDict() {
  console.log('① 词库（dictionary_definitions）')
  const { count: total } = await db.from('dictionary_definitions').select('id', { count: 'exact', head: true })
  const { count: ph } = await db.from('dictionary_definitions').select('id', { count: 'exact', head: true }).ilike('definition_zh', '%的学习含义%')
  const { count: ph2 } = await db.from('dictionary_definitions').select('id', { count: 'exact', head: true }).ilike('definition_zh', '中文释义:%')
  const { count: empty } = await db.from('dictionary_definitions').select('id', { count: 'exact', head: true }).or('definition_zh.is.null,definition_zh.eq.')
  console.log(`  释义总数 ${total} · 占位"的学习含义" ${ph} · 占位"中文释义:" ${ph2} · 空释义 ${empty}`)
  if (SHOW) { const { data } = await db.from('dictionary_definitions').select('word_id, definition_zh').ilike('definition_zh', '%的学习含义%').limit(6); for (const d of (data ?? []) as { word_id: string; definition_zh: string }[]) console.log(`     ${d.word_id}: ${d.definition_zh}`) }
}

async function auditBank() {
  console.log('\n② 题库（question_bank · active 全量扫描）')
  const defects: Record<string, Record<string, number>> = {}     // type -> defect -> count
  const samples: Record<string, string[]> = {}
  const badIds = new Set<string>()
  const bump = (type: string, d: string, sample?: string, id?: string) => { (defects[type] ??= {})[d] = ((defects[type] ?? {})[d] ?? 0) + 1; if (sample && (samples[d] ??= []).length < 8) samples[d].push(sample); if (id) badIds.add(id) }
  let after = ''; let scanned = 0
  for (; ;) {
    let q = db.from('question_bank').select('id,type,input_mode,prompt,prompt_zh,answer,answer_text,choices').eq('status', 'active').order('id', { ascending: true }).limit(1000)
    if (after) q = q.gt('id', after)
    const { data, error } = await q
    if (error) { console.error('scan err', error.message); break }
    const rows = (data ?? []) as Row[]
    if (!rows.length) break
    for (const r of rows) {
      scanned++
      const opts = Array.isArray(r.choices) ? r.choices : []
      const texts = opts.map(o => String(o?.text ?? ''))
      const fields = [r.prompt ?? '', r.prompt_zh ?? '', r.answer_text ?? '', ...texts]
      // 占位释义
      if (fields.some(f => PLACEHOLDER(f))) bump(r.type, '占位释义', `${r.id.slice(-12)} ${r.prompt_zh ?? r.prompt ?? texts.join('/')}`.slice(0, 90), r.id)
      // 结构错（仅选择题：有 choices 的非短文题）
      const isChoice = r.input_mode !== 'spell' && r.input_mode !== 'listen' && !PASSAGE.has(r.type) && opts.length > 0
      if (isChoice) {
        if (opts.length < 2) bump(r.type, '选项<2', r.id, r.id)
        else {
          if (new Set(texts.map(t => t.trim().toLowerCase())).size !== texts.length) bump(r.type, '选项重复', `${r.id.slice(-12)} ${texts.join('/')}`.slice(0, 90), r.id)
          if (!r.answer || !opts.some(o => o.id === r.answer)) bump(r.type, '答案不在选项', r.id, r.id)
          // 答案泄漏：题面含正确选项文本（针对"选英文词"类，prompt 应是中文）
          const ansText = opts.find(o => o.id === r.answer)?.text?.trim().toLowerCase()
          if (ansText && ansText.length >= 3 && (r.prompt ?? '').toLowerCase().includes(ansText) && ['def_to_word', 'zh_to_en', 'synonym_choice', 'antonym_choice'].includes(r.type)) bump(r.type, '答案泄漏', `${r.id.slice(-12)} prompt=${r.prompt}`.slice(0, 90), r.id)
        }
      }
    }
    after = rows[rows.length - 1].id
    if (scanned % 20000 < 1000) process.stdout.write(`\r  扫描 ${scanned} …`)
  }
  console.log(`\r  扫描完成：${scanned} 题\n`)
  // 汇总
  const allDefects = new Set<string>(); Object.values(defects).forEach(d => Object.keys(d).forEach(k => allDefects.add(k)))
  let grand = 0
  const totByDefect: Record<string, number> = {}
  console.log('  按题型 × 缺陷：')
  for (const type of Object.keys(defects).sort()) {
    const parts = Object.entries(defects[type]).map(([d, n]) => { totByDefect[d] = (totByDefect[d] ?? 0) + n; grand += n; return `${d}=${n}` })
    console.log(`    ${type.padEnd(24)} ${parts.join('  ')}`)
  }
  console.log('\n  缺陷合计：')
  for (const [d, n] of Object.entries(totByDefect).sort((a, b) => b[1] - a[1])) console.log(`    ${d.padEnd(14)} ${n}`)
  console.log(`  === 错漏题总计 ${grand}（去重行 ${badIds.size}）===`)
  if (FIX && badIds.size) {
    const ids = [...badIds]; let del = 0
    for (let i = 0; i < ids.length; i += 200) { const { error } = await db.from('question_bank').delete().in('id', ids.slice(i, i + 200)); if (error) { console.error('  删除失败', error.message); break } del += ids.slice(i, i + 200).length }
    console.log(`  🗑 已删除缺陷题 ${del}`)
  }
  if (SHOW) { console.log('\n  样例：'); for (const [d, ss] of Object.entries(samples)) { console.log(`   [${d}]`); ss.forEach(s => console.log('     ' + s)) } }
}

async function main() {
  console.log('═══ 词库 + 题库 完整审查 ═══\n')
  await auditDict()
  await auditBank()
}
main().catch(e => { console.error('✗', e?.message ?? e); process.exit(1) })
