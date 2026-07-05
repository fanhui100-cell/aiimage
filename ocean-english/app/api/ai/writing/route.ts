/* ============================================================================
   /api/ai/writing — AI 造句批改（D16）
   学习者用目标词造句 → AI 像老师一样给中文反馈：评分 + 做得好 + 修改建议 + 润色版。
   自包含调用 DeepSeek（DEEPSEEK_API_KEY），与 /api/ai/conversation 同一模式。
   未配置 key 时返回 503，前端降级到本地启发式批改（仍可用）。
   POST { word, zh?, sentence, level? }
   → { ok, score, title, sub, good:string[], fix:string[], polished }
   ============================================================================ */
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit, getClientIP, rateLimitKey } from '@/lib/ai/ai-rate-limit'

export const runtime = 'nodejs'

// P2 fix (cc-full-project-review-2026-07-05): 匿名限流，防止无鉴权环节被循环打爆付费 DeepSeek（其它 AI/评分路由均有）。
const LIMIT = { windowMs: 60_000, max: 10 }
const LV: Record<number, string> = { 1: 'CEFR A2（初中）', 2: 'CEFR B1（高中）', 3: 'CEFR B1-B2（四级）', 4: 'CEFR B2（六级）', 5: 'CEFR B2-C1（考研）', 6: 'CEFR C1（托福）', 7: 'CEFR C1-C2（SAT）' }

export async function POST(req: NextRequest) {
  const key = process.env.DEEPSEEK_API_KEY
  if (!key) return NextResponse.json({ ok: false, error: 'ai_not_configured' }, { status: 503 })
  if (!(await checkRateLimit(rateLimitKey('ai-writing', getClientIP(req)), LIMIT))) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  }

  let body: { word?: unknown; zh?: unknown; sentence?: unknown; level?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }

  const word = typeof body.word === 'string' ? body.word.trim().slice(0, 60) : ''
  const sentence = typeof body.sentence === 'string' ? body.sentence.trim().slice(0, 600) : ''
  const zh = typeof body.zh === 'string' ? body.zh.trim().slice(0, 120) : ''
  if (!word || !sentence) return NextResponse.json({ ok: false, error: 'word_and_sentence_required' }, { status: 400 })
  const lv = LV[Number(body.level)] ?? 'CEFR B1'

  const system = `你是英语写作老师 Lumi，批改学习者用目标词造的英文句子。难度基准：${lv}。
目标词：「${word}」${zh ? `（${zh}）` : ''}
请客观评分并给出鼓励而具体的中文反馈。只输出 JSON，无其它文字：
{"score": 40-98 的整数, "title":"一句中文总评(≤12字)", "sub":"一句中文补充(≤30字)", "good":["做得好的点，中文，0-2 条"], "fix":["可改进点，中文，1-3 条，具体到词/语法"], "polished":"润色后的英文句子（保留原意，修正语法，自然地道）"}
评分参考：是否用上目标词且语境贴切、语法正确性、句子完整与表达清晰度。`

  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat',
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: `目标词：${word}\n我的句子：${sentence}` },
        ],
      }),
    })
    if (!res.ok) return NextResponse.json({ ok: false, error: 'provider_error' }, { status: res.status === 429 ? 429 : 502 })
    const j = await res.json() as { choices?: { message?: { content?: string } }[] }
    const raw = (j.choices?.[0]?.message?.content ?? '').trim()
    try {
      const p = JSON.parse(raw) as Record<string, unknown>
      const score = Math.max(40, Math.min(98, Math.round(Number(p.score) || 70)))
      const arr = (v: unknown): string[] => Array.isArray(v) ? v.filter(x => typeof x === 'string' && x.trim()).map(x => (x as string).trim()).slice(0, 3) : []
      return NextResponse.json({
        ok: true,
        score,
        title: typeof p.title === 'string' && p.title.trim() ? p.title.trim() : '已批改',
        sub: typeof p.sub === 'string' ? p.sub.trim() : '',
        good: arr(p.good),
        fix: arr(p.fix).length ? arr(p.fix) : ['继续保持，试试更精确的搭配。'],
        polished: typeof p.polished === 'string' && p.polished.trim() ? p.polished.trim() : sentence,
      })
    } catch {
      return NextResponse.json({ ok: false, error: 'parse_error' }, { status: 502 })
    }
  } catch {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}
