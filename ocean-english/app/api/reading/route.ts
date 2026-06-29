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
import { levelCefrRank } from '@/lib/levels'

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

const DETAIL_SELECT = 'id,normalized_word,audio_ref,prompt,prompt_zh,choices,answer,explanation_zh,theme_tags'
// 列表内存缓存（按 level），TTL 5 分钟：列表只读轻量 reading_passages，再加缓存近乎秒开
const listCache = new Map<string, { at: number; data: unknown }>()
const LIST_TTL = 5 * 60_000

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

    // ── 列表：只读轻量 reading_passages（无正文，keyWords 已预算）+ 5 分钟缓存 → 秒开 ──
    const cacheKey = level || 'all'
    const cached = listCache.get(cacheKey)
    if (cached && Date.now() - cached.at < LIST_TTL) {
      return NextResponse.json({ ok: true, data: cached.data })
    }
    const lvNum = level ? Number(level) : 0
    // 1) 篇级元数据（id/title/level/minutes/key_words），分页取全量
    type RP = { id: string; title: string | null; title_zh: string | null; level: number | null; minutes: number | null; key_words: string[] | null }
    const passages: RP[] = []
    for (let from = 0; ; from += 1000) {
      let q = db.from('reading_passages').select('id,title,title_zh,level,minutes,key_words').eq('status', 'active').order('id', { ascending: true }).range(from, from + 999)
      if (lvNum) q = q.eq('level', lvNum)
      const { data, error } = await q
      if (error) return NextResponse.json({ ok: false, data: [] }, { status: 200 })
      const part = (data ?? []) as RP[]
      passages.push(...part)
      if (part.length < 1000) break
    }
    // 2) 每篇题数：只取 normalized_word（无正文，轻量）
    const qcount = new Map<string, number>()
    for (let from = 0; ; from += 1000) {
      let q = db.from('question_bank').select('normalized_word').eq('type', 'reading_comprehension').eq('status', 'active').order('id', { ascending: true }).range(from, from + 999)
      if (lvNum) q = q.contains('theme_tags', [`lv${lvNum}`])
      const { data } = await q
      const part = (data ?? []) as { normalized_word: string | null }[]
      for (const r of part) { const pid = String(r.normalized_word ?? ''); if (pid) qcount.set(pid, (qcount.get(pid) ?? 0) + 1) }
      if (part.length < 1000) break
    }
    // 3) 组装；difficulty 用「CEFR 难度 + 生词密度」廉价代理（生词率 = difficulty × (1−已掌握)，前端再算）
    //    难度按 cefrRank（A2..C1）而非 level 号：雅思(L8, B2-C1) 不因 level=8 被谎报为最难，落在六级/托福之间。
    //    线性标定保持旧量纲：rank2(A2)→11、rank4.5(雅思)→66、rank5(C1)→77；level 缺失(0)维持低基线。
    const list = passages.map((p) => {
      const kw = Array.isArray(p.key_words) ? p.key_words : []
      const minutes = p.minutes ?? 1
      const lvl = p.level ?? lvNum
      const rank = lvl >= 1 ? levelCefrRank(lvl) : 0
      const cefrBase = rank ? Math.round((rank - 2) / 3 * 66 + 11) : 0
      const difficulty = Math.min(95, Math.max(8, cefrBase + Math.min(18, Math.round(kw.length / Math.max(1, minutes)))))
      return { id: p.id, title: p.title || '', titleZh: p.title_zh || undefined, level: lvl, minutes, questionCount: qcount.get(p.id) ?? 3, keyWords: kw, keyWordCount: kw.length, difficulty }
    }).filter((x) => x.questionCount > 0)

    listCache.set(cacheKey, { at: Date.now(), data: list })
    return NextResponse.json({ ok: true, data: list })
  } catch {
    return NextResponse.json({ ok: false, data: [] }, { status: 200 })
  }
}
