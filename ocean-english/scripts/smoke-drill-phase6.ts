/* smoke-drill-phase6.ts — /drill 三面重排 Playwright 点击级验证（Phase 6）
   用法：BASE=http://localhost:3211 npx tsx scripts/smoke-drill-phase6.ts
   覆盖：三面切换 / 单词宇宙开练就绪 / 考试专项手风琴+task 三态+跳转 / 模拟卷 coming-soon /
        退役题型零渲染 / 移动视口。需 dev server 已运行。 */
import { chromium, type Page } from '@playwright/test'

const BASE = process.env.BASE || 'http://localhost:3211'
const fails: string[] = []
const ok = (cond: boolean, msg: string) => { console.log(`${cond ? '  ✓' : '  ✗'} ${msg}`); if (!cond) fails.push(msg) }

async function noDeprecated(page: Page, where: string) {
  const html = await page.content()
  for (const dep of ['反义词', 'antonym_choice', 'cet_cloze']) {
    ok(!html.includes(dep), `${where}: 不含退役「${dep}」`)
  }
}

async function run() {
  const browser = await chromium.launch()
  try {
    // ── 桌面 ──
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const page = await ctx.newPage()
    await page.goto(`${BASE}/drill`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.lx-surfacesw.v2', { timeout: 30000 })

    console.log('[desktop] 三面切换 + 智能复习')
    ok(await page.locator('button[data-s="universe"]').count() === 1, '存在「单词宇宙练习」面切换')
    ok(await page.locator('button[data-s="exam"]').count() === 1, '存在「考试专项」面切换')
    ok(await page.locator('button[data-s="mock"]').count() === 1, '存在「模拟试卷」面切换')
    ok(await page.locator('.lx-reviewentry').count() === 1, '智能复习为顶部常驻 entry（不占三选一）')

    console.log('[desktop] 单词宇宙练习：选题型 → 开练就绪')
    await page.locator('button[data-s="universe"]').click()
    await page.waitForSelector('.lx-chip', { timeout: 15000 })
    await page.locator('.lx-chip:not(.dis)').first().click()
    const lbtn = page.locator('.lx-lbtn').first()
    ok(!(await lbtn.isDisabled()), '选中题型后「开始自由练」可点')
    await noDeprecated(page, 'universe')

    console.log('[desktop] 考试专项：手风琴 + task 三态')
    await page.locator('button[data-s="exam"]').click()
    await page.waitForSelector('.lx-es-strip', { timeout: 15000 })
    ok(await page.locator('.lx-es-exam').count() === 7, '考试 strip = 7 档')
    ok(await page.locator('.lx-es-accrow').count() >= 4, '手风琴板块行 ≥ 4')
    // 展开「听力理解」板块（cet4 默认 cet4，含 listening 可练任务）
    await page.locator('.lx-es-acchead', { hasText: '听力' }).first().click()
    await page.waitForSelector('.lx-es-task', { timeout: 15000 })
    ok(await page.locator('.lx-es-status.ok').count() >= 1, '有「可练」task（绿状态）')
    await noDeprecated(page, 'exam')

    console.log('[desktop] 考试专项：可练 task → 跳 /quiz + 真实 session API 参数')
    const sessionReqP = page.waitForRequest((r) => r.url().includes('/api/practice/session'), { timeout: 20000 })
    await page.locator('.lx-es-task.ok .lx-es-go').first().click()
    await page.waitForURL(/\/quiz\?mode=task/, { timeout: 15000 })
    ok(/\/quiz\?mode=task&examId=.+&taskType=.+&level=\d/.test(page.url()), `跳转 URL 正确：${page.url().replace(BASE, '')}`)
    const sUrl = (await sessionReqP).url()
    const sQuery = sUrl.split('?')[1] ?? ''
    ok(/taskType=listening_comprehension/.test(sUrl), `session API 实参 taskType=listening_comprehension（${sQuery}）`)
    ok(/examId=cet4/.test(sUrl), 'session API 实参带 examId=cet4')
    ok(!/taskType=en_to_zh/.test(sUrl), 'session API 实参未退化为 en_to_zh')

    console.log('[desktop] 模拟试卷：TOEFL/SAT coming-soon')
    await page.goto(`${BASE}/drill`, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('.lx-surfacesw.v2', { timeout: 30000 })
    await page.locator('button[data-s="mock"]').click()
    await page.waitForSelector('.lx-exam-grid', { timeout: 15000 })
    ok(await page.locator('.lx-exam.soon').count() >= 2, 'TOEFL/SAT 置灰 coming-soon（≥2）')
    ok(await page.locator('.lx-exam-soon', { hasText: '题库建设中' }).count() >= 1, 'coming-soon 文案「题库建设中」')
    await noDeprecated(page, 'mock')
    await ctx.close()

    // ── 移动视口 ──
    console.log('[mobile] 三面 + 手风琴竖排')
    const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const mp = await mctx.newPage()
    await mp.goto(`${BASE}/drill`, { waitUntil: 'domcontentloaded' })
    await mp.waitForSelector('.lx-surfacesw.v2', { timeout: 30000 })
    ok(await mp.locator('button[data-s="universe"]').count() === 1, '移动端三面切换存在')
    await mp.locator('button[data-s="exam"]').click()
    await mp.waitForSelector('.lx-es-acc', { timeout: 15000 })
    ok(await mp.locator('.lx-es-accrow').count() >= 4, '移动端手风琴竖排可用')
    await noDeprecated(mp, 'mobile')
    await mctx.close()
  } finally {
    await browser.close()
  }

  console.log(`\ndrill phase6 smoke · 失败 ${fails.length}`)
  for (const f of fails) console.error(`FAIL ${f}`)
  process.exit(fails.length ? 1 : 0)
}

run().catch((e) => { console.error('fatal', e?.message ?? e); process.exit(1) })
