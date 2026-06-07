'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SaveWordButton } from '@/components/learning/SaveWordButton'
import { PronunciationButton } from '@/components/pronunciation/PronunciationButton'
import { ExampleSentencePlayer } from '@/components/pronunciation/ExampleSentencePlayer'
import { AccentSelector } from '@/components/pronunciation/AccentSelector'
import { readAccentPreference } from '@/lib/pronunciation/pronunciation-client'
import { useLearningStore } from '@/store/learningStore'
import { useMotivationStore } from '@/store/useMotivationStore'
import type { DictionaryWord } from '@/lib/dictionary/dictionary-types'
import type { Accent } from '@/lib/pronunciation/pronunciation-types'

// ── Shared styles ──────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(155,191,202,0.12)',
  borderRadius: '12px',
  padding: '20px 24px',
  marginBottom: '16px',
}

const sectionHead: React.CSSProperties = {
  fontSize: '11px',
  letterSpacing: '0.12em',
  color: 'rgba(56,189,248,0.6)',
  fontFamily: 'var(--font-mono)',
  marginBottom: '12px',
}

const exampleBlock: React.CSSProperties = {
  background: 'rgba(56,189,248,0.05)',
  borderLeft: '3px solid rgba(56,189,248,0.4)',
  padding: '10px 14px',
  borderRadius: '0 6px 6px 0',
  marginTop: '8px',
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Badge({
  label,
  color = '#38BDF8',
  bg,
}: {
  label: string
  color?: string
  bg?: string
}) {
  return (
    <span
      style={{
        fontSize: '11px',
        padding: '2px 8px',
        borderRadius: '4px',
        background: bg ?? `${color}14`,
        color,
        border: `1px solid ${color}30`,
        fontFamily: 'var(--font-mono)',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {label}
    </span>
  )
}

function WordTag({ label }: { label: string }) {
  return (
    <Link
      href={`/word/${label}`}
      style={{
        padding: '4px 10px',
        borderRadius: '5px',
        fontSize: '13px',
        textDecoration: 'none',
        display: 'inline-block',
        background: 'rgba(52,211,153,0.08)',
        color: '#34D399',
        border: '1px solid rgba(52,211,153,0.25)',
      }}
    >
      {label}
    </Link>
  )
}

function AntonymTag({ label }: { label: string }) {
  return (
    <Link
      href={`/word/${label}`}
      style={{
        padding: '4px 10px',
        borderRadius: '5px',
        fontSize: '13px',
        textDecoration: 'none',
        display: 'inline-block',
        background: 'rgba(239,68,68,0.08)',
        color: 'rgba(239,68,68,0.7)',
        border: '1px solid rgba(239,68,68,0.2)',
      }}
    >
      {label}
    </Link>
  )
}

function renderAIContent(content: string) {
  return content.split('\n').map((line, i) => (
    <p key={i} style={{ margin: '0 0 6px', fontSize: '13px', color: '#ECFBFF', lineHeight: 1.7 }}>
      {line.split('**').map((part, j) =>
        j % 2 === 1 ? (
          <strong key={j} style={{ color: '#7EF9FF' }}>{part}</strong>
        ) : (
          part
        ),
      )}
    </p>
  ))
}

// ── Difficulty dots ────────────────────────────────────────────────────────

function DifficultyDots({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <span style={{ display: 'inline-flex', gap: '3px', verticalAlign: 'middle' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: n <= level ? '#38BDF8' : 'rgba(56,189,248,0.15)',
          }}
        />
      ))}
    </span>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

interface WordDetailClientProps {
  word: DictionaryWord
}

export function WordDetailClient({ word }: WordDetailClientProps) {
  const [showEvil, setShowEvil] = useState(false)
  const [aiExplanation, setAiExplanation] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [accent, setAccent] = useState<Accent>('auto')

  // Init accent from localStorage after mount (avoids SSR mismatch)
  useEffect(() => { setAccent(readAccentPreference()) }, [])

  // Anti-spam: each word's pronunciation awards LexiStar at most once per page lifecycle
  const hasAwardedPronunciationRef = useRef(false)

  const { addToReview, completeTaskUnit, markStudyToday, incrementXp, incrementWordsLearned, userLevel } =
    useLearningStore()
  const { addLexiStar, recordPronunciationPlay } = useMotivationStore()
  const router = useRouter()

  function handlePronunciationPlayed() {
    if (hasAwardedPronunciationRef.current) return
    hasAwardedPronunciationRef.current = true
    try {
      addLexiStar(2, 'pronunciation', word.id)
      recordPronunciationPlay(word.id)
    } catch {}
  }

  async function handleAIExplain() {
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await fetch('/api/ai/word-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word.word, userLevel: userLevel ?? 'intermediate' }),
      })
      const data = (await res.json()) as { content?: string }
      if (res.ok && data.content) {
        setAiExplanation(data.content)
      } else {
        setAiError('AI explanation unavailable. Please try again. / AI 解释暂时不可用，请重试。')
      }
    } catch {
      setAiError('Could not connect to AI. Please check your connection. / 无法连接 AI，请检查网络。')
    } finally {
      setAiLoading(false)
    }
  }

  function handleAddToReview() {
    addToReview(word.id, word.word)
    completeTaskUnit('vocab-5', 1)
    markStudyToday()
    incrementXp(10)
    incrementWordsLearned()
  }

  function handleQuizThis() {
    router.push(`/quiz?word=${word.id}`)
  }

  // Derived values
  const standardMnem = word.mnemonics.find(m => m.style === 'standard')
  const evilMnem = word.mnemonics.find(m => m.style === 'evil')
  const hasMnemonic = !!(standardMnem ?? evilMnem)

  const cefrLabel = word.cefrLevel
  const difficultyLevel = word.difficulty
  const isOriginalSeed = word.sourceType === 'original'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: '20px', fontSize: '13px' }}>
          <Link href="/dictionary" style={{ color: 'rgba(56,189,248,0.6)', textDecoration: 'none' }}>
            Dictionary / 词典
          </Link>
          <span style={{ color: 'rgba(155,191,202,0.4)', margin: '0 8px' }}>›</span>
          <span style={{ color: '#9BBFCA' }}>{word.word}</span>
        </div>

        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: '42px', fontWeight: 700, color: '#ECFBFF' }}>
                {word.word}
              </h1>

              {/* IPA + Pronunciation + AccentSelector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {word.phoneticIpa && (
                  <span style={{ fontSize: '18px', color: '#7EF9FF', fontFamily: 'var(--font-mono)' }}>
                    {word.phoneticIpa}
                  </span>
                )}
                <PronunciationButton
                  text={word.word}
                  accent={accent}
                  size="md"
                  onPlayed={handlePronunciationPlayed}
                />
                <AccentSelector value={accent} onChange={setAccent} />
              </div>

              {/* Metadata badges */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                {word.partOfSpeech && (
                  <Badge label={word.partOfSpeech} color="#8B5CF6" />
                )}
                {cefrLabel && (
                  <Badge label={cefrLabel} color="#F97316" />
                )}
                {difficultyLevel && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'rgba(155,191,202,0.6)' }}>
                    <DifficultyDots level={difficultyLevel} />
                  </span>
                )}
                {word.isCore && <Badge label="Core / 核心" color="#34D399" />}
                {word.isExamWord && <Badge label="Exam / 考试" color="#FBBF24" />}
                {word.examTags.slice(0, 3).map(tag => (
                  <Badge key={tag} label={tag} color="rgba(56,189,248,0.7)" />
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <SaveWordButton wordId={word.id} word={word.word} />
              <button
                onClick={handleAIExplain}
                disabled={aiLoading || !!aiExplanation}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: aiExplanation ? 'rgba(139,92,246,0.06)' : 'rgba(139,92,246,0.1)',
                  border: `1px solid ${aiExplanation ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.5)'}`,
                  color: aiExplanation ? 'rgba(139,92,246,0.5)' : '#8B5CF6',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: aiLoading || !!aiExplanation ? 'default' : 'pointer',
                  opacity: aiLoading ? 0.7 : 1,
                }}
              >
                {aiLoading ? '✦ AI thinking…' : aiExplanation ? '✦ AI Explained' : '✦ Ask AI / AI 解释'}
              </button>
              <Link
                href={`/chat?context=word&word=${encodeURIComponent(word.id)}`}
                style={{
                  padding: '10px 16px', borderRadius: '8px', textDecoration: 'none',
                  background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.25)',
                  color: '#38BDF8', fontSize: '14px', fontWeight: 600,
                }}
              >
                Ask in Chat →
              </Link>
              <button
                onClick={handleAddToReview}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: 'rgba(52,211,153,0.1)',
                  border: '1px solid rgba(52,211,153,0.4)',
                  color: '#34D399',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + Review / 加入复习
              </button>
              <button
                onClick={handleQuizThis}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: 'rgba(139,92,246,0.1)',
                  border: '1px solid rgba(139,92,246,0.4)',
                  color: '#8B5CF6',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                📝 Quiz This
              </button>
              <Link
                href={`/lexigraph?word=${word.id}`}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: 'rgba(126,249,255,0.06)',
                  border: '1px solid rgba(126,249,255,0.28)',
                  color: '#7EF9FF',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-block',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                ✦ LexiGraph
              </Link>
            </div>
          </div>
        </div>

        {/* ── DEFINITIONS + EXAMPLES ─────────────────────────────────── */}
        {word.definitions.length > 0 && (
          <div style={card}>
            <div style={sectionHead}>DEFINITIONS / 释义</div>
            {word.definitions.map((def, i) => {
              const example = word.examples[i]
              return (
                <div key={i} style={{ marginBottom: i < word.definitions.length - 1 ? '20px' : 0 }}>
                  <Badge label={def.partOfSpeech} color="#8B5CF6" />
                  <p style={{ margin: '8px 0 3px', fontSize: '15px', color: '#ECFBFF', lineHeight: 1.6 }}>
                    {def.definitionEn}
                  </p>
                  {def.definitionZh && (
                    <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#9BBFCA' }}>
                      {def.definitionZh}
                    </p>
                  )}
                  {example && (
                    <div style={exampleBlock}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: '0 0 3px', fontSize: '13px', color: '#ECFBFF', fontStyle: 'italic' }}>
                            &ldquo;{example.sentenceEn}&rdquo;
                          </p>
                          {example.sentenceZh && (
                            <p style={{ margin: 0, fontSize: '12px', color: '#9BBFCA' }}>
                              {example.sentenceZh}
                            </p>
                          )}
                        </div>
                        <ExampleSentencePlayer sentence={example.sentenceEn} accent={accent} />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Extra examples beyond definition count */}
            {word.examples.slice(word.definitions.length).map((ex, i) => (
              <div key={`extra-${i}`} style={{ ...exampleBlock, marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 3px', fontSize: '13px', color: '#ECFBFF', fontStyle: 'italic' }}>
                      &ldquo;{ex.sentenceEn}&rdquo;
                    </p>
                    {ex.sentenceZh && (
                      <p style={{ margin: 0, fontSize: '12px', color: '#9BBFCA' }}>{ex.sentenceZh}</p>
                    )}
                  </div>
                  <ExampleSentencePlayer sentence={ex.sentenceEn} accent={accent} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── MEMORY TRICKS ──────────────────────────────────────────── */}
        {hasMnemonic && (
          <div style={card}>
            <div style={sectionHead}>MEMORY TRICKS / 记忆法</div>

            {standardMnem && (
              <div
                style={{
                  background: 'rgba(255,215,106,0.06)',
                  border: '1px solid rgba(255,215,106,0.2)',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: evilMnem ? '12px' : 0,
                }}
              >
                <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#FFD76A', lineHeight: 1.6 }}>
                  💡 {standardMnem.mnemonicEn}
                </p>
                {standardMnem.mnemonicZh && (
                  <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,215,106,0.7)' }}>
                    {standardMnem.mnemonicZh}
                  </p>
                )}
              </div>
            )}

            {evilMnem && (
              <div>
                <button
                  onClick={() => setShowEvil(v => !v)}
                  style={{
                    background: 'none',
                    border: '1px dashed rgba(239,68,68,0.3)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    color: 'rgba(239,68,68,0.6)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: showEvil ? '10px' : 0,
                  }}
                >
                  ⚠️ {showEvil ? 'Hide' : 'Show'} 邪修记忆法 (Unconventional Method)
                </button>
                {showEvil && (
                  <div
                    style={{
                      background: 'rgba(239,68,68,0.05)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '8px',
                      padding: '14px',
                    }}
                  >
                    <p style={{ margin: '0 0 4px', fontSize: '14px', color: 'rgba(239,68,68,0.8)', lineHeight: 1.6 }}>
                      😈 {evilMnem.mnemonicEn}
                    </p>
                    {evilMnem.mnemonicZh && (
                      <p style={{ margin: 0, fontSize: '13px', color: 'rgba(239,68,68,0.6)' }}>
                        {evilMnem.mnemonicZh}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── SYNONYMS & ANTONYMS ────────────────────────────────────── */}
        {(word.synonyms.length > 0 || word.antonyms.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {word.synonyms.length > 0 && (
              <div style={card}>
                <div style={sectionHead}>SYNONYMS / 近义词</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {word.synonyms.map(s => <WordTag key={s} label={s} />)}
                </div>
              </div>
            )}
            {word.antonyms.length > 0 && (
              <div style={card}>
                <div style={sectionHead}>ANTONYMS / 反义词</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {word.antonyms.map(a => <AntonymTag key={a} label={a} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── COLLOCATIONS ──────────────────────────────────────────── */}
        {word.collocations.length > 0 && (
          <div style={card}>
            <div style={sectionHead}>COLLOCATIONS / 常用搭配</div>
            {word.collocations.map((c, i) => (
              <div key={i} style={{ marginBottom: i < word.collocations.length - 1 ? '14px' : 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#7EF9FF', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                  {c.phrase}
                </div>
                {c.exampleEn && (
                  <div style={{ fontSize: '13px', color: '#ECFBFF', marginBottom: '2px' }}>{c.exampleEn}</div>
                )}
                {c.exampleZh && (
                  <div style={{ fontSize: '12px', color: '#9BBFCA' }}>{c.exampleZh}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── SCENE USAGE ───────────────────────────────────────────── */}
        {word.sceneUsages.length > 0 && (
          <div style={card}>
            <div style={sectionHead}>SCENE USAGE / 场景用法</div>
            {word.sceneUsages.map((s, i) => (
              <div key={i} style={{ marginBottom: i < word.sceneUsages.length - 1 ? '14px' : 0 }}>
                <div
                  style={{
                    display: 'inline-block',
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(249,115,22,0.1)',
                    color: '#F97316',
                    border: '1px solid rgba(249,115,22,0.3)',
                    marginBottom: '6px',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {s.sceneEn}{s.sceneZh ? ` / ${s.sceneZh}` : ''}
                </div>
                {s.exampleEn && (
                  <div style={{ fontSize: '13px', color: '#ECFBFF', marginBottom: '3px', fontStyle: 'italic' }}>
                    &ldquo;{s.exampleEn}&rdquo;
                  </div>
                )}
                {s.exampleZh && (
                  <div style={{ fontSize: '12px', color: '#9BBFCA' }}>{s.exampleZh}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── ETYMOLOGY ─────────────────────────────────────────────── */}
        {word.etymology && (
          <div style={card}>
            <div style={sectionHead}>ETYMOLOGY / 词源</div>
            <div style={{ fontSize: '13px', color: '#7EF9FF', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
              {word.etymology.roots}
            </div>
            {word.etymology.explanationEn && word.etymology.explanationEn !== word.etymology.roots && (
              <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#ECFBFF', lineHeight: 1.6 }}>
                {word.etymology.explanationEn}
              </p>
            )}
            {word.etymology.explanationZh && (
              <p style={{ margin: 0, fontSize: '13px', color: '#9BBFCA' }}>
                {word.etymology.explanationZh}
              </p>
            )}
          </div>
        )}

        {/* ── AI EXPLANATION ────────────────────────────────────────── */}
        {(aiLoading || aiError || aiExplanation) && (
          <div
            style={{
              ...card,
              borderColor: 'rgba(139,92,246,0.25)',
              background: 'rgba(139,92,246,0.04)',
            }}
          >
            <div style={{ ...sectionHead, color: 'rgba(139,92,246,0.7)' }}>
              AI EXPLANATION / AI 解释
            </div>
            {aiLoading && (
              <div style={{ fontSize: '13px', color: '#9BBFCA' }}>✦ AI is thinking… / AI 正在思考…</div>
            )}
            {aiError && !aiLoading && (
              <div>
                <div style={{ fontSize: '13px', color: 'rgba(239,68,68,0.7)', marginBottom: '12px' }}>
                  {aiError}
                </div>
                <button
                  onClick={handleAIExplain}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: 'rgba(139,92,246,0.1)',
                    border: '1px solid rgba(139,92,246,0.4)',
                    color: '#8B5CF6',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Retry / 重试
                </button>
              </div>
            )}
            {aiExplanation && !aiLoading && (
              <div>{renderAIContent(aiExplanation)}</div>
            )}
          </div>
        )}

        {/* ── SOURCE ATTRIBUTION ────────────────────────────────────── */}
        {isOriginalSeed && (
          <div style={{ marginBottom: '8px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(56,189,248,0.03)', border: '1px solid rgba(56,189,248,0.08)' }}>
            <div style={{ fontSize: '10px', color: 'rgba(155,191,202,0.4)', fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}>
              ✓ Original educational content — not from a commercial dictionary.
              For personal study only. AI-generated answers are suggestions, not authoritative definitions.
              <br />
              原创教育内容，非商业词典来源。仅供个人学习参考，AI 生成答案仅为学习建议。
            </div>
          </div>
        )}

        {/* Back link */}
        <div style={{ marginTop: '24px' }}>
          <Link href="/dictionary" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>
            ← Dictionary / 返回词典
          </Link>
        </div>
      </div>
    </div>
  )
}
