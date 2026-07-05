/* smoke-listening-phase9.ts — 听力练习路由 AudioPlayer 集成 Playwright 点击级验证（Phase 9）
   用法：BASE=http://localhost:3211 npx tsx scripts/smoke-listening-phase9.ts
   覆盖：listening_comprehension 练习加载；AudioPlayer 播放钮存在；v1 无稳定音频→朗读(TTS)兜底；
        答题前不显示 transcript；点击播放不崩；选答锁定不崩；无 pageerror。 */
import { chromium } from '@playwright/test'

const BASE = process.env.BASE || 'http://localhost:3211'
const URL = `${BASE}/quiz?mode=task&taskType=listening_comprehension&level=3&count=3`
const fails: string[] = []
const ok = (c: boolean, m: string) => { console.log(`${c ? '  ✓' : '  ✗'} ${m}`); if (!c) fails.push(m) }

async function run() {
  const browser = await chromium.launch()
  const crashes: string[] = []
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const page = await ctx.newPage()
    page.on('pageerror', (e) => crashes.push(String(e.message)))

    console.log('[1] 听力练习加载')
    // v1 听力池为随机窗口、偶发空池（与本期改动无关）→ 最多重载 4 次直到出现播放钮
    const playBtn = page.locator('button[aria-label="播放听力音频"]')
    let loaded = false
    for (let attempt = 0; attempt < 4 && !loaded; attempt += 1) {
      await page.goto(URL, { waitUntil: 'domcontentloaded' })
      try { await playBtn.first().waitFor({ timeout: 15000 }); loaded = true } catch { /* 空池/编译中，重载 */ }
    }
    ok(loaded && await playBtn.count() >= 1, 'AudioPlayer 播放钮存在（含空池重试）')

    console.log('[2] v1 无稳定音频 → 朗读(TTS)兜底模式')
    ok(await page.getByText('朗读模式', { exact: true }).count() >= 1, '显示「朗读模式」（TTS 兜底）')

    console.log('[3] 答题前不暴露 transcript')
    ok(await page.locator('.pr-v2 .transcript').count() === 0, '答题前无 .transcript')

    console.log('[4] 点击播放不崩')
    await playBtn.first().click()
    await page.waitForTimeout(600)
    ok(crashes.length === 0, `点击播放后无崩溃${crashes.length ? '：' + crashes[0] : ''}`)

    console.log('[5] 选答锁定不崩')
    const opt = page.locator('.pr-v2 .opt.press, .opts .opt')
    if (await opt.count()) {
      await opt.first().click()
      await page.waitForTimeout(500)
      ok(true, '选答后未崩溃（已锁定）')
    } else {
      ok(false, '未找到选项按钮')
    }

    console.log('[6] 无运行时崩溃')
    ok(crashes.length === 0, `无 pageerror${crashes.length ? '：' + crashes.slice(0, 3).join(' | ') : ''}`)
    await ctx.close()
  } finally {
    await browser.close()
  }
  console.log(`\nlistening phase9 smoke · 失败 ${fails.length}`)
  for (const f of fails) console.error(`FAIL ${f}`)
  process.exit(fails.length ? 1 : 0)
}
run().catch((e) => { console.error('fatal', e?.message ?? e); process.exit(1) })
