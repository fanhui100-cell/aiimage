/* ════════════════════════════════════════════════════════════════════════
   gen-reading.ts — 读短文→选择（reading_comprehension）· 与 gen-listening 平行
   DeepSeek 写**全新原创**分级短文 + 3 道阅读理解单选题（主旨/细节/推断）。
   短文存进 question_bank.audio_ref（试炼/练习按屏显文本渲染，不走 TTS）。
   合规：100% 原创，非真题。默认 status='draft'；加 --active 直接转 active。
   用法：npx tsx scripts/gen-reading.ts <level=3> <count=8> [--apply] [--active]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
const getEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'))
const DS = getEnv('DEEPSEEK_API_KEY')

const LEVEL = Number(process.argv[2] || 3)
const COUNT = Number(process.argv[3] || 8)
const APPLY = process.argv.includes('--apply')
const ACTIVE = process.argv.includes('--active')
// belt: 1 初中(中考) 2 高中(高考) 3 四级 4 六级 5 考研 6 托福 7 SAT
const EXAM = ({ 1: '中考', 2: '高考', 3: 'CET-4', 4: 'CET-6', 5: 'KAOYAN', 6: 'TOEFL', 7: 'SAT' } as Record<number, string>)[LEVEL] ?? 'CET-4'
const WORDS = ({ 1: '约 80-120 词', 2: '约 120-160 词', 3: '约 180-220 词', 4: '约 220-260 词', 5: '约 250-300 词', 6: '约 280-340 词', 7: '约 320-400 词' } as Record<number, string>)[LEVEL] ?? '约 200 词'

type Q = { q: string; options: string[]; answer: string; explain_zh: string }
type Passage = { title: string; title_zh?: string; passage: string; zh: string; questions: Q[] }

// 话题池：每次随机选一个注入提示词 → 强制多样化，降低重复（内容 hash 去重导致的低产出）
const TOPICS = [
  '人工智能与日常生活', '海洋生态与保护', '太空探索', '心理健康与情绪', '城市化与交通', '可再生能源',
  '考古发现与古文明', '饮食文化与营养', '语言与大脑', '气候变化', '运动科学', '睡眠与健康',
  '社交媒体的影响', '远程工作', '生物多样性', '艺术与创造力', '志愿服务与社区', '教育创新',
  '消费主义与极简', '动物行为', '水资源', '建筑与设计', '音乐与情感', '电影与叙事',
  '机器人与自动化', '基因与遗传', '天气与自然灾害', '历史人物', '旅行与跨文化', '时间管理',
  '森林与树木', '昆虫世界', '货币与经济', '疫苗与公共卫生', '材料科学', '光与色彩',
  '记忆与学习方法', '友谊与人际', '冒险与探险家', '微生物', '可持续时尚', '城市绿化',
]

async function gen(n: number, tryN = 0): Promise<Passage[]> {
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)]
  const prompt = `你是 ${EXAM} 阅读命题专家。请写 ${n} 篇**全新原创**的英语短文（${WORDS}，难度/题材贴近 ${EXAM}），**本篇主题聚焦：${topic}**（用一个新颖具体的角度，不要泛泛而谈），每篇配 3 道阅读理解单选题（主旨大意 / 细节理解 / 推断 各一），全部不得抄袭任何真题。
要求：题目和选项用英文；解析用中文（≤30字）；每题 4 个不重复选项、仅 1 个正确；正确答案文本须与某个选项完全一致。
只输出 JSON 数组、无其它文字：
[{"title":"英文标题","title_zh":"中文标题","passage":"完整短文","zh":"短文中文翻译","questions":[{"q":"英文问题","options":["A文本","B文本","C文本","D文本"],"answer":"正确选项的文本","explain_zh":"中文解析"}]}]`
  let res: Response
  try {
    res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST', headers: { Authorization: 'Bearer ' + DS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.85, messages: [{ role: 'user', content: prompt }] }),
    })
  } catch { if (tryN < 2) { await new Promise(r => setTimeout(r, 1200)); return gen(n, tryN + 1) } return [] }
  if (!res.ok) { if (tryN < 2) { await new Promise(r => setTimeout(r, 1200)); return gen(n, tryN + 1) } console.error('  DeepSeek HTTP', res.status); return [] }
  // res.json() / JSON.parse 都可能因截断或非 JSON 响应抛错 → 整体兜 try（之前未兜，会崩整个任务）
  try {
    const j = await res.json() as { choices?: { message?: { content?: string } }[] }
    let txt = (j.choices?.[0]?.message?.content || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim()
    const m = txt.match(/\[[\s\S]*\]/)
    if (m) txt = m[0]
    const arr = JSON.parse(txt) as Passage[]
    return Array.isArray(arr) ? arr.filter(p => p.passage && Array.isArray(p.questions) && p.questions.length) : []
  } catch { if (tryN < 2) { await new Promise(r => setTimeout(r, 1200)); return gen(n, tryN + 1) } return [] }
}

function rng(seed: number) { return () => { let t = (seed += 0x6D2B79F5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
function shuffle<T>(a: T[], r: () => number) { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1));[x[i], x[j]] = [x[j], x[i]] } return x }

// 把一篇 Passage 转成 (passageRow, qRows)；选项校验不过的题丢弃
function buildRows(p: Passage): { passageRow: Record<string, unknown>; qRows: Record<string, unknown>[] } | null {
  const pid = `rp-${EXAM.toLowerCase().replace('-', '')}-${hash(p.passage).toString(36).slice(0, 8)}`
  const passageRow = {
    id: pid, title: p.title ?? null, title_zh: p.title_zh ?? null,
    passage_en: p.passage, passage_zh: p.zh ?? null,
    level: LEVEL, exam_tags: [EXAM],
    minutes: Math.max(1, Math.round(p.passage.split(/\s+/).length / 200)),
    source_type: 'ai_generated_practice', status: ACTIVE ? 'active' : 'draft',
  }
  const qRows: Record<string, unknown>[] = []
  p.questions.forEach((qq, k) => {
    const texts = (qq.options ?? []).map(t => String(t).trim())
    if (texts.length !== 4 || new Set(texts.map(t => t.toLowerCase())).size !== 4) return
    const r = rng(hash(pid + k))
    const opts = shuffle(texts, r).map((t, i) => ({ id: 'abcd'[i], text: t }))
    const ans = opts.find(o => o.text.toLowerCase() === String(qq.answer).trim().toLowerCase())?.id
    if (!ans) return
    qRows.push({
      id: `reading_comprehension-${pid}-q${k}`, type: 'reading_comprehension', input_mode: 'choice',
      source_type: 'ai_generated_practice', source_exam: `LexiOcean-${EXAM.replace('-', '')}-Reading`,
      source_note: `DeepSeek 原创阅读短文 · ${EXAM}`,
      normalized_word: pid, difficulty_level: Math.min(Math.max(LEVEL, 1), 5), question_difficulty: 4, bloom_level: 'understand',
      prompt: qq.q, prompt_zh: '阅读短文，回答下面的问题', choices: opts, answer: ans,
      audio_ref: p.passage, explanation_zh: qq.explain_zh ?? '', exam_tags: [EXAM], theme_tags: [`lv${LEVEL}`],
      skill_tags: ['reading'], status: ACTIVE ? 'active' : 'draft', is_reviewed: ACTIVE, version: 'read-v1',
    })
  })
  return qRows.length ? { passageRow, qRows } : null
}

async function main() {
  console.log(`[read] ${EXAM} (lv${LEVEL}) passages=${COUNT} ${APPLY ? (ACTIVE ? 'APPLY+ACTIVE' : 'APPLY(draft)') : 'dry-run'}`)
  if (!DS) { console.error('DEEPSEEK_API_KEY missing'); process.exit(1) }
  let okP = 0, okQ = 0; let sample = ''
  // 逐篇生成→即时写库（避免中断丢全部；upsert 按内容 hash 幂等）
  for (let i = 0; i < COUNT; i++) {
    try {
      const got = await gen(1)
      for (const p of got) {
        const built = buildRows(p); if (!built) continue
        if (!sample) sample = `《${p.title}》(${p.passage.split(/\s+/).length}词)`
        if (APPLY) {
          const { error: e1 } = await db.from('reading_passages').upsert([built.passageRow], { onConflict: 'id' })
          if (e1) { console.error('[read] passage upsert err', e1.message); continue }
          const { error: e2 } = await db.from('question_bank').upsert(built.qRows, { onConflict: 'id' })
          if (e2) { console.error('[read] q upsert err', e2.message); continue }
        }
        okP++; okQ += built.qRows.length
      }
    } catch (e) { console.error('[read] iter err', (e as Error)?.message ?? e) }   // 单次失败不崩整任务
    process.stdout.write(`\r[read] ${APPLY ? '已写' : '可写'} ${okP} 篇 / ${okQ} 题（生成 ${i + 1}/${COUNT}）`)
  }
  console.log(`\n[read] ${EXAM} ${APPLY ? (ACTIVE ? 'active 上架' : 'draft 待审') : 'dry-run'}：${okP} 篇 / ${okQ} 题　样例 ${sample}`)
  if (!APPLY) console.log('dry-run，未写库。加 --apply（再加 --active 直接上架）。')
}
main().catch(e => { console.error('[read] fatal', e?.message ?? e); process.exit(1) })
