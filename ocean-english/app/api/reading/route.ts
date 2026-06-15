/* ============================================================================
   /api/reading — 阅读板块数据源（Task 1.1）
   读 question_bank 里 type='reading_comprehension' 的原创短文+理解题：
     · GET ?level=N        → ReadingListItem[]（按 normalized_word 聚合成「篇」）
     · GET ?id=<passageId> → ReadingDetail（单篇正文 + 可点词 + 理解题）
   短文存在 question_bank.audio_ref，passageId = normalized_word（同篇共享）。
   keyWords = 短文实词 ∩ dictionary_words（前端高亮可点查词）。
   合规：全部为 LexiOcean 原创/AI 生成短文，非真题原文。
   ============================================================================ */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ReadingRow {
  id: string
  normalized_word: string | null
  audio_ref: string | null
  prompt: string | null
  prompt_zh: string | null
  choices: { id: string; text: string }[] | null
  answer: string | null
  explanation_zh: string | null
  theme_tags: string[] | null
}

const LIST_SELECT = 'normalized_word,audio_ref,theme_tags'
const DETAIL_SELECT = 'id,normalized_word,audio_ref,prompt,prompt_zh,choices,answer,explanation_zh,theme_tags'

// 常见功能词/高频词不作为可点生词（keyWords）
const STOP = new Set([
  'the', 'and', 'that', 'this', 'these', 'those', 'with', 'from', 'they', 'them', 'their', 'there',
  'have', 'has', 'had', 'will', 'would', 'could', 'should', 'about', 'which', 'what', 'when', 'where',
  'while', 'than', 'then', 'into', 'over', 'under', 'such', 'some', 'many', 'more', 'most', 'much',
  'also', 'been', 'being', 'were', 'was', 'are', 'because', 'however', 'their', 'your', 'you', 'his',
  'her', 'its', 'our', 'who', 'whom', 'whose', 'not', 'but', 'for', 'are',
])

function levelOf(themeTags: unknown): number {
  if (!Array.isArray(themeTags)) return 0
  for (const t of themeTags) {
    const m = /^lv(\d)/.exec(String(t))
    if (m) return Number(m[1])
  }
  return 0
}

function wordCount(text: string): number {
  return (text.trim().match(/\S+/g) ?? []).length
}

function deriveTitle(passage: string): string {
  const first = passage.trim().split(/(?<=[.?!])\s/)[0] ?? passage.trim()
  return first.length > 64 ? `${first.slice(0, 61).trimEnd()}…` : (first || 'Reading Passage')
}

