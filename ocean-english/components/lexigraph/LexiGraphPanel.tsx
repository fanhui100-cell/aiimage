'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLexiStore } from '@/store/lexiStore'
import { useMotivationStore } from '@/store/useMotivationStore'
import { PronunciationButton } from '@/components/pronunciation/PronunciationButton'
import { ExampleSentencePlayer } from '@/components/pronunciation/ExampleSentencePlayer'
import { AccentSelector } from '@/components/pronunciation/AccentSelector'
import { readAccentPreference } from '@/lib/pronunciation/pronunciation-client'
import type { DictionaryWord } from '@/lib/dictionary/dictionary-types'
import type { Accent } from '@/lib/pronunciation/pronunciation-types'

export type PanelMode = 'detail' | 'not-in-corpus' | 'loading' | 'empty'

interface Props {
  word: DictionaryWord | null
  mode: PanelMode
  notInCorpusWord?: string
  onSynonymClick: (word: string) => void
  /** Called when pronunciation playback starts — triggers wave animation in LexiGraphPage */
  onPronunciationPlayed?: () => void
}

const sHead: React.CSSProperties = {
  fontSize: '10px',
  letterSpacing: '0.12em',
  color: 'rgba(56,189,248,0.5)',
  fontFamily: 'var(--font-mono)',
  marginBottom: '6px',
  marginTop: '18px',
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: '11px',
      padding: '2px 7px',
      borderRadius: '4px',
      background: `${color}18`,
      color,
      border: `1px solid ${color}28`,
      fontFamily: 'var(--font-mono)',
      whiteSpace: 'nowrap' as const,
    }}>
      {label}
    </span>
  )
}

function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      height: '100%',
      background: 'rgba(2,6,23,0.88)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(to right, transparent, rgba(56,189,248,0.5), transparent)',
        zIndex: 1,
      }} />
      {children}
    </div>
  )
}

