/**
 * e2e/learning-loop.spec.ts — 界面优化5 阶段2 学习闭环回归（spec A7-3，8 例）
 *
 * 通过 localStorage['lexi-store-v1']（persist v5）做确定性状态注入，
 * 再走真实 UI 断言；store 断言读回同一 key。
 */

import { test, expect, type Page } from '@playwright/test'

const KEY = 'lexi-store-v1'
const DAY = 86_400_000
const dstr = (t: number) => new Date(t).toISOString().slice(0, 10)
const today = () => dstr(Date.now())

function entry(over: Record<string, unknown> = {}) {
  return {
    id: 'testword', word: 'testword', zh: '测试释义', phon: '', pos: 'n.', galaxy: 'cognition',
    state: 'learning', streak: 0, ease: 2.5, interval: 0,
    addedAt: Date.now(), source: 'lookup',
    ...over,
  }
}

/** 注入一次性初始 store（仅首次加载生效，后续导航保留页面内变更） */
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
  }, { key: KEY, st: state })
}

async function readStore(page: Page): Promise<any> {
  return page.evaluate(
    (key) => JSON.parse(window.localStorage.getItem(key) ?? '{"state":{}}').state,
    KEY,
  )
}

// ── 1. 定级 → 今日包个性化 ────────────────────────────────────────────────
test('定级 B1(band4) → 推荐词落在 CEFR 邻近窗口且今日页出现推荐区', async ({ page, request }) => {
  const res = await request.get('/api/dictionary/recommend?band=4&limit=5')
  expect(res.ok()).toBeTruthy()
  const { data } = await res.json()
  expect(Array.isArray(data) && data.length > 0).toBeTruthy()
  for (const w of data) {
    if (w.cefrLevel) expect(['B1', 'B2']).toContain(w.cefrLevel)
  }

  await seed(page, { profile: { onboarded: true, skipped: false, targetExam: null, band: 4, dailyGoal: 12, userLevel: 'intermediate' } })
  await page.goto('/today')
  await expect(page.getByText('今日推荐')).toBeVisible()
  const st = await readStore(page)
  expect(st.todayPack.date).toBe(today())
  expect(st.todayPack.recommendedIds.length).toBeGreaterThan(0)
})

// ── 2. 学新词 ────────────────────────────────────────────────────────────
test('学新词「认识」→ 状态 learning + 今日进度 +1', async ({ page }) => {
  await seed(page, {
    words: [entry({ id: 'alpha', word: 'alpha', state: 'recommended' })],
    todayPack: { date: today(), recommendedIds: ['alpha'] },
  })
  await page.goto('/learn?flow=true')
  await page.getByRole('button', { name: /认识/ }).click()
  await expect(page.getByText('学习完成')).toBeVisible()
  const st = await readStore(page)
  expect(st.words.find((w: any) => w.id === 'alpha').state).toBe('learning')
  expect(st.daily.learned).toBe(1)
  expect(st.daily.date).toBe(today())
})

// ── 3. 测验答错 ──────────────────────────────────────────────────────────
test('测验答错 → 状态 weak + 错题本出现该题', async ({ page, request }) => {
  const dictRes = await request.get('/api/dictionary/word/inevitable')
  expect(dictRes.ok()).toBeTruthy()
  const { data: dict } = await dictRes.json()
  const correct: string = dict.definitions[0].definitionEn

  await seed(page, { words: [entry({ id: 'inevitable', word: 'inevitable', zh: '必然的', state: 'learning' })] })
  await page.goto('/quiz?mode=vocabulary-drill&word=inevitable')
  await expect(page.locator('h1', { hasText: 'inevitable' })).toBeVisible()

  const opts = page.locator('h1 + div button')
  await expect(opts).toHaveCount(4)
  const n = await opts.count()
  for (let i = 0; i < n; i++) {
    const t = (await opts.nth(i).innerText()).trim()
    if (!t.includes(correct.slice(0, 40))) { await opts.nth(i).click(); break }
  }
  await expect(page.getByText('Not quite')).toBeVisible()

  const st = await readStore(page)
  expect(st.words.find((w: any) => w.id === 'inevitable').state).toBe('weak')
  expect(st.wrongAnswers.length).toBeGreaterThanOrEqual(1)
  expect(st.daily.quizzed).toBeGreaterThanOrEqual(1)

  await page.goto('/memory?tab=wrong')
  await expect(page.getByText('inevitable').first()).toBeVisible()
})

