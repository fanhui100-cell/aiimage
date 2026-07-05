import { Suspense } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { LoadingState } from '@/components/lexiverse/LoadingState'
import { LexiverseQuizClient } from '@/components/quiz/LexiverseQuizClient'
import { PracticeRunner } from '@/components/practice/PracticeRunner'
import type { PracticeRunnerProps } from '@/components/practice/practice-types'

// Phase 5：/quiz 数据层迁移到统一 Practice Session API（PracticeRunner）。
// vs 辨析 / 昨日回顾 / 错题强化 仍走 LexiverseQuizClient（legacy fallback，本阶段不删）。

// 专练 drill key → question_bank 题型（synant 已去退役 antonym_choice）
const DRILL_TYPE_MAP: Record<string, string[]> = {
  meaning: ['en_to_zh', 'def_to_word'], listen: ['listen_to_meaning'], pic: ['en_to_zh', 'def_to_word'],
  cloze: ['cloze_choice'], sentence: ['cloze_choice', 'cloze_spell'], listenVocab: ['listen_to_meaning'],
  translate: ['en_to_zh', 'zh_to_en'], longSent: ['synonym_substitute', 'cloze_choice'],
  discern: ['confusable_choice', 'synonym_choice'], fullCloze: ['cloze_passage'], inferRead: ['reading_comprehension'],
  acadListen: ['listening_comprehension'], readVocab: ['synonym_substitute'], speakUse: ['en_to_zh', 'synonym_substitute'],
  writeWord: ['synonym_substitute'], hardDiscern: ['confusable_choice', 'synonym_choice'], equiv: ['synonym_substitute'],
  synant: ['synonym_choice', 'synonym_substitute'], ctxInfer: ['reading_comprehension', 'cloze_choice'],
}

// 目标考试 → 7 档 level（仅 7 档真实考试；不含 IELTS/GRE —— 它们不是 7 档别名，
// Phase 1 已修正 normalizeExamId，前端不得再把它们静默归到 TOEFL/SAT 档）
const EXAM_TO_LEVEL: Record<string, number> = {
  '初中': 1, '高中': 2, GAOKAO: 2, 'CET-4': 3, CET4: 3, 'CET-6': 4, CET6: 4,
  '考研': 5, KAOYAN: 5, TOEFL: 6, SAT: 7, IELTS: 8,   // 八档：IELTS→8（coming_soon 落空池显空态，不静默回退 CET4）
}

type SP = Record<string, string | string[] | undefined>

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

/** 旧 /quiz 参数 → PracticeRunner props（null = 走 legacy LexiverseQuizClient） */
function mapToRunnerProps(sp: SP): PracticeRunnerProps | null {
  const mode = one(sp.mode)
  const word = one(sp.word)
  const vs = one(sp.vs)
  const yesterday = one(sp.yesterday)
  const returnTo = one(sp.returnTo)
  const examTag = one(sp.exam)
  const levelParam = one(sp.level)
  const level = levelParam && /^[1-8]$/.test(levelParam) ? Number(levelParam) : undefined   // 八档：接受 1-8（含雅思）
  // 未知 / GRE → undefined；IELTS→8（落 level 8 空池显空态，不静默归到 CET-4）；最终回退默认 level=3（CET-4）
  const levelFromExam = examTag ? EXAM_TO_LEVEL[examTag] : undefined

  // legacy 专属：vs 辨析 / 昨日回顾 / 错题强化
  if ((word && vs) || yesterday === '1' || mode === 'wrong-answer-booster') return null

  // ?word=（无 vs）→ word session
  if (word) return { mode: 'word', word, returnTo }

  // 考试专项任务（ExamTaskPicker → /quiz?mode=task&examId&taskType&level）：显式 taskType 直传，
  // 不能落到默认 en_to_zh。退役题型交给 session API 空池处理（runner 显示空态）。
  if (mode === 'task' && (one(sp.taskType) || one(sp.examId))) {
    const taskType = one(sp.taskType)
    const examId = one(sp.examId)
    const sectionId = one(sp.sectionId)
    const countRaw = one(sp.count)
    const count = countRaw && /^\d+$/.test(countRaw) ? Number(countRaw) : undefined
    return { mode: 'task', taskType, examId, sectionId, level: level ?? levelFromExam, count, returnTo }
  }

  // 听力 / 阅读练习
  if (mode === 'listening-practice') return { mode: 'task', taskType: 'listening_comprehension', level: level ?? levelFromExam ?? 3, returnTo }
  if (mode === 'reading-practice') return { mode: 'task', taskType: 'reading_comprehension', level: level ?? levelFromExam ?? 3, returnTo }

  // 专练 drill：?drill=<key>（旧 /drill 跳转可能带 drill=1&type=<uiType>，也兼容 drill=<key>）
  const drillKey = one(sp.drill)
  const drillType = one(sp.type)
  const key = drillType ?? (drillKey && drillKey !== '1' ? drillKey : undefined)
  if (key && DRILL_TYPE_MAP[key]) {
    const lv = level ?? levelFromExam ?? 3
    return { mode: 'task', taskType: DRILL_TYPE_MAP[key][0], level: lv, returnTo }
  }

  // exam-practice：按目标考试映射等级，主走阅读/词汇综合 → 用 reading_comprehension 主线
  if (mode === 'exam-practice') {
    return { mode: 'task', taskType: 'reading_comprehension', level: level ?? levelFromExam ?? 3, returnTo }
  }

  // 词汇 / 句子练习（默认）→ 按等级抽词汇综合（en_to_zh 主线）
  return { mode: 'task', taskType: 'en_to_zh', level: level ?? 3, returnTo }
}

export default async function QuizPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const runnerProps = mapToRunnerProps(sp)

  return (
    <AppShell>
      <Suspense fallback={<LoadingState message="Loading Quiz Center..." />}>
        {runnerProps ? <PracticeRunner {...runnerProps} /> : <LexiverseQuizClient />}
      </Suspense>
    </AppShell>
  )
}
