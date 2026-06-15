/* 验证 lib/srs/schedule.ts FSRS 调度。运行：npx tsx scripts/verify-srs.ts */
import { strict as assert } from 'node:assert'
import { gradeSrs, previewIntervals, isMastered, type SrsState } from '../lib/srs/schedule'

const HOUR = 3_600_000
let s: SrsState = { interval: 0, ease: 2.5, streak: 0 }

// 连续答对：间隔单调增长、连对累加、最终达到「已掌握」
const seq: number[] = []
for (let i = 0; i < 6; i++) {
  const r = gradeSrs(s, 'good')
  seq.push(r.interval)
  s = { interval: r.interval, ease: r.ease, streak: r.streak }
}
console.log('good x6 间隔：', seq.join(' → '))
for (let i = 1; i < seq.length; i++) assert.ok(seq[i] >= seq[i - 1], '间隔应单调不减')
assert.ok(seq[seq.length - 1] > seq[0], '稳定增长')
assert.ok(isMastered({ streak: 6, interval: seq[seq.length - 1] }), '连对 6 次应已掌握')

// easy > good > hard（同一状态下）
const base: SrsState = { interval: 10, ease: 2.5, streak: 3 }
const ih = gradeSrs(base, 'hard').interval
const ig = gradeSrs(base, 'good').interval
const ie = gradeSrs(base, 'easy').interval
console.log('同态 hard/good/easy 间隔：', ih, ig, ie)
assert.ok(ie >= ig && ig >= ih, 'easy ≥ good ≥ hard')

// again：连对清零、1 小时回炉、稳定性回落
const lapse = gradeSrs(base, 'again')
console.log('again：interval=%d streak=%d 回炉≈%s', lapse.interval, lapse.streak, lapse.nextReviewAt - Date.now() <= HOUR + 1000 ? '1小时' : '?')
assert.equal(lapse.streak, 0, 'again 连对清零')
assert.ok(lapse.nextReviewAt - Date.now() <= HOUR + 1000, 'again 约 1 小时回炉')
assert.ok(lapse.interval <= base.interval, 'again 稳定性不增')

// 难词（低 ease）增长应慢于易词（高 ease）
const hardWord = gradeSrs({ interval: 10, ease: 1.4, streak: 3 }, 'good').interval
const easyWord = gradeSrs({ interval: 10, ease: 2.8, streak: 3 }, 'good').interval
console.log('难词 vs 易词 good 间隔：', hardWord, easyWord)
assert.ok(easyWord >= hardWord, '易词稳定性增长 ≥ 难词')

// 预览不抛错、含四档
const pv = previewIntervals({ interval: 7, ease: 2.5, streak: 2 })
console.log('预览：', pv)
assert.ok(pv.again && pv.hard && pv.good && pv.easy)

console.log('✓ FSRS schedule 全部断言通过')