// ── 4. 复习评分 ──────────────────────────────────────────────────────────
test('复习评「记得」→ 按钮预告天数 === store 写入 interval', async ({ page }) => {
  await seed(page, {
    words: [entry({ id: 'beta', word: 'beta', state: 'review', streak: 2, ease: 2.5, interval: 3, nextReviewAt: Date.now() - 1000 })],
  })
  await page.goto('/memory')
  await page.getByRole('button', { name: '显示答案' }).click()
  const goodBtn = page.getByRole('button', { name: /记得/ })
  const label = await goodBtn.innerText()
  const predicted = Number(label.match(/(\d+)天/)?.[1])
  expect(predicted).toBeGreaterThan(0)
  await goodBtn.click()
  await expect(page.getByText('词汇掌握率')).toBeVisible()
  const st = await readStore(page)
  expect(st.words.find((w: any) => w.id === 'beta').interval).toBe(predicted)
  expect(st.daily.reviewed).toBe(1)
})

// ── 5. 时间快进 → 词回到到期队列 ─────────────────────────────────────────
test('快进 interval 天 → 词重新出现在到期队列', async ({ page }) => {
  const nextReviewAt = Date.now() + 8 * DAY
  await seed(page, {
    words: [entry({ id: 'gamma', word: 'gamma', state: 'review', streak: 3, interval: 8, nextReviewAt })],
  })
  // 等价于 clock.fastForward(8 天)：页面时钟直接装在到期时刻之后
  await page.clock.install({ time: nextReviewAt + 3_600_000 })
  await page.goto('/memory')
  await expect(page.getByText('gamma')).toBeVisible()
})

// ── 6. streak 规则 ───────────────────────────────────────────────────────
test('昨日有学习 → 今日再学 streak=2；隔一日学习 → streak 归 1', async ({ page, browser }) => {
  // 场景 A：昨天学过，今天再学 → 2
  await seed(page, {
    words: [entry({ id: 'd1', word: 'd1word', state: 'recommended' })],
    todayPack: { date: today(), recommendedIds: ['d1'] },
    streakData: { current: 1, longest: 1, lastStudyDate: dstr(Date.now() - DAY) },
  })
  await page.goto('/learn?flow=true')
  await page.getByRole('button', { name: /认识/ }).click()
  await expect(page.getByText('学习完成')).toBeVisible()
  let st = await readStore(page)
  expect(st.streakData.current).toBe(2)
  expect(st.streakData.longest).toBe(2)

  // 场景 B：前天学过（跳了一天），今天学 → 归 1
  const ctx = await browser.newContext()
  const page2 = await ctx.newPage()
  await seed(page2, {
    words: [entry({ id: 'd2', word: 'd2word', state: 'recommended' })],
    todayPack: { date: today(), recommendedIds: ['d2'] },
    streakData: { current: 5, longest: 5, lastStudyDate: dstr(Date.now() - 2 * DAY) },
  })
  await page2.goto('/learn?flow=true')
  await page2.getByRole('button', { name: /认识/ }).click()
  await expect(page2.getByText('学习完成')).toBeVisible()
  st = await readStore(page2)
  expect(st.streakData.current).toBe(1)
  expect(st.streakData.longest).toBe(5)
  await ctx.close()
})

// ── 7. 次日重置 ──────────────────────────────────────────────────────────
test('次日进入 → 进度归零、今日包重新生成且不同', async ({ page }) => {
  const yest = dstr(Date.now() - DAY)
  await seed(page, {
    daily: { date: yest, learned: 5, quizzed: 2, reviewed: 1 },
    todayPack: { date: yest, recommendedIds: ['stale-old-id'] },
  })
  await page.goto('/today')
  await expect(page.getByText('今日进度：0 / 12')).toBeVisible()
  // buildTodayPack 在挂载后异步重建
  await page.waitForFunction(
    ({ key, d }) => JSON.parse(window.localStorage.getItem(key) ?? '{"state":{}}').state.todayPack?.date === d,
    { key: KEY, d: today() },
  )
  const st = await readStore(page)
  expect(st.todayPack.recommendedIds).not.toContain('stale-old-id')
})

// ── 8. 词详情入库 → 多处可见 ─────────────────────────────────────────────
test('词详情「加入学习」→ 状态机入库 + 词库可见', async ({ page }) => {
  await seed(page, {})
  await page.goto('/word/inevitable')
  await page.getByRole('button', { name: /加入学习/ }).click()
  await expect
    .poll(async () => {
      const st = await readStore(page)
      return st.words.find((w: any) => w.id === 'inevitable')?.state
    })
    .toBe('learning')
  const st = await readStore(page)
  expect(st.words.find((w: any) => w.id === 'inevitable').source).toBe('lookup')
  expect(st.daily.learned).toBe(1)

  await page.goto('/dictionary')
  await expect(page.getByText('inevitable').first()).toBeVisible()
})
