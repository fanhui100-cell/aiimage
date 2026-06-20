/* ════════════════════════════════════════════════════════════════════════
   papers/paper-generator.ts — 从 ExamSpec + v2 active 题池装配可复现整卷（Phase 10）

   规则（硬约束）：
   - 仅抽 v2 active question_sets/items；按 task_type + level 匹配（迁移数据 exam_id 为空，
     与 session-builder 一致按 level 取）。
   - 绝不抽退役题型（antonym_choice / cet_cloze）。
   - 绝不抽「无 active 音频」的 active 听力题组。
   - 池不足时只给 warnings: insufficient_pool，绝不用无关词题顶替。
   - 主观区（写作/翻译/口语）只放 placeholder（needs_manual_or_ai_scoring），不造假客观题。
   - 同卷内不重复 stimulus；尽量不过度重复 target word。
   - 确定性：同一 seed + 同一题池 → 同一卷（seeded RNG + 按 id 稳定排序后再洗牌）。
   - v2 未应用：返回 { paper:null, warnings:['v2_not_applied'] }，不抛错。
   ════════════════════════════════════════════════════════════════════════ */
import type { SupabaseClient } from '@supabase/supabase-js'
import { getExamSpec, type ExamSectionSpec } from '@/lib/exam-specs'
import {
  DEPRECATED_QUESTION_TYPES,
  isDeprecatedQuestionType,
  isExamTaskType,
} from '@/lib/question-bank/question-type-taxonomy'
import type {
  GeneratedPaper,
  GeneratePaperInput,
  PaperItem,
  PaperSection,
  PaperSetRef,
  ScoreKind,
} from './paper-types'

const DEPRECATED_FILTER = `(${DEPRECATED_QUESTION_TYPES.join(',')})`
const GROUPED_MULTI_ITEM = new Set(['reading_comprehension', 'listening_comprehension'])
const SINGLE_WHOLE_TASK = new Set(['banked_cloze', 'seven_select', 'cloze_passage', 'grammar_fill', 'para_match'])
const TARGET_WORD_CAP = 2

// ── 确定性 RNG ───────────────────────────────────────────────────────────────
function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
function mulberry32(seed: number): () => number {
  return () => { let t = (seed += 0x6D2B79F5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
function seededShuffle<T>(arr: T[], rnd: () => number): T[] {
  const x = [...arr]
  for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1));[x[i], x[j]] = [x[j], x[i]] }
  return x
}

// ── v2 探测 ──────────────────────────────────────────────────────────────────
export async function v2Available(db: SupabaseClient): Promise<boolean> {
  const { error } = await db.from('question_items').select('id').limit(1)
  return !error
}

// ── section 分类 ─────────────────────────────────────────────────────────────
function isSubjectiveSection(sec: ExamSectionSpec): boolean {
  if (sec.requiresRubric) return true
  if (sec.skill === 'writing' || sec.skill === 'speaking') return true
  // 没有任何「客观考试题型」候选 → 主观/生产性
  return !sec.taskTypes.some((t) => isExamTaskType(t) && !isDeprecatedQuestionType(t))
}
function scoringKindForTask(taskType: string): ScoreKind {
  if (taskType === 'para_match') return 'matching'
  if (SINGLE_WHOLE_TASK.has(taskType)) return 'multi_blank'
  return 'objective'
}
function targetCount(sec: ExamSectionSpec, mode: GeneratePaperInput['mode']): number {
  return mode === 'mini' ? Math.max(1, Math.min(sec.itemCount, 5)) : sec.itemCount
}

// ── v2 取数 ──────────────────────────────────────────────────────────────────
type SetRow = { id: string; stimulus_id: string | null; task_type: string }
type ItemRow = { id: string; question_set_id: string; order_index: number; input_mode: string; prompt: string; prompt_zh: string | null; choices: unknown; answer: unknown }
type StimRow = { id: string; kind: string; title: string | null; text_en: string | null }

