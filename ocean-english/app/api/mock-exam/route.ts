/* ════════════════════════════════════════════════════════════════════════
   /api/mock-exam?exam=gaokao[&seed=N] — 按真实考试结构装配「模拟卷」
   结构来自 paper-specs（公开题型/题量/分值），题目全部从本项目原创题库抽取，
   不含任何真题版权内容。返回分区的题目（供前端按真卷顺序作答）。
   ════════════════════════════════════════════════════════════════════════ */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPaperSpec, type MockSection } from '@/lib/mock-exam/paper-specs'
import { isDeprecatedQuestionType } from '@/lib/question-bank/question-type-taxonomy'

const SEL = 'id,type,input_mode,word_id,normalized_word,prompt,prompt_zh,choices,answer,answer_text,hint,audio_ref,explanation_zh,exam_tags,theme_tags'
type Row = Record<string, unknown> & { id: string; type: string; normalized_word: string | null }
function mulberry32(seed: number) { return () => { let t = (seed += 0x6D2B79F5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function shuffle<T>(a: T[], r: () => number): T[] { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1));[x[i], x[j]] = [x[j], x[i]] } return x }

type DB = Awaited<ReturnType<typeof createClient>>
// 随机窗口取题：先数总量，再随机偏移取一段 → 每次组卷覆盖全量（含最新题），不再只取最旧
async function fetchType(db: DB, type: string, level: number, cap: number, rnd: () => number): Promise<Row[]> {
  const { count } = await db.from('question_bank').select('*', { count: 'exact', head: true })
    .eq('type', type).eq('status', 'active').eq('is_reviewed', true).contains('theme_tags', [`lv${level}`])
  const total = count ?? 0
  if (!total) return []
  const offset = Math.floor(rnd() * Math.max(1, total - cap + 1))
  const { data } = await db.from('question_bank').select(SEL)
    .eq('type', type).eq('status', 'active').eq('is_reviewed', true).contains('theme_tags', [`lv${level}`])
    .order('id', { ascending: true }).range(offset, offset + Math.max(cap, 1) - 1)
  return (data ?? []) as unknown as Row[]
}

// 选区里第一个「该档有货」的题型，返回 (实际题型, 候选行)
// Phase 0A：退役题型(antonym_choice/cet_cloze)一律跳过，绝不回退到退役题型抽题。
async function pickType(db: DB, sec: MockSection, level: number, rnd: () => number): Promise<{ type: string; rows: Row[] } | null> {
  for (const t of sec.types) {
    if (isDeprecatedQuestionType(t)) continue
    const cap = sec.mode === 'passages' ? (sec.passages ?? 4) * 3 * 8 : Math.max((sec.rows ?? 1) * 8, 60)
    const rows = await fetchType(db, t, level, cap, rnd)
    if (rows.length) return { type: t, rows }
  }
  return null
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const exam = sp.get('exam')?.trim() ?? ''
  const seed = Number(sp.get('seed')) || Math.floor(Math.random() * 1e9)
  const spec = getPaperSpec(exam)
  if (!spec) return NextResponse.json({ ok: false, error: 'unknown_exam' }, { status: 200 })
  const rnd = mulberry32(seed)

  try {
    const db = await createClient()
    const sections = [] as { key: string; label: string; en: string; type: string; points: number; questions: Row[]; note?: string }[]
    for (const sec of spec.sections) {
      const picked = await pickType(db, sec, spec.level, rnd)
      if (!picked) { sections.push({ key: sec.key, label: sec.label, en: sec.en, type: sec.types[0], points: sec.points, questions: [], note: '该档暂无可用题' }); continue }
      let qs: Row[]
      if (sec.mode === 'passages') {
        // 按整篇取：归并到 passage(normalized_word)，随机选 N 篇，含该篇全部题
        const byP = new Map<string, Row[]>()
        for (const r of picked.rows) { const pid = String(r.normalized_word ?? r.id); (byP.get(pid) ?? byP.set(pid, []).get(pid)!).push(r) }
        const chosen = shuffle([...byP.keys()], rnd).slice(0, sec.passages ?? 4)
        qs = chosen.flatMap(pid => byP.get(pid)!)
      } else {
        qs = shuffle(picked.rows, rnd).slice(0, sec.rows ?? 1)
      }
      sections.push({ key: sec.key, label: sec.label, en: sec.en, type: picked.type, points: sec.points, questions: qs, note: picked.type !== sec.types[0] ? `回退题型 ${picked.type}` : sec.note })
    }
    const totalQ = sections.reduce((s, x) => s + x.questions.length, 0)
    return NextResponse.json({
      ok: true,
      data: { exam: spec.exam, zh: spec.zh, cnExam: spec.cnExam, level: spec.level, minutes: spec.minutes,
        objectivePoints: spec.objectivePoints, fullPoints: spec.fullPoints, skipped: spec.skipped, seed, totalQuestions: totalQ, sections },
    })
  } catch {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 200 })
  }
}
