/* ════════════════════════════════════════════════════════════════════════
   validate-paper-generator.ts — 模拟卷生成器/评分校验（Phase 10，只读）

   - v2 未应用 → 生成路径优雅返回 v2_not_applied，退出 0，不崩。
   - v2 已应用 → 生成 CET4 mini/section/full + 一个 kaoyan section（池允许时）；
     校验同 seed 同卷、无退役题型、池不足受控告警。
   - scoring 纯函数单测始终运行（不依赖 DB）：客观精确 / 多空·匹配部分给分 / 主观待评分。
   有错误退出 1，否则 0。

   用法（审计建议拆分，避免「8 张远程整卷全跑完才算通过」）：
     npm run validate:papers        → 本地契约(scoring+clientPaper) + 远程 smoke(cet4 mini + 听力 section，带超时)
     npm run validate:papers:full   → 追加全量整卷压测(所有卷 + 确定性 + TOEFL/SAT 门控)，单独跑，不放普通门禁
   ════════════════════════════════════════════════════════════════════════ */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { loadDotenv } from './load-dotenv'
import { generatePaper, toClientPaper, v2Available } from '@/lib/papers/paper-generator'
import { scorePaper, scoreItem } from '@/lib/papers/scoring'
import { isDeprecatedQuestionType } from '@/lib/question-bank/question-type-taxonomy'
import type { GeneratedPaper, PaperItem, PaperSection } from '@/lib/papers/paper-types'

loadDotenv() // signAudioPath 依赖 process.env（听力音频签名）
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

// ── 确定性比较：剥离每次现签的时变 token，避免把「签名 token 不同」误判为「卷不同」──────────
// Supabase createSignedUrl 返回 …/object/sign/<bucket>/<path>?token=<jwt>，jwt 含 iat/exp 故每次调用都变；
// 同一对象的 path（?前）稳定。归一化只去掉 ?token=… 时变段，仍逐字段比较（含稳定音频对象路径），不弱化。
function normalizePaper(paper: GeneratedPaper | null): unknown {
  if (!paper) return paper
  const clone = JSON.parse(JSON.stringify(paper)) as GeneratedPaper
  for (const s of clone.sections) {
    for (const set of s.sets) {
      const u = set.stimulus?.audioUrl
      if (typeof u === 'string') set.stimulus!.audioUrl = u.split('?')[0]
    }
  }
  return clone
}
/** set/item 选择签名：直接证明「真实 set/item 选择不变」，与 stimulus/签名无关。 */
function selectionSignature(paper: GeneratedPaper | null): string {
  if (!paper) return 'null'
  return JSON.stringify(paper.sections.map((s) => ({
    sec: s.sectionId, task: s.taskType,
    sets: s.sets.map((x) => x.setId),
    items: s.items.map((x) => x.questionItemId),
  })))
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

// 明确超时：远程 smoke 不应无限等待外部状态（审计建议「带明确超时」）。
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => { const t = setTimeout(() => rej(new Error(`${label} 超时 ${(ms / 1000).toFixed(0)}s`)), ms); (t as { unref?: () => void }).unref?.() }),
  ])
}

// v2 未应用：生成路径优雅返回 v2_not_applied（smoke 与 full 共用）。
async function v2NotAppliedChecks(db: SupabaseClient) {
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
}

// 远程 smoke（默认门禁）：只跑 1 张 mini + 1 个听力 section，带明确超时；
// 验证「修候选签名后听力不再 0 题」且单次生成在可接受时间内。整卷压测见 dbFull（--full）。
async function dbSmoke(db: SupabaseClient) {
  const applied = await v2Available(db)
  if (!applied) { await v2NotAppliedChecks(db); return { applied: false } }
  notes.push('v2 applied · smoke：cet4 mini + 听力 section（带 60s 超时）')
  const timed = async <T>(label: string, p: Promise<T>): Promise<T> => {
    const t0 = Date.now(); const r = await withTimeout(p, 60_000, label); notes.push(`⏱ ${label}: ${((Date.now() - t0) / 1000).toFixed(1)}s`); return r
  }
  const mini = await timed('cet4 mini', generatePaper(db, { examId: 'cet4', mode: 'mini', seed: 'smoke-mini' }))
  if (mini.paper) { assertNoDeprecated(mini.paper, 'cet4 mini'); assertClientListeningSafe(mini.paper, 'cet4 mini') }
  else notes.push(`cet4 mini: paper=null warnings=${mini.warnings.join(',')}`)
  const lisSec = await timed('cet4 listening section', generatePaper(db, { examId: 'cet4', mode: 'section', sectionId: 'listening', seed: 'smoke-listening' }))
  if (lisSec.paper) {
    assertNoDeprecated(lisSec.paper, 'cet4 listening section'); assertClientListeningSafe(lisSec.paper, 'cet4 listening section')
    const lis = lisSec.paper.sections.find((s) => s.taskType === 'listening_comprehension')
    ok(!!lis && (lis.items?.length ?? 0) > 0, `cet4 听力 section 应抽到题（实际 ${lis?.items?.length ?? 0}；修候选签名后不应再 0 题）`)
  } else notes.push(`cet4 listening section: paper=null warnings=${lisSec.warnings.join(',')}`)
  return { applied: true }
}

