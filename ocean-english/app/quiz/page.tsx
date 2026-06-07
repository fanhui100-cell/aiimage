'use client'

import { useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { QuizModeSelector } from '@/components/quiz/QuizModeSelector'
import { QuizSourceBadge } from '@/components/quiz/QuizSourceBadge'
import { useLearningStore } from '@/store/learningStore'
import { getRandomQuiz, getQuizForWord } from '@/data/mock-quiz'
import { buildVocabularyDrillSession } from '@/lib/question-bank/question-bank-session-builder'
import type { QuizQuestion, QuizAttempt } from '@/types/quiz'
import Link from 'next/link'

function QuizContent() {
  const searchParams = useSearchParams()
  const wordParam = searchParams.get('word')
  const modeParam = searchParams.get('mode')
  const difficultyParam = searchParams.get('difficulty')
  const activeMode = modeParam === 'vocabulary-drill' ? 'vocabulary-drill' : 'quick'
  const difficulty =
    difficultyParam === '1' ||
    difficultyParam === '2' ||
    difficultyParam === '3' ||
    difficultyParam === '4' ||
    difficultyParam === '5'
      ? Number(difficultyParam) as 1 | 2 | 3 | 4 | 5
      : undefined

  const [questions] = useState<QuizQuestion[]>(() => {
    if (activeMode === 'vocabulary-drill') {
      return buildVocabularyDrillSession({
        count: 5,
        wordId: wordParam ?? undefined,
        normalizedWord: wordParam ?? undefined,
        difficultyLevel: difficulty,
      })
    }
    return wordParam ? getQuizForWord(wordParam).slice(0, 3).concat(getRandomQuiz(2)) : getRandomQuiz(5)
  })
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [finished, setFinished] = useState(false)

  const { addWrongAnswer, addQuizSession, completeTaskUnit, incrementXp, markStudyToday } =
    useLearningStore()

  const current = questions[currentIdx]
  const isCorrect = selected === current?.correctAnswer

  const handleSelect = useCallback(
    (optionId: string) => {
      if (showFeedback) return
      setSelected(optionId)
      setShowFeedback(true)

      const correct = optionId === current.correctAnswer
      const attempt: QuizAttempt = {
        questionId: current.id,
        wordId: current.wordId,
        word: current.word,
        userAnswer: optionId,
        correct,
        timestamp: Date.now(),
      }
      setAttempts(prev => [...prev, attempt])

      if (!correct) {
        addWrongAnswer({
          wordId: current.wordId,
          word: current.word,
          question: current.question,
          userAnswer: optionId,
          correctAnswer: current.correctAnswer,
          explanation: current.explanation,
          timestamp: Date.now(),
        })
      } else {
        incrementXp(20)
        completeTaskUnit('quiz-5', 1)
        markStudyToday()
      }
    },
    [showFeedback, current, addWrongAnswer, incrementXp, completeTaskUnit, markStudyToday],
  )

  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= questions.length) {
      const finalAttempts = [...attempts]
      addQuizSession({
        id: `session-${Date.now()}`,
        startedAt: Date.now(),
        completedAt: Date.now(),
        attempts: finalAttempts,
        score: finalAttempts.filter(a => a.correct).length,
        total: questions.length,
      })
      setFinished(true)
    } else {
      setCurrentIdx(i => i + 1)
      setSelected(null)
      setShowFeedback(false)
    }
  }, [currentIdx, questions.length, attempts, addQuizSession])

  const score = attempts.filter(a => a.correct).length

  if (!current || questions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--ink-sub)' }}>
        暂无题目。{' '}
        <Link href="/dictionary" style={{ color: 'var(--teal-ink)' }}>前往词典</Link>
      </div>
    )
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        style={{ maxWidth: '520px', margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}
      >
        <GlassCard theme="light" style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '36px', fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
            {score} <span style={{ fontSize: '18px', color: 'var(--ink-sub)' }}>/ {questions.length}</span>
          </div>
          <div style={{ fontSize: '20px', color: pct >= 80 ? 'var(--teal-ink)' : pct >= 60 ? 'var(--teal-ink)' : 'var(--ink-sub)', fontWeight: 600, marginBottom: '4px' }}>
            {pct}%
          </div>
          <div style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>
            {pct >= 80 ? '优秀！Excellent!' : pct >= 60 ? '不错！Good effort!' : '继续加油！Keep going!'}
          </div>
        </GlassCard>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
          <Button
            variant="primary"
            onClick={() => { setCurrentIdx(0); setSelected(null); setShowFeedback(false); setAttempts([]); setFinished(false) }}
          >
            再试一次
          </Button>
          <Button as="a" href="/memory" variant="success">
            继续复习 →
          </Button>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button as="a" href="/chat" variant="ghost" size="sm">
            问 AI
          </Button>
          {wordParam && (
            <Button as="a" href={`/lexigraph?word=${wordParam}`} variant="ghost" size="sm">
              词汇星图
            </Button>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 24px 40px' }}>
      <QuizModeSelector activeMode={activeMode} wordParam={wordParam} />

      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '12px', color: 'var(--ink-sub)', fontFamily: 'var(--font-mono)' }}>
          {currentIdx + 1} / {questions.length}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--teal-ink)', fontFamily: 'var(--font-mono)' }}>
          ✓ {attempts.filter(a => a.correct).length}
        </div>
      </div>
      <div style={{ height: '3px', background: 'rgba(20,30,40,0.08)', borderRadius: '2px', marginBottom: '32px', overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', background: 'linear-gradient(90deg, var(--teal-ink), var(--teal))', borderRadius: '2px' }}
          initial={false}
          animate={{ width: `${((currentIdx) / questions.length) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Word tag */}
      <div style={{
        display: 'inline-block', fontSize: '11px', padding: '3px 10px',
        borderRadius: '4px', background: 'var(--teal-bg)', color: 'var(--teal-ink)',
        border: '1px solid rgba(14,140,122,0.2)', fontFamily: 'var(--font-mono)', marginBottom: '14px',
      }}>
        {current.word}
        {activeMode === 'vocabulary-drill' && <QuizSourceBadge questionId={current.id} />}
      </div>

      {/* Question */}
      <h2 style={{ color: 'var(--ink)', margin: '0 0 28px', fontSize: '20px', lineHeight: 1.5 }}>
        {current.question}
      </h2>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        {current.options?.map((opt, idx) => {
          const isSelected = selected === opt.id
          const isCorrectOpt = opt.id === current.correctAnswer
          let borderColor = 'var(--line)'
          let bgColor = 'var(--card)'
          let textColor = 'var(--ink)'
          if (showFeedback) {
            if (isCorrectOpt) { borderColor = 'rgba(14,140,122,0.5)'; bgColor = 'rgba(14,140,122,0.07)'; textColor = 'var(--teal-ink)' }
            else if (isSelected && !isCorrectOpt) { borderColor = 'rgba(191,74,48,0.4)'; bgColor = 'rgba(191,74,48,0.06)'; textColor = 'var(--rose-ink)' }
          } else if (isSelected) {
            borderColor = 'rgba(14,140,122,0.4)'; bgColor = 'var(--teal-bg)'
          }

          const shakeAnim = showFeedback && isSelected && !isCorrectOpt
            ? { x: [-3, 3, -3, 3, 0], transition: { duration: 0.35 } }
            : {}

          return (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, ...shakeAnim }}
              transition={{ delay: idx * 0.04, duration: 0.2 }}
              onClick={() => handleSelect(opt.id)}
              style={{
                padding: '14px 18px',
                borderRadius: '10px',
                background: bgColor,
                border: `1px solid ${borderColor}`,
                color: textColor,
                fontSize: '14px',
                textAlign: 'left',
                cursor: showFeedback ? 'default' : 'pointer',
                transition: 'background 0.2s, border-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                boxShadow: 'var(--card-shadow-sm)',
              }}
            >
              <span style={{
                width: '24px', height: '24px', borderRadius: '50%',
                border: `1px solid ${borderColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', flexShrink: 0, color: textColor,
                fontFamily: 'var(--font-mono)',
              }}>
                {opt.id.toUpperCase()}
              </span>
              {opt.text}
            </motion.button>
          )
        })}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div style={{
              background: isCorrect ? 'rgba(14,140,122,0.06)' : 'rgba(191,74,48,0.05)',
              border: `1px solid ${isCorrect ? 'rgba(14,140,122,0.25)' : 'rgba(191,74,48,0.18)'}`,
              borderRadius: '10px', padding: '16px', marginBottom: '16px',
            }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: isCorrect ? 'var(--teal-ink)' : 'var(--rose-ink)', marginBottom: '8px' }}>
                {isCorrect ? '✓ 答对了！' : '✗ 答错了。'}
              </div>
              <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6 }}>{current.explanation}</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-sub)' }}>{current.explanationZh}</p>
            </div>

            <Button onClick={handleNext} style={{ width: '100%', padding: '14px' }}>
              {currentIdx + 1 >= questions.length ? '查看结果' : '下一题'} →
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function QuizPage() {
  return (
    <AppShell>
      <div className="theme-light" style={{ minHeight: '100vh', paddingTop: '80px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px 0' }}>
          <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--teal-ink)', opacity: 0.7 }}>
            练习模式 · Quiz
          </p>
          <h1 style={{ margin: '0 0 4px', fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 'clamp(24px, 3.5vw, 38px)', color: 'var(--ink)', letterSpacing: '0.01em' }}>
            练习模式
          </h1>
          <p style={{ margin: '0 0 32px', fontFamily: 'var(--font-news)', fontStyle: 'italic', fontSize: '15px', color: 'var(--teal-ink)' }}>
            Quiz Mode — Vocabulary testing &amp; error notebook
          </p>
        </div>
        <Suspense fallback={<div style={{ color: 'var(--ink-sub)', textAlign: 'center', padding: '40px', fontFamily: 'var(--font-mono)' }}>loading…</div>}>
          <QuizContent />
        </Suspense>
      </div>
    </AppShell>
  )
}
