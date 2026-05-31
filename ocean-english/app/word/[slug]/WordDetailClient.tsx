'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SaveWordButton } from '@/components/learning/SaveWordButton'
import { useLearningStore } from '@/store/learningStore'
import type { Word } from '@/types/word'

const sectionStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(155,191,202,0.12)',
  borderRadius: '12px',
  padding: '20px 24px',
  marginBottom: '16px',
}

const sectionHeadStyle: React.CSSProperties = {
  fontSize: '11px',
  letterSpacing: '0.12em',
  color: 'rgba(56,189,248,0.6)',
  fontFamily: 'ui-monospace, monospace',
  marginBottom: '12px',
}

interface WordDetailClientProps {
  word: Word
}

export function WordDetailClient({ word }: WordDetailClientProps) {
  const [showEvil, setShowEvil] = useState(false)
  const { addToReview, completeTaskUnit, markStudyToday, incrementXp } = useLearningStore()
  const router = useRouter()

  function handleAddToReview() {
    addToReview(word.id, word.word)
    completeTaskUnit('vocab-5', 1)
    markStudyToday()
    incrementXp(10)
  }

  function handleQuizThis() {
    router.push(`/quiz?word=${word.id}`)
  }

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

        {/* Word header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ margin: '0 0 6px', fontSize: '42px', fontWeight: 700, color: '#ECFBFF' }}>
                {word.word}
              </h1>
              <div
                style={{
                  fontSize: '18px',
                  color: '#7EF9FF',
                  fontFamily: 'ui-monospace, monospace',
                  marginBottom: '8px',
                }}
              >
                {word.phonetic}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {word.examFrequency.map(exam => (
                  <span
                    key={exam}
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(56,189,248,0.08)',
                      color: 'rgba(56,189,248,0.7)',
                      border: '1px solid rgba(56,189,248,0.2)',
                      fontFamily: 'ui-monospace, monospace',
                    }}
                  >
                    {exam}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <SaveWordButton wordId={word.id} word={word.word} />
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
            </div>
          </div>
        </div>

        {/* Definitions */}
        <div style={sectionStyle}>
          <div style={sectionHeadStyle}>DEFINITIONS / 释义</div>
          {word.definitions.map((def, i) => (
            <div key={i} style={{ marginBottom: i < word.definitions.length - 1 ? '16px' : 0 }}>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(139,92,246,0.1)',
                  color: '#8B5CF6',
                  border: '1px solid rgba(139,92,246,0.3)',
                  marginBottom: '6px',
                  display: 'inline-block',
                  fontFamily: 'ui-monospace, monospace',
                }}
              >
                {def.partOfSpeech}
              </span>
              <p style={{ margin: '0 0 4px', fontSize: '15px', color: '#ECFBFF', lineHeight: 1.6 }}>
                {def.meaning}
              </p>
              <p style={{ margin: '0 0 10px', fontSize: '14px', color: '#9BBFCA' }}>
                {def.meaningZh}
              </p>
              <div
                style={{
                  background: 'rgba(56,189,248,0.05)',
                  borderLeft: '3px solid rgba(56,189,248,0.4)',
                  padding: '10px 14px',
                  borderRadius: '0 6px 6px 0',
                }}
              >
                <p style={{ margin: '0 0 3px', fontSize: '13px', color: '#ECFBFF', fontStyle: 'italic' }}>
                  &ldquo;{def.example}&rdquo;
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#9BBFCA' }}>{def.exampleZh}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Etymology */}
        <div style={sectionStyle}>
          <div style={sectionHeadStyle}>ETYMOLOGY / 词源</div>
          <div style={{ fontSize: '13px', color: '#7EF9FF', fontFamily: 'ui-monospace, monospace', marginBottom: '8px' }}>
            {word.etymology.roots}
          </div>
          <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#ECFBFF', lineHeight: 1.6 }}>
            {word.etymology.explanation}
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: '#9BBFCA' }}>{word.etymology.explanationZh}</p>
        </div>

        {/* Mnemonic */}
        <div style={sectionStyle}>
          <div style={sectionHeadStyle}>MEMORY TRICKS / 记忆法</div>
          <div
            style={{
              background: 'rgba(255,215,106,0.06)',
              border: '1px solid rgba(255,215,106,0.2)',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: word.mnemonicEvil ? '12px' : 0,
            }}
          >
            <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#FFD76A', lineHeight: 1.6 }}>
              💡 {word.mnemonic}
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,215,106,0.7)' }}>
              {word.mnemonicZh}
            </p>
          </div>
          {word.mnemonicEvil && (
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
                  fontFamily: 'ui-monospace, monospace',
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
                    😈 {word.mnemonicEvil}
                  </p>
                  <p style={{ margin: 0, fontSize: '13px', color: 'rgba(239,68,68,0.6)' }}>
                    {word.mnemonicEvilZh}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Synonyms & Antonyms */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div style={sectionStyle}>
            <div style={sectionHeadStyle}>SYNONYMS / 近义词</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {word.synonyms.map(s => (
                <Link
                  key={s}
                  href={`/word/${s}`}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '5px',
                    background: 'rgba(52,211,153,0.08)',
                    color: '#34D399',
                    border: '1px solid rgba(52,211,153,0.25)',
                    fontSize: '13px',
                    textDecoration: 'none',
                  }}
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>
          <div style={sectionStyle}>
            <div style={sectionHeadStyle}>ANTONYMS / 反义词</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {word.antonyms.map(a => (
                <Link
                  key={a}
                  href={`/word/${a}`}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '5px',
                    background: 'rgba(239,68,68,0.08)',
                    color: 'rgba(239,68,68,0.7)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    fontSize: '13px',
                    textDecoration: 'none',
                  }}
                >
                  {a}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Collocations */}
        {word.collocations.length > 0 && (
          <div style={sectionStyle}>
            <div style={sectionHeadStyle}>COLLOCATIONS / 常用搭配</div>
            {word.collocations.map((c, i) => (
              <div key={i} style={{ marginBottom: i < word.collocations.length - 1 ? '14px' : 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#7EF9FF', marginBottom: '4px', fontFamily: 'ui-monospace, monospace' }}>
                  {c.phrase}
                </div>
                <div style={{ fontSize: '13px', color: '#ECFBFF', marginBottom: '2px' }}>{c.example}</div>
                <div style={{ fontSize: '12px', color: '#9BBFCA' }}>{c.exampleZh}</div>
              </div>
            ))}
          </div>
        )}

        {/* Scene Usage */}
        {word.sceneUsage.length > 0 && (
          <div style={sectionStyle}>
            <div style={sectionHeadStyle}>SCENE USAGE / 场景用法</div>
            {word.sceneUsage.map((s, i) => (
              <div key={i} style={{ marginBottom: i < word.sceneUsage.length - 1 ? '14px' : 0 }}>
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
                    fontFamily: 'ui-monospace, monospace',
                  }}
                >
                  {s.scene} / {s.sceneZh}
                </div>
                <div style={{ fontSize: '13px', color: '#ECFBFF', marginBottom: '3px', fontStyle: 'italic' }}>
                  &ldquo;{s.example}&rdquo;
                </div>
                <div style={{ fontSize: '12px', color: '#9BBFCA' }}>{s.exampleZh}</div>
              </div>
            ))}
          </div>
        )}

        {/* Back */}
        <div style={{ marginTop: '32px' }}>
          <Link href="/dictionary" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>
            ← Dictionary / 返回词典
          </Link>
        </div>
      </div>
    </div>
  )
}
