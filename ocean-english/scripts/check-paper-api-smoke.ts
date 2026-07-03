/* ════════════════════════════════════════════════════════════════════════
   check-paper-api-smoke.ts — 7 档组卷就绪只读 smoke（G9）

   对每档考试跑 mini + full 组卷（直连 generatePaper，不需起服务）。验收：
   - 池足够的 section 能出题；
   - 池不足时受控返回 insufficient_pool（不是错误兜底、不抽别的题型）；
   - 任何生成的卷子都不含退役题型；
   - 听力客户端视图不泄露 transcript（toClientPaper）；
   - 主观 section 标记为待评分（needs scoring），不伪装客观题。
   只读。用法：npm run smoke:papers
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { loadDotenv } from './load-dotenv'
import { generatePaper, toClientPaper, v2Available } from '@/lib/papers/paper-generator'
import { EXAM_SPECS } from '@/lib/exam-specs'
import { isDeprecatedQuestionType } from '@/lib/question-bank/question-type-taxonomy'
import type { GeneratedPaper } from '@/lib/papers/paper-types'

loadDotenv() // signAudioPath 依赖 process.env（听力音频签名）
const env = readFileSync('.env.local', 'utf8')
const readEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(readEnv('NEXT_PUBLIC_SUPABASE_URL'), readEnv('SUPABASE_SERVICE_ROLE_KEY'))
const OUT = 'reports/paper-api-smoke.json'

const errors: string[] = []
const rows: Record<string, unknown>[] = []

function checkPaper(label: string, paper: GeneratedPaper) {
  const client = toClientPaper(paper)
  for (const s of client.sections) {
    if (s.taskType && isDeprecatedQuestionType(s.taskType)) errors.push(`${label}: 含退役题型 ${s.taskType}`)
    // 听力 transcript 不得出现在客户端视图
    if (s.skill === 'listening') {
      for (const it of s.items ?? []) {
        const blob = JSON.stringify(it).toLowerCase()
        if (blob.includes('transcript')) errors.push(`${label}: 听力 item 疑似泄露 transcript`)
      }
    }
    // 主观 section 应标记 subjective / needs scoring，不能当客观题
    if (s.subjective && s.scoring && s.scoring !== 'needs_manual_or_ai_scoring') {
      errors.push(`${label}: 主观 section ${s.sectionId} scoring=${s.scoring}（应 needs_manual_or_ai_scoring）`)
    }
  }
}

async function main() {
  const applied = await v2Available(db)
  if (!applied) { writeFileSync(OUT, JSON.stringify({ status: 'v2_not_applied' }, null, 2)); console.log('smoke:papers v2_not_applied'); return }

  for (const spec of EXAM_SPECS) {
    for (const mode of ['mini', 'full'] as const) {
      const { paper, warnings } = await generatePaper(db, { examId: spec.id, mode, seed: `${spec.id}-${mode}` })
      const insufficient = warnings.includes('insufficient_pool')
      // 按 spec 精确推导本 exam 唯一可接受的受控拒绝（不设宽泛白名单）：
      //   coming_soon（IELTS）→ 只接受 exam_coming_soon；其它非 active → 只接受 exam_not_active；
      //   active 但 paperReady=false（TOEFL）→ 只接受 paper_not_ready；
      //   正常 active 考试 → 必须出卷，或受控 insufficient_pool。
      // unknown_exam / v2_not_applied 在本 smoke（遍历 EXAM_SPECS、v2 已确认 applied）中一律算错误。
      const expectedRefusal = spec.status === 'coming_soon' ? 'exam_coming_soon'
        : spec.status !== 'active' ? 'exam_not_active'
        : spec.paperReady === false ? 'paper_not_ready'
        : 'insufficient_pool'
      const mustRefuse = expectedRefusal !== 'insufficient_pool' // coming_soon / not_active / paperReady=false 绝不该出卷
      if (paper) {
        if (mustRefuse) errors.push(`${spec.id} ${mode}: 应受控拒绝（${expectedRefusal}）却生成了 paper`)
        checkPaper(`${spec.id} ${mode}`, paper)
      } else if (!warnings.includes(expectedRefusal)) {
        errors.push(`${spec.id} ${mode}: 未出卷且缺期望受控拒绝 ${expectedRefusal}（got: ${warnings.join(',') || 'none'}）`)
      }
      rows.push({ exam: spec.id, mode, generated: !!paper, sections: paper?.sections.length ?? 0, insufficientPool: insufficient, expectedRefusal: !paper ? expectedRefusal : null, refusal: !paper ? warnings.filter((w) => w === expectedRefusal) : [], warnings })
    }
  }

  writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), applied, rows, errors, ok: errors.length === 0 }, null, 2) + '\n', 'utf8')
  console.log(`smoke:papers · exams ${EXAM_SPECS.length} × {mini,full} · 错误 ${errors.length}`)
  for (const r of rows) console.log(`  ${r.exam} ${r.mode}: ${r.generated ? `generated ${r.sections} sections from active pool` : `no paper — refusal: ${((r.refusal as string[]) ?? []).join(',') || 'NONE (suspected error fallback)'}`}`)
  for (const e of errors) console.error(`ERROR ${e}`)
  process.exitCode = errors.length ? 1 : 0
}
main().catch((e) => { console.error('smoke:papers fatal', e?.message ?? e); process.exitCode = 1 })
