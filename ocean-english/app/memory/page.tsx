'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { AppShell } from '@/components/layout/AppShell'
import { PageShell } from '@/components/ui/PageShell'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { useLearningStore } from '@/store/learningStore'
import { getMockWord } from '@/data/mock-words'

type Tab = 'saved' | 'review' | 'wrong'

export default function MemoryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('saved')
  const [revealed, setRevealed] = useState<Set<string>>(new Set())

  const { savedWords, reviewWords, wrongAnswers, getDueWords, removeWrongAnswer, updateReview, completeTaskUnit, incrementXp } = useLearningStore()

  const dueWords = getDueWords()

  const tabVariant = (tab: Tab) => activeTab === tab ? 'primary' : 'ghost'

  function toggleReveal(id: string) {
    setRevealed(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function handleReview(wordId: string, correct: boolean) {
    updateReview(wordId, correct)
    setRevealed(prev => { const n = new Set(prev); n.delete(wordId); return n })
    if (correct) { incrementXp(15); completeTaskUnit('review-10', 1) }
  }

  const stats = [
    { label: 'Saved', labelZh: '已收藏', count: savedWords.length, color: '#FBBF24', icon: '★', tab: 'saved' as Tab },
    { label: 'Due', labelZh: '待复习', count: dueWords.length, color: '#38BDF8', icon: '◎', tab: 'review' as Tab },
    { label: 'Wrong', labelZh: '错题', count: wrongAnswers.length, color: '#EF4444', icon: '✗', tab: 'wrong' as Tab },
  ]

  return (
    <AppShell>
      <PageShell maxWidth={900}>
        <div style={{ marginBottom: '8px', fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(56,189,248,0.45)', fontFamily: 'var(--font-mono)' }}>
          LEXIOCEAN / MEMORY ROOTS
        </div>
        <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 700, color: '#ECFBFF' }}>
          Memory Roots <span style={{ fontSize: '18px', color: '#9BBFCA' }}>记忆根系</span>
        </h1>
        <p style={{ margin: '0 0 28px', color: '#9BBFCA', fontSize: '14px', lineHeight: 1.6 }}>
          Spaced repetition, saved words, and your wrong-answer notebook.
          <br />
          <span style={{ color: 'rgba(155,191,202,0.5)', fontSize: '13px' }}>间隔复习、收藏单词与错题本。</span>
        </p>

        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
          {stats.map(s => (
            <button
              key={s.label}
              onClick={() => setActiveTab(s.tab)}
              style={{
                background: activeTab === s.tab ? `${s.color}12` : 'var(--glass-bg)',
                border: `1px solid ${activeTab === s.tab ? `${s.color}50` : 'var(--glass-border)'}`,
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '4px', color: activeTab === s.tab ? s.color : 'rgba(155,191,202,0.5)' }}>{s.icon}</div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: s.color, marginBottom: '2px' }}>{s.count}</div>
              <div style={{ fontSize: '11px', color: '#9BBFCA' }}>{s.label}</div>
              <div style={{ fontSize: '10px', color: 'rgba(155,191,202,0.45)' }}>{s.labelZh}</div>
            </button>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <Button variant={tabVariant('saved')} size="sm" onClick={() => setActiveTab('saved')}>
            ★ Saved / 收藏
          </Button>
          <Button variant={tabVariant('review')} size="sm" onClick={() => setActiveTab('review')}>
            ◎ Review / 复习
            {dueWords.length > 0 && (
              <span style={{ marginLeft: '6px', background: '#38BDF8', color: '#020617', borderRadius: '8px', padding: '1px 6px', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                {dueWords.length}
              </span>
            )}
          </Button>
          <Button variant={tabVariant('wrong')} size="sm" onClick={() => setActiveTab('wrong')}>
            ✗ Wrong / 错题本
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {/* ── Saved tab ── */}
          {activeTab === 'saved' && (
            <motion.div key="saved" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {savedWords.length === 0 ? (
                <EmptyState
                  icon="☆"
                  title="No saved words yet"
                  titleZh="还没有收藏的单词"
                  description="Go to the Dictionary and tap ☆ next to any word to save it here."
                  descriptionZh="在词典中点击 ☆ 收藏单词，它们会出现在这里。"
                  actions={[{ label: 'Open Dictionary / 打开词典', href: '/dictionary' }]}
                />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                  {savedWords.map((wordId, i) => {
                    const w = getMockWord(wordId)
                    return (
                      <motion.div
                        key={wordId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.25 }}
                        whileHover={{ y: -2 }}
                      >
                        <GlassCard accentColor="#FBBF24" style={{ border: '1px solid rgba(251,191,36,0.18)', height: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Link href={`/word/${wordId}`} style={{ textDecoration: 'none', flex: 1 }}>
                              <div style={{ fontSize: '17px', fontWeight: 700, color: '#ECFBFF', marginBottom: '2px' }}>{wordId}</div>
                              {w && <div style={{ fontSize: '12px', color: '#7EF9FF', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>{w.phonetic}</div>}
                              {w && <div style={{ fontSize: '12px', color: '#9BBFCA', lineHeight: 1.5 }}>{w.definitions[0]?.meaningZh}</div>}
                            </Link>
                            <Link
                              href={`/lexigraph?word=${wordId}`}
                              title="Open in LexiGraph"
                              style={{ fontSize: '12px', color: 'rgba(126,249,255,0.5)', textDecoration: 'none', marginLeft: '8px', flexShrink: 0, fontFamily: 'var(--font-mono)' }}
                            >
                              ✦
                            </Link>
                          </div>
                        </GlassCard>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Review tab ── */}
          {activeTab === 'review' && (
            <motion.div key="review" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {dueWords.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
                  <Button as="a" href="/quiz" variant="secondary" size="sm">
                    ✎ Quick Quiz / 开始练习
                  </Button>
                </div>
              )}
              {dueWords.length === 0 ? (
                <EmptyState
                  icon="◎"
                  title="All caught up!"
                  titleZh="暂时没有需要复习的单词"
                  description={`${reviewWords.length} word${reviewWords.length !== 1 ? 's' : ''} in queue. Check back later, or take a quiz.`}
                  descriptionZh="复习队列中的单词都已掌握，稍后再来。"
                  actions={reviewWords.length > 0 ? [{ label: 'Quiz Anyway / 去做练习', href: '/quiz' }] : []}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {dueWords.map((r, i) => {
                    const w = getMockWord(r.wordId)
                    const isRevealed = revealed.has(r.wordId)
                    return (
                      <motion.div
                        key={r.wordId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.25 }}
                      >
                        <GlassCard accentColor="#38BDF8" style={{ border: '1px solid rgba(56,189,248,0.18)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                            <div style={{ fontSize: '26px', fontWeight: 700, color: '#ECFBFF' }}>{r.word}</div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <Link href={`/word/${r.wordId}`} style={{ fontSize: '11px', color: 'rgba(155,191,202,0.5)', textDecoration: 'none' }}>Detail</Link>
                              <Link href={`/lexigraph?word=${r.wordId}`} style={{ fontSize: '11px', color: 'rgba(126,249,255,0.5)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>✦</Link>
                            </div>
                          </div>
                          {w && <div style={{ fontSize: '13px', color: '#7EF9FF', fontFamily: 'var(--font-mono)', marginBottom: '14px' }}>{w.phonetic}</div>}

                          <AnimatePresence mode="wait">
                            {!isRevealed ? (
                              <motion.div key="hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <Button size="sm" onClick={() => toggleReveal(r.wordId)}>
                                  Reveal / 显示释义
                                </Button>
                              </motion.div>
                            ) : (
                              <motion.div key="revealed" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                {w && (
                                  <div style={{ fontSize: '14px', color: '#9BBFCA', marginBottom: '16px', lineHeight: 1.6 }}>
                                    {w.definitions[0]?.meaningZh}<br />
                                    <span style={{ color: 'rgba(155,191,202,0.6)', fontSize: '13px' }}>{w.definitions[0]?.meaning}</span>
                                  </div>
                                )}
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <Button variant="danger" size="sm" style={{ flex: 1 }} onClick={() => handleReview(r.wordId, false)}>
                                    ✗ Forgot / 忘了
                                  </Button>
                                  <Button variant="success" size="sm" style={{ flex: 1 }} onClick={() => handleReview(r.wordId, true)}>
                                    ✓ Remember / 记得
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </GlassCard>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Wrong Answers tab ── */}
          {activeTab === 'wrong' && (
            <motion.div key="wrong" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {wrongAnswers.length === 0 ? (
                <EmptyState
                  icon="✓"
                  title="No wrong answers yet"
                  titleZh="错题本是空的"
                  description="Take a quiz to build vocabulary and track any questions you get wrong."
                  descriptionZh="去做练习题，答错的题目会自动记录在这里。"
                  actions={[{ label: 'Take a Quiz / 去练习', href: '/quiz' }]}
                />
              ) : (
                <>
                  <SectionHeader label={`WRONG ANSWERS · ${wrongAnswers.length}`} labelZh="错题本" style={{ marginBottom: '14px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {wrongAnswers.slice(0, 20).map((wa, i) => (
                      <motion.div
                        key={wa.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.25 }}
                      >
                        <GlassCard style={{ border: '1px solid rgba(239,68,68,0.18)', background: 'rgba(239,68,68,0.03)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '16px', fontWeight: 700, color: '#ECFBFF', marginBottom: '6px' }}>
                                <Link href={`/word/${wa.wordId}`} style={{ color: '#ECFBFF', textDecoration: 'none' }}>{wa.word}</Link>
                              </div>
                              <div style={{ fontSize: '13px', color: '#9BBFCA', marginBottom: '8px' }}>{wa.question}</div>
                              <div style={{ fontSize: '12px', color: 'rgba(239,68,68,0.7)', marginBottom: '4px' }}>Your answer: {wa.userAnswer} ✗</div>
                              <div style={{ fontSize: '12px', color: '#34D399', marginBottom: '8px' }}>Correct: {wa.correctAnswer} ✓</div>
                              <div style={{ fontSize: '12px', color: 'rgba(155,191,202,0.6)', lineHeight: 1.5 }}>{wa.explanation}</div>
                              <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <Link href={`/lexigraph?word=${wa.wordId}`} style={{ fontSize: '11px', color: 'rgba(126,249,255,0.6)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>✦ LexiGraph</Link>
                                <Link href={`/chat?context=wrong_answer&id=${wa.id}`} style={{ fontSize: '11px', color: 'rgba(139,92,246,0.7)', textDecoration: 'none' }}>✦ Ask AI / 问 AI</Link>
                              </div>
                            </div>
                            <button
                              onClick={() => removeWrongAnswer(wa.id)}
                              style={{ background: 'none', border: 'none', color: 'rgba(155,191,202,0.3)', cursor: 'pointer', fontSize: '16px', padding: '4px', marginLeft: '12px' }}
                              aria-label="Remove from wrong answers"
                            >
                              ×
                            </button>
                          </div>
                        </GlassCard>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </PageShell>
    </AppShell>
  )
}
