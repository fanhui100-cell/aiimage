/* ════════════════════════════════════════════════════════════════════════
   gen-questions.ts — 规则层题库生成（A 通用题型，免费、无 AI、可重复跑）
   从富化好的 dictionary_words（按 7 档 primary_level）批量产 MCQ + 打字题，
   写入 question_bank（status='active'，source_type='original_curated'）。
   合规：100% 由我们自有词库规则生成，不含任何盗版真题原文。
   用法：  npx tsx scripts/gen-questions.ts <level=1> [--dry]
   幂等：  id = `${type}-${wordId}`，upsert(onConflict:id) 重复跑覆盖不重复。
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
const getEnv = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() ?? ''
const db = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'))

const LEVEL = Number(process.argv[2] || 1)
const DRY = process.argv.includes('--dry')

const FORM_LABEL: Record<string, string> = {
  past: '过去式', pp: '过去分词', ing: '现在分词', third: '三单',
  plural: '复数', comparative: '比较级', superlative: '最高级',
}

type Row = {
  id: string
  word: string
  part_of_speech: string | null
  phonetic_ipa: string | null
  primary_level: number | null
  inflections: Record<string, string> | null
  dictionary_definitions: { definition_zh: string | null; part_of_speech: string | null; order_index: number }[]
  dictionary_examples: { sentence_en: string | null; sentence_zh: string | null; order_index: number }[]
  dictionary_synonyms: { synonym: string | null; order_index: number }[]
  dictionary_antonyms: { antonym: string | null; order_index: number }[]
}
type QRow = Record<string, unknown>

// 清洗中文释义：去掉词形变化方括号 [beat-beaten]、词性前缀，避免英文答案泄漏进中文题面
const cleanZh = (s: string) => (s ?? '').replace(/\[[^\]]*\]/g, ' ').replace(/^\s*[a-zA-Z]{1,5}\.\s*/, '').replace(/\s+/g, ' ').trim()
const zhOf = (w: Row) => {
  const d = [...(w.dictionary_definitions ?? [])].sort((a, b) => a.order_index - b.order_index)[0]
  return cleanZh(d?.definition_zh ?? '')
}
// 答案泄漏判定：英文答案词（≥3）以整词形式出现在中文题面
const leaksWord = (promptZh: string, word: string) => word.length >= 3 && new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(promptZh)
const exOf = (w: Row) => {
  const e = [...(w.dictionary_examples ?? [])].sort((a, b) => a.order_index - b.order_index)[0]
  return { en: (e?.sentence_en ?? '').trim(), zh: (e?.sentence_zh ?? '').trim() }
}
const posOf = (w: Row) => (w.part_of_speech || w.dictionary_definitions?.[0]?.part_of_speech || '').trim()
const ipaOf = (w: Row) => {
  const p = (w.phonetic_ipa ?? '').trim()
  return p ? (/^\/.*\/$/.test(p) ? p : `/${p.replace(/^\/|\/$/g, '')}/`) : ''
}
const explZh = (w: Row) => {
  const pos = posOf(w).replace(/\.+$/, '')
  return [pos && `${pos}.`, zhOf(w)].filter(Boolean).join(' ')
}
const spellHint = (word: string) => {
  const w = word.toLowerCase()
  if (w.length <= 1) return w
  const mid = Array(Math.max(0, w.length - 2)).fill('_').join(' ')
  return [w[0], mid, w[w.length - 1]].filter(Boolean).join(' ')
}
const escapeRe = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const clozeBlank = (sentence: string, word: string) => {
  if (!sentence) return ''
  const r = sentence.replace(new RegExp(`\\b${escapeRe(word)}(s|es|ed|ing|d)?\\b`, 'i'), '[BLANK]')
  return r === sentence ? '' : r
}
function rng(seed: number) { return () => { let t = (seed += 0x6D2B79F5); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
function pick<T>(arr: T[], n: number, r: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a.slice(0, n)
}
function choices(items: { text: string; wid: string }[], targetId: string, r: () => number) {
  const sh = pick(items, items.length, r).slice(0, 4)
  const opts = sh.map((o, i) => ({ id: 'abcd'[i], text: o.text, wid: o.wid }))
  const answer = opts.find(o => o.wid === targetId)?.id ?? 'a'
  return { choices: opts.map(o => ({ id: o.id, text: o.text })), answer }
}
const synsOf = (w: Row): string[] => {
  const seen = new Set<string>()
  const out: string[] = []
  for (const s of [...(w.dictionary_synonyms ?? [])].sort((a, b) => a.order_index - b.order_index)) {
    const t = (s.synonym ?? '').trim()
    const k = t.toLowerCase(); const wl = w.word.toLowerCase()
    // 排除自身/与词互为子串（如 inconsistent↔consistent）—— 否则答案泄漏/不成立
    if (t && /^[a-zA-Z][a-zA-Z'\- ]*$/.test(t) && k !== wl && !k.includes(wl) && !wl.includes(k) && !seen.has(k)) { seen.add(k); out.push(t) }
  }
  return out
}
// antsOf 已随 antonym_choice 退役移除（Phase 11）。
function lev(a: string, b: string): number {
  const m = a.length, n = b.length
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)])
  for (let j = 0; j <= n; j++) d[0][j] = j
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[m][n]
}

async function main() {
  console.log(`[gen] level=${LEVEL} ${DRY ? '(dry-run)' : ''}`)
  // 多表 join（defs+examples+synonyms）在大档会触发 8s statement timeout：
  // 拆成 base + 各一表的轻量分页，分别拉取后按 id 合并。
  const PAGE = 500
  // 键集分页（cursor on id），避免大档高 offset 跳行导致 statement timeout
  async function fetchAll<T extends { id: string }>(selStr: string): Promise<T[]> {
    const acc: T[] = []
    let cursor = ''
    for (;;) {
      let res
      for (let tryN = 0; tryN < 3; tryN++) {
        let q = db.from('dictionary_words').select(selStr)
          .eq('primary_level', LEVEL).order('id', { ascending: true }).limit(PAGE)
        if (cursor) q = q.gt('id', cursor)
        res = await q
        if (!res.error) break
        if (tryN === 2) { console.error(res.error); process.exit(1) }
        await new Promise(r => setTimeout(r, 1000))
      }
      const pg = (res!.data ?? []) as unknown as T[]
      acc.push(...pg)
      if (pg.length < PAGE) break
      cursor = pg[pg.length - 1].id
    }
    return acc
  }
  type Base = { id: string; word: string; part_of_speech: string | null; phonetic_ipa: string | null; primary_level: number | null; inflections: Record<string, string> | null }
  type Nest<K extends string, V> = { id: string } & Record<K, V[]>
  const baseRows = await fetchAll<Base>('id, word, part_of_speech, phonetic_ipa, primary_level, inflections')
  const defMap = new Map<string, Row['dictionary_definitions']>()
  for (const p of await fetchAll<Nest<'dictionary_definitions', Row['dictionary_definitions'][number]>>('id, dictionary_definitions(definition_zh, part_of_speech, order_index)')) defMap.set(p.id, p.dictionary_definitions ?? [])
  const exMap = new Map<string, Row['dictionary_examples']>()
  for (const p of await fetchAll<Nest<'dictionary_examples', Row['dictionary_examples'][number]>>('id, dictionary_examples(sentence_en, sentence_zh, order_index)')) exMap.set(p.id, p.dictionary_examples ?? [])
  const synMap = new Map<string, Row['dictionary_synonyms']>()
  for (const p of await fetchAll<Nest<'dictionary_synonyms', Row['dictionary_synonyms'][number]>>('id, dictionary_synonyms(synonym, order_index)')) synMap.set(p.id, p.dictionary_synonyms ?? [])
  const antMap = new Map<string, Row['dictionary_antonyms']>()
  for (const p of await fetchAll<Nest<'dictionary_antonyms', Row['dictionary_antonyms'][number]>>('id, dictionary_antonyms(antonym, order_index)')) antMap.set(p.id, p.dictionary_antonyms ?? [])
  const rows: Row[] = baseRows.map(b => ({
    ...b,
    dictionary_definitions: defMap.get(b.id) ?? [],
    dictionary_examples: exMap.get(b.id) ?? [],
    dictionary_synonyms: synMap.get(b.id) ?? [],
    dictionary_antonyms: antMap.get(b.id) ?? [],
  }))
  const usable = rows.filter(w => w.word && zhOf(w))
  console.log(`[gen] fetched ${rows.length}, usable(zh) ${usable.length}`)

  // 干扰项池：英文词 + 中文释义（按词性分桶）
  const byId = new Map(usable.map(w => [w.id, w]))
  const enPool = usable.map(w => ({ text: w.word, wid: w.id, pos: posOf(w) }))
  const zhPool = usable.map(w => ({ text: zhOf(w), wid: w.id, pos: posOf(w) }))
  const samePos = <T extends { wid: string; pos: string }>(pool: T[], w: Row) => {
    const p = posOf(w)
    const same = pool.filter(x => x.wid !== w.id && x.pos === p)
    return same.length >= 3 ? same : pool.filter(x => x.wid !== w.id)
  }

  // 形近索引（confusable_choice 用）：首字母分桶，桶内 |len差|≤1 且编辑距离∈[1,2]
  const firstBucket = new Map<string, Row[]>()
  for (const w of usable) { const k = w.word[0].toLowerCase(); (firstBucket.get(k) ?? firstBucket.set(k, []).get(k)!).push(w) }
  const confusables = new Map<string, Row[]>()
  for (const w of usable) {
    if (w.word.length < 3) continue
    const wl = w.word.toLowerCase()
    const near: Row[] = []
    for (const x of firstBucket.get(wl[0]) ?? []) {
      if (x.id === w.id || Math.abs(x.word.length - w.word.length) > 1) continue
      const d = lev(wl, x.word.toLowerCase())
      if (d >= 1 && d <= 2) { near.push(x); if (near.length >= 8) break }
    }
    if (near.length) confusables.set(w.id, near)
  }

  const out: QRow[] = []
  const base = (w: Row, type: string) => ({
    id: `${type}-${w.id}`, type, word_id: w.id, normalized_word: w.word.toLowerCase(),
    difficulty_level: Math.min(Math.max(LEVEL, 1), 5),
    source_type: 'original_curated', status: 'active', is_reviewed: true,
    version: 'rule-v1', theme_tags: [`lv${LEVEL}`], explanation_zh: explZh(w),
  })

  for (const w of usable) {
    const r = rng(hash(w.id))
    const zh = zhOf(w), ex = exOf(w), ipa = ipaOf(w)

    // en_to_zh（英→中，选中文释义）
    {
      const ds = pick(samePos(zhPool, w).filter(x => x.text && x.text !== zh), 3, r)
      if (ds.length === 3) {
        const { choices: ch, answer } = choices([{ text: zh, wid: w.id }, ...ds.map(d => ({ text: d.text, wid: d.wid }))], w.id, r)
        out.push({ ...base(w, 'en_to_zh'), input_mode: 'choice', bloom_level: 'remember', prompt: w.word, prompt_zh: null, choices: ch, answer, hint: { ipa } })
      }
    }
    // zh_to_en（中→英，选英文单词）—— 中文题面含英文答案词则跳过（防泄漏）
    if (!leaksWord(zh, w.word)) {
      const ds = pick(samePos(enPool, w).filter(x => x.text.toLowerCase() !== w.word.toLowerCase()), 3, r)
      if (ds.length === 3) {
        const { choices: ch, answer } = choices([{ text: w.word, wid: w.id }, ...ds.map(d => ({ text: d.text, wid: d.wid }))], w.id, r)
        out.push({ ...base(w, 'zh_to_en'), input_mode: 'choice', bloom_level: 'remember', prompt: zh, prompt_zh: zh, choices: ch, answer })
      }
    }
    // def_to_word（释义选词）—— 同上防泄漏
    if (!leaksWord(zh, w.word)) {
      const ds = pick(samePos(enPool, w).filter(x => x.text.toLowerCase() !== w.word.toLowerCase()), 3, r)
      if (ds.length === 3) {
        const { choices: ch, answer } = choices([{ text: w.word, wid: w.id }, ...ds.map(d => ({ text: d.text, wid: d.wid }))], w.id, r)
        out.push({ ...base(w, 'def_to_word'), input_mode: 'choice', bloom_level: 'understand', prompt: zh, prompt_zh: null, choices: ch, answer })
      }
    }
    // zh_to_word_spell（中→敲英文）
    if (/^[a-zA-Z][a-zA-Z'-]*$/.test(w.word) && w.word.length >= 2) {
      out.push({ ...base(w, 'zh_to_word_spell'), input_mode: 'spell', bloom_level: 'remember', prompt: zh, prompt_zh: zh, answer_text: w.word.toLowerCase(), hint: { initials: spellHint(w.word), ipa } })
    }
    // cloze_choice（例句填空，选词）
    {
      const blanked = ex.en ? clozeBlank(ex.en, w.word) : ''
      const ds = pick(samePos(enPool, w).filter(x => x.text.toLowerCase() !== w.word.toLowerCase()), 3, r)
      if (blanked && ds.length === 3) {
        const { choices: ch, answer } = choices([{ text: w.word, wid: w.id }, ...ds.map(d => ({ text: d.text, wid: d.wid }))], w.id, r)
        out.push({ ...base(w, 'cloze_choice'), input_mode: 'choice', bloom_level: 'apply', prompt: blanked, prompt_zh: ex.zh || null, choices: ch, answer, explanation_zh: ex.zh || explZh(w) })
      }
    }
    // word_form（词形填空：选一个存在的变化形）
    if (w.inflections && typeof w.inflections === 'object') {
      const forms = Object.entries(FORM_LABEL).filter(([k]) => w.inflections?.[k])
      if (forms.length) {
        const [k, label] = forms[Math.floor(r() * forms.length)]
        const form = w.inflections[k]
        out.push({ ...base(w, 'word_form'), input_mode: 'spell', bloom_level: 'apply', prompt: `${w.word} 的${label}`, prompt_zh: `${zh} — ${label}`, answer_text: String(form).toLowerCase(), hint: { ipa } })
      }
    }
    // synonym_choice（近义词选择：选与该词同义的词，干扰=非近义同档词）
    {
      const syns = synsOf(w)
      if (syns.length) {
        const correct = syns[0]
        const block = new Set([w.word.toLowerCase(), ...syns.map(s => s.toLowerCase())])
        const ds = pick(samePos(enPool, w).filter(x => !block.has(x.text.toLowerCase())), 3, r)
        if (ds.length === 3) {
          const opts = pick([{ text: correct }, ...ds.map(d => ({ text: d.text }))], 4, r).map((o, i) => ({ id: 'abcd'[i], text: o.text }))
          const answer = opts.find(o => o.text.toLowerCase() === correct.toLowerCase())?.id
          if (answer) out.push({ ...base(w, 'synonym_choice'), input_mode: 'choice', bloom_level: 'understand', prompt: w.word, prompt_zh: null, choices: opts, answer, hint: { ipa }, explanation_zh: `${w.word} 近义：${syns.slice(0, 3).join('、')}` })
        }
      }
    }
    // confusable_choice（易混词：给中文释义，在形近词里选对的拼写）
    {
      const conf = confusables.get(w.id) ?? []
      if (zh && conf.length >= 3) {
        const ds = pick(conf, 3, r)
        const { choices: ch, answer } = choices([{ text: w.word, wid: w.id }, ...ds.map(c => ({ text: c.word, wid: c.id }))], w.id, r)
        out.push({ ...base(w, 'confusable_choice'), input_mode: 'choice', bloom_level: 'analyze', prompt: zh, prompt_zh: null, choices: ch, answer, hint: { ipa }, explanation_zh: `${w.word}（${zh}）易与 ${ds.map(c => c.word).join('、')} 混淆` })
      }
    }
    const cleanWord = /^[a-zA-Z][a-zA-Z'-]*$/.test(w.word) && w.word.length >= 2
    // cloze_spell（例句填空·敲）
    {
      const blanked = ex.en ? clozeBlank(ex.en, w.word) : ''
      if (blanked && cleanWord) {
        out.push({ ...base(w, 'cloze_spell'), input_mode: 'spell', bloom_level: 'apply', prompt: blanked, prompt_zh: ex.zh || null, answer_text: w.word.toLowerCase(), hint: { initials: spellHint(w.word), ipa }, explanation_zh: ex.zh || explZh(w) })
      }
    }
    // listen_to_meaning（听音→选义）
    {
      const ds = pick(samePos(zhPool, w).filter(x => x.text && x.text !== zh), 3, r)
      if (cleanWord && ds.length === 3) {
        const opts = pick([{ text: zh, wid: w.id }, ...ds.map(d => ({ text: d.text, wid: d.wid }))], 4, r).map((o, i) => ({ id: 'abcd'[i], text: o.text, wid: o.wid }))
        out.push({ ...base(w, 'listen_to_meaning'), input_mode: 'listen', bloom_level: 'understand', prompt: w.word, prompt_zh: '听发音，选出词义', choices: opts.map(o => ({ id: o.id, text: o.text })), answer: opts.find(o => o.wid === w.id)!.id, audio_ref: w.word.toLowerCase(), hint: { ipa } })
      }
    }
    // dictation_spell（听写：听音→敲单词）
    if (cleanWord) {
      out.push({ ...base(w, 'dictation_spell'), input_mode: 'listen', bloom_level: 'remember', prompt: '', prompt_zh: '听写：拼出你听到的单词', answer_text: w.word.toLowerCase(), audio_ref: w.word.toLowerCase(), hint: { initials: spellHint(w.word), ipa } })
    }
    // antonym_choice 已退役（Phase 11）：不再生成。反义关系仅作词典展示，不作题型。
    // synonym_substitute（语境同义替换：句中画线词，选意思最接近的）
    {
      const syns = synsOf(w)
      const inEx = ex.en && new RegExp(`\\b${escapeRe(w.word)}\\b`, 'i').test(ex.en)
      if (cleanWord && syns.length && inEx) {
        const correct = syns[0]
        const block = new Set([w.word.toLowerCase(), ...syns.map(s => s.toLowerCase())])
        const ds = pick(samePos(enPool, w).filter(x => !block.has(x.text.toLowerCase())), 3, r)
        if (ds.length === 3) {
          const marked = ex.en.replace(new RegExp(`\\b(${escapeRe(w.word)})\\b`, 'i'), '「$1」')
          const opts = pick([{ text: correct }, ...ds.map(d => ({ text: d.text }))], 4, r).map((o, i) => ({ id: 'abcd'[i], text: o.text }))
          const answer = opts.find(o => o.text.toLowerCase() === correct.toLowerCase())?.id
          if (answer) out.push({ ...base(w, 'synonym_substitute'), input_mode: 'choice', bloom_level: 'understand', prompt: marked, prompt_zh: `选出与句中「${w.word}」意思最接近的词`, choices: opts, answer, hint: { ipa }, explanation_zh: `${w.word} ≈ ${syns.slice(0, 3).join('、')}` })
        }
      }
    }
  }

  void byId
  const byType: Record<string, number> = {}
  for (const q of out) byType[q.type as string] = (byType[q.type as string] ?? 0) + 1
  console.log(`[gen] generated ${out.length} questions:`, byType)
  if (DRY) { console.log('[gen] dry-run, not writing'); return }

  let written = 0
  for (let i = 0; i < out.length; i += 200) {
    const chunk = out.slice(i, i + 200)
    let e = (await db.from('question_bank').upsert(chunk, { onConflict: 'id' })).error
    if (e) { // 单次重试（缓解偶发 statement timeout）
      await new Promise(res => setTimeout(res, 800))
      e = (await db.from('question_bank').upsert(chunk, { onConflict: 'id' })).error
    }
    if (e) { console.error('[gen] upsert error at', i, e.message); process.exit(1) }
    written += chunk.length
    process.stdout.write(`\r[gen] upserted ${written}/${out.length}`)
  }
  console.log(`\n[gen] done. level=${LEVEL} active rule-layer questions = ${written}`)
}
main()