async function fetchActiveSets(db: SupabaseClient, taskType: string, level: number): Promise<SetRow[]> {
  const { data, error } = await db.from('question_sets')
    .select('id, stimulus_id, task_type')
    .eq('status', 'active').eq('task_type', taskType).eq('level', level)
    .not('task_type', 'in', DEPRECATED_FILTER)
    .order('id', { ascending: true }).limit(400)
  if (error) return []
  return ((data ?? []) as SetRow[]).filter((s) => !isDeprecatedQuestionType(s.task_type))
}
async function fetchActiveItems(db: SupabaseClient, setId: string): Promise<ItemRow[]> {
  const { data } = await db.from('question_items')
    .select('id, question_set_id, order_index, input_mode, prompt, prompt_zh, choices, answer')
    .eq('status', 'active').eq('question_set_id', setId)
    .order('order_index', { ascending: true })
  return (data ?? []) as ItemRow[]
}
/** 返回 stimulus_id → active 音频 URL（既作听力可用门，又供 PaperStimulus.audioUrl）。 */
async function fetchActiveAudioUrls(db: SupabaseClient, stimulusIds: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  for (let i = 0; i < stimulusIds.length; i += 200) {
    const chunk = stimulusIds.slice(i, i + 200)
    if (!chunk.length) break
    const { data } = await db.from('audio_assets').select('stimulus_id, url, qa_status').in('stimulus_id', chunk).eq('qa_status', 'active')
    for (const a of (data ?? []) as { stimulus_id: string | null; url: string | null }[]) {
      if (a.stimulus_id && a.url && !out.has(a.stimulus_id)) out.set(a.stimulus_id, a.url)
    }
  }
  return out
}
async function fetchStimuli(db: SupabaseClient, ids: string[]): Promise<Map<string, StimRow>> {
  const map = new Map<string, StimRow>()
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200)
    if (!chunk.length) break
    const { data } = await db.from('stimuli').select('id, kind, title, text_en').in('id', chunk).eq('qa_status', 'active')
    for (const s of (data ?? []) as StimRow[]) map.set(s.id, s)
  }
  return map
}
async function fetchTargetWords(db: SupabaseClient, itemIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>()
  for (let i = 0; i < itemIds.length; i += 200) {
    const chunk = itemIds.slice(i, i + 200)
    if (!chunk.length) break
    const { data } = await db.from('question_target_words').select('question_item_id, word_id').in('question_item_id', chunk)
    for (const r of (data ?? []) as { question_item_id: string; word_id: string | null }[]) {
      if (!r.word_id) continue
      const arr = map.get(r.question_item_id) ?? []
      arr.push(r.word_id)
      map.set(r.question_item_id, arr)
    }
  }
  return map
}

function mapItem(it: ItemRow, targetWordIds: string[]): PaperItem {
  const choicesRaw = Array.isArray(it.choices) ? (it.choices as { id: string; text: string }[]) : []
  return {
    questionItemId: it.id,
    setId: it.question_set_id,
    orderIndex: it.order_index,
    inputMode: String(it.input_mode ?? 'choice'),
    prompt: String(it.prompt ?? ''),
    promptZh: it.prompt_zh ?? undefined,
    choices: choicesRaw.length ? choicesRaw.map((c) => ({ id: c.id, text: c.text })) : undefined,
    answerKey: it.answer ?? null,
    targetWordIds: targetWordIds.length ? targetWordIds : undefined,
  }
}

// ── 抽一个客观题型 ────────────────────────────────────────────────────────────
async function drawTask(
  db: SupabaseClient, taskType: string, level: number, target: number, rnd: () => number,
  usedStimuli: Set<string>, usedWord: Map<string, number>,
): Promise<{ sets: PaperSetRef[]; items: PaperItem[]; short: boolean }> {
  const sets = await fetchActiveSets(db, taskType, level)
  if (!sets.length) return { sets: [], items: [], short: true }

  const grouped = GROUPED_MULTI_ITEM.has(taskType)
  const wholeTask = SINGLE_WHOLE_TASK.has(taskType)
  const needAudio = taskType === 'listening_comprehension'
  const audioUrls = needAudio ? await fetchActiveAudioUrls(db, sets.map((s) => s.stimulus_id).filter((x): x is string => !!x)) : null

  const ordered = seededShuffle(sets, rnd)
  const stimById = await fetchStimuli(db, [...new Set(ordered.map((s) => s.stimulus_id).filter((x): x is string => !!x))])

  const outSets: PaperSetRef[] = []
  const outItems: PaperItem[] = []
  const reached = () => grouped ? outItems.length >= target : wholeTask ? outSets.length >= 1 : outItems.length >= target

  for (const s of ordered) {
    if (reached()) break
    if (s.stimulus_id && usedStimuli.has(s.stimulus_id)) continue                 // 同卷不重复 stimulus
    if (needAudio && (!s.stimulus_id || !audioUrls!.has(s.stimulus_id))) continue // 听力无 active 音频 → 跳过，绝不顶替

    const items = await fetchActiveItems(db, s.id)
    if (!items.length) continue
    const tw = await fetchTargetWords(db, items.map((i) => i.id))

    // 单题型（非整篇/非整任务）：尽量不过度重复 target word
    if (!grouped && !wholeTask) {
      const primary = tw.get(items[0].id)?.[0]
      if (primary && (usedWord.get(primary) ?? 0) >= TARGET_WORD_CAP) continue
    }

    if (s.stimulus_id) usedStimuli.add(s.stimulus_id)
    const stim = s.stimulus_id ? stimById.get(s.stimulus_id) : undefined
    const audioUrl = needAudio && s.stimulus_id ? audioUrls!.get(s.stimulus_id) : undefined
    // 听力：只带 audioUrl（原文=transcript 不前泄）；阅读等：带 textEn 材料（考试必读内容，非 transcript）。
    const stimulus = stim
      ? (needAudio
          ? { kind: stim.kind, title: stim.title ?? undefined, audioUrl }
          : { kind: stim.kind, title: stim.title ?? undefined, textEn: stim.text_en ?? undefined })
      : undefined
    outSets.push({ setId: s.id, taskType, stimulusId: s.stimulus_id ?? undefined, stimulus })
    for (const it of items) {
      const wids = tw.get(it.id) ?? []
      for (const w of wids) usedWord.set(w, (usedWord.get(w) ?? 0) + 1)
      outItems.push(mapItem(it, wids))
      if (grouped && outItems.length >= target) break
    }
  }

  const short = grouped ? outItems.length < target : wholeTask ? outSets.length < 1 : outItems.length < target
  return { sets: outSets, items: outItems, short }
}

