/* ════════════════════════════════════════════════════════════════════════
   spotcheck-authored.ts — 人工抽查辅助：把 authored JSON 经 shape 映射后的
   最终入库形态（prompt / answer / 词数）打印出来，便于逐 set 肉眼核对。
   只读，不连库、不写库。用法：
     npx tsx scripts/spotcheck-authored.ts --file=data/generated-question-sets/<dir>/<file>.json
   ════════════════════════════════════════════════════════════════════════ */
import { readFileSync, existsSync } from 'node:fs'
import { shapeToItems, countWords, type ShapeTemplate } from '@/lib/exam-task-templates/shape'

const argValue = (n: string) => { const h = process.argv.find((a) => a.startsWith(`${n}=`)); return h ? h.slice(n.length + 1) : null }
const FILE = argValue('--file')
if (!FILE || !existsSync(FILE)) { console.error('spotcheck: 需 --file=<path>'); process.exit(1) }

interface AuthoredFile { template: string; level?: number; sets: Record<string, unknown>[] }
interface Template { taskType: string; skill: string; itemCount: number; optionCount: number; answerSchema: Record<string, unknown>; stimulusRequirements?: Record<string, unknown> }

const af = JSON.parse(readFileSync(FILE, 'utf8')) as AuthoredFile
const t = JSON.parse(readFileSync(`data/exam-task-templates/${af.template}.json`, 'utf8')) as Template
const st: ShapeTemplate = { taskType: t.taskType, skill: t.skill, itemCount: t.itemCount, optionCount: t.optionCount, answerSchema: t.answerSchema, stimulusRequirements: t.stimulusRequirements }

let idx = 0
for (const raw of af.sets) {
  idx++
  const out = shapeToItems(st, raw)
  if (!out.ok) { console.log(`#${idx} REJECT=${out.reject}`); continue }
  const stim = out.result.stimulusText ?? ''
  console.log(`\n#${idx}  stimWords=${countWords(stim)}  items=${out.result.items.length}`)
  console.log(`  stimulus: ${stim}`)
  for (const it of out.result.items) {
    console.log(`  [${it.inputMode}] prompt: ${it.prompt}`)
    console.log(`           answer: ${JSON.stringify(it.answer)}`)
    if (it.choices.length) console.log(`           choices: ${it.choices.map((c) => `${c.id}.${c.text}`).join(' | ')}`)
  }
}
console.log(`\nspotcheck: ${idx} sets · template ${af.template} · level ${af.level}`)
