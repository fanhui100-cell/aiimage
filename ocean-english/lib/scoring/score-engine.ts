/* ════════════════════════════════════════════════════════════════════════
   scoring/score-engine.ts — rubric 驱动的主观题评分引擎（Phase 12）

   - 真 provider（DEEPSEEK_API_KEY）：自包含调用 DeepSeek（JSON 输出），与 /api/ai/writing
     同一模式；不触碰 DeepSeek 全局限流路由。失败 → 回退 mock 估分。
   - 无 key / forceMock：确定性 mock 估分，标 provider:'mock'。
   - 评分一律 isEstimate=true（练习估分，非官方分）。
   ════════════════════════════════════════════════════════════════════════ */
import type { Rubric, ScoreInput, SubjectiveScore, ScoreDimensionResult } from './rubric-types'

export interface EngineOpts { forceMock?: boolean; timeoutMs?: number }

const round2 = (n: number) => Math.round(n * 100) / 100
const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

function bandToResults(rubric: Rubric, bandByKey: Map<string, { band: number; comment: string }>): ScoreDimensionResult[] {
  return rubric.dimensions.map((d) => {
    const b = bandByKey.get(d.key) ?? { band: 3, comment: '' }
    const band = Math.max(0, Math.min(5, b.band))
    const max = round2(d.weight * rubric.fullScore)
    return { key: d.key, labelZh: d.labelZh, awarded: round2((band / 5) * max), comment: b.comment, max }
  })
}

function assemble(
  rubric: Rubric, provider: 'deepseek' | 'mock',
  bandByKey: Map<string, { band: number; comment: string }>,
  strengths: string[], issues: string[], rec: string, warnings: string[],
): SubjectiveScore {
  const dimensions = bandToResults(rubric, bandByKey)
  const overall = round2(dimensions.reduce((a, x) => a + x.awarded, 0))
  const ratio = rubric.fullScore ? overall / rubric.fullScore : 0
  const band = ratio >= 0.85 ? '优秀 · 接近目标' : ratio >= 0.7 ? '达标' : ratio >= 0.55 ? '基本达标 · 可提升' : '待提升'
  return {
    provider, isEstimate: true, rubricId: rubric.id, examId: rubric.examId, skill: rubric.skill,
    overall, fullScore: rubric.fullScore, band, dimensions, strengths, issues, nextRecommendation: rec, warnings,
  }
}

// ── 确定性 mock 估分（无 randomness：同输入同结果）─────────────────────────────
function mockScore(rubric: Rubric, input: ScoreInput, warnings: string[]): SubjectiveScore {
  const words = wordCount(input.text)
  const lenAdj = words < 20 ? -1.2 : words < 50 ? -0.5 : words > 500 ? -0.2 : 0
  const bandByKey = new Map<string, { band: number; comment: string }>()
  for (const d of rubric.dimensions) {
    let band = 3.2
    if (d.key === 'task_achievement') band += lenAdj
    if (d.key === 'organization' || d.key === 'coherence') band += words < 50 ? -0.4 : 0
    band = Math.max(0, Math.min(5, Math.round(band * 2) / 2))
    bandByKey.set(d.key, { band, comment: `（估算）${d.labelZh}：基于长度/结构的占位评估，待 AI 复核。` })
  }
  const strengths = words >= 50 ? ['完成了基本作答，长度达标。'] : ['已开始作答。']
  const issues = words < 30 ? ['内容偏短，建议补充要点与细节。'] : ['可提升用词多样性与句式变化。']
  const rec = `针对「${rubric.nameZh}」多练同类任务，重点打磨${rubric.dimensions[0]?.labelZh ?? '任务完成度'}。`
  return assemble(rubric, 'mock', bandByKey, strengths, issues, rec, [...warnings, 'mock_estimate'])
}

/**
 * 严格解析 AI 返回的 dimensions（纯函数，可单测）：
 * - 只接受属于本 rubric 的维度 key（未知 key 一律忽略）；
 * - band 必须是有限数（NaN 不静默变 0，直接判无效）；
 * - comment 必须非空；
 * - 必须覆盖 rubric 全部维度，否则返回 null → 调用方走 mock 回退。
 */