export function LexiGraphPanel({ word, mode, notInCorpusWord, onSynonymClick, onPronunciationPlayed }: Props) {
  const [aiExplanation, setAiExplanation] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [reviewAdded, setReviewAdded] = useState(false)
  const [accent, setAccent] = useState<Accent>('auto')

  // Init accent from localStorage after mount
  useEffect(() => { setAccent(readAccentPreference()) }, [])

  // Anti-spam: each word's pronunciation awards LexiStar at most once per panel lifecycle
  const hasAwardedPronunciationRef = useRef(false)

  const router = useRouter()
  const userLevel = useLexiStore(s => s.profile.userLevel ?? null)
  const lexiWords = useLexiStore(s => s.words)
  const { addLexiStar, markReviewAction, lightUpWordNode, setCompanionMessage, recordPronunciationPlay, recordQuizStart } = useMotivationStore()

  function handlePronunciationPlayed() {
    if (!hasAwardedPronunciationRef.current) {
      hasAwardedPronunciationRef.current = true
      try {
        addLexiStar(2, 'pronunciation', word?.id)
        setCompanionMessage('Good. Let the sound shape the memory.')
        recordPronunciationPlay(word?.id)
      } catch {}
    }
    onPronunciationPlayed?.()
  }

  if (mode === 'empty') {
    return (
      <PanelShell>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'rgba(155,191,202,0.4)', fontSize: '13px', padding: '0 20px' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px', opacity: 0.5 }}>◈</div>
            <div>Search or click a node to explore.</div>
            <div style={{ marginTop: '4px', fontSize: '12px', opacity: 0.6 }}>搜索或点击节点以探索。</div>
          </div>
        </div>
      </PanelShell>
    )
  }

  if (mode === 'loading') {
    return (
      <PanelShell>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: '#38BDF8', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
            Loading… / 加载中…
          </div>
        </div>
      </PanelShell>
    )
  }

  if (mode === 'not-in-corpus') {
    return (
      <PanelShell>
        <div style={{ flex: 1, padding: '24px 20px', color: 'rgba(155,191,202,0.7)', fontSize: '13px' }}>
          <div style={{
            fontSize: '15px', color: '#9BBFCA', marginBottom: '12px',
            fontFamily: 'var(--font-mono)', wordBreak: 'break-word',
          }}>
            {notInCorpusWord ?? '—'}
          </div>
          <div>This related item is not yet in the dictionary.</div>
          <div style={{ marginTop: '4px', opacity: 0.7 }}>这个关联词暂未收录。</div>
          <div style={{ marginTop: '14px', fontSize: '11px', opacity: 0.45, lineHeight: 1.6 }}>
            May be a phrase, root marker, or exam tag — not a standalone dictionary word.
          </div>
        </div>
      </PanelShell>
    )
  }

  if (!word) return null

  const isInReview = lexiWords.some(w => w.id === word.id && w.nextReviewAt != null)
  const standardMnem = word.mnemonics.find(m => m.style === 'standard')
  const cefrColor: Record<string, string> = {
    A1: '#34D399', A2: '#34D399', B1: '#38BDF8', B2: '#38BDF8', C1: '#F97316', C2: '#F97316',
  }

  async function handleAIExplain() {
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await fetch('/api/ai/word-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word!.word, userLevel: userLevel ?? 'intermediate' }),
      })
      const data = (await res.json()) as { content?: string }
      if (res.ok && data.content) {
        setAiExplanation(data.content)
      } else {
        setAiError('AI explanation unavailable. / AI 解释暂时不可用。')
      }
    } catch {
      setAiError('Could not connect. / 无法连接。')
    } finally {
      setAiLoading(false)
    }
  }

  function handleAddToReview() {
    // 词典词经唯一入口进入统一状态机，再进 SRS 队列
    const lexi = useLexiStore.getState()
    lexi.ensureWord(word!, 'lookup')
    lexi.addToReview(word!.id)
    lexi.recordActivity('learned')
    lexi.incXp(10)
    setReviewAdded(true)
    try {
      addLexiStar(8, 'review', word!.id)
      markReviewAction(word!.id)
      lightUpWordNode(word!.id)
      setCompanionMessage("I'll keep this word warm for your next review.")
    } catch {}
  }

  function handleQuizThis() {
    try {
      addLexiStar(5, 'quiz', word!.id)
      setCompanionMessage('Good work. Keep going.')
      recordQuizStart(word!.id)
    } catch {}
    router.push(`/quiz?word=${word!.id}`)
  }

  const btnBase: React.CSSProperties = {
    padding: '6px 11px', borderRadius: '6px', fontSize: '12px',
    fontWeight: 600, cursor: 'pointer', border: 'none', lineHeight: 1.4,
  }

  return (
    <PanelShell>
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 72px' }}>

        {/* Word header */}
        <div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#ECFBFF', lineHeight: 1.1 }}>
            {word.word}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap', marginTop: '4px' }}>
            {word.phoneticIpa && (
              <span style={{ fontSize: '14px', color: '#7EF9FF', fontFamily: 'var(--font-mono)' }}>
                {word.phoneticIpa}
              </span>
            )}
            <PronunciationButton text={word.word} accent={accent} size="sm" onPlayed={handlePronunciationPlayed} />
            <AccentSelector value={accent} onChange={setAccent} />
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '9px' }}>
            {word.partOfSpeech && <Chip label={word.partOfSpeech} color="#8B5CF6" />}
            {word.cefrLevel && <Chip label={word.cefrLevel} color={cefrColor[word.cefrLevel] ?? '#9BBFCA'} />}
            {word.isCore && <Chip label="Core" color="#34D399" />}
            {word.isExamWord && <Chip label="Exam" color="#FBBF24" />}
            {word.examTags.slice(0, 2).map(t => <Chip key={t} label={t} color="rgba(56,189,248,0.75)" />)}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '14px' }}>
          <button
            onClick={handleAddToReview}
            disabled={isInReview || reviewAdded}
            style={{
              ...btnBase,
              background: isInReview || reviewAdded ? 'rgba(52,211,153,0.05)' : 'rgba(52,211,153,0.1)',
              border: '1px solid rgba(52,211,153,0.4)',
              color: isInReview || reviewAdded ? 'rgba(52,211,153,0.4)' : '#34D399',
              cursor: isInReview || reviewAdded ? 'default' : 'pointer',
            }}
          >
            {isInReview || reviewAdded ? '✓ In Review' : '+ Review'}
          </button>
          <button
            onClick={handleQuizThis}
            style={{ ...btnBase, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.4)', color: '#8B5CF6' }}
          >
            Quiz
          </button>
          <button
            onClick={handleAIExplain}
            disabled={aiLoading || !!aiExplanation}
            style={{
              ...btnBase,
              background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.3)',
              color: aiExplanation ? 'rgba(56,189,248,0.4)' : '#38BDF8',
              cursor: aiLoading || !!aiExplanation ? 'default' : 'pointer',
              opacity: aiLoading ? 0.7 : 1,
            }}
          >
            {aiLoading ? '…AI' : aiExplanation ? '✦ Done' : '✦ Ask AI'}
          </button>
          <Link
            href={`/word/${word.id}`}
            style={{
              ...btnBase, cursor: 'pointer', textDecoration: 'none', display: 'inline-block',
              background: 'rgba(155,191,202,0.06)', border: '1px solid rgba(155,191,202,0.2)', color: '#9BBFCA',
            }}
          >
            ↗ Detail
          </Link>
        </div>

        {/* AI result */}
        {aiError && (
          <div style={{ marginTop: '8px', fontSize: '11px', color: '#F87171' }}>{aiError}</div>
        )}
        {aiExplanation && (
          <div style={{
            marginTop: '10px', padding: '10px 12px',
            background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)',
            borderRadius: '7px', fontSize: '12px', color: '#ECFBFF', lineHeight: 1.65,
          }}>
            {aiExplanation}
          </div>
        )}
        <Link
          href={`/chat?context=lexigraph_word&word=${encodeURIComponent(word.id)}`}
          style={{ display: 'inline-block', marginTop: '6px', fontSize: '11px', color: 'rgba(139,92,246,0.6)', textDecoration: 'none' }}
        >
          ✦ Ask AI in Chat / 在 AI 导学中深入探索 →
        </Link>

        {/* Definition */}
        {word.definitions.length > 0 && (
          <>
            <div style={sHead}>DEFINITION / 释义</div>
            <div style={{ fontSize: '13px', color: '#ECFBFF', lineHeight: 1.65 }}>
              {word.definitions[0].definitionEn}
            </div>
            {word.definitions[0].definitionZh && (
              <div style={{ fontSize: '12px', color: '#9BBFCA', marginTop: '3px' }}>
                {word.definitions[0].definitionZh}
              </div>
            )}
          </>
        )}

        {/* Example */}
        {word.examples.length > 0 && (
          <>
            <div style={sHead}>EXAMPLE / 例句</div>
            <div style={{
              background: 'rgba(56,189,248,0.04)',
              borderLeft: '3px solid rgba(56,189,248,0.35)',
              padding: '7px 11px', borderRadius: '0 5px 5px 0',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#ECFBFF', lineHeight: 1.65, fontStyle: 'italic' }}>
                    {word.examples[0].sentenceEn}
                  </div>
                  {word.examples[0].sentenceZh && (
                    <div style={{ fontSize: '11px', color: '#9BBFCA', marginTop: '3px' }}>
                      {word.examples[0].sentenceZh}
                    </div>
                  )}
                </div>
                <ExampleSentencePlayer sentence={word.examples[0].sentenceEn} accent={accent} />
              </div>
            </div>
          </>
        )}

        {/* Synonyms */}
        {word.synonyms.length > 0 && (
          <>
            <div style={sHead}>SYNONYMS / 近义词</div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {word.synonyms.slice(0, 5).map(s => (
                <button
                  key={s}
                  onClick={() => onSynonymClick(s)}
                  style={{
                    padding: '3px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer',
                    background: 'rgba(52,211,153,0.08)', color: '#34D399',
                    border: '1px solid rgba(52,211,153,0.22)', fontFamily: 'var(--font-mono)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Antonyms */}
        {word.antonyms.length > 0 && (
          <>
            <div style={sHead}>ANTONYMS / 反义词</div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {word.antonyms.slice(0, 4).map(s => (
                <button
                  key={s}
                  onClick={() => onSynonymClick(s)}
                  style={{
                    padding: '3px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer',
                    background: 'rgba(248,113,113,0.08)', color: 'rgba(248,113,113,0.85)',
                    border: '1px solid rgba(248,113,113,0.22)', fontFamily: 'var(--font-mono)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Collocations */}
        {word.collocations.length > 0 && (
          <>
            <div style={sHead}>COLLOCATIONS / 搭配</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {word.collocations.slice(0, 3).map((c, i) => (
                <div key={i}>
                  <div style={{ fontSize: '12px', color: '#38BDF8', fontFamily: 'var(--font-mono)' }}>
                    {c.phrase}
                  </div>
                  {c.exampleEn && (
                    <div style={{ fontSize: '11px', color: '#9BBFCA', marginTop: '2px' }}>{c.exampleEn}</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Etymology */}
        {word.etymology && (
          <>
            <div style={sHead}>ETYMOLOGY / 词源</div>
            <div style={{ fontSize: '12px', color: '#FBBF24', fontFamily: 'var(--font-mono)' }}>
              {word.etymology.roots}
            </div>
            {word.etymology.explanationEn && (
              <div style={{ fontSize: '11px', color: '#9BBFCA', marginTop: '3px', lineHeight: 1.55 }}>
                {word.etymology.explanationEn}
              </div>
            )}
            {word.etymology.explanationZh && (
              <div style={{ fontSize: '11px', color: 'rgba(155,191,202,0.55)', marginTop: '2px' }}>
                {word.etymology.explanationZh}
              </div>
            )}
          </>
        )}

        {/* Mnemonic */}
        {standardMnem && (
          <>
            <div style={sHead}>MNEMONIC / 记忆法</div>
            <div style={{
              fontSize: '12px', color: '#ECFBFF', lineHeight: 1.6,
              background: 'rgba(139,92,246,0.06)', padding: '8px 11px',
              borderRadius: '6px', border: '1px solid rgba(139,92,246,0.15)',
            }}>
              {standardMnem.mnemonicEn}
            </div>
            {standardMnem.mnemonicZh && (
              <div style={{ fontSize: '11px', color: '#9BBFCA', marginTop: '4px' }}>
                {standardMnem.mnemonicZh}
              </div>
            )}
          </>
        )}

        {/* Source */}
        <div style={{ marginTop: '18px', fontSize: '10px', color: 'rgba(155,191,202,0.25)', fontFamily: 'var(--font-mono)' }}>
          src: {word.sourceType}{word.sourceNote ? ` · ${word.sourceNote.slice(0, 40)}` : ''}
        </div>
      </div>
    </PanelShell>
  )
}
