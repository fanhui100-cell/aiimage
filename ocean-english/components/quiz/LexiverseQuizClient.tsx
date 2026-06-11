'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import {
  LiquidActionButton,
  LiquidBadge,
  LiquidGlassCard,
  LiquidGlassPanel,
  LiquidSegmentedControl,
} from '@/components/lexiverse/liquid-ui'
import { LoadingState } from '@/components/lexiverse/LoadingState'
import { useLexiverseDictionary } from '@/lib/lexiverse/useLexiverseDictionary'
import type { FilterableWord } from '@/lib/lexiverse/lexiverse-word-filter'
import type { DictionaryDefinition, DictionaryExample, DictionaryWord } from '@/lib/dictionary/dictionary-types'
import { useLexiStore, type WrongAnswer } from '@/store/lexiStore'
import type { QuizAttempt } from '@/types/quiz'

type QuizMode = 'vocabulary-drill' | 'sentence-practice' | 'exam-practice' | 'wrong-answer-booster'
type QuizOption = { id: string; text: string; wordId?: string }
type QuizQuestion = {
  id: string
  mode: QuizMode
  wordId: string
  word: string
  prompt: string
  question: string
  options: QuizOption[]
  answer: string
  explanation: string
  explanationZh?: string
}
type VocabWord = FilterableWord & Partial<Pick<DictionaryWord,
  'definitions' | 'examples' | 'partOfSpeech' | 'phoneticIpa' | 'examTags'
>>

const MODE_OPTIONS: { value: QuizMode; label: ReactNode }[] = [
  { value: 'vocabulary-drill', label: 'Quick · 快速' },
  { value: 'sentence-practice', label: 'Sentence · 句子' },
  { value: 'exam-practice', label: 'Exam · 应试' },
  { value: 'wrong-answer-booster', label: 'Wrong · 错题' },
]

const MODE_CARDS: { mode: QuizMode; title: string; subtitle: string; accent: string; description: string }[] = [
  { mode: 'vocabulary-drill',    title: 'Vocabulary Drill',      subtitle: '词汇速记', accent: '#0E8C7A', description: 'Choose the right meaning from the full Lexiverse dictionary.' },
  { mode: 'sentence-practice',   title: 'Sentence Practice',     subtitle: '句子练习', accent: '#7c5cbf', description: 'Fill sentence blanks using real example sentences.' },
  { mode: 'exam-practice',       title: 'Exam Practice',         subtitle: '应试模拟', accent: '#b3781f', description: 'Practice words filtered by TOEFL, IELTS, CET, GRE, and more.' },
  { mode: 'wrong-answer-booster', title: 'Wrong Answer Booster', subtitle: '错题强化', accent: '#bf4a30', description: 'Rebuild confidence from your saved wrong-answer notebook.' },
]

const EXAM_TAGS = ['TOEFL', 'IELTS', 'CET-4', 'CET-6', 'KAOYAN', 'GAOKAO', 'SAT', 'GRE']

