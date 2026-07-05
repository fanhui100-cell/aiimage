/* 验证 lib/analytics/report.ts（Task 1.3）— 合成数据 + node:assert。
   运行：npx tsx scripts/verify-report.ts */
import { strict as assert } from 'node:assert'
import { buildReport, estimateVocab } from '../lib/analytics/report'
import type { WordEntry } from '../store/lexiStore'

const NOW = Date.UTC(2026, 5, 15)
const DAY = 86_400_000

function w(p: Partial<WordEntry> & Pick<WordEntry, 'id' | 'state'>): WordEntry {
  return {
    word: p.id, phon: '', pos: 'n', zh: '', galaxy: 'cognition',
    streak: 0, ease: 2.5, interval: 0,
    ...p,
  } as WordEntry
}

const words: WordEntry[] = [
  w({ id: 'apple', state: 'mastered', ease: 2.7, interval: 16, dims: ['recognize', 'spell'], nextReviewAt: NOW + 16 * DAY }),
  w({ id: 'brave', state: 'mastered', ease: 2.6, interval: 35, dims: ['recognize', 'spell', 'listen'], nextReviewAt: NOW + 35 * DAY }),
  w({ id: 'cease', state: 'review', ease: 2.4, interval: 7, dims: ['recognize'], nextReviewAt: NOW - 1 * DAY }), // 过期
  w({ id: 'delta', state: 'learning', ease: 2.5, interval: 1, dims: [] }),
  w({ id: 'eager', state: 'weak', ease: 2.1, interval: 1, dims: ['recognize'], nextReviewAt: NOW - 2 * DAY }), // 过期
  w({ id: 'frost', state: 'unknown' }),   // 非活跃
  w({ id: 'glyph', state: 'locked' }),    // 非活跃
]

const history = {
  '2026-06-13': { learned: 5, quizzed: 8, reviewed: 3 },
  '2026-06-14': { learned: 2, quizzed: 0, reviewed: 10 },
}

const r = buildReport({ words, history, level: 3, now: NOW })

// 1) 状态分布求和 = 总词数
const stateSum = Object.values(r.byState).reduce((a, b) => a + b, 0)
assert.equal(stateSum, words.length, 'byState 求和应等于总词数')
assert.equal(r.byState.mastered, 2)
assert.equal(r.byState.locked, 1)

// 2) totals
assert.equal(r.totals.mastered, 2)
assert.equal(r.totals.active, 5, '活跃词 = 非 locked/unknown = 5')
assert.equal(r.totals.due, 2, 'cease/eager 已过期 → due=2')

// 3) 词汇量估算 = 基线(4500@lv3) + mastered(2)
assert.equal(estimateVocab(3, 2), 4502)
assert.equal(r.vocabEstimate, 4502)
assert.equal(estimateVocab(7, 0), 14000)
assert.equal(estimateVocab(99, 0), 14000, 'level 越界夹到 7')

// 4) 矩阵只含活跃词
assert.equal(r.matrix.length, 5)
const cease = r.matrix.find((m) => m.word === 'cease')!
assert.equal(cease.dueInDays, -1, 'cease 过期 1 天 → dueInDays=-1')

// 5) 间隔桶：interval 升序，weak 计入 weak
const ivs = r.intervalBuckets.map((b) => b.interval)
assert.deepEqual(ivs, [...ivs].sort((a, b) => a - b), '间隔桶应升序')
const iv1 = r.intervalBuckets.find((b) => b.interval === 1)!
assert.equal(iv1.weak, 1, 'interval=1 桶含 eager(weak)')
assert.equal(iv1.healthy, 1, 'interval=1 桶含 delta(learning)')

// 6) 跨维：3 个维度，recognize 命中 4/5=80%
assert.equal(r.dims.length, 3)
const rec = r.dims.find((d) => d.dim === 'recognize')!
assert.equal(rec.rate, 80, 'recognize: apple/brave/cease/eager = 4/5 = 80%')
const listen = r.dims.find((d) => d.dim === 'listen')!
assert.equal(listen.gold, 1, 'listen+mastered = brave = 1')

// 7) 热力图：日期 → 活动总数
assert.equal(r.heatmap['2026-06-13'], 16)
assert.equal(r.heatmap['2026-06-14'], 12)

// 8) 空输入不崩
const empty = buildReport({ words: [], history: {}, level: 1, now: NOW })
assert.equal(empty.totals.active, 0)
assert.equal(empty.vocabEstimate, 1500)
assert.equal(empty.dims[0].rate, 0)

console.log('✓ report.ts 全部断言通过（8 组）')
