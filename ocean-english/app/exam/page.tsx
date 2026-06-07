'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { PageShell } from '@/components/ui/PageShell'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/SectionHeader'
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
      <div style={{ color: 'rgba(155,191,202,0.4)', fontSize: '13px', padding: '20px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
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
          <div key={q.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(155,191,202,0.1)', borderRadius: '10px', padding: '18px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(56,189,248,0.5)', marginBottom: '8px', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
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
                    style={{
                      padding: '10px 14px', borderRadius: '8px', textAlign: 'left',
                      background: isCorrect ? 'rgba(52,211,153,0.08)' : isWrong ? 'rgba(239,68,68,0.06)' : isSel ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isCorrect ? 'rgba(52,211,153,0.4)' : isWrong ? 'rgba(239,68,68,0.3)' : isSel ? 'rgba(56,189,248,0.4)' : 'rgba(155,191,202,0.1)'}`,
                      color: isCorrect ? '#34D399' : isWrong ? 'rgba(239,68,68,0.7)' : '#ECFBFF',
                      fontSize: '13px', cursor: 'pointer',
                    }}>
                    {String.fromCharCode(65 + i)}. {opt}
                  </button>
                )
              })}
            </div>
            {selectedIdx !== undefined && !isRevealed && (
              <Button size="sm" onClick={() => setRevealed(prev => new Set(prev).add(q.id))}>
                Check Answer / 查看答案
              </Button>
            )}
            {isRevealed && (
              <div style={{ background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '8px', padding: '12px' }}>
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
      <PageShell maxWidth={900}>
        <div style={{ marginBottom: '8px', fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(139,92,246,0.5)', fontFamily: 'var(--font-mono)' }}>
          LEXIOCEAN / EXAM BRANCH
        </div>
        <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 700, color: '#ECFBFF' }}>
          Exam Branch <span style={{ fontSize: '18px', color: '#9BBFCA' }}>考试枝路</span>
        </h1>
        <p style={{ margin: '0 0 28px', color: '#9BBFCA', fontSize: '14px', lineHeight: 1.6 }}>
          Choose your target exam for focused preparation and practice questions.
          <br />
          <span style={{ color: 'rgba(155,191,202,0.5)', fontSize: '13px' }}>选择目标考试，专项备考与练习。</span>
        </p>

        {/* Exam selector grid */}
        <SectionHeader label="SELECT EXAM" labelZh="选择考试" style={{ marginBottom: '14px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px', marginBottom: '28px' }}>
          {examTypes.map((exam, i) => {
            const active = selectedExam === exam.id
            return (
              <motion.button
                key={exam.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
                whileHover={{ y: -2 }}
                onClick={() => setSelectedExam(selectedExam === exam.id ? null : exam.id)}
                style={{
                  background: active ? `${exam.color}10` : 'var(--glass-bg)',
                  border: `1px solid ${active ? `${exam.color}60` : 'var(--glass-border)'}`,
                  borderRadius: '10px',
                  padding: '18px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, background 0.2s',
                  boxShadow: active ? `0 0 18px ${exam.color}12` : 'none',
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 700, color: active ? exam.color : '#ECFBFF', marginBottom: '2px' }}>
                  {exam.id}
                </div>
                <div style={{ fontSize: '13px', color: '#9BBFCA', marginBottom: '4px' }}>{exam.zh}</div>
                <div style={{ fontSize: '11px', color: 'rgba(155,191,202,0.45)', lineHeight: 1.4 }}>{exam.desc}</div>
              </motion.button>
            )
          })}
        </div>

        {/* Sample drill */}
        <GlassCard>
          <div style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(56,189,248,0.5)', fontFamily: 'var(--font-mono)', marginBottom: '18px' }}>
            {selectedExam ? `${selectedExam} SAMPLE DRILL / 样题练习` : 'SAMPLE QUESTIONS / 样题示例'}
            <span style={{ marginLeft: '10px', color: 'rgba(155,191,202,0.3)' }}>(Mock data — 模拟数据)</span>
          </div>
          <MockDrillSection exam={selectedExam} />
        </GlassCard>

        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link href="/study" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>
            ← Back to Study
          </Link>
          <Button as="a" href="/quiz" variant="secondary" size="sm">
            Quiz More Words / 练习 →
          </Button>
          <Link href="/lexigraph" style={{ fontSize: '13px', color: 'rgba(126,249,255,0.55)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>
            ✦ LexiGraph
          </Link>
        </div>
      </PageShell>
    </AppShell>
  )
}