// 短文实词候选（小写、≥4 字母、去停用词），上限 80，供与词典求交
function candidateTokens(passage: string): string[] {
  const set = new Set<string>()
  for (const m of passage.toLowerCase().matchAll(/[a-z][a-z'-]{2,}/g)) {
    const w = m[0].replace(/^['-]+|['-]+$/g, '')
    if (w.length >= 4 && !STOP.has(w)) set.add(w)
  }
  return [...set].slice(0, 80)
}

// 去掉选项文本里被烤进去的字母前缀（如 "D. xxx" / "A) xxx"）
function cleanChoiceText(text: string): string {
  return text.replace(/^[A-Da-d][.)、]\s*/, '').trim()
}

// 分批查 dictionary_words，返回命中词 id → frequency_rank（PostgREST in() 限长，按 200 分批）
async function dictFreq(
  db: Awaited<ReturnType<typeof createClient>>,
  tokens: string[],
): Promise<Map<string, number | null>> {
  const m = new Map<string, number | null>()
  for (let i = 0; i < tokens.length; i += 200) {
    const chunk = tokens.slice(i, i + 200)
    if (!chunk.length) continue
    const { data } = await db.from('dictionary_words').select('id,frequency_rank').in('id', chunk)
    for (const r of (data ?? []) as { id: string; frequency_rank: number | null }[]) m.set(r.id, r.frequency_rank)
  }
  return m
}

async function buildDetail(db: Awaited<ReturnType<typeof createClient>>, id: string) {
  const { data, error } = await db
    .from('question_bank')
    .select(DETAIL_SELECT)
    .eq('type', 'reading_comprehension')
    .eq('status', 'active')
    .eq('normalized_word', id)
  if (error) return null
  const rows = (data ?? []) as unknown as ReadingRow[]
  if (!rows.length) return null

  const passage = String(rows[0].audio_ref ?? '')
  const level = levelOf(rows[0].theme_tags)

  const toks = candidateTokens(passage)
  let keyWords: string[] = []
  if (toks.length) {
    const { data: dict } = await db.from('dictionary_words').select('id').in('id', toks)
    keyWords = ((dict ?? []) as { id: string }[]).map((r) => r.id)
  }

  const questions = rows
    .map((r) => ({
      id: r.id,
      prompt: r.prompt ?? '',
      promptZh: r.prompt_zh ?? undefined,
      choices: (Array.isArray(r.choices) ? r.choices : [])
        .filter((c) => c && c.id && c.text)
        .map((c) => ({ id: c.id, text: cleanChoiceText(c.text) })),
      answer: r.answer ?? '',
      explanationZh: r.explanation_zh ?? undefined,
    }))
    .filter((q) => q.choices.length >= 2 && q.answer)

  // reading_passages 富化覆盖（有真标题/中文标题/中文翻译/精选 keyWords 时优先；表缺失则静默回退）
  const { data: rp } = await db.from('reading_passages')
    .select('title,title_zh,passage_zh,key_words,minutes').eq('id', id).maybeSingle()
  const p = rp as { title?: string; title_zh?: string; passage_zh?: string; key_words?: string[]; minutes?: number } | null

  return {
    id,
    title: p?.title || deriveTitle(passage),
    titleZh: p?.title_zh || undefined,
    level,
    minutes: p?.minutes ?? Math.max(1, Math.round(wordCount(passage) / 200)),
    paragraphs: passage.split(/\n\n+/).map((s) => s.trim()).filter(Boolean),
    passageZh: p?.passage_zh || undefined,
    keyWords: p?.key_words?.length ? p.key_words : keyWords,
    questions,
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const id = sp.get('id')?.trim()
  const level = sp.get('level')?.trim()

  try {
    const db = await createClient()

    if (id) {
      const detail = await buildDetail(db, id)
      if (!detail) return NextResponse.json({ ok: false, data: null }, { status: 200 })
      return NextResponse.json({ ok: true, data: detail })
    }

    let q = db
      .from('question_bank')
      .select(LIST_SELECT)
      .eq('type', 'reading_comprehension')
      .eq('status', 'active')
    if (level) q = q.contains('theme_tags', [`lv${level}`])

    const { data, error } = await q.limit(3000)
    if (error) return NextResponse.json({ ok: false, data: [] }, { status: 200 })

    const rows = (data ?? []) as unknown as ReadingRow[]
    const byPassage = new Map<string, { audio: string; level: number; count: number }>()
    for (const r of rows) {
      const pid = String(r.normalized_word ?? '')
      if (!pid) continue
      const cur = byPassage.get(pid)
      if (cur) cur.count += 1
      else byPassage.set(pid, { audio: String(r.audio_ref ?? ''), level: levelOf(r.theme_tags), count: 1 })
    }

    const ids = [...byPassage.keys()]
    const rpMap = new Map<string, { title?: string; title_zh?: string; minutes?: number }>()
    if (ids.length) {
      const { data: rps } = await db.from('reading_passages').select('id,title,title_zh,minutes').in('id', ids)
      for (const r of (rps ?? []) as { id: string; title?: string; title_zh?: string; minutes?: number }[]) rpMap.set(r.id, r)
    }

    // 每篇 keyWords（实词 ∩ 词典）：跨篇收 token → 分批查词典 → 回填，前端据此算生词率
    const perPassageTokens = new Map<string, string[]>()
    const allTokens = new Set<string>()
    for (const [pid, v] of byPassage) {
      const toks = candidateTokens(v.audio)
      perPassageTokens.set(pid, toks)
      for (const t of toks) allTokens.add(t)
    }
    const freqMap = await dictFreq(db, [...allTokens])
    const RARE = 4000   // 词频排名 > 此值（或无频）视为偏难/可能生词 → 拉开各篇生词率
    const list = [...byPassage.entries()].map(([pid, v]) => {
      const rp = rpMap.get(pid)
      const keyWords = (perPassageTokens.get(pid) ?? []).filter((t) => freqMap.has(t))
      const rare = keyWords.filter((k) => { const f = freqMap.get(k); return f == null || f > RARE }).length
      const difficulty = keyWords.length ? Math.round(rare / keyWords.length * 100) : 0
      return {
        id: pid,
        title: rp?.title || deriveTitle(v.audio),
        titleZh: rp?.title_zh || undefined,
        level: v.level,
        minutes: rp?.minutes ?? Math.max(1, Math.round(wordCount(v.audio) / 200)),
        questionCount: v.count,
        keyWords,
        keyWordCount: keyWords.length,
        difficulty,
      }
    })

    return NextResponse.json({ ok: true, data: list })
  } catch {
    return NextResponse.json({ ok: false, data: [] }, { status: 200 })
  }
}
