/* ════════════════════════════════════════════════════════════════════════
   review-nuance.ts — 近义辨析「Opus 审高频」清洗（针对 DeepSeek 草稿的污染）
   发现：高频功能词的 WordNet 同义集被化学元素/单位/缩写污染（be→beryllium、
   a→ampere、in→indium、he→helium…）。本脚本做两件安全的清洗：
     ① 纯功能/语法词（冠词/代词/介词/连词/系动词等）整体清空 nuance —— 这些词
        本就不需要「近义辨析」卡。
     ② 删除「明显是生僻科学术语」的成员行（生僻元素/惰性气体/核碱基/单位/旧称），
        这些永远不会是合法的近义成员；只删成员行，不动该词其它合法成员。
   用法：npx tsx scripts/review-nuance.ts [--apply]   （默认 dry-run）
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
const getEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'))
const APPLY = process.argv.includes('--apply')

// ① 纯功能/语法词（无强内容义；不含 have/do/say/make/will/can/may 等有实义同形词）
const FUNCTION_WORDS = [
  'a', 'an', 'the',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
  'this', 'that', 'these', 'those', 'whom', 'whose', 'which',
  'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'themselves',
  'in', 'on', 'at', 'to', 'of', 'for', 'from', 'into', 'onto', 'upon', 'with',
  'and', 'or', 'but', 'nor', 'if', 'than', 'as', 'because', 'although', 'though',
  'whereas', 'unless', 'whether',
  'is', 'am', 'are', 'was', 'were', 'been', 'being', 'be',
]

// ② 生僻科学术语成员黑名单（绝不会是合法近义；刻意排除 lead/tin/gold/iron/copper/
//    zinc/mercury/carbon/oxygen/nitrogen/calcium/sodium 等常用同形词以免误删）
const SCI_GARBAGE = [
  // 惰性气体
  'helium', 'neon', 'argon', 'krypton', 'xenon', 'radon',
  // 生僻金属/类金属
  'beryllium', 'glucinium', 'scandium', 'vanadium', 'manganese', 'gallium', 'germanium',
  'selenium', 'rubidium', 'strontium', 'yttrium', 'zirconium', 'niobium', 'columbium',
  'molybdenum', 'technetium', 'ruthenium', 'rhodium', 'palladium', 'cadmium', 'indium',
  'tellurium', 'cesium', 'caesium', 'barium', 'lanthanum', 'cerium', 'praseodymium',
  'neodymium', 'promethium', 'samarium', 'europium', 'gadolinium', 'terbium', 'dysprosium',
  'holmium', 'erbium', 'thulium', 'ytterbium', 'lutetium', 'hafnium', 'tantalum', 'tungsten',
  'wolfram', 'rhenium', 'osmium', 'iridium', 'thallium', 'bismuth', 'polonium', 'astatine',
  'francium', 'radium', 'actinium', 'thorium', 'protactinium', 'neptunium', 'plutonium',
  'americium', 'curium', 'berkelium', 'californium', 'einsteinium', 'fermium', 'mendelevium',
  'nobelium', 'lawrencium', 'rutherfordium', 'dubnium', 'seaborgium', 'bohrium', 'hassium',
  // 核碱基 / 维生素旧称 / 单位 / 缩写
  'adenine', 'guanine', 'cytosine', 'thymine', 'uracil', 'axerophthol',
  'ampere', 'amp', 'angstrom', 'becquerel', 'sievert', 'candela',
]
const members = [...new Set([...SCI_GARBAGE, ...SCI_GARBAGE.map(m => m[0].toUpperCase() + m.slice(1))])]

async function countIn(col: string, vals: string[]) {
  let total = 0
  for (let i = 0; i < vals.length; i += 100) {
    const { count } = await db.from('dictionary_word_nuance').select('id', { count: 'exact', head: true }).in(col, vals.slice(i, i + 100))
    total += count ?? 0
  }
  return total
}

async function main() {
  console.log(`[review-nuance] ${APPLY ? 'APPLY' : 'dry-run'}`)
  const fwRows = await countIn('word_id', FUNCTION_WORDS)
  const fwWords = await db.from('dictionary_word_nuance').select('word_id').in('word_id', FUNCTION_WORDS)
  const distinctFw = new Set((fwWords.data ?? []).map(r => r.word_id))
  console.log(`① 功能词命中：${distinctFw.size} 个词 / ${fwRows} 行 nuance →`, [...distinctFw].sort().join(' '))

  const sciRows = await countIn('member', members)
  console.log(`② 生僻科学术语成员命中：${sciRows} 行`)

  if (!APPLY) { console.log('\ndry-run，未删除。加 --apply 执行。'); return }

  let del1 = 0
  for (let i = 0; i < FUNCTION_WORDS.length; i += 100) {
    const { error, count } = await db.from('dictionary_word_nuance').delete({ count: 'exact' }).in('word_id', FUNCTION_WORDS.slice(i, i + 100))
    if (error) { console.error('① delete err', error.message); process.exit(1) }
    del1 += count ?? 0
  }
  let del2 = 0
  for (let i = 0; i < members.length; i += 100) {
    const { error, count } = await db.from('dictionary_word_nuance').delete({ count: 'exact' }).in('member', members.slice(i, i + 100))
    if (error) { console.error('② delete err', error.message); process.exit(1) }
    del2 += count ?? 0
  }
  console.log(`已删除：① 功能词 ${del1} 行；② 科学术语成员 ${del2} 行`)
  const { count: remain } = await db.from('dictionary_word_nuance').select('id', { count: 'exact', head: true })
  console.log(`剩余 nuance 行：${remain}`)
}
main()