// 全量整卷压测（--full）：所有卷 + 确定性 + 退役 + 池不足 + TOEFL/SAT 门控。不放普通门禁。
async function dbFull(db: SupabaseClient) {
  const applied = await v2Available(db)
  if (!applied) { await v2NotAppliedChecks(db); return { applied: false } }

  notes.push('v2 applied：执行真实生成 + 确定性/退役/池不足校验')
  // 阶段计时：每次 generatePaper 输出耗时，避免以后只看到「总超时」无法定位（审计建议）。
  const timed = async <T>(label: string, p: Promise<T>): Promise<T> => {
    const t0 = Date.now(); const r = await p; notes.push(`⏱ ${label}: ${((Date.now() - t0) / 1000).toFixed(1)}s`); return r
  }
  // CET4 mini/section/full（含听力 section 抽题校验：曾因对全部候选 stimulus 现签遇限流/失败，误判听力 0 题）
  for (const m of ['mini', 'full'] as const) {
    const { paper, warnings } = await timed(`cet4 ${m}`, generatePaper(db, { examId: 'cet4', mode: m, seed: `cet4-${m}` }))
    if (paper) {
      assertNoDeprecated(paper, `cet4 ${m}`); assertClientListeningSafe(paper, `cet4 ${m}`)
      const lis = paper.sections.find((s) => s.taskType === 'listening_comprehension')
      if (lis) ok((lis.items?.length ?? 0) > 0, `cet4 ${m} 听力 section 应抽到题（实际 ${lis.items?.length ?? 0}；修候选签名后不应再 0 题）`)
      if (warnings.includes('insufficient_pool')) notes.push(`cet4 ${m}: insufficient_pool（受控）`)
    } else notes.push(`cet4 ${m}: paper=null warnings=${warnings.join(',')}`)
  }
  const sec = await generatePaper(db, { examId: 'cet4', mode: 'section', sectionId: 'careful_reading', seed: 'cet4-sec' })
  if (sec.paper) assertNoDeprecated(sec.paper, 'cet4 section')
  // kaoyan 一个 section
  const ky = await generatePaper(db, { examId: 'kaoyan', mode: 'section', sectionId: 'reading_a', seed: 'ky-sec' })
  if (ky.paper) assertNoDeprecated(ky.paper, 'kaoyan section')
  else notes.push(`kaoyan section: warnings=${ky.warnings.join(',')}`)
  // 确定性：同 seed 同卷。听力 stimulus.audioUrl 是每次现签的短时签名（token 时变），
  // 故先比 set/item 选择签名（证明真实选择不变），再比归一化卷（剥时变 token、保留稳定音频对象路径后逐字段一致）。
  const d1 = await generatePaper(db, { examId: 'cet4', mode: 'full', seed: 'determinism' })
  const d2 = await generatePaper(db, { examId: 'cet4', mode: 'full', seed: 'determinism' })
  ok(selectionSignature(d1.paper) === selectionSignature(d2.paper), 'applied: 同 seed → set/item 选择完全一致')
  ok(JSON.stringify(normalizePaper(d1.paper)) === JSON.stringify(normalizePaper(d2.paper)), 'applied: 同 seed 同卷（归一化时变签名 token 后逐字段一致）')
  // 同时确认 d1/d2 原始卷的差异确实只来自签名 token（若原始已相等，说明该卷无听力签名 URL）。
  const rawIdentical = JSON.stringify(d1.paper) === JSON.stringify(d2.paper)
  notes.push(rawIdentical ? '确定性：原始卷即逐字节相等（本卷无时变签名 URL）' : '确定性：原始卷仅签名 token 不同，归一化后一致（set/item 选择确定）')

  // 第三轮审计：TOEFL 整卷未就绪（paperReady=false）→ 模考拒；专项 task 仍可练（见 validate:practice-session）
  const toeflFull = await generatePaper(db, { examId: 'toefl', mode: 'full', seed: 'toefl-full' })
  ok(toeflFull.paper === null && toeflFull.warnings.includes('paper_not_ready'), 'toefl full → paper_not_ready（整卷未就绪，模考禁、专项可练）')
  // SAT Expression of Ideas 是 writing domain 但客观 MCQ：修 isSubjectiveSection 后该 section 应客观抽题（非主观 1 题）
  const satFull = await generatePaper(db, { examId: 'sat', mode: 'full', seed: 'sat-full' })
  if (satFull.paper) {
    assertNoDeprecated(satFull.paper, 'sat full')
    const expr = satFull.paper.sections.find((s) => s.sectionId === 'expression_of_ideas')
    ok(!!expr && expr.subjective !== true, 'sat expression_of_ideas 应判客观（非 subjective）')
    ok(!!expr && (expr.items?.length ?? 0) >= 2, `sat expression_of_ideas 应抽到多道客观题（实际 ${expr?.items?.length ?? 0}）`)
  } else {
    notes.push(`sat full: paper=null warnings=${satFull.warnings.join(',')}`)
  }
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
    const full = process.argv.includes('--full')
    try {
      const r = await (full ? dbFull(db) : dbSmoke(db))
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
