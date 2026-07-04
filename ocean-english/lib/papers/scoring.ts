/* ════════════════════════════════════════════════════════════════════════
   papers/scoring.ts — 模拟卷评分（Phase 10，纯函数）

   - 客观选择题：精确匹配。
   - multi_blank / matching：答案形状支持时按位置部分给分。
   - free_text / speaking / writing：返回 needs_manual_or_ai_scoring（Phase 12 接 AI/人工）。
   - 返回 section 与整卷汇总。
   ════════════════════════════════════════════════════════════════════════ */
import type {
  GeneratedPaper,
  ItemResponse,
  ItemScore,
  PaperItem,
  PaperScore,
  PaperSection,
  SectionScore,
} from './paper-types'

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
function looseEq(a: unknown, b: unknown): boolean {
  if (a == null || b == null) return false
  if (typeof a === 'number' || typeof b === 'number') return Number(a) === Number(b)
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase()
}
/** 把多空/匹配的 answerKey 归一为「逐空正确值」数组（兼容 number[] / string[] / {answer}[]）。 */
function blankAnswers(key: unknown): unknown[] {
  if (!Array.isArray(key)) return []
  return key.map((k) => (k && typeof k === 'object' && 'answer' in (k as object)) ? (k as { answer: unknown }).answer : k)
}

const MANUAL_MODES = new Set(['free_text', 'speak'])

// ── Build a Sentence（TOEFL）可接受语序判分（2026-07-05 Task 2 边界）────────────
// exact accepted-sequence match only：作答词块序列须逐块命中集合中的某一可接受语序（含 canonical）。
// 不做宽泛语法等价（部分等价表达需人工判断）；official:false，非官方 TOEFL 评分。
/** Build a Sentence 判分契约：answer 存 canonical + 可接受语序集合。 */
export interface BuildSentenceAnswer {
  canonical: string[]
  acceptedSequences: string[][]
  scoring: 'accepted_sequence_exact'
  official: false
}

export function isBuildSentenceAnswer(a: unknown): a is BuildSentenceAnswer {
  if (!a || typeof a !== 'object' || Array.isArray(a)) return false
  const o = a as Record<string, unknown>
  if (o.scoring !== 'accepted_sequence_exact' || o.official !== false) return false
  const canonical = o.canonical
  if (!Array.isArray(canonical) || canonical.length === 0 || canonical.some((t) => typeof t !== 'string' || !t.trim())) return false
  const seqs = o.acceptedSequences
  if (!Array.isArray(seqs) || seqs.length < 1) return false
  return seqs.every((s) => Array.isArray(s) && s.length === canonical.length && s.every((t) => typeof t === 'string' && t.trim()))
}

/** 词块归一：trim + 小写 + 折叠多空格 + 去尾部句末标点。 */
export function normalizeBuildSentenceTokens(tokens: string[]): string[] {
  return tokens.map((token) =>
    String(token)
      .trim()
      .toLowerCase()
      .replace(/[.!?。！？]+$/g, '')
      .replace(/\s+/g, ' ')
  )
}

export function sequenceEquals(a: string[], b: string[]): boolean {
  const na = normalizeBuildSentenceTokens(a)
  const nb = normalizeBuildSentenceTokens(b)
  return na.length === nb.length && na.every((token, index) => token === nb[index])
}

/** 单题评分。max=该题满分（由 section 均分得到）。 */
export function scoreItem(item: PaperItem, response: unknown, max: number): ItemScore {
  const id = item.questionItemId
  const mode = item.inputMode

  if (mode === 'choice') {
    const correct = typeof item.answerKey === 'string' && String(response) === item.answerKey
    return { questionItemId: id, kind: 'objective', awarded: correct ? max : 0, max, correct }
  }

  // Build a Sentence（accepted_sequence_exact，须在通用 multi_blank 之前）：作答=词块文本序列，
  // 命中任一可接受语序得满分，否则 0；不做部分给分、不做宽泛语法等价。
  if (isBuildSentenceAnswer(item.answerKey)) {
    const resp = Array.isArray(response) ? (response as unknown[]).map((x) => String(x)) : []
    const hit = item.answerKey.acceptedSequences.some((seq) => sequenceEquals(seq, resp))
    return { questionItemId: id, kind: 'objective', awarded: hit ? max : 0, max, correct: hit }
  }

  if (mode === 'multi_blank' || mode === 'matching') {
    const correctArr = blankAnswers(item.answerKey)
    if (!correctArr.length) return { questionItemId: id, kind: 'needs_manual_or_ai_scoring', awarded: 0, max, needsScoring: true }
    const resp = Array.isArray(response) ? response : []
    let matched = 0
    for (let i = 0; i < correctArr.length; i++) if (looseEq(resp[i], correctArr[i])) matched++
    const awarded = round2(max * (matched / correctArr.length))
    return { questionItemId: id, kind: mode === 'matching' ? 'matching' : 'multi_blank', awarded, max, correct: matched === correctArr.length }
  }

  if (mode === 'spell') {
    const correct = typeof item.answerKey === 'string' && looseEq(response, item.answerKey)
    return { questionItemId: id, kind: 'objective', awarded: correct ? max : 0, max, correct }
  }

  // free_text / speak / 其它无客观键 → 待 AI/人工评分（Phase 12）
  if (MANUAL_MODES.has(mode)) return { questionItemId: id, kind: 'needs_manual_or_ai_scoring', awarded: 0, max, needsScoring: true }
  // listen 等若带选择键则按精确，否则待评分
  if (typeof item.answerKey === 'string' && item.choices?.length) {
    const correct = String(response) === item.answerKey
    return { questionItemId: id, kind: 'objective', awarded: correct ? max : 0, max, correct }
  }
  return { questionItemId: id, kind: 'needs_manual_or_ai_scoring', awarded: 0, max, needsScoring: true }
}

/** 板块评分。responses 按 questionItemId 索引。 */
export function scoreSection(section: PaperSection, responses: Map<string, unknown>): SectionScore {
  if (section.subjective || !section.items.length) {
    return { sectionId: section.sectionId, awarded: 0, max: section.points, needsManualOrAi: true, items: [] }
  }
  const perItemMax = section.points / section.items.length
  const items = section.items.map((it) => scoreItem(it, responses.get(it.questionItemId), perItemMax))
  const awarded = round2(items.reduce((a, s) => a + s.awarded, 0))
  const needsManualOrAi = items.some((s) => s.needsScoring)
  return { sectionId: section.sectionId, awarded, max: section.points, needsManualOrAi, items }
}

/** 整卷评分。objective* 仅统计可客观计分的板块；scaled=客观得分四舍五入。 */
export function scorePaper(paper: GeneratedPaper, responses: ItemResponse[]): PaperScore {
  const byId = new Map<string, unknown>()
  for (const r of responses) byId.set(r.questionItemId, r.answer)

  const sections = paper.sections.map((s) => scoreSection(s, byId))
  const objectiveSections = sections.filter((s, i) => !paper.sections[i].subjective)
  const objectiveAwarded = round2(objectiveSections.reduce((a, s) => a + s.awarded, 0))
  const objectiveMax = round2(objectiveSections.reduce((a, s) => a + s.max, 0))
  const needsManualOrAi = sections.some((s) => s.needsManualOrAi)
  return { sections, objectiveAwarded, objectiveMax, scaled: Math.round(objectiveAwarded), needsManualOrAi }
}
