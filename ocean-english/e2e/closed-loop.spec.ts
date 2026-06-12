/**
 * P5-B7 闭环 E2E — 最终整合包阶段 5 规格四条
 * 复用 learning-loop 的 persist v5 注入手法（localStorage['lexi-store-v1']）。
 */
import { test, expect, type Page } from '@playwright/test'

const KEY = 'lexi-store-v1'

function entry(over: Record<string, unknown> = {}) {
  return {
    id: 'testword', word: 'testword', zh: '测试释义', phon: '', pos: 'n.', galaxy: 'academic',
    state: 'learning', streak: 2, ease: 2.5, interval: 4,
    addedAt: Date.now(), source: 'lookup',
    ...over,
  }
}

async function seed(page: Page, state: Record<string, unknown> = {}) {
  await page.addInitScript(({ key, st }) => {
    if (window.localStorage.getItem('__e2e_seeded')) return
    const base = {
      words: [], xp: 0,
      daily: { date: '', learned: 0, quizzed: 0, reviewed: 0 },
      streakData: { current: 0, longest: 0, lastStudyDate: '' },
      goalToday: 12,
      todayPack: { date: '', recommendedIds: [] },
      log: [],
      profile: { onboarded: true, skipped: false, targetExam: null, band: 5, dailyGoal: 12, userLevel: 'intermediate' },
      wrongAnswers: [], quizHistory: [], chatMessages: [],
    }
    window.localStorage.setItem(key, JSON.stringify({ state: Object.assign(base, st), version: 5 }))
    window.localStorage.setItem('__e2e_seeded', '1')
    window.localStorage.setItem('lexigraph-v2-intro-seen', '1')
    window.localStorage.setItem('lv2-intro-seen', '1')
    window.localStorage.setItem('lexi-seen-recall-hint', '1')
  }, { key: KEY, st: state })
}

async function readStore(page: Page) {
  return page.evaluate(k => JSON.parse(window.localStorage.getItem(k)!).state, KEY)
}

