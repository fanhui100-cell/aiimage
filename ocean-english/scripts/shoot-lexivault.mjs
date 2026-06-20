import { chromium } from 'playwright'
import fs from 'node:fs'
const OUT = 'test-results/lexivault'; fs.mkdirSync(OUT, { recursive: true })
const base = process.env.BASE_URL || 'http://localhost:3137'
const DAY = 86400000, now = Date.now()
const W = (o) => ({ phon: '', pos: o.pos || 'adj.', galaxy: 'cognition', ease: 2.5, streak: 0, interval: 0, addedAt: now - 3 * DAY, source: 'lookup', ...o })
const words = [
  W({ id: 'subtle', word: 'subtle', zh: '微妙的；不易察觉的', pos: 'adj.', state: 'weak', streak: 1, interval: 2, nextReviewAt: now - DAY, examTags: ['TOEFL', 'IELTS'], syn: ['delicate', 'nuanced'], ant: ['obvious'], ex: 'The author draws a subtle distinction between the two.', exZh: '作者在两者间做了细微区分。' }),
  W({ id: 'affect', word: 'affect', zh: '影响 (v.)', pos: 'v.', state: 'weak', streak: 0, interval: 1, nextReviewAt: now + DAY, examTags: ['CET-6', 'IELTS'], syn: ['influence', 'impact'], ant: [] }),
  W({ id: 'effect', word: 'effect', zh: '效果；影响 (n.)', pos: 'n.', state: 'learning', streak: 2, interval: 3, examTags: ['CET-6'], syn: ['result', 'consequence'], ant: [] }),
  W({ id: 'ubiquitous', word: 'ubiquitous', zh: '无处不在的', pos: 'adj.', state: 'mastered', streak: 5, interval: 16, dims: ['recognize', 'spell'], nextReviewAt: now + 9 * DAY, examTags: ['TOEFL', 'GRE'], syn: ['omnipresent', 'pervasive'], ant: ['rare'] }),
  W({ id: 'mitigate', word: 'mitigate', zh: '减轻；缓解', pos: 'v.', state: 'review', streak: 3, interval: 7, nextReviewAt: now - 2 * DAY, source: 'scan', examTags: ['TOEFL', 'IELTS'], syn: ['alleviate', 'ease'], ant: ['aggravate'], ex: 'measures to mitigate the impact of drought.', exZh: '减轻干旱影响的措施。' }),
  W({ id: 'ambiguous', word: 'ambiguous', zh: '模糊的；有歧义的', pos: 'adj.', state: 'learning', streak: 1, interval: 5, nextReviewAt: now + 2 * DAY, examTags: ['IELTS', 'GRE'], syn: ['vague', 'unclear'], ant: ['clear'] }),
  W({ id: 'resilience', word: 'resilience', zh: '韧性；恢复力', pos: 'n.', state: 'mastered', streak: 7, interval: 25, dims: ['recognize', 'spell', 'listen'], examTags: ['IELTS'], syn: ['toughness'], ant: ['fragility'] }),
  W({ id: 'meticulous', word: 'meticulous', zh: '一丝不苟的', pos: 'adj.', state: 'learning', streak: 1, interval: 2, nextReviewAt: now + DAY, examTags: ['IELTS'], syn: ['thorough', 'scrupulous'], ant: ['careless'] }),
]
const wrongAnswers = [
  { id: 'wa1', wordId: 'affect', word: 'affect', question: 'How does climate change ___ crops?', userAnswer: 'effect', correctAnswer: 'affect', explanation: 'affect 作动词', timestamp: now - 1 * DAY },
  { id: 'wa2', wordId: 'meticulous', word: 'meticulous', question: '拼写: 一丝不苟的', userAnswer: 'meticilous', correctAnswer: 'meticulous', explanation: '', timestamp: now - 2 * DAY },
  { id: 'wa3', wordId: 'subtle', word: 'subtle', question: 'a ___ difference in tone (≈ delicate)', userAnswer: 'obvious', correctAnswer: 'subtle', explanation: '', timestamp: now - 5 * DAY },
  { id: 'wa4', wordId: 'subtle', word: 'subtle', question: 'TOEFL p.42 词义猜测', userAnswer: '明显的', correctAnswer: '不易察觉的', explanation: '', timestamp: now - 2 * DAY },
]
const persisted = JSON.stringify({ state: { words, wrongAnswers, xp: 320, daily: {}, history: {}, streakData: { current: 14, longest: 20 }, profile: { onboarded: true, band: 6, dailyGoal: 12, level: 4 } }, version: 5 })
const browser = await chromium.launch()

async function run(mode) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(([m, p]) => { try { localStorage.setItem('lexiverse-mode', m); localStorage.setItem('lexi-store-v1', p) } catch {} }, [mode, persisted])
  const page = await ctx.newPage(); const errs = []
  page.on('pageerror', e => errs.push(e.message.slice(0, 140)))
  await page.goto(base + '/knowledge', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(5000)
  await page.screenshot({ path: `${OUT}/${mode}-default.png` })
  try { await page.locator('.kv-wrow').first().click({ timeout: 2500 }); await page.waitForTimeout(1800) } catch {}
  await page.screenshot({ path: `${OUT}/${mode}-picked.png` })
  try { await page.locator('.a2-graph-entry').click({ timeout: 2500 }); await page.waitForTimeout(1000); await page.screenshot({ path: `${OUT}/${mode}-graph.png` }); await page.locator('.a2-graphov .kv-act').click() } catch {}
  console.log(`[${mode}] errs:`, errs.length ? errs : 'none')
  await ctx.close()
}
await run('light'); await run('dark')
const m = await browser.newContext({ viewport: { width: 414, height: 880 } })
await m.addInitScript(p => { try { localStorage.setItem('lexi-store-v1', p) } catch {} }, persisted)
const mp = await m.newPage(); await mp.goto(base + '/knowledge', { waitUntil: 'domcontentloaded' }); await mp.waitForTimeout(4500)
await mp.screenshot({ path: `${OUT}/mobile.png` })
try { await mp.locator('.kv-mbtn').first().click(); await mp.waitForTimeout(500); await mp.screenshot({ path: `${OUT}/mobile-drawer.png` }) } catch {}
await m.close(); await browser.close(); console.log('done')
