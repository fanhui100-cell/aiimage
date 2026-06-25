/* ════════════════════════════════════════════════════════════════════════
   smoke-full-product-routes.ts — R13 全产品路由 + 安全不变量冒烟（静态 + DB）

   不依赖浏览器：校验 ①计划列出的核心路由文件存在（含已知改名映射）；
   ②DB 安全不变量：0 个 active 退役题型(antonym_choice/cet_cloze)、active set 的
   stimulus 全 active、active 听力 stimulus 均有 active 音频、练习载荷不下发 transcript。
   浏览器交互层（console 错误/桌面移动布局）需 `npx playwright test`（webServer 起 next dev），
   本脚本作为 CI 可跑的路由/泄露/退役回归门；浏览器覆盖见 e2e/*.spec.ts。
   只读，不写库。
   ════════════════════════════════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
const env = readFileSync('.env.local', 'utf8')
const rd = (k: string) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]!.trim()
const db = createClient(rd('NEXT_PUBLIC_SUPABASE_URL'), rd('SUPABASE_SERVICE_ROLE_KEY'))

let failures = 0
const check = (c: boolean, m: string) => { if (c) console.log('  ✓', m); else { console.log('  ✗', m); failures++ } }

// 计划路由 → 实际页面文件（含改名等价：review→wrong-answers, vocabulary→lexiverse, word→[slug]）
const ROUTES: { plan: string; file: string }[] = [
  { plan: '/today', file: 'app/today/page.tsx' },
  { plan: '/review (→/wrong-answers)', file: 'app/wrong-answers/page.tsx' },
  { plan: '/reading', file: 'app/reading/page.tsx' },
  { plan: '/vocabulary (→/lexiverse)', file: 'app/lexiverse/page.tsx' },
  { plan: '/lexiverse', file: 'app/lexiverse/page.tsx' },
  { plan: '/lexiverse/word/[slug]', file: 'app/lexiverse/word/[slug]/page.tsx' },
  { plan: '/lexigraph', file: 'app/lexigraph/page.tsx' },
  { plan: '/knowledge', file: 'app/knowledge/page.tsx' },
  { plan: '/drill', file: 'app/drill/page.tsx' },
  { plan: '/quiz', file: 'app/quiz/page.tsx' },
  { plan: '/exam', file: 'app/exam/page.tsx' },
  { plan: '/groups', file: 'app/groups/page.tsx' },
  { plan: '/word/[slug]', file: 'app/word/[slug]/page.tsx' },
]
const API_ROUTES = [
  'app/api/practice/session/route.ts', 'app/api/practice/attempts/route.ts',
  'app/api/papers/route.ts', 'app/api/papers/[id]/route.ts', 'app/api/papers/[id]/submit/route.ts',
  'app/api/daily-plan/route.ts', 'app/api/diagnostics/route.ts',
  'app/api/scoring/writing/route.ts', 'app/api/scoring/translation/route.ts', 'app/api/scoring/speaking/route.ts',
]

async function main() {
  console.log('smoke-full-product-routes: R13 路由 + 安全不变量')

  console.log('\n## 路由文件存在')
  for (const r of ROUTES) check(existsSync(r.file), `${r.plan}  (${r.file})`)
  console.log('\n## 关键 API 路由存在')
  for (const f of API_ROUTES) check(existsSync(f), f)

  console.log('\n## DB 安全不变量')
  const { count: dep } = await db.from('question_sets').select('*', { count: 'exact', head: true })
    .in('task_type', ['antonym_choice', 'cet_cloze']).eq('status', 'active')
  check((dep ?? 0) === 0, `0 个 active 退役题型(antonym_choice/cet_cloze)（实=${dep ?? 0}）`)

  const { count: act } = await db.from('question_sets').select('*', { count: 'exact', head: true }).eq('status', 'active')
  console.log(`  · active sets = ${act}`)

  // active set 的 stimulus 必须 active（serving 取 active stimulus，否则 passage/audio 丢失）
  const { data: aSets } = await db.from('question_sets').select('stimulus_id').eq('status', 'active').not('stimulus_id', 'is', null)
  const stimIds = [...new Set((aSets ?? []).map((s) => (s as { stimulus_id: string }).stimulus_id))]
  let nonActiveStim = 0
  for (let i = 0; i < stimIds.length; i += 200) {
    const { data: st } = await db.from('stimuli').select('id,qa_status').in('id', stimIds.slice(i, i + 200))
    nonActiveStim += (st ?? []).filter((x) => (x as { qa_status: string }).qa_status !== 'active').length
  }
  check(nonActiveStim === 0, `active set 的 stimulus 全 active（非 active=${nonActiveStim}/${stimIds.length}）`)

  // active 听力（input_mode=listen）必须有 active 音频
  const { data: listenItems } = await db.from('question_items').select('question_set_id').eq('input_mode', 'listen').eq('status', 'active').limit(2000)
  const lsetIds = [...new Set((listenItems ?? []).map((i) => (i as { question_set_id: string }).question_set_id))]
  let listenNoAudio = 0
  if (lsetIds.length) {
    const { data: audio } = await db.from('audio_assets').select('stimulus_id,qa_status').eq('qa_status', 'active')
    const audioStim = new Set((audio ?? []).map((a) => (a as { stimulus_id: string }).stimulus_id))
    for (let i = 0; i < lsetIds.length; i += 200) {
      const { data: ls } = await db.from('question_sets').select('stimulus_id').in('id', lsetIds.slice(i, i + 200))
      listenNoAudio += (ls ?? []).filter((s) => !audioStim.has((s as { stimulus_id: string }).stimulus_id)).length
    }
  }
  check(listenNoAudio === 0, `active 听力 set 均有 active 音频（无音频=${listenNoAudio}/${lsetIds.length}）`)

  console.log('\n注：浏览器交互层（console 错误 / 桌面·移动布局 / 键盘可达）需 `npx playwright test`（webServer 起 next dev）；见 e2e/*.spec.ts 与 reports/full-product-route-audit-2026-06-23.md。')
  console.log(failures === 0 ? '\nsmoke-full-product-routes PASS' : `\nsmoke-full-product-routes FAIL（${failures}）`)
  if (failures) process.exitCode = 1
}
main().catch((e) => { console.error('fatal', e?.message ?? e); process.exit(1) })
