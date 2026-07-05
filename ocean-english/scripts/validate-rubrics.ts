/* ════════════════════════════════════════════════════════════════════════
   validate-rubrics.ts — 主观题 rubric 完整性校验（Phase 12，纯函数、只读）

   - ExamSpec 中每个生产性（写作/翻译/口语）section 都必须有 rubric。
   - 每个 rubric 维度都要有 labels、scale、description、bands，且权重和≈1。
   - SAT 不应有生产性 section（无写作/口语评分）。
   有错误退出 1，否则 0。用法：npm run validate:rubrics
   ════════════════════════════════════════════════════════════════════════ */
import { writeFileSync } from 'node:fs'
import { listExamSpecs, getExamSpec } from '@/lib/exam-specs'
import { RUBRICS, getRubricForSection, sectionNeedsRubric } from '@/lib/scoring/rubrics'
import { parseRubricDimensions } from '@/lib/scoring/score-engine'

const OUT = 'reports/rubrics-validation.json'
const errors: string[] = []
const warnings: string[] = []
const notes: string[] = []

// ── AI 维度解析的严格性 fixture：未知 key / 缺维度 / 空 comment / NaN band 必须 → null ──
function parserFixtures() {
  const r = RUBRICS[0]   // zhongkao:writing（4 维）
  const valid = r.dimensions.map((d) => ({ key: d.key, band: 4, comment: 'ok' }))
  if (parseRubricDimensions(r, valid) === null) errors.push('parser fixture: 合法维度不应 → null')
  if (parseRubricDimensions(r, [{ key: 'not_a_real_dimension', band: 5, comment: 'bad' }]) !== null) errors.push('parser fixture: 未知 key 必须 → null')
  if (parseRubricDimensions(r, valid.slice(0, -1)) !== null) errors.push('parser fixture: 缺维度必须 → null')
  if (parseRubricDimensions(r, valid.map((d, i) => (i === 0 ? { ...d, comment: '' } : d))) !== null) errors.push('parser fixture: 空 comment 必须 → null')
  if (parseRubricDimensions(r, valid.map((d, i) => (i === 0 ? { ...d, band: 'x' } : d))) !== null) errors.push('parser fixture: 非数 band(NaN) 必须 → null')
  if (parseRubricDimensions(r, valid.map((d, i) => (i === 0 ? { ...d, band: Number.NaN } : d))) !== null) errors.push('parser fixture: NaN band 必须 → null')
}

function main() {
  parserFixtures()

  // 1) 每个生产性 section 都有 rubric
  let subjectiveSections = 0
  for (const spec of listExamSpecs()) {
    for (const sec of spec.sections) {
      if (!sectionNeedsRubric(sec)) continue
      subjectiveSections++
      const r = getRubricForSection(spec.id, sec)
      if (!r) {
        // coming_soon（如 IELTS 整卷未做）：rubric 缺口降级为 warning——该考试组卷/专项一律受控拒
        // （exam_coming_soon），永远走不到主观评分；绝不为 coming_soon 造假 rubric。active 考试缺 rubric 仍是错误。
        const msg = `${spec.id}/${sec.id} 缺 rubric（skill=${sec.skill}, tasks=${sec.taskTypes.join('/')}）`
        if (spec.status === 'coming_soon') warnings.push(`${msg} · status=coming_soon，组卷受控拒，非阻塞`)
        else errors.push(msg)
      }
    }
  }

  // 2) SAT 无生产性 section（不做写作/口语评分）
  const sat = getExamSpec('sat')
  if (sat) {
    const subj = sat.sections.filter(sectionNeedsRubric)
    if (subj.length) errors.push(`sat 不应有生产性 section，但发现：${subj.map((s) => s.id).join(', ')}`)
    if (RUBRICS.some((r) => r.examId === 'sat')) errors.push('sat 不应有 rubric')
  }

  // 3) rubric 维度形状 + 权重和
  for (const r of RUBRICS) {
    if (!r.dimensions.length) { errors.push(`${r.id} 无维度`); continue }
    let wsum = 0
    for (const d of r.dimensions) {
      if (!d.labelZh || !d.labelEn) errors.push(`${r.id}/${d.key} 缺 label`)
      if (!d.description || !d.description.trim()) errors.push(`${r.id}/${d.key} 缺 description`)
      if (!d.scale || typeof d.scale.min !== 'number' || typeof d.scale.max !== 'number' || d.scale.max <= d.scale.min) errors.push(`${r.id}/${d.key} scale 非法`)
      if (!Array.isArray(d.bands) || d.bands.length < 2) errors.push(`${r.id}/${d.key} 缺分档描述 bands`)
      wsum += d.weight
    }
    if (Math.abs(wsum - 1) > 0.001) errors.push(`${r.id} 维度权重和=${wsum.toFixed(3)} ≠ 1`)
  }

  notes.push(`生产性 section ${subjectiveSections} 个 · rubric ${RUBRICS.length} 个`)
  writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), rubrics: RUBRICS.map((r) => r.id), subjectiveSections, errors, warnings, notes, ok: errors.length === 0 }, null, 2) + '\n', 'utf8')
  console.log(`validate-rubrics: rubric ${RUBRICS.length} · 生产性 section ${subjectiveSections} · 错误 ${errors.length} · 警告 ${warnings.length}`)
  for (const n of notes) console.log(`  · ${n}`)
  for (const w of warnings) console.warn(`WARN ${w}`)
  for (const e of errors) console.error(`ERROR ${e}`)
  process.exitCode = errors.length ? 1 : 0
}

main()
