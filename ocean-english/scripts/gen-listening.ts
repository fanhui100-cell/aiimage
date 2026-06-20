/* ════════════════════════════════════════════════════════════════════════
   gen-listening.ts — 听短文→选择（P3 · listening_comprehension）
   DeepSeek 写原创短文（按档分级）+ 3 道理解设问；短文存 listening_passages，
   设问存 question_bank（type=listening_comprehension, input_mode=listen,
   audio_ref=短文全文供 TTS 朗读, status=draft → Opus 审 → active）。
   合规：100% 原创短文，非真题。用法：npx tsx scripts/gen-listening.ts <level=3> <count=6> [--apply]
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
const getEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'))
const DS = getEnv('DEEPSEEK_API_KEY')

const LEVEL = Number(process.argv[2] || 3)
const COUNT = Number(process.argv[3] || 6)
const APPLY = process.argv.includes('--apply')
const ACTIVE = process.argv.includes('--active')   // 直接写 active（原创合规练习题）；否则 draft
// belt: 1 初中(中考) 2 高中(高考) 3 四级 4 六级 5 考研 6 托福 7 SAT
const EXAM = ({ 1: '中考', 2: '高考', 3: 'CET-4', 4: 'CET-6', 5: 'KAOYAN', 6: 'TOEFL', 7: 'SAT' } as Record<number, string>)[LEVEL] ?? 'CET-4'
const WORDS = ({ 1: '约 50-70 词', 2: '约 70-90 词', 3: '约 90-110 词', 4: '约 110-130 词', 5: '约 120-150 词', 6: '约 130-160 词', 7: '约 140-170 词' } as Record<number, string>)[LEVEL] ?? '约 110 词'

type Q = { q: string; options: string[]; answer: string; explain_zh: string }
type Passage = { title: string; passage: string; zh: string; questions: Q[] }

// 听力场景池：每次随机选一个注入 → 题材多样、不重复（清晰口语化、便于 TTS 清楚朗读）
const SCENES = [
  '校园通知/广播', '师生对话', '同学间约定计划', '图书馆借阅', '社团招新', '运动会', '旅行与航班', '餐厅点餐',
  '购物退换', '问路指路', '天气预报', '科普小讲座', '博物馆参观', '志愿活动', '求职面试', '租房与搬家',
  '医院/看病', '健康与运动', '环保行动', '音乐会/电影', '电话留言', '失物招领', '家庭日常', '银行/邮局办事',
  '课程安排变动', '讲座问答', '采访片段', '宠物与动物', '科技新品介绍', '节日庆祝', '美食制作', '城市交通',
]
async function gen(n: number, tryN = 0): Promise<Passage[]> {
  const scene = SCENES[Math.floor(Math.random() * SCENES.length)]
  const prompt = `你是 ${EXAM} 听力命题专家。请写 ${n} 篇**全新原创**的英语短文（${WORDS}，难度贴近 ${EXAM}），**本篇场景：${scene}**（用具体新颖的情境，避免与常见范文雷同）。语言要**口语化、自然、发音清晰易懂**（适合朗读成听力材料：句子不过长、用词清楚、避免生僻拗口词与歧义读音）。每篇配 3 道听力理解单选题（主旨/细节/推断各一），全部不得抄袭任何真题。
要求：题目和选项用英文；解析用中文（≤30字）；每题 4 个不重复选项、1 个正确。
只输出 JSON 数组、无其它文字：
[{"title":"...","passage":"完整短文","zh":"短文中文翻译","questions":[{"q":"英文问题","options":["A文本","B文本","C文本","D文本"],"answer":"正确选项的文本","explain_zh":"中文解析"}]}]`
  let res: Response
  try {
    res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST', headers: { Authorization: 'Bearer ' + DS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'deepseek-chat', temperature: 0.85, messages: [{ role: 'user', content: prompt }] }),
    })
  } catch { if (tryN < 2) { await new Promise(r => setTimeout(r, 1200)); return gen(n, tryN + 1) } return [] }
  if (!res.ok) { if (tryN < 2) { await new Promise(r => setTimeout(r, 1200)); return gen(n, tryN + 1) } console.error('  DeepSeek HTTP', res.status); return [] }
  try {
    const j = await res.json() as { choices?: { message?: { content?: string } }[] }
    let txt = (j.choices?.[0]?.message?.content || '').trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim()
    const m = txt.match(/\[[\s\S]*\]/)   // 兜底：抽取最外层数组
    if (m) txt = m[0]
    const arr = JSON.parse(txt) as Passage[]
    return Array.isArray(arr) ? arr.filter(p => p.passage && Array.isArray(p.questions) && p.questions.length) : []
  } catch { if (tryN < 2) { await new Promise(r => setTimeout(r, 1200)); return gen(n, tryN + 1) } return [] }
}

function rng(seed: number) { return () => { let t = (seed += 0x6D2B79F5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
function shuffle<T>(a: T[], r: () => number) { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1));[x[i], x[j]] = [x[j], x[i]] } return x }

function buildRows(p: Passage): { passageRow: Record<string, unknown>; qRows: Record<string, unknown>[] } | null {
  const pid = `lp-${EXAM.toLowerCase().replace('-', '')}-${hash(p.passage).toString(36).slice(0, 8)}`
  const passageRow = { id: pid, title: p.title ?? '', passage_en: p.passage, passage_zh: p.zh ?? '', level: LEVEL, source_type: 'ai_generated_practice' }
  const qRows: Record<string, unknown>[] = []
  p.questions.forEach((qq, k) => {
    const texts = (qq.options ?? []).map(t => String(t).trim().replace(/^\s*[A-Da-d]\s*[.、)）:：]\s*/, ''))  // 去掉烤进选项的字母前缀
    if (texts.length !== 4 || new Set(texts.map(t => t.toLowerCase())).size !== 4) return
    const opts = shuffle(texts, rng(hash(pid + k))).map((t, i) => ({ id: 'abcd'[i], text: t }))
    const ansText = String(qq.answer).trim().replace(/^\s*[A-Da-d]\s*[.、)）:：]\s*/, '')
    const ans = opts.find(o => o.text.toLowerCase() === ansText.toLowerCase())?.id
    if (!ans) return
    qRows.push({
      id: `listening_comprehension-${pid}-q${k}`, type: 'listening_comprehension', input_mode: 'listen',
      source_type: 'ai_generated_practice', source_exam: `LexiOcean-${EXAM.replace('-', '')}-Listening`,
      source_note: `DeepSeek 原创听力短文 · ${EXAM}`,
      normalized_word: pid, difficulty_level: Math.min(Math.max(LEVEL, 1), 5), question_difficulty: 4, bloom_level: 'understand',
      prompt: qq.q, prompt_zh: '听短文，回答下面的问题', choices: opts, answer: ans,
      audio_ref: p.passage, explanation_zh: qq.explain_zh ?? '', exam_tags: [EXAM], theme_tags: [`lv${LEVEL}`],
      skill_tags: ['listening'], status: ACTIVE ? 'active' : 'draft', is_reviewed: ACTIVE, version: 'listen-v2',
    })
  })
  return qRows.length ? { passageRow, qRows } : null
}

