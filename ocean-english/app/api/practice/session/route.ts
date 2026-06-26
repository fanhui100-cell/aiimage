/* ════════════════════════════════════════════════════════════════════════
   /api/practice/session — 统一练习会话（Phase 4）
   POST body: BuildPracticeSessionInput
   GET  query: mode/source/examId/sectionId/taskType/word/wordId/level/count/seed（便于 smoke）
   预期空/未就绪 → HTTP 200（source:'empty'）；非法输入 → HTTP 400。
   只读题库；公开可练（无需鉴权）。
   ════════════════════════════════════════════════════════════════════════ */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildPracticeSession } from '@/lib/practice/session-builder'
import type { BuildPracticeSessionInput, PracticeMode, PracticeSource } from '@/lib/practice/session-types'

const MODES: PracticeMode[] = ['word', 'task', 'section', 'paper']
const SOURCES: PracticeSource[] = ['v1', 'v2', 'auto']

function invalid(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 400 })
}

function validate(input: BuildPracticeSessionInput): string | null {
  if (!MODES.includes(input.mode)) return 'invalid_mode'
  if (input.source && !SOURCES.includes(input.source)) return 'invalid_source'
  // level 若提供必须是 1-8 整数（挡 NaN：否则 builder 的 if(level) 跳过过滤→跨等级抽题）
  if (input.level != null && !(Number.isInteger(input.level) && input.level >= 1 && input.level <= 8)) return 'invalid_level'
  // count 若提供必须是正整数
  if (input.count != null && !(Number.isInteger(input.count) && input.count >= 1)) return 'invalid_count'
  if (input.mode === 'word' && !input.word && !input.wordId) return 'missing_word'
  if (input.mode === 'section' && (!input.examId || !input.sectionId)) return 'missing_section'
  if (input.mode === 'paper' && !input.examId) return 'missing_exam'
  if (input.mode === 'task') {
    if (!input.taskType && !input.examId) return 'missing_task'
    // 无 examId 时无法推断等级 → 必须显式 level，否则会跨等级抽题
    if (!input.examId && input.level == null) return 'missing_level'
  }
  return null
}

export async function POST(request: NextRequest) {
  let body: BuildPracticeSessionInput
  try {
    body = (await request.json()) as BuildPracticeSessionInput
  } catch {
    return invalid('invalid_json')
  }
  const err = validate(body)
  if (err) return invalid(err)

  const db = await createClient()
  const result = await buildPracticeSession(db, body)
  return NextResponse.json(result)
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const input: BuildPracticeSessionInput = {
    mode: (sp.get('mode') ?? 'word') as PracticeMode,
    source: (sp.get('source') as PracticeSource | null) ?? undefined,
    examId: sp.get('examId') ?? undefined,
    sectionId: sp.get('sectionId') ?? undefined,
    taskType: sp.get('taskType') ?? undefined,
    word: sp.get('word') ?? undefined,
    wordId: sp.get('wordId') ?? undefined,
    level: sp.get('level') ? Number(sp.get('level')) : undefined,
    count: sp.get('count') ? Number(sp.get('count')) : undefined,
    seed: sp.get('seed') ?? undefined,
  }
  const err = validate(input)
  if (err) return invalid(err)

  const db = await createClient()
  const result = await buildPracticeSession(db, input)
  return NextResponse.json(result)
}
