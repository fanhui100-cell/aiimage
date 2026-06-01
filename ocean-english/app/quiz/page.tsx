'use client'

import { useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { useLearningStore } from '@/store/learningStore'
import { getRandomQuiz, getQuizForWord } from '@/data/mock-quiz'
import type { QuizQuestion, QuizAttempt } from '@/types/quiz'
import Link from 'next/link'

function QuizContent() {
  const searchParams = useSearchParams()
  const wordParam = searchParams.get('word')

  const [questions] = useState<QuizQuestion[]>(() =>
    wordParam ? getQuizForWord(wordParam).slice(0, 3).concat(getRandomQuiz(2)) : getRandomQuiz(5),
  )
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
      // Save completed session to quiz history
      const finalAttempts = [...attempts]
      if (selected && current) {
        // current attempt already in `attempts` via handleSelect
      }
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
  }, [currentIdx, questions.length, attempts, selected, current, addQuizSession])

  const score = attempts.filter(a => a.correct).length

  if (!current || questions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px', color: '#9BBFCA' }}>
        No questions available. <Link href="/dictionary" style={{ color: '#38BDF8' }}>Go to Dictionary</Link>
      </div>
    )
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪'}</div>
        <h2 style={{ color: '#ECFBFF', margin: '0 0 8px', fontSize: '28px' }}>
          {score} / {questions.length} Correct
        </h2>
        <p style={{ color: '#9BBFCA', marginBottom: '8px' }}>
          {pct}% accuracy
        </p>
        <p style={{ color: 'rgba(155,191,202,0.6)', marginBottom: '32px', fontSize: '13px' }}>
          {pct >= 80 ? 'Excellent work! 优秀！' : pct >= 60 ? 'Good effort! 不错！' : 'Keep practicing! 继续加油！'}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setCurrentIdx(0); setSelected(null); setShowFeedback(false); setAttempts([]); setFinished(false) }}
            style={{
              padding: '12px 28px',
              borderRadius: '8px',
              background: 'rgba(56,189,248,0.15)',
              border: '1px solid rgba(56,189,248,0.5)',
              color: '#38BDF8',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ↺ Try Again / 再试一次
          </button>
          <Link
            href="/memory"
            style={{
              padding: '12px 28px',
              borderRadius: '8px',
              background: 'rgba(52,211,153,0.1)',
              border: '1px solid rgba(52,211,153,0.4)',
              color: '#34D399',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Wrong Answers / 错题本 →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', color: '#9BBFCA' }}>
          Question {currentIdx + 1} of {questions.length} / 第 {currentIdx + 1} 题
        </div>
        <div style={{ fontSize: '13px', color: '#34D399' }}>
          ✓ {attempts.filter(a => a.correct).length} correct / 答对
        </div>
      </div>
      <div
        style={{
          height: '4px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '2px',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${((currentIdx) / questions.length) * 100}%`,
            background: '#38BDF8',
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Word tag */}
      <div
        style={{
          display: 'inline-block',
          fontSize: '11px',
          padding: '3px 10px',
          borderRadius: '4px',
          background: 'rgba(56,189,248,0.08)',
          color: 'rgba(56,189,248,0.7)',
          border: '1px solid rgba(56,189,248,0.2)',
          fontFamily: 'ui-monospace, monospace',
          marginBottom: '14px',
        }}
      >
        {current.word}
      </div>

      {/* Question */}
      <h2 style={{ color: '#ECFBFF', margin: '0 0 28px', fontSize: '20px', lineHeight: 1.5 }}>
        {current.question}
      </h2>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        {current.options?.map(opt => {
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
          return (
            <button
              key={opt.id}
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
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: `1px solid ${borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  flexShrink: 0,
                  color: textColor,
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                {opt.id.toUpperCase()}
              </span>
              {opt.text}
            </button>
          )
        })}
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div
          style={{
            background: isCorrect ? 'rgba(52,211,153,0.08)' : 'rgba(239,68,68,0.06)',
            border: `1px solid ${isCorrect ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.2)'}`,
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ fontSize: '15px', fontWeight: 600, color: isCorrect ? '#34D399' : 'rgba(239,68,68,0.8)', marginBottom: '8px' }}>
            {isCorrect ? '✓ Correct! 答对了！' : '✗ Incorrect. 答错了。'}
          </div>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#ECFBFF', lineHeight: 1.6 }}>
            {current.explanation}
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#9BBFCA' }}>{current.explanationZh}</p>
        </div>
      )}

      {showFeedback && (
        <button
          onClick={handleNext}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '10px',
            background: 'rgba(56,189,248,0.15)',
            border: '1px solid rgba(56,189,248,0.5)',
            color: '#38BDF8',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {currentIdx + 1 >= questions.length ? 'See Results / 查看结果' : 'Next Question / 下一题'} →
        </button>
      )}
    </div>
  )
}

export default function QuizPage() {
  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px 0' }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '32px', fontWeight: 700, color: '#ECFBFF' }}>
            Quiz Mode <span style={{ fontSize: '18px', color: '#9BBFCA' }}>练习模式</span>
          </h1>
          <p style={{ margin: '0 0 32px', color: '#9BBFCA', fontSize: '14px' }}>
            Test your vocabulary. Wrong answers go to your error notebook.
            <br />
            <span style={{ color: 'rgba(155,191,202,0.6)', fontSize: '13px' }}>
              词汇测试。答错的题目自动加入错题本。
            </span>
          </p>
        </div>
        <Suspense fallback={<div style={{ color: '#9BBFCA', textAlign: 'center', padding: '40px' }}>Loading...</div>}>
          <QuizContent />
        </Suspense>
      </div>
    </AppShell>
  )
}
