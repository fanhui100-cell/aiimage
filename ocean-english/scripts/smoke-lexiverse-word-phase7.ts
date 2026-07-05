/* smoke-lexiverse-word-phase7.ts — Lexiverse 词入口 CTA Playwright 点击级验证（Phase 7）
   用法：BASE=http://localhost:3211 WORD=ability npx tsx scripts/smoke-lexiverse-word-phase7.ts
   覆盖：/lexiverse 不崩；词详情 CTA 组；练这个词→/api/practice/session?mode=word&word=；返回流；
        考试语境仍是按词（非随机/task）；加入今日切已加入；无运行时崩溃。 */
import { chromium, type Page } from '@playwright/test'

const BASE = process.env.BASE || 'http://localhost:3211'
const WORD = process.env.WORD || 'improve'
const WORD_PAGE = `/lexiverse/word/${WORD}`
const fails: string[] = []
const ok = (cond: boolean, msg: string) => { console.log(`${cond ? '  ✓' : '  ✗'} ${msg}`); if (!cond) fails.push(msg) }

async function gotoWord(page: Page) {
  await page.goto(`${BASE}${WORD_PAGE}`, { waitUntil: 'domcontentloaded' })
  await page.getByText('练这个词', { exact: true }).waitFor({ timeout: 20000 })
}

async function run() {
  const browser = await chromium.launch()
  const crashes: string[] = []
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const page = await ctx.newPage()
    page.on('pageerror', (e) => crashes.push(String(e.message)))

    console.log('[1] /lexiverse 不崩')
    await page.goto(`${BASE}/lexiverse`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(1500)
    ok(true, '/lexiverse 加载（domcontentloaded）')

    console.log('[2] 词详情 CTA 组')
    await gotoWord(page)
    for (const cta of ['练这个词', '考试语境', '词图关系']) {
      ok(await page.getByText(cta, { exact: true }).count() >= 1, `CTA「${cta}」存在`)
    }
    ok(await page.getByText(/加入今日|已加入今日/).count() >= 1, 'CTA「加入今日/已加入今日」存在')

    console.log('[3] 练这个词 → /api/practice/session?mode=word&word=')
    const req1 = page.waitForRequest((r) => r.url().includes('/api/practice/session'), { timeout: 20000 })
    await page.getByText('练这个词', { exact: true }).click()
    await page.waitForURL(/\/quiz\?word=/, { timeout: 15000 })
    const u1 = (await req1).url()
    ok(/mode=word/.test(u1), `session 实参 mode=word（${u1.split('?')[1]}）`)
    ok(new RegExp(`word=${WORD}(\\b|&|$)`).test(u1), `session 实参 word=${WORD}`)
    ok(!/taskType=en_to_zh/.test(u1) && !/mode=task/.test(u1), '未退化为随机/task 练习')

    console.log('[4] 返回流：runner 退出 → 回到词页')
    await page.waitForSelector('.pr-v2 .exit', { timeout: 20000 })
    await page.locator('.pr-v2 .exit').first().click()
    await page.waitForURL(new RegExp(WORD_PAGE.replace(/\//g, '\\/')), { timeout: 15000 })
    ok(page.url().includes(WORD_PAGE), `退出回到词页：${page.url().replace(BASE, '')}`)

    console.log('[5] 考试语境 → 仍是按词（非随机/task）')
    await gotoWord(page)
    const req2 = page.waitForRequest((r) => r.url().includes('/api/practice/session'), { timeout: 20000 })
    await page.getByText('考试语境', { exact: true }).click()
    await page.waitForURL(/\/quiz\?word=/, { timeout: 15000 })
    const u2 = (await req2).url()
    ok(/mode=word/.test(u2) && new RegExp(`word=${WORD}`).test(u2), `考试语境 session 仍按词 mode=word&word=${WORD}`)
    ok(!/taskType=en_to_zh/.test(u2), '考试语境未退化为无关随机题')

    console.log('[6] 加入今日 → 切换为已加入今日')
    await gotoWord(page)
    const addBtn = page.getByText('加入今日', { exact: true })
    if (await addBtn.count()) {
      await addBtn.click()
      await page.getByText('已加入今日', { exact: true }).waitFor({ timeout: 8000 })
      ok(true, '点击「加入今日」后切换为「已加入今日」')
    } else {
      ok(await page.getByText('已加入今日', { exact: true }).count() >= 1, '该词已在今日队列（已加入今日）')
    }

    console.log('[7] 无运行时崩溃')
    ok(crashes.length === 0, `无 pageerror 崩溃${crashes.length ? '：' + crashes.slice(0, 3).join(' | ') : ''}`)
    await ctx.close()
  } finally {
    await browser.close()
  }

  console.log(`\nlexiverse word phase7 smoke · 失败 ${fails.length}`)
  for (const f of fails) console.error(`FAIL ${f}`)
  process.exit(fails.length ? 1 : 0)
}

run().catch((e) => { console.error('fatal', e?.message ?? e); process.exit(1) })
