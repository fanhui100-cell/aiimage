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
      <div style={{ textAlign: 'center', padding: '80px 24px', color: '#9BBFCA' }}>
        No questions available.{' '}
        <Link href="/dictionary" style={{ color: '#38BDF8' }}>Go to Dictionary</Link>
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
        <div style={{ fontSize: '52px', marginBottom: '20px' }}>{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪'}</div>
        <GlassCard style={{ marginBottom: '24px', border: `1px solid ${pct >= 80 ? 'rgba(52,211,153,0.3)' : pct >= 60 ? 'rgba(56,189,248,0.25)' : 'rgba(155,191,202,0.15)'}` }}>
          <div style={{ fontSize: '36px', fontWeight: 700, color: '#ECFBFF', marginBottom: '4px' }}>
            {score} <span style={{ fontSize: '18px', color: '#9BBFCA' }}>/ {questions.length}</span>
          </div>
          <div style={{ fontSize: '20px', color: pct >= 80 ? '#34D399' : pct >= 60 ? '#38BDF8' : '#9BBFCA', fontWeight: 600, marginBottom: '4px' }}>
            {pct}%
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(155,191,202,0.6)' }}>
            {pct >= 80 ? 'Excellent! 优秀！' : pct >= 60 ? 'Good effort! 不错！' : 'Keep going! 继续加油！'}
          </div>
        </GlassCard>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
          <Button
            variant="primary"
            onClick={() => { setCurrentIdx(0); setSelected(null); setShowFeedback(false); setAttempts([]); setFinished(false) }}
          >
            ↺ Try Again / 再试一次
          </Button>
          <Button as="a" href="/memory" variant="success">
            Continue Review / 继续复习 →
          </Button>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button as="a" href="/chat" variant="secondary" size="sm">
            ✦ Ask AI / 问 AI
          </Button>
          {wordParam && (
            <Button as="a" href={`/lexigraph?word=${wordParam}`} variant="ghost" size="sm">
              ✦ LexiGraph
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
        <div style={{ fontSize: '12px', color: '#9BBFCA', fontFamily: 'var(--font-mono)' }}>
          {currentIdx + 1} / {questions.length}
        </div>
        <div style={{ fontSize: '12px', color: '#34D399', fontFamily: 'var(--font-mono)' }}>
          ✓ {attempts.filter(a => a.correct).length}
        </div>
      </div>
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', marginBottom: '32px', overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', background: 'linear-gradient(90deg, #38BDF8, #7EF9FF)', borderRadius: '2px' }}
          initial={false}
          animate={{ width: `${((currentIdx) / questions.length) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Word tag */}
      <div style={{
        display: 'inline-block', fontSize: '11px', padding: '3px 10px',
        borderRadius: '4px', background: 'rgba(56,189,248,0.08)', color: 'rgba(56,189,248,0.7)',
        border: '1px solid rgba(56,189,248,0.2)', fontFamily: 'var(--font-mono)', marginBottom: '14px',
      }}>
        {current.word}
        {activeMode === 'vocabulary-drill' && <QuizSourceBadge questionId={current.id} />}
      </div>

      {/* Question */}
      <h2 style={{ color: '#ECFBFF', margin: '0 0 28px', fontSize: '20px', lineHeight: 1.5 }}>
        {current.question}
      </h2>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        {current.options?.map((opt, idx) => {
          const isSelected = selected === opt.id
          const isCorrectOpt = opt.id === current.correctAnswer
          let borderColor = 'rgba(155,191,202,0.2)'
          let bgColor = 'rgba(255,255,255,0.03)'
          let textColor = '#ECFBFF'
          if (showFeedback) {
            if (isCorrectOpt) { borderColor = 'rgba(52,211,153,0.6)'; bgColor = 'rgba(52,211,153,0.1)'; textColor = '#34D399' }
            else if (isSelected && !isCorrectOpt) { borderColor = 'rgba(239,68,68,0.5)'; bgColor = 'rgba(239,68,68,0.08)'; textColor = 'rgba(239,68,68,0.8)' }
          } else if (isSelected) {
            borderColor = 'rgba(56,189,248,0.6)'; bgColor = 'rgba(56,189,248,0.08)'
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
              background: isCorrect ? 'rgba(52,211,153,0.07)' : 'rgba(239,68,68,0.05)',
              border: `1px solid ${isCorrect ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.2)'}`,
              borderRadius: '10px', padding: '16px', marginBottom: '16px',
            }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: isCorrect ? '#34D399' : 'rgba(239,68,68,0.8)', marginBottom: '8px' }}>
                {isCorrect ? '✓ Correct! 答对了！' : '✗ Incorrect. 答错了。'}
              </div>
              <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#ECFBFF', lineHeight: 1.6 }}>{current.explanation}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#9BBFCA' }}>{current.explanationZh}</p>
            </div>

            <Button onClick={handleNext} style={{ width: '100%', padding: '14px' }}>
              {currentIdx + 1 >= questions.length ? 'See Results / 查看结果' : 'Next Question / 下一题'} →
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
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px 0' }}>
          <div style={{ marginBottom: '8px', fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(56,189,248,0.45)', fontFamily: 'var(--font-mono)' }}>
            LEXIOCEAN / QUIZ MODE
          </div>
          <h1 style={{ margin: '0 0 4px', fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 700, color: '#ECFBFF' }}>
            Quiz Mode <span style={{ fontSize: '18px', color: '#9BBFCA' }}>练习模式</span>
          </h1>
          <p style={{ margin: '0 0 32px', color: '#9BBFCA', fontSize: '14px' }}>
            Test your vocabulary. Wrong answers go to your error notebook.
            <br />
            <span style={{ color: 'rgba(155,191,202,0.5)', fontSize: '13px' }}>词汇测试。答错的题目自动加入错题本。</span>
          </p>
        </div>
        <Suspense fallback={<div style={{ color: '#9BBFCA', textAlign: 'center', padding: '40px', fontFamily: 'var(--font-mono)' }}>loading…</div>}>
          <QuizContent />
        </Suspense>
      </div>
    </AppShell>
  )
}