export function LexiverseQuizClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { words: rawWords, loading, error } = useLexiverseDictionary()
  const words = rawWords as VocabWord[]
  const wrongAnswers = useLexiStore(s => s.wrongAnswers)
  const addWrongAnswer = useLexiStore(s => s.addWrongAnswer)
  const addQuizSession = useLexiStore(s => s.addQuizSession)
  const incrementXp = useLexiStore(s => s.incXp)

  const urlMode = parseMode(searchParams.get('mode'))
  const wordParam = searchParams.get('word') ?? undefined
  const vsParam = searchParams.get('vs') ?? undefined
  const examParam = searchParams.get('exam') ?? 'IELTS'
  const returnTo = searchParams.get('returnTo')

  const [mode, setMode] = useState<QuizMode>(urlMode)
  const [examTag, setExamTag] = useState(examParam)
  const [seed, setSeed] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [finished, setFinished] = useState(false)

  // P4：vs 辨析模式 — /quiz?word=A&vs=B 生成 A/B 二选一辨析题
  // （题面 = 例句挖空或中文释义，干扰项 = 另一词；结果走既有写回链路）
  const [vsQuestions, setVsQuestions] = useState<QuizQuestion[] | null>(null)
  useEffect(() => {
    if (!wordParam || !vsParam) { setVsQuestions(null); return }
    let cancelled = false
    Promise.all([wordParam, vsParam].map(async w => {
      const res = await fetch(`/api/dictionary/word/${encodeURIComponent(w.toLowerCase())}`)
      const json = res.ok ? await res.json() : null
      return json?.data ?? null
    })).then(([a, b]) => {
      if (cancelled || !a || !b) { if (!cancelled) setVsQuestions([]); return }
      setVsQuestions(buildVsQuestions(a, b))
    })
    return () => { cancelled = true }
  }, [wordParam, vsParam])

  // 真词修复：指定词不在客户端词池（池有 1000 行上限）时，按需单词补取——
  // 14k 词库任意词「考一考」都能出题；词典真没有才显示空状态（A3 语义不变）
  const [extraWord, setExtraWord] = useState<VocabWord | null>(null)
  useEffect(() => {
    setExtraWord(null)
    if (!wordParam || vsParam) return
    if (words.some(w => w.id === wordParam || w.word.toLowerCase() === wordParam.toLowerCase())) return
    let cancelled = false
    fetch(`/api/dictionary/word/${encodeURIComponent(wordParam.toLowerCase())}`)
      .then(r => (r.ok ? r.json() : null))
      .then(json => { if (!cancelled && json?.data) setExtraWord(json.data as VocabWord) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [wordParam, vsParam, words])

  const questions = useMemo(() => {
    if (vsQuestions) return vsQuestions
    const pool = extraWord ? [extraWord, ...words] : words
    if (!pool.length) return []
    return buildQuestions({ mode, words: pool, wrongAnswers, wordId: wordParam, examTag, seed })
  }, [vsQuestions, extraWord, mode, words, wrongAnswers, wordParam, examTag, seed])

  // B5-2：「30 秒后再考我」克隆题插到队列倒数第二位（不计分，只为再曝光）
  const [extras, setExtras] = useState<QuizQuestion[]>([])
  useEffect(() => { setExtras([]) }, [questions])
  const queue = useMemo(() => {
    if (!extras.length) return questions
    const q = [...questions]
    for (const e of extras) q.splice(Math.max(0, q.length - 1), 0, e)
    return q
  }, [questions, extras])

  const current = queue[currentIndex] ?? null
  const isRetryQuestion = !!current && current.id.startsWith('retry-')
  const score = attempts.filter(a => a.correct).length
  const answered = selected !== null

  const retryLater = useCallback(() => {
    if (!current) return
    setExtras(prev => [...prev, { ...current, id: `retry-${current.id}-${Date.now()}` }])
  }, [current])

  const chooseMode = useCallback((next: QuizMode) => {
    setMode(next)
    setCurrentIndex(0)
    setSelected(null)
    setAttempts([])
    setFinished(false)
    const sp = new URLSearchParams(searchParams.toString())
    sp.set('mode', next)
    if (next === 'exam-practice') sp.set('exam', examTag)
    router.replace(`/quiz?${sp.toString()}`)
  }, [router, searchParams, examTag])

  const handleSelect = useCallback((optionId: string) => {
    if (!current || answered) return
    setSelected(optionId)
    const correct = optionId === current.answer
    // 重曝光题：只给反馈，不计分、不写状态机、不进错题本
    if (isRetryQuestion) return
    const attempt: QuizAttempt = {
      questionId: current.id,
      wordId: current.wordId,
      word: current.word,
      userAnswer: optionId,
      correct,
      timestamp: Date.now(),
    }
    setAttempts(prev => [...prev, attempt])
    // A6：答题驱动统一状态机（词不在学习库则静默跳过，纯刷题不强制入库）
    const lexi = useLexiStore.getState()
    if (correct) {
      incrementXp(10)
      if (lexi.byId(current.wordId)) lexi.markCorrect(current.wordId)
      // B6-2：重练答对 → 自动从错题本移除（按 wordId 匹配）
      lexi.wrongAnswers
        .filter(w => w.wordId === current.wordId)
        .forEach(w => lexi.removeWrongAnswer(w.id))
    } else {
      const picked = current.options.find(o => o.id === optionId)
      const answer = current.options.find(o => o.id === current.answer)
      addWrongAnswer({
        wordId: current.wordId,
        word: current.word,
        question: current.question,
        userAnswer: picked?.text ?? optionId,
        correctAnswer: answer?.text ?? current.answer,
        explanation: current.explanation,
        timestamp: Date.now(),
      })
      if (lexi.byId(current.wordId)) lexi.markWrong(current.wordId)
    }
    lexi.recordActivity('quizzed')
  }, [current, answered, isRetryQuestion, incrementXp, addWrongAnswer])

  const nextQuestion = useCallback(() => {
    if (currentIndex + 1 >= queue.length) {
      addQuizSession({
        id: `lexiverse-${Date.now()}`,
        startedAt: Date.now() - Math.max(1, attempts.length) * 18000,
        completedAt: Date.now(),
        attempts,
        score,
        total: questions.length,
      })
      setFinished(true)
      return
    }
    setCurrentIndex(i => i + 1)
    setSelected(null)
  }, [currentIndex, queue.length, questions.length, attempts, score, addQuizSession])

  const restart = useCallback(() => {
    setSeed(s => s + 1)
    setCurrentIndex(0)
    setSelected(null)
    setAttempts([])
    setExtras([])
    setFinished(false)
  }, [])

  // B5-1：键盘 — 1-4 / a-d 选项、Enter 下一题
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (finished || !current) return
      if (!answered) {
        const k = e.key.toLowerCase()
        const i = ['1', '2', '3', '4'].includes(k) ? Number(k) - 1 : ['a', 'b', 'c', 'd'].indexOf(k)
        if (i >= 0 && current.options[i]) handleSelect(current.options[i].id)
      } else if (e.key === 'Enter') {
        nextQuestion()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finished, current, answered, handleSelect, nextQuestion])

  const isVsMode = !!(wordParam && vsParam)

  if (loading && !isVsMode) return <LoadingState message="Loading Quiz Center..." />
  if (isVsMode && vsQuestions === null) return <LoadingState message="生成辨析题…" />
  if (error && !isVsMode) return <QuizFrame><EmptyState title="Dictionary unavailable" detail={error.message} /></QuizFrame>
  if (!questions.length) {
    // A3：单词测验找不到该词时显示空状态，不回退成随机题
    const detail = wordParam
      ? '该词还没有题目，去词典看看。 / No questions for this word yet.'
      : mode === 'wrong-answer-booster'
        ? 'No wrong answers yet. Try a vocabulary drill first.'
        : 'No questions are available for this mode yet.'
    const action = wordParam
      ? <LinkButton href={`/word/${wordParam}`}>查看词条 · View Word</LinkButton>
      : <LinkButton href="/quiz?mode=vocabulary-drill">Start Vocabulary Drill</LinkButton>
    return <QuizFrame><EmptyState title="Nothing to practice yet" detail={detail} action={action} /></QuizFrame>
  }

  return (
    <QuizFrame>
      <header style={styles.header}>
        <div>
          <Link href="/lexiverse" style={styles.brand}>Lexiverse</Link>
          <span style={styles.sub}>Quiz Center · 练习中心</span>
        </div>
        {!isVsMode && <LiquidSegmentedControl value={mode} onChange={chooseMode} options={MODE_OPTIONS} />}
      </header>

      {isVsMode && (
        <div style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid rgba(242,135,158,0.4)', background: 'rgba(242,135,158,0.06)', marginBottom: 16, fontSize: 13.5, color: 'var(--ink)' }}>
          ⚡ 辨析模式 · <b>{wordParam}</b> vs <b>{vsParam}</b> — 二选一，分清这对易混词
        </div>
      )}

      {!isVsMode && <section style={styles.modeGrid}>
        {MODE_CARDS.map(card => (
          <button
            type="button"
            key={card.mode}
            onClick={() => chooseMode(card.mode)}
            style={{
              ...styles.modeCard,
              borderColor: mode === card.mode ? card.accent : 'var(--line)',
              boxShadow: mode === card.mode ? `0 0 20px ${card.accent}18` : 'none',
            }}
          >
            <span style={{ ...styles.modeIcon, color: card.accent, borderColor: `${card.accent}55` }}>{modeGlyph(card.mode)}</span>
            <strong>{card.title}</strong>
            <em>{card.subtitle}</em>
            <span>{card.description}</span>
          </button>
        ))}
      </section>}

      {mode === 'exam-practice' && (
        <div style={styles.examRow}>
          {EXAM_TAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setExamTag(tag)
                restart()
                const sp = new URLSearchParams(searchParams.toString())
                sp.set('mode', 'exam-practice')
                sp.set('exam', tag)
                router.replace(`/quiz?${sp.toString()}`)
              }}
              style={{
                ...styles.examButton,
                color: examTag === tag ? 'var(--gold-ink)' : 'var(--ink-sub)',
                borderColor: examTag === tag ? 'var(--gold-ink)' : 'var(--line)',
                background: examTag === tag ? 'rgba(179,120,31,0.08)' : 'transparent',
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {finished ? (
        <Results score={score} total={questions.length} onRestart={restart} returnTo={returnTo}
          wrongTotal={wrongAnswers.length}
          changedWords={[...new Set(attempts.map(a => a.wordId))]} />
      ) : current ? (
        <QuestionPanel
          question={current}
          currentIndex={currentIndex}
          total={queue.length}
          selected={selected}
          onSelect={handleSelect}
          onNext={nextQuestion}
          onRetryLater={isRetryQuestion ? undefined : retryLater}
        />
      ) : null}
    </QuizFrame>
  )
}

function QuestionPanel({ question, currentIndex, total, selected, onSelect, onNext, onRetryLater }: {
  question: QuizQuestion
  currentIndex: number
  total: number
  selected: string | null
  onSelect: (id: string) => void
  onNext: () => void
  onRetryLater?: () => void
}) {
  const answered = selected !== null
  const correct = selected === question.answer
  const [retryQueued, setRetryQueued] = useState(false)
  useEffect(() => { setRetryQueued(false) }, [question.id])
  return (
    <LiquidGlassPanel padding={22} style={{ ...styles.questionPanel }}>
      <div style={styles.progressTop}>
        <LiquidBadge color="var(--teal-ink)">{question.prompt}</LiquidBadge>
        <span>{currentIndex + 1} / {total}</span>
      </div>
      {/* B5-1：分子含当前题 — 答完最后一题满格 */}
      <div style={styles.progressBar}><i style={{ width: `${((currentIndex + (answered ? 1 : 0)) / total) * 100}%` }} /></div>
      <h1 style={styles.question}>{question.question}</h1>
      <div style={styles.options}>
        {question.options.map((option, index) => {
          const isSelected = selected === option.id
          const isAnswer = question.answer === option.id
          const stateColor = answered && isAnswer ? '#0a8a6e' : answered && isSelected ? '#bf4a30' : 'var(--teal-ink)'
          // Demo01：答对 scale 弹跳 + 描边扩散；答错 ±4px shake
          const fxClass = answered && isSelected
            ? (isAnswer ? 'quiz-correct' : 'quiz-wrong')
            : ''
          return (
            <button
              type="button"
              key={option.id}
              onClick={() => onSelect(option.id)}
              disabled={answered}
              className={fxClass}
              style={{
                ...styles.option,
                borderColor: answered && (isSelected || isAnswer) ? stateColor : 'var(--line)',
                background: answered && (isSelected || isAnswer) ? `${stateColor}12` : 'var(--card-2)',
                color: answered && (isSelected || isAnswer) ? stateColor : 'var(--ink)',
              }}
            >
              <span style={styles.optionKey}>{String.fromCharCode(65 + index)}</span>
              <span>{option.text}</span>
            </button>
          )
        })}
      </div>
      {answered && (
        <LiquidGlassCard style={{ background: 'var(--card)', border: '1px solid var(--line)', backdropFilter: 'none' }}>
          <strong style={{ color: correct ? '#0a8a6e' : '#bf4a30' }}>
            {correct ? 'Correct · 答对了' : 'Not quite · 再看一次'}
          </strong>
          <p style={styles.explanation}>{question.explanation}</p>
          {question.explanationZh && <p style={styles.explanationZh}>{question.explanationZh}</p>}
          {/* B5-2：答错即时教学 — 错题归档确认 + 当场再曝光 */}
          {!correct && onRetryLater && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>已加入错题本 ✓</span>
              <button
                type="button"
                disabled={retryQueued}
                onClick={() => { setRetryQueued(true); onRetryLater() }}
                style={{
                  padding: '6px 12px', borderRadius: 999, cursor: retryQueued ? 'default' : 'pointer',
                  border: '1px solid var(--line-strong)', background: 'var(--card-2)',
                  fontSize: 12, fontWeight: 600, color: retryQueued ? 'var(--ink-muted)' : 'var(--teal-ink)',
                  fontFamily: 'var(--font-sans)',
                }}>
                {retryQueued ? '已排进本轮队尾 ✓' : '30 秒后再考我'}
              </button>
            </div>
          )}
        </LiquidGlassCard>
      )}
      <div style={styles.nextRow}>
        <LiquidActionButton disabled={!answered} onClick={onNext}>
          {currentIndex + 1 >= total ? 'See Results · 查看结果' : 'Next · 下一题'}
        </LiquidActionButton>
      </div>
    </LiquidGlassPanel>
  )
}

function Results({ score, total, onRestart, returnTo, wrongTotal, changedWords }: {
  score: number
  total: number
  onRestart: () => void
  returnTo: string | null
  wrongTotal: number
  changedWords?: string[]
}) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  return (
    <LiquidGlassPanel padding={28} style={styles.results}>
      <LiquidBadge color={pct >= 80 ? '#0a8a6e' : pct >= 60 ? 'var(--gold-ink)' : 'var(--rose-ink)'}>{pct}% accuracy</LiquidBadge>
      <h1 style={styles.resultScore}>{score} / {total}</h1>
      <p style={styles.resultText}>
        {pct >= 80 ? 'Strong recall. The sky is getting brighter.' : pct >= 60 ? 'Good pass. A few stars still need another orbit.' : 'Keep practicing. The weak spots are now saved for review.'}
      </p>
      {/* B5-3：动作收敛 — 主按钮唯一，其余降级 */}
      <div style={styles.resultActions}>
        {wrongTotal > 0 ? (
          <Link href="/memory?tab=wrong" style={{ textDecoration: 'none' }}>
            <LiquidActionButton>复习错题（{wrongTotal}）</LiquidActionButton>
          </Link>
        ) : (
          <Link href="/memory" style={{ textDecoration: 'none' }}>
            <LiquidActionButton>继续复习到期词</LiquidActionButton>
          </Link>
        )}
        <button type="button" onClick={onRestart} style={{ ...styles.linkButton, border: '1px solid var(--line)', cursor: 'pointer' }}>
          Try Again · 再练一次
        </button>
      </div>
      <p style={{ marginTop: 14, marginBottom: 0 }}>
        <Link href={returnTo ?? `/lexiverse${changedWords?.length ? `?highlight=${changedWords.slice(0, 8).map(encodeURIComponent).join(',')}` : ''}`}
          style={{ fontSize: 13, color: 'var(--ink-sub)', textDecorationColor: 'var(--line-strong)' }}>
          看星球变化 →
        </Link>
      </p>
    </LiquidGlassPanel>
  )
}

function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return (
    <LiquidGlassPanel style={styles.empty}>
      <h1>{title}</h1>
      <p>{detail}</p>
      {action}
    </LiquidGlassPanel>
  )
}

function QuizFrame({ children }: { children: ReactNode }) {
  return (
    <main className="theme-light" style={styles.page}>
      <div style={styles.wrap}>{children}</div>
    </main>
  )
}

function LinkButton({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} style={styles.linkButton}>{children}</Link>
}

function buildQuestions(args: {
  mode: QuizMode
  words: VocabWord[]
  wrongAnswers: WrongAnswer[]
  wordId?: string
  examTag: string
  seed: number
}): QuizQuestion[] {
  const rng = mulberry32(hash(`${args.mode}:${args.wordId ?? ''}:${args.examTag}:${args.seed}`))
  const usable = args.words.filter(w => firstDefinition(w).en && w.word)
  const preferred = args.wordId ? usable.find(w => w.id === args.wordId || w.word.toLowerCase() === args.wordId?.toLowerCase()) : null

  // A3：指定单词但词典无此词 → 空题集（上层显示空状态），不回退随机题
  if (args.wordId && !preferred && args.mode !== 'wrong-answer-booster') return []

  if (args.mode === 'wrong-answer-booster') {
    return args.wrongAnswers.slice(0, 8).map((wrong, index) => {
      const target = usable.find(w => w.id === wrong.wordId) ?? preferred ?? usable[index % usable.length]
      const distractors = pickWords(usable.filter(w => w.id !== target.id), 3, rng)
      const correctText = wrong.correctAnswer || target.word
      const options = shuffle([
        { id: 'a', text: correctText, wordId: target.id },
        ...distractors.map((w, i) => ({ id: String.fromCharCode(98 + i), text: w.word, wordId: w.id })),
      ], rng).map((o, i) => ({ ...o, id: String.fromCharCode(97 + i) }))
      const answer = options.find(o => o.text === correctText)?.id ?? options[0].id
      return {
        id: `wrong-${wrong.id}-${index}`,
        mode: args.mode,
        wordId: wrong.wordId,
        word: wrong.word,
        prompt: 'Correct your mistake · 纠正错题',
        question: wrong.question,
        options,
        answer,
        explanation: wrong.explanation || firstDefinition(target).en,
      }
    })
  }

  let pool = usable
  if (args.mode === 'sentence-practice') pool = usable.filter(w => firstExample(w).en)
  if (args.mode === 'exam-practice') pool = usable.filter(w => (w.examTags ?? []).includes(args.examTag))
  if (!pool.length) pool = usable

  const targets = preferred ? [preferred, ...pickWords(pool.filter(w => w.id !== preferred.id), 4, rng)] : pickWords(pool, 5, rng)
  return targets.map((target, index) => {
    if (args.mode === 'sentence-practice') return sentenceQuestion(target, usable, index, rng)
    return vocabQuestion(target, usable, index, rng, args.mode, args.examTag)
  })
}

/* P4：vs 辨析题 — A/B 各出一题，题面 = 例句挖空（无例句退中文释义），
   选项固定二选一（干扰项 = 另一词）。 */
function buildVsQuestions(a: DictionaryWord, b: DictionaryWord): QuizQuestion[] {
  const pair: [DictionaryWord, DictionaryWord][] = [[a, b], [b, a]]
  return pair.map(([target, other], index) => {
    const example = target.examples?.[0]
    const def = target.definitions?.[0]
    const blanked = example?.sentenceEn ? blankWord(example.sentenceEn, target.word) : ''
    const question = blanked
      || (def?.definitionZh ? `哪个词的意思是「${def.definitionZh}」？` : target.word)
    const options = (index % 2 === 0 ? [target, other] : [other, target]).map((w, i) => ({
      id: String.fromCharCode(97 + i), text: w.word, wordId: w.id,
    }))
    return {
      id: `vs-${target.id}-${index}`,
      mode: 'vocabulary-drill' as QuizMode,
      wordId: target.id,
      word: target.word,
      prompt: `辨析 · ${a.word} vs ${b.word}`,
      question,
      options,
      answer: options.find(o => o.wordId === target.id)?.id ?? 'a',
      explanation: [
        `${target.word}: ${target.definitions?.[0]?.definitionZh ?? target.definitions?.[0]?.definitionEn ?? ''}`,
        `${other.word}: ${other.definitions?.[0]?.definitionZh ?? other.definitions?.[0]?.definitionEn ?? ''}`,
      ].join('  ｜  '),
      explanationZh: example?.sentenceZh ?? '',
    }
  })
}

function vocabQuestion(target: VocabWord, allWords: VocabWord[], index: number, rng: () => number, mode: QuizMode, examTag: string): QuizQuestion {
  const distractors = pickWords(allWords.filter(w => w.id !== target.id), 3, rng)
  const options = shuffle([target, ...distractors], rng).map((w, i) => ({
    id: String.fromCharCode(97 + i),
    text: firstDefinition(w).en,
    wordId: w.id,
  }))
  return {
    id: `${mode}-${target.id}-${index}`,
    mode,
    wordId: target.id,
    word: target.word,
    prompt: mode === 'exam-practice' ? `${examTag} Practice · 应试练习` : 'Choose the meaning · 选择释义',
    question: target.word,
    options,
    answer: options.find(o => o.wordId === target.id)?.id ?? 'a',
    explanation: firstDefinition(target).en,
    explanationZh: firstDefinition(target).zh,
  }
}

function sentenceQuestion(target: VocabWord, allWords: VocabWord[], index: number, rng: () => number): QuizQuestion {
  const example = firstExample(target)
  const blanked = blankWord(example.en, target.word)
  const distractors = pickWords(allWords.filter(w => w.id !== target.id), 3, rng)
  const options = shuffle([target, ...distractors], rng).map((w, i) => ({
    id: String.fromCharCode(97 + i),
    text: w.word,
    wordId: w.id,
  }))
  return {
    id: `sentence-${target.id}-${index}`,
    mode: 'sentence-practice',
    wordId: target.id,
    word: target.word,
    prompt: 'Fill in the blank · 选词填空',
    question: blanked || target.word,
    options,
    answer: options.find(o => o.wordId === target.id)?.id ?? 'a',
    explanation: example.en || firstDefinition(target).en,
    explanationZh: example.zh,
  }
}

function firstDefinition(word: VocabWord) {
  const def = word.definitions?.[0] as DictionaryDefinition | undefined
  return { en: def?.definitionEn ?? '', zh: def?.definitionZh ?? '' }
}

function firstExample(word: VocabWord) {
  const ex = word.examples?.[0] as DictionaryExample | undefined
  return { en: ex?.sentenceEn ?? '', zh: ex?.sentenceZh ?? '' }
}

function blankWord(sentence: string, word: string) {
  if (!sentence) return ''
  const pattern = new RegExp(`\\b${escapeRegExp(word)}s?\\b`, 'i')
  return sentence.replace(pattern, '_____')
}

function pickWords(words: VocabWord[], count: number, rng: () => number) {
  return shuffle(words, rng).slice(0, Math.min(count, words.length))
}

function shuffle<T>(items: T[], rng: () => number) {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = next[i]
    next[i] = next[j]
    next[j] = tmp
  }
  return next
}

