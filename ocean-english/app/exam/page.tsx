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
  { id: 'TOEFL' as const, zh: '托福', desc: 'Test of English as a Foreign Language', color: '#0E8C7A' },
  { id: 'IELTS' as const, zh: '雅思', desc: 'International English Language Testing System', color: '#0E8C7A' },
  { id: 'CET-4' as const, zh: '四级', desc: '大学英语四级', color: '#0E8C7A' },
  { id: 'CET-6' as const, zh: '六级', desc: '大学英语六级', color: '#0E8C7A' },
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
      <div style={{ color: 'var(--ink-muted)', fontSize: '13px', padding: '20px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
        [ {exam} 样题 — 更多题目即将上线 ]
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {questions.map((q: ExamQuestion) => {
        const isRevealed = revealed.has(q.id)
        const selectedIdx = selected[q.id]
        return (
          <div key={q.id} style={{ background: 'var(--card-2)', border: '1px solid var(--line)', borderRadius: '10px', padding: '18px' }}>
            <div style={{ fontSize: '11px', color: 'var(--teal-ink)', opacity: 0.75, marginBottom: '8px', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
              {q.type.toUpperCase()} — {q.exam}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--ink)', marginBottom: '14px', lineHeight: 1.6 }}>{q.question}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {q.options.map((opt, i) => {
                const isSel = selectedIdx === i
                const isCorrect = isRevealed && opt === q.options[q.correctIndex]
                const isWrong = isRevealed && isSel && !isCorrect
                return (
                  <button key={opt} onClick={() => { setSelected(s => ({ ...s, [q.id]: i })) }}
                    style={{
                      padding: '10px 14px', borderRadius: '8px', textAlign: 'left',
                      background: isCorrect ? 'rgba(14,140,122,0.07)' : isWrong ? 'rgba(191,74,48,0.06)' : isSel ? 'var(--teal-bg)' : 'var(--card)',
                      border: `1px solid ${isCorrect ? 'rgba(14,140,122,0.4)' : isWrong ? 'rgba(191,74,48,0.3)' : isSel ? 'rgba(14,140,122,0.4)' : 'var(--line)'}`,
                      color: isCorrect ? 'var(--teal-ink)' : isWrong ? 'var(--rose-ink)' : 'var(--ink)',
                      fontSize: '13px', cursor: 'pointer',
                    }}>
                    {String.fromCharCode(65 + i)}. {opt}
                  </button>
                )
              })}
            </div>
            {selectedIdx !== undefined && !isRevealed && (
              <Button size="sm" onClick={() => setRevealed(prev => new Set(prev).add(q.id))}>
                查看答案
              </Button>
            )}
            {isRevealed && (
              <div style={{ background: 'rgba(14,140,122,0.06)', border: '1px solid rgba(14,140,122,0.2)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontSize: '12px', color: 'var(--teal-ink)', marginBottom: '6px' }}>
                  正确答案: {q.options[q.correctIndex]}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ink-sub)', lineHeight: 1.5 }}>{q.explanationZh}</div>
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
      <PageShell maxWidth={900} theme="light">
        <p style={{ margin: '0 0 6px', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--teal-ink)', opacity: 0.7 }}>
          考试枝路 · Exam
        </p>
        <h1 style={{ margin: '0 0 4px', fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 'clamp(24px, 3.5vw, 38px)', color: 'var(--ink)', letterSpacing: '0.01em' }}>
          考试枝路
        </h1>
        <p style={{ margin: '0 0 28px', fontFamily: 'var(--font-news)', fontStyle: 'italic', fontSize: '15px', color: 'var(--teal-ink)' }}>
          Exam Branch — Focused preparation &amp; practice questions
        </p>

        {/* Exam selector grid */}
        <SectionHeader label="SELECT EXAM" labelZh="选择考试" theme="light" style={{ marginBottom: '14px' }} />
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
                  background: active ? `${exam.color}10` : 'var(--card)',
                  border: `1px solid ${active ? `${exam.color}55` : 'var(--line)'}`,
                  borderRadius: 'var(--r-sm)',
                  padding: '18px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, background 0.2s',
                  boxShadow: active ? `0 0 18px ${exam.color}12` : 'var(--card-shadow-sm)',
                }}
              >
                <div style={{ fontFamily: 'var(--font-serif-zh)', fontSize: '16px', fontWeight: 600, color: active ? exam.color : 'var(--ink)', marginBottom: '2px' }}>
                  {exam.zh}
                </div>
                <div style={{ fontSize: '12px', color: active ? exam.color : 'var(--teal-ink)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                  {exam.id}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ink-muted)', lineHeight: 1.4 }}>{exam.desc}</div>
              </motion.button>
            )
          })}
        </div>

        {/* Sample drill */}
        <GlassCard theme="light">
          <div style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'var(--teal-ink)', opacity: 0.7, fontFamily: 'var(--font-mono)', marginBottom: '18px' }}>
            {selectedExam ? `${selectedExam} · 样题练习` : '样题示例'}
            <span style={{ marginLeft: '10px', color: 'var(--ink-muted)' }}>(模拟数据)</span>
          </div>
          <MockDrillSection exam={selectedExam} />
        </GlassCard>

        <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link href="/study" style={{ fontSize: '13px', color: 'var(--teal-ink)', textDecoration: 'none' }}>
            ← 返回学习中心
          </Link>
          <Button as="a" href="/quiz" variant="ghost" size="sm">
            词汇练习 →
          </Button>
          <Link href="/lexigraph" style={{ fontSize: '13px', color: 'var(--ink-sub)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>
            ✦ 词汇星图
          </Link>
        </div>
      </PageShell>
    </AppShell>
  )
}