export function parseRubricDimensions(rubric: Rubric, dims: unknown): Map<string, { band: number; comment: string }> | null {
  const validKeys = new Set<string>(rubric.dimensions.map((d) => d.key))
  const bandByKey = new Map<string, { band: number; comment: string }>()
  const arr = Array.isArray(dims) ? dims : []
  for (const raw of arr) {
    const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
    if (typeof o.key !== 'string' || !validKeys.has(o.key) || bandByKey.has(o.key)) continue   // 未知/重复 key 忽略
    const bandNum = Number(o.band)
    if (!Number.isFinite(bandNum)) continue                                                    // NaN/非数 → 无效
    const comment = String(o.comment ?? '').trim().slice(0, 120)
    if (!comment) continue                                                                     // 空 comment → 无效
    bandByKey.set(o.key, { band: Math.max(0, Math.min(5, bandNum)), comment })
  }
  // 必须每个 rubric 维度都拿到合法 band + 非空 comment
  return bandByKey.size === rubric.dimensions.length ? bandByKey : null
}

// ── DeepSeek 评分 ────────────────────────────────────────────────────────────
function buildPrompt(rubric: Rubric, input: ScoreInput): { system: string; user: string } {
  const dimList = rubric.dimensions.map((d) => `- ${d.key}（${d.labelZh}，权重${d.weight}）：${d.description}`).join('\n')
  const keys = rubric.dimensions.map((d) => d.key)
  const system = `你是英语考试主观题评分老师。按以下 rubric 为「${rubric.nameZh}」打练习估分（不是官方分，给学习者参考与改进方向）。
评分维度（每个维度给 0-5 档，0=未作答/跑题，5=优秀）：
${dimList}
只输出 JSON、无其它文字：
{"dimensions":[${keys.map((k) => `{"key":"${k}","band":0-5,"comment":"中文一句，具体到问题"}`).join(',')}],"strengths":["中文，0-2 条"],"issues":["中文，1-3 条，具体"],"recommendation":"中文一句，下一步练什么"}`
  const user = `${input.sourceText ? `【题面/原文】${input.sourceText.slice(0, 1500)}\n` : ''}【学习者提交】${input.text.slice(0, 4000)}`
  return { system, user }
}

async function deepseekScore(rubric: Rubric, input: ScoreInput, timeoutMs: number): Promise<SubjectiveScore | null> {
  const key = process.env.DEEPSEEK_API_KEY
  if (!key) return null
  const { system, user } = buildPrompt(rubric, input)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST', signal: controller.signal,
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.3, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
    })
    if (!res.ok) return null
    const j = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    const raw = (j.choices?.[0]?.message?.content ?? '').trim()
    const p = JSON.parse(raw) as { dimensions?: unknown; strengths?: unknown; issues?: unknown; recommendation?: unknown }
    // 严格校验：未知 key / 缺维度 / 空 comment / NaN band → null → mock 回退（不冒充 deepseek 成功）
    const bandByKey = parseRubricDimensions(rubric, p.dimensions)
    if (!bandByKey) return null
    const arr = (v: unknown, n: number): string[] => Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).map((x) => (x as string).trim()).slice(0, n) : []
    const issues = arr(p.issues, 3)
    return assemble(rubric, 'deepseek', bandByKey, arr(p.strengths, 2), issues.length ? issues : ['继续保持，注意细节。'], typeof p.recommendation === 'string' && p.recommendation.trim() ? p.recommendation.trim() : '多练同类任务。', [])
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** rubric 驱动评分：真 provider 优先，失败/无 key → mock 估分。 */
export async function runRubricScoring(rubric: Rubric, input: ScoreInput, opts: EngineOpts = {}): Promise<SubjectiveScore> {
  if (opts.forceMock) return mockScore(rubric, input, [])
  const real = await deepseekScore(rubric, input, opts.timeoutMs ?? 30_000)
  if (real) return real
  return mockScore(rubric, input, process.env.DEEPSEEK_API_KEY ? ['provider_unavailable_fallback'] : ['provider_not_configured'])
}