// ── 装配一个 section ─────────────────────────────────────────────────────────
async function buildSection(
  db: SupabaseClient, sec: ExamSectionSpec, level: number, mode: GeneratePaperInput['mode'], rnd: () => number,
  usedStimuli: Set<string>, usedWord: Map<string, number>,
): Promise<PaperSection> {
  const base: PaperSection = {
    sectionId: sec.id, labelZh: sec.labelZh, labelEn: sec.labelEn, skill: sec.skill,
    taskType: null, groupMode: sec.groupMode, points: sec.points, scoring: 'objective',
    requiresAudio: sec.requiresAudio, requiresRubric: sec.requiresRubric, subjective: false,
    sets: [], items: [], warnings: [],
  }

  if (isSubjectiveSection(sec)) {
    return { ...base, subjective: true, scoring: 'needs_manual_or_ai_scoring', taskType: sec.taskTypes[0] ?? null, placeholder: { reason: 'needs_manual_or_ai_scoring', taskTypes: sec.taskTypes } }
  }

  const target = targetCount(sec, mode)
  const candidates = sec.taskTypes.filter((t) => isExamTaskType(t) && !isDeprecatedQuestionType(t))
  for (const t of candidates) {
    const drawn = await drawTask(db, t, level, target, rnd, usedStimuli, usedWord)
    if (drawn.items.length) {
      return { ...base, taskType: t, scoring: scoringKindForTask(t), sets: drawn.sets, items: drawn.items, warnings: drawn.short ? ['insufficient_pool'] : [] }
    }
  }
  return { ...base, taskType: candidates[0] ?? sec.taskTypes[0] ?? null, warnings: ['insufficient_pool'] }
}

// ── 入口 ────────────────────────────────────────────────────────────────────
export async function generatePaper(db: SupabaseClient, input: GeneratePaperInput): Promise<{ paper: GeneratedPaper | null; warnings: string[] }> {
  const spec = getExamSpec(input.examId)
  if (!spec) return { paper: null, warnings: ['unknown_exam'] }
  if (!(await v2Available(db))) return { paper: null, warnings: ['v2_not_applied'] }

  let sections = spec.sections
  if (input.mode === 'section') {
    const sec = spec.sections.find((s) => s.id === input.sectionId)
    if (!sec) return { paper: null, warnings: ['unknown_section'] }
    sections = [sec]
  } else if (input.mode === 'mini') {
    sections = spec.sections.filter((s) => !isSubjectiveSection(s))   // mini=仅客观区、各区缩量
    if (!sections.length) return { paper: null, warnings: ['no_objective_sections'] }
  }

  const seed = input.seed?.trim() || `${spec.id}-${input.mode}-${Date.now().toString(36)}`
  const rnd = mulberry32(hashStr(seed))
  const usedStimuli = new Set<string>()
  const usedWord = new Map<string, number>()
  const warnings: string[] = []
  const outSections: PaperSection[] = []
  for (const sec of sections) {
    const built = await buildSection(db, sec, spec.level, input.mode, rnd, usedStimuli, usedWord)
    if (built.warnings.includes('insufficient_pool') && !warnings.includes('insufficient_pool')) warnings.push('insufficient_pool')
    outSections.push(built)
  }

  return {
    paper: {
      examId: spec.id, examLabelZh: spec.labelZh, level: spec.level, mode: input.mode, seed,
      scoringScale: spec.scoringScale, fullScore: spec.fullScore, totalMinutes: spec.totalMinutes,
      sections: outSections, warnings,
    },
    warnings,
  }
}

/** 听力/需音频板块：剥掉 stimulus 文本（即 transcript），仅留 audioUrl 等播放字段。 */
function stripListeningStimulus(set: PaperSetRef): PaperSetRef {
  if (!set.stimulus) return set
  const stim = { ...set.stimulus }
  delete stim.textEn
  return { ...set, stimulus: stim }
}

/** 客户端视图：剥 answerKey；听力（requiresAudio 或 listening_comprehension）再剥 stimulus 原文。 */
export function toClientPaper(paper: GeneratedPaper): GeneratedPaper {
  return {
    ...paper,
    sections: paper.sections.map((s) => {
      const isListening = s.requiresAudio === true || s.taskType === 'listening_comprehension'
      return {
        ...s,
        sets: isListening ? s.sets.map(stripListeningStimulus) : s.sets,
        items: s.items.map((it) => { const rest = { ...it }; delete rest.answerKey; return rest }),
      }
    }),
  }
}
