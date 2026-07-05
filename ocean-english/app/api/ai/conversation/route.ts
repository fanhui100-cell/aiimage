/* ============================================================================
   /api/ai/conversation — AI 口语场景对话（Task 3.2）
   场景化英语陪练：学习者（语音转写或打字）发消息 → AI 简短自然回复 + 一句中文
   反馈（用词/语法）。自包含调用 DeepSeek（DEEPSEEK_API_KEY），不依赖正在重构的
   AI provider 抽象。前端（D8）配 Web Speech 录音 + 朗读。
   POST { scenario?, level?, messages:[{role:'user'|'assistant', content}] }
   → { ok, reply, feedbackZh }
   ============================================================================ */
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit, getClientIP, rateLimitKey } from '@/lib/ai/ai-rate-limit'

export const runtime = 'nodejs'

// P2 fix (cc-full-project-review-2026-07-05): 匿名限流，防止无鉴权环节被循环打爆付费 DeepSeek（其它 AI/评分路由均有）。
const LIMIT = { windowMs: 60_000, max: 20 }
const LV: Record<number, string> = { 1: 'CEFR A2（初中）', 2: 'CEFR B1（高中）', 3: 'CEFR B1-B2（四级）', 4: 'CEFR B2（六级）', 5: 'CEFR B2-C1（考研）', 6: 'CEFR C1（托福）', 7: 'CEFR C1-C2（SAT）' }

interface Msg { role: 'user' | 'assistant'; content: string }

function clean(messages: unknown): Msg[] {
  if (!Array.isArray(messages)) return []
  return messages
    .filter((m): m is Msg => !!m && typeof m === 'object'
      && ((m as Msg).role === 'user' || (m as Msg).role === 'assistant')
      && typeof (m as Msg).content === 'string' && (m as Msg).content.length > 0)
    .map(m => ({ role: m.role, content: m.content.slice(0, 1000) }))
    .slice(-16)
}

export async function POST(req: NextRequest) {
  const key = process.env.DEEPSEEK_API_KEY
  if (!key) return NextResponse.json({ ok: false, error: 'ai_not_configured' }, { status: 503 })
  if (!(await checkRateLimit(rateLimitKey('ai-conversation', getClientIP(req)), LIMIT))) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
  }

  let body: { scenario?: unknown; level?: unknown; messages?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }) }

  const messages = clean(body.messages)
  if (!messages.length) return NextResponse.json({ ok: false, error: 'messages_required' }, { status: 400 })
  const scenario = typeof body.scenario === 'string' && body.scenario.trim() ? body.scenario.trim().slice(0, 120) : '日常自由对话'
  const lvNum = Number(body.level)
  const lv = LV[lvNum] ?? 'CEFR B1'

  const system = `你是英语口语陪练 Lumi。场景：「${scenario}」。请用英语和学习者自然对话，扮演该场景中的对方角色。
要求：
1) 回复简短自然（1-3 句），符合 ${lv} 难度，多抛回一个问题推进对话；
2) 若学习者上一句有明显用词/语法/表达问题，用一句简短中文给出建议，否则反馈留空；
3) 只输出 JSON，无其它文字：{"reply":"你的英文回复","feedbackZh":"中文反馈或空字符串"}`

  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat',
        temperature: 0.8,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: system }, ...messages],
      }),
    })
    if (!res.ok) return NextResponse.json({ ok: false, error: 'provider_error' }, { status: res.status === 429 ? 429 : 502 })
    const j = await res.json() as { choices?: { message?: { content?: string } }[] }
    const raw = (j.choices?.[0]?.message?.content ?? '').trim()
    let reply = raw, feedbackZh = ''
    try {
      const parsed = JSON.parse(raw) as { reply?: string; feedbackZh?: string }
      reply = (parsed.reply ?? '').trim() || raw
      feedbackZh = (parsed.feedbackZh ?? '').trim()
    } catch { /* 非 JSON：直接当回复 */ }
    return NextResponse.json({ ok: true, reply, feedbackZh })
  } catch {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}