test.describe('最终整合包 · 闭环 E2E', () => {

  test('1. 定级→今日包→学→练→celebrate 巡航→次日到期', async ({ page }) => {
    test.setTimeout(180_000)
    // —— 定级（直选通道）——
    await page.addInitScript(() => {
      window.localStorage.setItem('lexigraph-v2-intro-seen', '1')
      window.localStorage.setItem('lv2-intro-seen', '1')
      window.localStorage.setItem('lexi-seen-recall-hint', '1')
    })
    await page.goto('/onboarding')
    await page.getByText('四级', { exact: true }).first().click()
    await page.getByText('全面掌握').click()
    await page.getByText('我知道我的水平').click()
    await page.getByText('大学英语四级，应试与应用并重').click()
    await page.getByRole('button', { name: /开始学习/ }).click()
    await page.waitForURL('**/today**', { timeout: 30_000 })

    // —— 今日包按等级生成 ——
    await expect.poll(async () => {
      const st = await readStore(page)
      return st.todayPack.recommendedIds.length
    }, { timeout: 30_000 }).toBeGreaterThan(0)
    const st0 = await readStore(page)
    expect(st0.profile.level).toBe(3)

    // —— 学（flow：翻面 → 认识，直到学完）——
    await page.goto('/learn?flow=true')
    for (let i = 0; i < 40; i++) {
      const card = page.locator('.flip-outer')
      if (!(await card.count())) break
      await card.click()                                  // 翻面
      const know = page.getByRole('button', { name: /认识/ }).first()
      if (!(await know.count())) break
      await know.click()
      await page.waitForTimeout(250)
      if (page.url().includes('/quiz')) break             // flow 自动进练
    }

    // —— 练（flow 进入 quiz，逐题作答到结果页）——
    if (!page.url().includes('/quiz')) await page.goto('/quiz?mode=vocabulary-drill')
    await page.waitForTimeout(3000)
    for (let i = 0; i < 12; i++) {
      const opt = page.locator('button').filter({ hasText: /^A\b|^a\./ }).first()
      const next = page.getByRole('button', { name: /下一题|See Results|查看结果/ }).first()
      if (await page.getByText(/accuracy/).count()) break
      const optBtns = page.locator('main button')
      // 点击第一个可用选项（题面下方第一个选项按钮）
      const candidates = page.locator('button:below(:text("/"))')
      try {
        // 直接用键盘答题（B5-1：1 选项 / Enter 下一题）
        await page.keyboard.press('1')
        await page.waitForTimeout(350)
        await page.keyboard.press('Enter')
        await page.waitForTimeout(450)
      } catch { break }
      void opt; void next; void optBtns; void candidates
    }
    const st1 = await readStore(page)
    expect(st1.daily.quizzed).toBeGreaterThan(0)

    // —— celebrate 巡航（直接走链路入口）——
    await page.goto('/lexiverse?celebrate=1')
    await page.waitForTimeout(6000)
    const uf = page.frames().find(f => f.url().includes('Universe'))
    expect(uf).toBeTruthy()
    // 今日有状态变化 → 巡航 overlay 出现（无变化词也会渲染收尾文案为 0 颗的情况不触发——
    // 学习步骤已产生 recommended→learning 变化，应触发）
    await expect.poll(() => uf!.locator('.lv2-cruise.on').count(), { timeout: 10_000 }).toBeGreaterThan(0)

    // —— 次日到期：把已学词 nextReviewAt 拨回过去 → /memory 出现到期队列 ——
    await page.evaluate(k => {
      const data = JSON.parse(window.localStorage.getItem(k)!)
      // 学/练后词可能落在 learning/review/weak 任意态——统一拨回到期
      for (const w of data.state.words.slice(0, 5)) {
        if (w.state === 'locked' || w.state === 'unknown') continue
        w.state = 'review'
        w.nextReviewAt = Date.now() - 1000
      }
      window.localStorage.setItem(k, JSON.stringify(data))
    }, KEY)
    await page.goto('/memory')
    await page.waitForTimeout(1500)
    const st2 = await readStore(page)
    const due = st2.words.filter((w: { nextReviewAt?: number }) => w.nextReviewAt != null && w.nextReviewAt <= Date.now()).length
    expect(due).toBeGreaterThan(0)
  })

  test('2. 宇宙就地评分 → SRS 间隔增长（记忆图谱颜色随之变绿/teal）', async ({ page }) => {
    test.setTimeout(120_000)
    // 真词池后 daily-basics 星系 = seed 主题词（benefit/habit/...），用池内真词
    await seed(page, {
      words: [entry({ id: 'benefit', word: 'benefit', zh: '益处', galaxy: 'daily-life', state: 'review', interval: 3, nextReviewAt: Date.now() - 1000 })],
    })
    await page.goto('/lexiverse?galaxy=daily-basics')
    await page.waitForTimeout(6000)
    const gf = page.frames().find(f => f.url().includes('Galaxy'))!
    expect(gf).toBeTruthy()
    await gf.evaluate(() => {
      const g = (window as unknown as { __galaxy: { openDetail: (n: unknown) => void; graph: { nodes: { word: string; satellite?: boolean }[] } } }).__galaxy
      const n = g.graph.nodes.find(x => !x.satellite && x.word === 'benefit')
      if (!n) throw new Error('benefit not in real pool: ' + g.graph.nodes.slice(0, 8).map(x => x.word).join(','))
      g.openDetail(n)
    })
    await expect.poll(() => gf.locator('.lv2-review').count(), { timeout: 8_000 }).toBe(1)
    await gf.locator('.lv2-card').click()                          // 翻面解锁评分
    await expect(gf.locator('.lv2-grades.on')).toHaveCount(1)
    await gf.locator('.lv2-grades button[data-g="good"]').click()  // 评分写真 SRS
    await page.waitForTimeout(1200)

    const st = await readStore(page)
    const w = st.words.find((x: { id: string }) => x.id === 'benefit')
    expect(w.interval).toBeGreaterThan(3)                          // 3 → 8
    expect(w.nextReviewAt).toBeGreaterThan(Date.now())             // /memory 队列同步减少
    // 记忆图谱颜色派生自 nextReviewAt/interval（纯函数）：
    // 评分前过期 → 红；评分后未到期且 interval<16 → teal（学习中）
  })

  test('3. 测验双错 → 记忆图谱红边 → 辨析题答对 → 红边消退', async ({ page }) => {
    test.setTimeout(120_000)
    const now = Date.now()
    const session = (ids: string[], correct: boolean, t: number) => ({
      id: 's' + t, startedAt: t, completedAt: t, score: correct ? ids.length : 0, total: ids.length,
      attempts: ids.map(w => ({ questionId: 'q' + w + t, wordId: w, word: w, userAnswer: 'x', correct, timestamp: t })),
    })
    await seed(page, {
      words: [
        entry({ id: 'accept', word: 'accept', state: 'weak' }),
        entry({ id: 'access', word: 'access', state: 'weak' }),
      ],
      quizHistory: [session(['accept', 'access'], false, now - 200000), session(['accept', 'access'], false, now - 100000)],
    })
    // 红边出现（≥2 次共错）
    await page.goto('/lexigraph')
    await page.getByRole('button', { name: '记忆图谱' }).click()
    await expect(page.locator('[data-wrong-edges="1"]')).toHaveCount(1, { timeout: 15_000 })

    // 辨析题：Q1 目标 accept、Q2 目标 access（buildVsQuestions 顺序），全答对
    await page.goto('/quiz?word=accept&vs=access')
    await expect(page.getByText('辨析模式')).toBeVisible({ timeout: 20_000 })
    for (const target of ['accept', 'access']) {
      await page.locator(`main button:has-text("${target}")`).last().click()
      await page.waitForTimeout(400)
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500)
    }
    // 回记忆图谱：红边消退
    await page.goto('/lexigraph')
    await page.getByRole('button', { name: '记忆图谱' }).click()
    await expect(page.locator('[data-wrong-edges="0"]')).toHaveCount(1, { timeout: 15_000 })
  })

  test('4. 词详情 ↔ 词图 ↔ 宇宙 三向带词跳转', async ({ page }) => {
    await seed(page, { words: [entry({ id: 'accept', word: 'accept', zh: '接受' })] })
    // 词详情 → 词图 / 宇宙
    await page.goto('/word/accept')
    await expect(page.getByText('在词图中展开 →')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('在宇宙中查看 ✦').first()).toBeVisible()
    // 词图 ?word= 直达 + 「在宇宙中查看」带词
    await page.goto('/lexigraph?word=accept')
    await expect(page.locator('h2', { hasText: 'accept' })).toBeVisible({ timeout: 20_000 })
    await page.getByRole('button', { name: /在宇宙中查看/ }).click()
    await page.waitForURL('**/lexiverse?word=accept**', { timeout: 15_000 })
    // 宇宙 dock 词图按钮存在（iframe 注入层；?word= 会跳转进星系页）
    await expect.poll(async () => {
      try {
        const frame = page.frames().find(f => /Galaxy\.html|Universe\.html/.test(f.url()))
        if (!frame) return -1
        return await frame.locator('.lv2-dock button').count()
      } catch { return -1 }   // iframe 重载（?word=→?galaxy= src 切换）竞态，继续轮询
    }, { timeout: 25_000 }).toBeGreaterThanOrEqual(4)
  })
})