function parseMode(mode: string | null): QuizMode {
  if (mode === 'sentence-practice' || mode === 'exam-practice' || mode === 'wrong-answer-booster') return mode
  return 'vocabulary-drill'
}

function modeGlyph(mode: QuizMode) {
  if (mode === 'sentence-practice') return 'S'
  if (mode === 'exam-practice') return 'E'
  if (mode === 'wrong-answer-booster') return 'W'
  return 'V'
}

function hash(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  return function rng() {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--paper)',
    color: 'var(--ink)',
    fontFamily: 'var(--font-sans)',
  },
  wrap: {
    position: 'relative',
    zIndex: 1,
    width: 'min(1080px, calc(100vw - 32px))',
    margin: '0 auto',
    padding: '22px 0 40px',
  },
  header: {
    height: 54,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  brand: { color: 'var(--teal-ink)', fontSize: 18, fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--font-serif)' },
  sub: { marginLeft: 12, color: 'var(--ink-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' },
  modeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, margin: '14px 0' },
  modeCard: {
    minHeight: 146,
    padding: 15,
    border: '1px solid var(--line)',
    borderRadius: 12,
    background: 'var(--card)',
    color: 'var(--ink)',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'grid',
    gap: 6,
    boxShadow: 'var(--card-shadow-sm)',
  },
  modeIcon: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: '1px solid',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
  },
  examRow: { display: 'flex', gap: 8, flexWrap: 'wrap', margin: '0 0 14px' },
  examButton: {
    padding: '7px 11px',
    borderRadius: 999,
    border: '1px solid var(--line)',
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--ink-sub)',
  },
  questionPanel: { maxWidth: 760, margin: '18px auto 0', background: 'var(--card)', border: '1px solid var(--line)', backdropFilter: 'none', boxShadow: 'var(--card-shadow)', color: 'var(--ink)' },
  progressTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--ink-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' },
  progressBar: { height: 4, borderRadius: 999, background: 'var(--line)', margin: '14px 0 24px', overflow: 'hidden' },
  question: { fontSize: 'clamp(26px, 4vw, 46px)', lineHeight: 1.12, letterSpacing: 0, margin: '0 0 22px', color: 'var(--ink)', fontFamily: 'var(--font-serif-zh)' },
  options: { display: 'grid', gap: 10, marginBottom: 18 },
  option: {
    minHeight: 58,
    borderRadius: 12,
    border: '1px solid var(--line)',
    background: 'var(--card-2)',
    padding: '12px 14px',
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: 14,
    fontFamily: 'inherit',
    color: 'var(--ink)',
  },
  optionKey: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: '1px solid currentColor',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontFamily: 'var(--font-mono)',
  },
  explanation: { margin: '9px 0 0', color: 'var(--ink)', lineHeight: 1.6, fontSize: 14 },
  explanationZh: { margin: '4px 0 0', color: 'var(--ink-sub)', lineHeight: 1.5, fontSize: 13 },
  nextRow: { display: 'flex', justifyContent: 'flex-end', marginTop: 18 },
  results: { maxWidth: 560, margin: '32px auto 0', textAlign: 'center', background: 'var(--card)', border: '1px solid var(--line)', backdropFilter: 'none', boxShadow: 'var(--card-shadow)', color: 'var(--ink)' },
  resultScore: { fontSize: 'clamp(54px, 10vw, 92px)', margin: '16px 0 6px', letterSpacing: 0, color: 'var(--teal-ink)', fontFamily: 'var(--font-mono)' },
  resultText: { color: 'var(--ink-sub)', lineHeight: 1.6, marginBottom: 24 },
  resultActions: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' },
  linkButton: {
    minHeight: 43,
    padding: '0 16px',
    borderRadius: 12,
    border: '1px solid var(--line)',
    background: 'var(--card-2)',
    color: 'var(--teal-ink)',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 700,
  },
  empty: { maxWidth: 520, margin: '18vh auto 0', textAlign: 'center', background: 'var(--card)', border: '1px solid var(--line)', backdropFilter: 'none', color: 'var(--ink)' },
}
