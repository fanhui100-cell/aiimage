'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SaveWordButton } from '@/components/learning/SaveWordButton'
import { PronunciationButton } from '@/components/pronunciation/PronunciationButton'
import { ExampleSentencePlayer } from '@/components/pronunciation/ExampleSentencePlayer'
import { AccentSelector } from '@/components/pronunciation/AccentSelector'
import { readAccentPreference } from '@/lib/pronunciation/pronunciation-client'
import { useLexiStore } from '@/store/lexiStore'
import { STATE_META } from '@/lib/state-meta'
import { useMotivationStore } from '@/store/useMotivationStore'
import type { DictionaryWord } from '@/lib/dictionary/dictionary-types'
import type { Accent } from '@/lib/pronunciation/pronunciation-types'

// ── Shared styles ──────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--r-card)',
  padding: '20px 24px',
  marginBottom: '16px',
  boxShadow: 'var(--card-shadow-sm)',
}

const sectionHead: React.CSSProperties = {
  fontSize: '11px',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--teal-ink)',
  opacity: 0.8,
  fontFamily: 'var(--font-mono)',
  marginBottom: '12px',
}

const exampleBlock: React.CSSProperties = {
  background: 'var(--teal-bg)',
  borderLeft: '3px solid rgba(14,140,122,0.4)',
  padding: '10px 14px',
  borderRadius: '0 6px 6px 0',
  marginTop: '8px',
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Badge({
  label,
  color = '#0E8C7A',
  bg,
  borderColor,
}: {
  label: string
  color?: string
  bg?: string
  borderColor?: string
}) {
  const resolvedBg = bg ?? (color.startsWith('var(') ? 'var(--teal-bg)' : `${color}18`)
  const resolvedBorder = borderColor ?? (color.startsWith('var(') ? 'rgba(14,140,122,0.2)' : `${color}32`)
  return (
    <span
      style={{
        fontSize: '11px',
        padding: '2px 8px',
        borderRadius: '4px',
        background: resolvedBg,
        color,
        border: `1px solid ${resolvedBorder}`,
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
        background: 'var(--teal-bg)',
        color: 'var(--teal-ink)',
        border: '1px solid rgba(14,140,122,0.25)',
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
        background: 'rgba(191,74,48,0.07)',
        color: 'var(--rose-ink)',
        border: '1px solid rgba(191,74,48,0.2)',
      }}
    >
      {label}
    </Link>
  )
}

function renderAIContent(content: string) {
  return content.split('\n').map((line, i) => (
    <p key={i} style={{ margin: '0 0 6px', fontSize: '13px', color: 'var(--ink)', lineHeight: 1.7 }}>
      {line.split('**').map((part, j) =>
        j % 2 === 1 ? (
          <strong key={j} style={{ color: 'var(--teal-ink)' }}>{part}</strong>
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
            background: n <= level ? 'var(--teal-ink)' : 'rgba(14,140,122,0.15)',
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

  const ensureWord = useLexiStore(s => s.ensureWord)
  const recordActivity = useLexiStore(s => s.recordActivity)
  const incXp = useLexiStore(s => s.incXp)
  const userLevel = useLexiStore(s => s.profile.userLevel ?? null)
  // B7-3：已入库 → 主按钮变状态显示 + 「移出」次级项
  const inStore = useLexiStore(s => s.words.find(w => w.id === word.id))
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
        setAiError('AI 解释暂时不可用，请重试。')
      }
    } catch {
      setAiError('无法连接 AI，请检查网络。')
    } finally {
      setAiLoading(false)
    }
  }

  function handleAddToReview() {
    // A4: 词典词经唯一入口进入统一状态机（已入库不重置进度）
    ensureWord(word, 'lookup')
    recordActivity('learned')
    incXp(10)
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
    <div className="theme-light" style={{ minHeight: '100vh', paddingTop: '16px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: '20px', fontSize: '13px' }}>
          <Link href="/dictionary" style={{ color: 'var(--teal-ink)', textDecoration: 'none' }}>
            词汇根系
          </Link>
          <span style={{ color: 'var(--ink-muted)', margin: '0 8px' }}>›</span>
          <span style={{ color: 'var(--ink-sub)' }}>{word.word}</span>
        </div>

        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ margin: '0 0 4px', fontSize: '42px', fontFamily: 'var(--font-serif)', fontWeight: 400, color: 'var(--ink)' }}>
                {word.word}
              </h1>

              {/* IPA + Pronunciation + AccentSelector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {word.phoneticIpa && (
                  <span style={{ fontSize: '18px', color: 'var(--teal-ink)', fontFamily: 'var(--font-mono)' }}>
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
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--ink-muted)' }}>
                    <DifficultyDots level={difficultyLevel} />
                  </span>
                )}
                {word.isCore && <Badge label="核心词" color="#0E8C7A" bg="var(--teal-bg)" borderColor="rgba(14,140,122,0.25)" />}
                {word.isExamWord && <Badge label="考试词" color="#B3781F" bg="rgba(179,120,31,0.1)" borderColor="rgba(179,120,31,0.3)" />}
                {word.examTags.slice(0, 3).map(tag => (
                  <Badge key={tag} label={tag} color="#0E8C7A" bg="var(--teal-bg)" borderColor="rgba(14,140,122,0.2)" />
                ))}
              </div>
            </div>

            {/* Action buttons（B7-3 收敛：主「加入学习」/次「考一考」/右上星标收藏） */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
              <SaveWordButton wordId={word.id} word={word.word} compact />
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {inStore ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '10px',
                    padding: '10px 16px', borderRadius: 'var(--r-pill)',
                    background: 'var(--teal-bg)', border: '1px solid rgba(14,140,122,0.3)',
                    color: 'var(--teal-ink)', fontSize: '14px', fontWeight: 600,
                  }}>
                    已在学习 · {STATE_META[inStore.state].zh}
                    <button
                      onClick={() => useLexiStore.getState().removeWord(word.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--ink-muted)', padding: 0, fontFamily: 'var(--font-sans)' }}
                    >
                      移出
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={handleAddToReview}
                    style={{
                      padding: '10px 22px',
                      borderRadius: 'var(--r-pill)',
                      background: 'var(--teal-ink)',
                      border: 'none',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 8px 20px -10px rgba(14,140,122,0.7)',
                    }}
                  >
                    + 加入学习
                  </button>
                )}
                <button
                  onClick={handleQuizThis}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 'var(--r-pill)',
                    background: 'var(--card)',
                    border: '1px solid var(--line-strong)',
                    color: 'var(--ink)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  考一考
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button
                onClick={handleAIExplain}
                disabled={aiLoading || !!aiExplanation}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--r-pill)',
                  background: aiExplanation ? 'rgba(139,92,246,0.06)' : 'rgba(139,92,246,0.1)',
                  border: `1px solid ${aiExplanation ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.5)'}`,
                  color: aiExplanation ? 'rgba(139,92,246,0.5)' : '#8B5CF6',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: aiLoading || !!aiExplanation ? 'default' : 'pointer',
                  opacity: aiLoading ? 0.7 : 1,
                }}
              >
                {aiLoading ? 'AI 思考中…' : aiExplanation ? 'AI 已解释' : 'AI 解释'}
              </button>
              <Link
                href={`/lexiverse?word=${encodeURIComponent(word.id)}`}
                style={{
                  padding: '8px 14px', borderRadius: 'var(--r-pill)', textDecoration: 'none',
                  background: 'var(--card)', border: '1px solid var(--line-strong)',
                  color: 'var(--ink)', fontSize: '13px', fontWeight: 600,
                }}
              >
                在宇宙中查看 ✦
              </Link>
              <Link
                href={`/chat?context=word&word=${encodeURIComponent(word.id)}`}
                style={{
                  padding: '8px 14px', borderRadius: 'var(--r-pill)', textDecoration: 'none',
                  background: 'var(--teal-bg)', border: '1px solid rgba(14,140,122,0.25)',
                  color: 'var(--teal-ink)', fontSize: '13px', fontWeight: 600,
                }}
              >
                AI 导学 →
              </Link>
              <Link
                href={`/lexigraph?word=${word.id}`}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--r-pill)',
                  background: 'var(--card)',
                  border: '1px solid var(--line-strong)',
                  color: 'var(--ink)',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-block',
                  fontFamily: 'var(--font-mono)',
                  boxShadow: 'var(--card-shadow-sm)',
                }}
              >
                ✦ 词汇星图
              </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── DEFINITIONS + EXAMPLES ─────────────────────────────────── */}
        {word.definitions.length > 0 && (
          <div style={card}>
            <div style={sectionHead}>DEFINITIONS · 释义</div>
            {word.definitions.map((def, i) => {
              const example = word.examples[i]
              return (
                <div key={i} style={{ marginBottom: i < word.definitions.length - 1 ? '20px' : 0 }}>
                  <Badge label={def.partOfSpeech} color="#8B5CF6" />
                  <p style={{ margin: '8px 0 3px', fontSize: '15px', color: 'var(--ink)', lineHeight: 1.6 }}>
                    {def.definitionEn}
                  </p>
                  {def.definitionZh && (
                    <p style={{ margin: '0 0 8px', fontSize: '14px', color: 'var(--ink-sub)' }}>
                      {def.definitionZh}
                    </p>
                  )}
                  {example && (
                    <div style={exampleBlock}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: '0 0 3px', fontSize: '13px', color: 'var(--ink)', fontStyle: 'italic' }}>
                            &ldquo;{example.sentenceEn}&rdquo;
                          </p>
                          {example.sentenceZh && (
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-sub)' }}>
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
                    <p style={{ margin: '0 0 3px', fontSize: '13px', color: 'var(--ink)', fontStyle: 'italic' }}>
                      &ldquo;{ex.sentenceEn}&rdquo;
                    </p>
                    {ex.sentenceZh && (
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--ink-sub)' }}>{ex.sentenceZh}</p>
                    )}
                  </div>
                  <ExampleSentencePlayer sentence={ex.sentenceEn} accent={accent} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PHRASES（P2：词库注入的常用短语）──────────────────────── */}
        {!!word.phrases?.length && (
          <div style={card}>
            <div style={sectionHead}>PHRASES · 常用短语</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {word.phrases.slice(0, 6).map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-news)' }}>{p.phrase}</span>
                  {p.translation && (
                    <span style={{ fontSize: '13px', color: 'var(--ink-sub)' }}>{p.translation}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MEMORY TRICKS ──────────────────────────────────────────── */}
        {hasMnemonic && (
          <div style={card}>
            <div style={sectionHead}>MEMORY TRICKS · 记忆法</div>

            {standardMnem && (
              <div
                style={{
                  background: 'rgba(179,120,31,0.06)',
                  border: '1px solid rgba(179,120,31,0.2)',
                  borderRadius: '8px',
                  padding: '14px',
                  marginBottom: evilMnem ? '12px' : 0,
                }}
              >
                <p style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--gold-ink)', lineHeight: 1.6 }}>
                  {standardMnem.mnemonicEn}
                </p>
                {standardMnem.mnemonicZh && (
                  <p style={{ margin: 0, fontSize: '13px', color: 'rgba(179,120,31,0.75)' }}>
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
                    border: '1px dashed rgba(191,74,48,0.3)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    color: 'var(--rose-ink)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: showEvil ? '10px' : 0,
                    opacity: 0.8,
                  }}
                >
                  {showEvil ? '隐藏' : '显示'} 邪修记忆法
                </button>
                {showEvil && (
                  <div
                    style={{
                      background: 'rgba(191,74,48,0.05)',
                      border: '1px solid rgba(191,74,48,0.18)',
                      borderRadius: '8px',
                      padding: '14px',
                    }}
                  >
                    <p style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--rose-ink)', lineHeight: 1.6 }}>
                      {evilMnem.mnemonicEn}
                    </p>
                    {evilMnem.mnemonicZh && (
                      <p style={{ margin: 0, fontSize: '13px', color: 'rgba(191,74,48,0.7)' }}>
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
                <div style={sectionHead}>SYNONYMS · 近义词</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {word.synonyms.map(s => <WordTag key={s} label={s} />)}
                </div>
              </div>
            )}
            {word.antonyms.length > 0 && (
              <div style={card}>
                <div style={sectionHead}>ANTONYMS · 反义词</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {word.antonyms.map(a => <AntonymTag key={a} label={a} />)}
                </div>
              </div>
            )}
            {/* P5-A1：近反义区块尾 → 词图展开 */}
            <Link href={`/lexigraph?word=${word.id}`}
              style={{ gridColumn: '1 / -1', fontSize: '13px', color: 'var(--teal-ink)', textDecoration: 'none', textAlign: 'right', fontWeight: 600 }}>
              在词图中展开 →
            </Link>
          </div>
        )}

        {/* ── COLLOCATIONS ──────────────────────────────────────────── */}
        {word.collocations.length > 0 && (
          <div style={card}>
            <div style={sectionHead}>COLLOCATIONS · 常用搭配</div>
            {word.collocations.map((c, i) => (
              <div key={i} style={{ marginBottom: i < word.collocations.length - 1 ? '14px' : 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--teal-ink)', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
                  {c.phrase}
                </div>
                {c.exampleEn && (
                  <div style={{ fontSize: '13px', color: 'var(--ink)', marginBottom: '2px' }}>{c.exampleEn}</div>
                )}
                {c.exampleZh && (
                  <div style={{ fontSize: '12px', color: 'var(--ink-sub)' }}>{c.exampleZh}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── SCENE USAGE ───────────────────────────────────────────── */}
        {word.sceneUsages.length > 0 && (
          <div style={card}>
            <div style={sectionHead}>SCENE USAGE · 场景用法</div>
            {word.sceneUsages.map((s, i) => (
              <div key={i} style={{ marginBottom: i < word.sceneUsages.length - 1 ? '14px' : 0 }}>
                <div
                  style={{
                    display: 'inline-block',
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'rgba(249,115,22,0.08)',
                    color: '#F97316',
                    border: '1px solid rgba(249,115,22,0.25)',
                    marginBottom: '6px',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {s.sceneEn}{s.sceneZh ? ` · ${s.sceneZh}` : ''}
                </div>
                {s.exampleEn && (
                  <div style={{ fontSize: '13px', color: 'var(--ink)', marginBottom: '3px', fontStyle: 'italic' }}>
                    &ldquo;{s.exampleEn}&rdquo;
                  </div>
                )}
                {s.exampleZh && (
                  <div style={{ fontSize: '12px', color: 'var(--ink-sub)' }}>{s.exampleZh}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── ETYMOLOGY ─────────────────────────────────────────────── */}
        {word.etymology && (
          <div style={card}>
            <div style={sectionHead}>ETYMOLOGY · 词源</div>
            <div style={{ fontSize: '13px', color: 'var(--teal-ink)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
              {word.etymology.roots}
            </div>
            {word.etymology.explanationEn && word.etymology.explanationEn !== word.etymology.roots && (
              <p style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--ink)', lineHeight: 1.6 }}>
                {word.etymology.explanationEn}
              </p>
            )}
            {word.etymology.explanationZh && (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-sub)' }}>
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
              borderColor: 'rgba(139,92,246,0.2)',
              background: 'rgba(139,92,246,0.03)',
            }}
          >
            <div style={{ ...sectionHead, color: 'rgba(139,92,246,0.8)', opacity: 1 }}>
              AI EXPLANATION · AI 解释
            </div>
            {aiLoading && (
              <div style={{ fontSize: '13px', color: 'var(--ink-sub)' }}>AI 正在思考…</div>
            )}
            {aiError && !aiLoading && (
              <div>
                <div style={{ fontSize: '13px', color: 'var(--rose-ink)', marginBottom: '12px' }}>
                  {aiError}
                </div>
                <button
                  onClick={handleAIExplain}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--r-pill)',
                    background: 'rgba(139,92,246,0.1)',
                    border: '1px solid rgba(139,92,246,0.35)',
                    color: '#8B5CF6',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  重试
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
          <div style={{ marginBottom: '8px', padding: '10px 14px', borderRadius: '8px', background: 'var(--teal-bg)', border: '1px solid rgba(14,140,122,0.12)' }}>
            <div style={{ fontSize: '10px', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}>
              原创教育内容，非商业词典来源。仅供个人学习参考，AI 生成答案仅为学习建议。
            </div>
          </div>
        )}

        {/* Back link */}
        <div style={{ marginTop: '24px' }}>
          <Link href="/dictionary" style={{ fontSize: '13px', color: 'var(--teal-ink)', textDecoration: 'none' }}>
            ← 返回词汇根系
          </Link>
        </div>
      </div>
    </div>
  )
}