async function main() {
  console.log(`[listen] ${EXAM} (lv${LEVEL}) passages=${COUNT} ${APPLY ? (ACTIVE ? 'APPLY+ACTIVE' : 'APPLY(draft)') : 'dry-run'}`)
  if (!DS) { console.error('DEEPSEEK_API_KEY missing'); process.exit(1) }
  let okP = 0, okQ = 0; let sample = ''
  for (let i = 0; i < COUNT; i++) {
    try {
      for (const p of await gen(1)) {
        const built = buildRows(p); if (!built) continue
        if (!sample) sample = `《${p.title}》`
        if (APPLY) {
          await db.from('listening_passages').upsert([built.passageRow], { onConflict: 'id' })
          const { error } = await db.from('question_bank').upsert(built.qRows, { onConflict: 'id' })
          if (error) { console.error('[listen] q upsert err', error.message); continue }
        }
        okP++; okQ += built.qRows.length
      }
    } catch (e) { console.error('[listen] iter err', (e as Error)?.message ?? e) }
    process.stdout.write(`\r[listen] ${APPLY ? '已写' : '可写'} ${okP} 篇 / ${okQ} 题（生成 ${i + 1}/${COUNT}）`)
  }
  console.log(`\n[listen] ${EXAM} ${APPLY ? (ACTIVE ? 'active 上架' : 'draft') : 'dry-run'}：${okP} 篇 / ${okQ} 题　样例 ${sample}`)
  if (!APPLY) console.log('dry-run，未写库。加 --apply。')
}
main().catch(e => { console.error('[listen] fatal', e?.message ?? e); process.exit(1) })
