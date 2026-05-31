'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { mockExamQuestions } from '@/data/mock-exam-questions'
import type { ExamQuestion } from '@/data/mock-exam-questions'

type ExamType = 'TOEFL' | 'IELTS' | 'CET-4' | 'CET-6' | 'KAOYAN' | 'GAOKAO' | null

const examTypes = [
  { id: 'TOEFL' as const, zh: '托福', desc: 'Test of English as a Foreign Language', color: '#38BDF8' },
  { id: 'IELTS' as const, zh: '雅思', desc: 'International English Language Testing System', color: '#7EF9FF' },
  { id: 'CET-4' as const, zh: '四级', desc: '大学英语四级', color: '#34D399' },
  { id: 'CET-6' as const, zh: '六级', desc: '大学英语六级', color: '#B8FFB2' },
  { id: 'KAOYAN' as const, zh: '考研', desc: 'Graduate School Entrance Exam English', color: '#8B5CF6' },
  { id: 'GAOKAO' as const, zh: '高考', desc: 'National College Entrance Exam English', color: '#F97316' },
]

function MockDrillSection({ exam }: { exam: ExamType }) {
  const [selected, setSelected] = useState<Record<string, number>>({})
  const [revealed, setRevealed] = useState<Set<string>>(new Set())

  const questions = mockExamQuestions.filter(
    (q: ExamQuestion) => exam === null || q.exam === exam,
  ).slice(0, 2)

  if (questions.length === 0) {
    return (
      <div style={{ color: 'rgba(155,191,202,0.4)', fontSize: '13px', padding: '20px', textAlign: 'center', fontFamily: 'ui-monospace, monospace' }}>
        [ Sample questions for {exam} — more content in Phase 3 ]
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {questions.map((q: ExamQuestion) => {
        const isRevealed = revealed.has(q.id)
        const selectedIdx = selected[q.id]
        return (
          <div key={q.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(155,191,202,0.12)', borderRadius: '10px', padding: '18px' }}>
            <div style={{ fontSize: '12px', color: 'rgba(56,189,248,0.5)', marginBottom: '8px', fontFamily: 'ui-monospace, monospace' }}>
              {q.type.toUpperCase()} — {q.exam}
            </div>
            <div style={{ fontSize: '14px', color: '#ECFBFF', marginBottom: '14px', lineHeight: 1.6 }}>{q.question}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {q.options.map((opt, i) => {
                const isSel = selectedIdx === i
                const isCorrect = isRevealed && opt === q.options[q.correctIndex]
                const isWrong = isRevealed && isSel && !isCorrect
                return (
                  <button key={opt} onClick={() => { setSelected(s => ({ ...s, [q.id]: i })) }}
                    style={{ padding: '10px 14px', borderRadius: '8px', textAlign: 'left', background: isCorrect ? 'rgba(52,211,153,0.08)' : isWrong ? 'rgba(239,68,68,0.06)' : isSel ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isCorrect ? 'rgba(52,211,153,0.4)' : isWrong ? 'rgba(239,68,68,0.3)' : isSel ? 'rgba(56,189,248,0.4)' : 'rgba(155,191,202,0.1)'}`, color: isCorrect ? '#34D399' : isWrong ? 'rgba(239,68,68,0.7)' : '#ECFBFF', fontSize: '13px', cursor: 'pointer' }}>
                    {String.fromCharCode(65 + i)}. {opt}
                  </button>
                )
              })}
            </div>
            {selectedIdx !== undefined && !isRevealed && (
              <button onClick={() => setRevealed(prev => new Set(prev).add(q.id))}
                style={{ padding: '8px 18px', borderRadius: '6px', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', color: '#38BDF8', fontSize: '12px', cursor: 'pointer' }}>
                Check Answer / 查看答案
              </button>
            )}
            {isRevealed && (
              <div style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '12px', color: '#34D399', marginBottom: '6px' }}>
                  Correct answer: {q.options[q.correctIndex]}
                </div>
                <div style={{ fontSize: '12px', color: '#9BBFCA', lineHeight: 1.5 }}>{q.explanationZh}</div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function ExamPage() {
  const [selectedExam, setSelectedExam] = useState<ExamType>(null)

  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
          <h1 style={{ margin: '0 0 6px', fontSize: '32px', fontWeight: 700, color: '#ECFBFF' }}>
            Exam Branch <span style={{ fontSize: '18px', color: '#9BBFCA' }}>考试枝路</span>
          </h1>
          <p style={{ margin: '0 0 28px', color: '#9BBFCA', fontSize: '14px' }}>
            Choose your target exam for focused preparation and practice questions.
            <br />
            <span style={{ color: 'rgba(155,191,202,0.6)', fontSize: '13px' }}>选择目标考试，专项备考与练习。</span>
          </p>

          {/* Exam selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', marginBottom: '32px' }}>
            {examTypes.map(exam => (
              <button
                key={exam.id}
                onClick={() => setSelectedExam(selectedExam === exam.id ? null : exam.id)}
                style={{
                  background: selectedExam === exam.id ? `${exam.color}12` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedExam === exam.id ? `${exam.color}60` : 'rgba(155,191,202,0.15)'}`,
                  borderRadius: '10px',
                  padding: '18px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: selectedExam === exam.id ? `0 0 16px ${exam.color}10` : 'none',
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 700, color: selectedExam === exam.id ? exam.color : '#ECFBFF', marginBottom: '2px' }}>
                  {exam.id}
                </div>
                <div style={{ fontSize: '13px', color: '#9BBFCA', marginBottom: '6px' }}>{exam.zh}</div>
                <div style={{ fontSize: '11px', color: 'rgba(155,191,202,0.5)' }}>{exam.desc}</div>
              </button>
            ))}
          </div>

          {/* Sample drill */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(155,191,202,0.12)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ fontSize: '12px', letterSpacing: '0.1em', color: 'rgba(56,189,248,0.5)', fontFamily: 'ui-monospace, monospace', marginBottom: '18px' }}>
              {selectedExam ? `${selectedExam} SAMPLE DRILL / 样题练习` : 'SAMPLE QUESTIONS / 样题示例'}
              <span style={{ marginLeft: '12px', color: 'rgba(155,191,202,0.3)' }}>(Mock data — 模拟数据)</span>
            </div>
            <MockDrillSection exam={selectedExam} />
          </div>

          <div style={{ marginTop: '24px' }}>
            <Link href="/" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>
              ← Back to Home / 返回首页
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
