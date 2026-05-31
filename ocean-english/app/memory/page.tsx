'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { useLearningStore } from '@/store/learningStore'
import { getMockWord } from '@/data/mock-words'

type Tab = 'saved' | 'review' | 'wrong'

export default function MemoryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('saved')
  const [revealed, setRevealed] = useState<Set<string>>(new Set())

  const { savedWords, reviewWords, wrongAnswers, getDueWords, removeWrongAnswer, updateReview, completeTaskUnit, incrementXp } = useLearningStore()

  const dueWords = getDueWords()

  const tabStyle = (tab: Tab): React.CSSProperties => ({
    padding: '8px 20px',
    borderRadius: '8px',
    background: activeTab === tab ? 'rgba(56,189,248,0.15)' : 'transparent',
    border: `1px solid ${activeTab === tab ? 'rgba(56,189,248,0.5)' : 'rgba(155,191,202,0.2)'}`,
    color: activeTab === tab ? '#38BDF8' : '#9BBFCA',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  })

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

  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
          <h1 style={{ margin: '0 0 6px', fontSize: '32px', fontWeight: 700, color: '#ECFBFF' }}>
            Memory Roots <span style={{ fontSize: '18px', color: '#9BBFCA' }}>记忆根系</span>
          </h1>
          <p style={{ margin: '0 0 28px', color: '#9BBFCA', fontSize: '14px' }}>
            Spaced repetition, saved words, and your wrong-answer notebook.
            <br />
            <span style={{ color: 'rgba(155,191,202,0.6)', fontSize: '13px' }}>间隔复习、收藏单词与错题本。</span>
          </p>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Saved Words', labelZh: '已收藏', count: savedWords.length, color: '#FBBF24', icon: '★', tab: 'saved' as Tab },
              { label: 'Due for Review', labelZh: '待复习', count: dueWords.length, color: '#38BDF8', icon: '📅', tab: 'review' as Tab },
              { label: 'Wrong Answers', labelZh: '错题', count: wrongAnswers.length, color: '#EF4444', icon: '❌', tab: 'wrong' as Tab },
            ].map(s => (
              <button
                key={s.label}
                onClick={() => setActiveTab(s.tab)}
                style={{
                  background: activeTab === s.tab ? `${s.color}12` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${activeTab === s.tab ? `${s.color}50` : 'rgba(155,191,202,0.12)'}`,
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>{s.icon}</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: s.color, marginBottom: '4px' }}>{s.count}</div>
                <div style={{ fontSize: '12px', color: '#9BBFCA' }}>{s.label}</div>
                <div style={{ fontSize: '11px', color: 'rgba(155,191,202,0.5)' }}>{s.labelZh}</div>
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            <button style={tabStyle('saved')} onClick={() => setActiveTab('saved')}>
              ★ Saved / 收藏
            </button>
            <button style={tabStyle('review')} onClick={() => setActiveTab('review')}>
              📅 Review / 复习 {dueWords.length > 0 && <span style={{ marginLeft: '4px', background: '#38BDF8', color: '#020617', borderRadius: '8px', padding: '1px 6px', fontSize: '10px' }}>{dueWords.length}</span>}
            </button>
            <button style={tabStyle('wrong')} onClick={() => setActiveTab('wrong')}>
              ❌ Wrong Answers / 错题本
            </button>
          </div>

          {/* Tab content */}
          {activeTab === 'saved' && (
            <div>
              {savedWords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(155,191,202,0.4)', fontFamily: 'ui-monospace, monospace', fontSize: '13px' }}>
                  No saved words yet. Go to the <Link href="/dictionary" style={{ color: '#38BDF8' }}>Dictionary</Link> and save words with ☆.
                  <br />还没有收藏的单词。在词典中点击 ☆ 收藏单词。
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                  {savedWords.map(wordId => {
                    const w = getMockWord(wordId)
                    return (
                      <Link key={wordId} href={`/word/${wordId}`}
                        style={{ display: 'block', textDecoration: 'none', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '10px', padding: '14px 16px' }}>
                        <div style={{ fontSize: '17px', fontWeight: 700, color: '#ECFBFF', marginBottom: '2px' }}>{wordId}</div>
                        {w && <div style={{ fontSize: '12px', color: '#7EF9FF', fontFamily: 'ui-monospace, monospace', marginBottom: '4px' }}>{w.phonetic}</div>}
                        {w && <div style={{ fontSize: '12px', color: '#9BBFCA' }}>{w.definitions[0]?.meaningZh}</div>}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'review' && (
            <div>
              {dueWords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(155,191,202,0.4)', fontSize: '13px' }}>
                  No words due for review right now. Check back later!
                  <br />暂时没有需要复习的单词。稍后再来看看！
                  <div style={{ marginTop: '16px', fontSize: '12px', color: 'rgba(155,191,202,0.3)' }}>
                    Total in queue: {reviewWords.length} / 复习队列总数：{reviewWords.length}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {dueWords.map(r => {
                    const w = getMockWord(r.wordId)
                    const isRevealed = revealed.has(r.wordId)
                    return (
                      <div key={r.wordId}
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '12px', padding: '20px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#ECFBFF', marginBottom: '4px' }}>{r.word}</div>
                        {w && <div style={{ fontSize: '14px', color: '#7EF9FF', fontFamily: 'ui-monospace, monospace', marginBottom: '12px' }}>{w.phonetic}</div>}
                        {!isRevealed ? (
                          <button onClick={() => toggleReveal(r.wordId)}
                            style={{ padding: '10px 24px', borderRadius: '8px', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.4)', color: '#38BDF8', fontSize: '14px', cursor: 'pointer' }}>
                            Reveal / 显示释义
                          </button>
                        ) : (
                          <div>
                            {w && <div style={{ fontSize: '14px', color: '#9BBFCA', marginBottom: '16px', lineHeight: 1.6 }}>
                              {w.definitions[0]?.meaningZh}<br />
                              <span style={{ color: 'rgba(155,191,202,0.6)', fontSize: '13px' }}>{w.definitions[0]?.meaning}</span>
                            </div>}
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button onClick={() => handleReview(r.wordId, false)}
                                style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'rgba(239,68,68,0.8)', fontSize: '14px', cursor: 'pointer' }}>
                                ✗ Forgot / 忘了
                              </button>
                              <button onClick={() => handleReview(r.wordId, true)}
                                style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.4)', color: '#34D399', fontSize: '14px', cursor: 'pointer' }}>
                                ✓ Remember / 记得
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'wrong' && (
            <div>
              {wrongAnswers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(155,191,202,0.4)', fontSize: '13px' }}>
                  No wrong answers yet. <Link href="/quiz" style={{ color: '#38BDF8' }}>Take a quiz</Link> to start!
                  <br />还没有错题。去做练习题吧！
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {wrongAnswers.slice(0, 20).map((wa, i) => (
                    <div key={`${wa.wordId}-${i}`}
                      style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#ECFBFF', marginBottom: '6px' }}>
                            <Link href={`/word/${wa.wordId}`} style={{ color: '#ECFBFF', textDecoration: 'none' }}>
                              {wa.word}
                            </Link>
                          </div>
                          <div style={{ fontSize: '13px', color: '#9BBFCA', marginBottom: '8px' }}>{wa.question}</div>
                          <div style={{ fontSize: '12px', color: 'rgba(239,68,68,0.7)', marginBottom: '4px' }}>
                            Your answer: {wa.userAnswer} ✗
                          </div>
                          <div style={{ fontSize: '12px', color: '#34D399', marginBottom: '8px' }}>
                            Correct: {wa.correctAnswer} ✓
                          </div>
                          <div style={{ fontSize: '12px', color: 'rgba(155,191,202,0.6)', lineHeight: 1.5 }}>
                            {wa.explanation}
                          </div>
                        </div>
                        <button
                          onClick={() => removeWrongAnswer(wa.wordId)}
                          style={{ background: 'none', border: 'none', color: 'rgba(155,191,202,0.3)', cursor: 'pointer', fontSize: '16px', padding: '4px', marginLeft: '12px' }}
                          aria-label="Remove from wrong answers"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
