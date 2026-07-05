import { chromium } from 'playwright'
import fs from 'node:fs'

const OUT = 'test-results/p4'
fs.mkdirSync(OUT, { recursive: true })
const base = process.env.BASE_URL || 'http://localhost:3137'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

async function shot(name, url, waitMs = 4500) {
  try {
    await page.goto(base + url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForTimeout(waitMs)
    await page.screenshot({ path: `${OUT}/${name}.png` })
    console.log('✓', name)
  } catch (e) {
    console.log('✗', name, e.message)
  }
}

// LexiGraph 默认档（含切档器）
await shot('lexigraph-default', '/lexigraph', 8000)
// 切到 SAT 星系（点切档器按钮）
try {
  await page.getByRole('button', { name: 'SAT' }).click({ timeout: 8000 })
  await page.waitForTimeout(8000)
  await page.screenshot({ path: `${OUT}/lexigraph-sat.png` })
  console.log('✓ lexigraph-sat (clicked)')
} catch (e) { console.log('✗ lexigraph-sat', e.message) }

// 词详情（发音按钮所在）
await shot('word-detail', '/word/ubiquitous', 4500)

await browser.close()
console.log('done →', OUT)
