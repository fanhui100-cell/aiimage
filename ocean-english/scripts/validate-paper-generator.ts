/* ════════════════════════════════════════════════════════════════════════
   validate-paper-generator.ts — 模拟卷生成器/评分校验（Phase 10，只读）

   - v2 未应用 → 生成路径优雅返回 v2_not_applied，退出 0，不崩。
   - v2 已应用 → 生成 CET4 mini/section/full + 一个 kaoyan section（池允许时）；
     校验同 seed 同卷、无退役题型、池不足受控告警。
   - scoring 纯函数单测始终运行（不依赖 DB）：客观精确 / 多空·匹配部分给分 / 主观待评分。
   有错误退出 1，否则 0。用法：npm run validate:papers
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { generatePaper, toClientPaper, v2Available } from '@/lib/papers/paper-generator'
import { scorePaper, scoreItem } from '@/lib/papers/scoring'
import { isDeprecatedQuestionType } from '@/lib/question-bank/question-type-taxonomy'
import type { GeneratedPaper, PaperItem, PaperSection } from '@/lib/papers/paper-types'

const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const SUPABASE_URL = readEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_ROLE = readEnv('SUPABASE_SERVICE_ROLE_KEY')
const OUT = 'reports/paper-generator-validation.json'

const errors: string[] = []
const notes: string[] = []
const ok = (cond: boolean, msg: string) => { if (!cond) errors.push(msg) }
function writeOut(p: Record<string, unknown>) { writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), ...p }, null, 2) + '\n', 'utf8') }

// ── 纯函数：scoring 单测（不依赖 DB，始终跑）────────────────────────────────
function item(partial: Partial<PaperItem>): PaperItem {
  return { questionItemId: 'x', setId: 's', orderIndex: 0, inputMode: 'choice', prompt: 'p', ...partial }
}
function scoringUnitTests() {
  // 客观选择：精确
  const c1 = scoreItem(item({ inputMode: 'choice', answerKey: 'b' }), 'b', 10)
  ok(c1.kind === 'objective' && c1.awarded === 10 && c1.correct === true, 'scoring: choice 正确得满分')
  const c2 = scoreItem(item({ inputMode: 'choice', answerKey: 'b' }), 'a', 10)
  ok(c2.awarded === 0 && c2.correct === false, 'scoring: choice 错误得 0')
  // multi_blank：部分给分（number[]）
  const mb = scoreItem(item({ inputMode: 'multi_blank', answerKey: [0, 1, 2, 3] }), [0, 9, 2, 9], 8)
  ok(mb.kind === 'multi_blank' && mb.awarded === 4 && mb.correct === false, 'scoring: multi_blank 半对得半分')
  // matching：部分给分
  const mt = scoreItem(item({ inputMode: 'matching', answerKey: [3, 1, 4, 2, 0] }), [3, 1, 4, 2, 0], 10)
  ok(mt.kind === 'matching' && mt.awarded === 10 && mt.correct === true, 'scoring: matching 全对得满分')
  // cloze_passage 形状 {options,answer}[]
  const cp = scoreItem(item({ inputMode: 'multi_blank', answerKey: [{ options: ['a', 'b'], answer: 'a' }, { options: ['c', 'd'], answer: 'd' }] }), ['a', 'c'], 10)
  ok(cp.awarded === 5, 'scoring: cloze_passage {answer} 形状半对得半分')
  // free_text → 待评分
  const ft = scoreItem(item({ inputMode: 'free_text', answerKey: null }), 'whatever', 10)
  ok(ft.kind === 'needs_manual_or_ai_scoring' && ft.needsScoring === true && ft.awarded === 0, 'scoring: free_text 待 AI/人工评分')

  // 整卷：客观 section + 主观 section
  const paper: GeneratedPaper = {
    examId: 'cet4', examLabelZh: 'CET-4', level: 3, mode: 'mini', seed: 't', scoringScale: '710', fullScore: 710, totalMinutes: 130,
    warnings: [],
    sections: [
      { sectionId: 'r', labelZh: '阅读', labelEn: 'R', skill: 'reading', taskType: 'reading_comprehension', groupMode: 'passages', points: 20, scoring: 'objective', subjective: false, sets: [], warnings: [],
        items: [item({ questionItemId: 'i1', inputMode: 'choice', answerKey: 'a' }), item({ questionItemId: 'i2', inputMode: 'choice', answerKey: 'b' })] },
      { sectionId: 'w', labelZh: '写作', labelEn: 'W', skill: 'writing', taskType: 'essay_writing', groupMode: 'single', points: 100, scoring: 'needs_manual_or_ai_scoring', subjective: true, sets: [], items: [], warnings: [] } as PaperSection,
    ],
  }
  const score = scorePaper(paper, [{ questionItemId: 'i1', answer: 'a' }, { questionItemId: 'i2', answer: 'x' }])
  ok(score.objectiveAwarded === 10 && score.objectiveMax === 20, 'scoring: 整卷客观分汇总正确（10/20）')
  ok(score.needsManualOrAi === true, 'scoring: 含主观区 → needsManualOrAi=true')
}

// ── 客户端卷契约：听力不泄 transcript、有 active 音频时带 audioUrl；阅读保留材料 ──────
function clientPaperContractTests() {
  const paper: GeneratedPaper = {
    examId: 'cet4', examLabelZh: 'CET-4', level: 3, mode: 'full', seed: 't', scoringScale: '710', fullScore: 710, totalMinutes: 130, warnings: [],
    sections: [
      { sectionId: 'listening', labelZh: '听力', labelEn: 'L', skill: 'listening', taskType: 'listening_comprehension', groupMode: 'rows', points: 249, scoring: 'objective', subjective: false, requiresAudio: true,
        sets: [{ setId: 'ls', taskType: 'listening_comprehension', stimulusId: 'st1', stimulus: { kind: 'lecture', title: 'Audio', textEn: 'SECRET TRANSCRIPT', audioUrl: 'https://x/a.mp3' } }],
        items: [item({ questionItemId: 'l1', inputMode: 'choice', answerKey: 'a' })], warnings: [] },
      { sectionId: 'reading', labelZh: '阅读', labelEn: 'R', skill: 'reading', taskType: 'reading_comprehension', groupMode: 'passages', points: 142, scoring: 'objective', subjective: false,
        sets: [{ setId: 'rs', taskType: 'reading_comprehension', stimulusId: 'st2', stimulus: { kind: 'passage', title: 'P', textEn: 'reading passage body' } }],
        items: [item({ questionItemId: 'r1', inputMode: 'choice', answerKey: 'b' })], warnings: [] },
    ],
  }
  const client = toClientPaper(paper)
  const ls = client.sections[0]
  const rs = client.sections[1]
  ok(ls.sets[0]?.stimulus?.textEn === undefined, 'client: 听力 stimulus 不含 textEn(transcript)')
  ok(ls.sets[0]?.stimulus?.audioUrl === 'https://x/a.mp3', 'client: 听力 stimulus 保留 audioUrl')
  ok(rs.sets[0]?.stimulus?.textEn === 'reading passage body', 'client: 阅读 stimulus 保留 textEn(考试材料)')
  ok(client.sections[0].items.every((i) => !('answerKey' in i)), 'client: items 已剥 answerKey')
}

// ── 生成的卷不得含退役题型 ────────────────────────────────────────────────────
function assertNoDeprecated(paper: GeneratedPaper, label: string) {
  for (const s of paper.sections) {
    if (s.taskType && isDeprecatedQuestionType(s.taskType)) errors.push(`${label}: section ${s.sectionId} 退役题型 ${s.taskType}`)
  }
}

// ── applied 真实卷：听力客户端 set 不得含 transcript；有题时须带 audioUrl ──────────────
function assertClientListeningSafe(paper: GeneratedPaper, label: string) {
  const client = toClientPaper(paper)
  for (const s of client.sections) {
    const isListening = s.requiresAudio === true || s.taskType === 'listening_comprehension'
    if (!isListening) continue
    for (const set of s.sets) {
      if (set.stimulus && 'textEn' in set.stimulus && set.stimulus.textEn != null) errors.push(`${label}: 听力 set ${set.setId} 客户端仍含 transcript`)
      if (s.items.length && !set.stimulus?.audioUrl) errors.push(`${label}: 听力 set ${set.setId} 缺 audioUrl`)
    }
  }
}

async function dbChecks(db: SupabaseClient) {
  const applied = await v2Available(db)
  if (!applied) {
    notes.push('v2 not_applied：生成路径返回 v2_not_applied（优雅）')
    for (const m of ['full', 'mini', 'section'] as const) {
      const { paper, warnings } = await generatePaper(db, { examId: 'cet4', mode: m, sectionId: m === 'section' ? 'careful_reading' : undefined })
      ok(paper === null && warnings.includes('v2_not_applied'), `not_applied: cet4 ${m} → v2_not_applied 且不崩`)
    }
    // 同 seed 同卷（not_applied 下双 null → 恒等）
    const a = await generatePaper(db, { examId: 'cet4', mode: 'full', seed: 'fixed' })
    const b = await generatePaper(db, { examId: 'cet4', mode: 'full', seed: 'fixed' })
    ok(JSON.stringify(a) === JSON.stringify(b), 'not_applied: 同 seed 同结果')
    // 未知考试受控
    const u = await generatePaper(db, { examId: 'ielts', mode: 'full' })
    ok(u.paper === null && u.warnings.includes('unknown_exam'), 'unknown_exam 受控')
    return { applied: false }
  }

  notes.push('v2 applied：执行真实生成 + 确定性/退役/池不足校验')
  // CET4 mini/section/full
  for (const m of ['mini', 'full'] as const) {
    const { paper, warnings } = await generatePaper(db, { examId: 'cet4', mode: m, seed: `cet4-${m}` })
    if (paper) { assertNoDeprecated(paper, `cet4 ${m}`); assertClientListeningSafe(paper, `cet4 ${m}`); if (warnings.includes('insufficient_pool')) notes.push(`cet4 ${m}: insufficient_pool（受控）`) }
    else notes.push(`cet4 ${m}: paper=null warnings=${warnings.join(',')}`)
  }
  const sec = await generatePaper(db, { examId: 'cet4', mode: 'section', sectionId: 'careful_reading', seed: 'cet4-sec' })
  if (sec.paper) assertNoDeprecated(sec.paper, 'cet4 section')
  // kaoyan 一个 section
  const ky = await generatePaper(db, { examId: 'kaoyan', mode: 'section', sectionId: 'reading_a', seed: 'ky-sec' })
  if (ky.paper) assertNoDeprecated(ky.paper, 'kaoyan section')
  else notes.push(`kaoyan section: warnings=${ky.warnings.join(',')}`)
  // 确定性：同 seed 同卷
  const d1 = await generatePaper(db, { examId: 'cet4', mode: 'full', seed: 'determinism' })
  const d2 = await generatePaper(db, { examId: 'cet4', mode: 'full', seed: 'determinism' })
  ok(JSON.stringify(d1.paper) === JSON.stringify(d2.paper), 'applied: 同 seed 同卷')
  return { applied: true }
}

async function main() {
  scoringUnitTests()
  clientPaperContractTests()

  let applied = false
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    notes.push('缺 Supabase 凭据：跳过 DB 生成校验，仅跑 scoring 单测')
  } else {
    const db = createClient(SUPABASE_URL, SERVICE_ROLE)
    try {
      const r = await dbChecks(db)
      applied = r.applied
    } catch (e) {
      errors.push(`db checks fatal: ${(e as Error).message}`)
    }
  }

  writeOut({ status: applied ? 'applied' : 'not_applied', errors, notes, ok: errors.length === 0 })
  console.log(`validate-papers: ${applied ? 'applied' : 'not_applied'} · 错误 ${errors.length}`)
  for (const n of notes) console.log(`  · ${n}`)
  for (const e of errors) console.error(`ERROR ${e}`)
  process.exit(errors.length ? 1 : 0)
}

main().catch((e) => {
  console.error('validate-papers fatal', e?.message ?? e)
  writeOut({ status: 'error', message: String(e?.message ?? e), errors, notes })
  process.exit(1)
})
