/* ════════════════════════════════════════════════════════════════════════
   GET /api/exam-specs            → { ok: true, data: ExamSpec[] }（七档全量）
   GET /api/exam-specs?id=cet4    → { ok: true, data: ExamSpec } 或
                                     { ok: false, error: 'unknown_exam' }（HTTP 200）
   只读规格层（Phase 1）：数据来自 lib/exam-specs，不查 DB，不需鉴权。
   ════════════════════════════════════════════════════════════════════════ */
import { NextResponse, type NextRequest } from 'next/server'
import { getExamSpec, listExamSpecs } from '@/lib/exam-specs'

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')?.trim()

  if (id) {
    const spec = getExamSpec(id)
    if (!spec) return NextResponse.json({ ok: false, error: 'unknown_exam' })
    return NextResponse.json({ ok: true, data: spec })
  }

  return NextResponse.json({ ok: true, data: listExamSpecs() })
}
