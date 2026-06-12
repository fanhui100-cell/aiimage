/* ============================================================================
   lib/pronunciation/scoring.ts — F4 发音评分算法（纯函数，可单测）
   评分依据（诚实边界）：SpeechRecognition 识别结果比对 + 时长比对。
   能回答「说得对不对、哪个词没说清」；不做音素级重音/语调分析。

   总分 = 完整度×0.4 + 准确度×0.4 + 流利度×0.2 → 0-100 整数
   ============================================================================ */

export type WordMark = 'hit' | 'close' | 'miss'

export interface PronunciationScore {
  total: number              // 0-100
  completeness: number       // 0-1 命中目标词数/目标词数
  accuracy: number           // 0-1 1-编辑操作数/目标词数（close 记半分）
  fluency: number            // 0-1 时长比
  wordMarks: { word: string; mark: WordMark; heard?: string }[]
  bestTranscript: string
}

const normalize = (s: string) =>
  s.toLowerCase().replace(/[^a-z' ]+/g, ' ').replace(/\s+/g, ' ').trim()

/** 字符级相似度（Levenshtein 比例），≥0.65 视为「接近」——经标定：
    accept/except 0.67 ✓ there/their 0.8 ✓ mitigate/meditate 0.63 ✗（确属说错） */
function charSimilarity(a: string, b: string): number {
  const m = a.length, n = b.length
  if (!m || !n) return 0
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const cur = [i]
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return 1 - prev[n] / Math.max(m, n)
}

/** 词级对齐（Levenshtein 回溯），返回每个目标词的命中标记 */
function alignWords(target: string[], heard: string[]): { marks: { word: string; mark: WordMark; heard?: string }[]; ops: number } {
  const m = target.length, n = heard.length
  // dp + 回溯
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const same = target[i - 1] === heard[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + same)
    }
  }
  const marks: { word: string; mark: WordMark; heard?: string }[] = Array(m)
  let ops = 0
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + (target[i - 1] === heard[j - 1] ? 0 : 1)) {
      if (target[i - 1] === heard[j - 1]) {
        marks[i - 1] = { word: target[i - 1], mark: 'hit' }
      } else {
        // 替换：字符级相似度 ≥0.8 算接近（半分）
        const sim = charSimilarity(target[i - 1], heard[j - 1])
        marks[i - 1] = { word: target[i - 1], mark: sim >= 0.65 ? 'close' : 'miss', heard: heard[j - 1] }
        ops++
      }
      i--; j--
    } else if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j] + 1)) {
      marks[i - 1] = { word: target[i - 1], mark: 'miss' }   // 删除：目标词没说
      ops++; i--
    } else {
      ops++; j--                                              // 插入：多说的词
    }
  }
  return { marks, ops }
}

/**
 * 对每个识别候选打分取最高。
 * @param target 目标词/句
 * @param alternatives SpeechRecognition 候选转写（≤3）
 * @param durationMs 实际说话时长
 */
export function scoreAttempt(target: string, alternatives: string[], durationMs: number): PronunciationScore {
  const targetWords = normalize(target).split(' ').filter(Boolean)
  const expectMs = Math.max(500, targetWords.length * 350)

  // 流利度：0.6-1.6 倍区间满分，向两侧线性衰减到 0（3 倍/0.2 倍处归零）
  const ratio = durationMs / expectMs
  const fluency = ratio >= 0.6 && ratio <= 1.6 ? 1
    : ratio < 0.6 ? Math.max(0, (ratio - 0.2) / 0.4)
    : Math.max(0, 1 - (ratio - 1.6) / 1.4)

  let best: PronunciationScore | null = null
  for (const alt of (alternatives.length ? alternatives : [''])) {
    const heardWords = normalize(alt).split(' ').filter(Boolean)
    const { marks, ops } = alignWords(targetWords, heardWords)
    const hits = marks.filter(x => x.mark === 'hit').length
    const closes = marks.filter(x => x.mark === 'close').length
    const completeness = (hits + closes * 0.5) / targetWords.length
    const accuracy = Math.max(0, 1 - ops / targetWords.length) + closes * 0.5 / targetWords.length
    const accClamped = Math.min(1, accuracy)
    const total = Math.round((completeness * 0.4 + accClamped * 0.4 + fluency * 0.2) * 100)
    const cand: PronunciationScore = {
      total, completeness, accuracy: accClamped, fluency,
      wordMarks: marks, bestTranscript: alt,
    }
    if (!best || cand.total > best.total) best = cand
  }
  return best!
}
