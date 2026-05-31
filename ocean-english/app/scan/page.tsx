'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { useLearningStore } from '@/store/learningStore'
import { mockScanResult } from '@/data/mock-scan'
import type { ScanResult } from '@/types/study'

export default function ScanPage() {
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [savedVocab, setSavedVocab] = useState<Set<string>>(new Set())

  const { addToReview, saveWord, completeTaskUnit, incrementXp } = useLearningStore()

  function simulateUpload() {
    setIsAnalyzing(true)
    setTimeout(() => {
      setResult(mockScanResult)
      setIsAnalyzing(false)
    }, 2000)
  }

  function handleSaveVocab(word: string) {
    const id = word.toLowerCase().replace(/\s+/g, '-')
    addToReview(id, word)
    saveWord(id)
    setSavedVocab(prev => new Set(prev).add(word))
    completeTaskUnit('vocab-5', 1)
    incrementXp(10)
  }

  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
          <h1 style={{ margin: '0 0 6px', fontSize: '32px', fontWeight: 700, color: '#ECFBFF' }}>
            Scan Hollow <span style={{ fontSize: '18px', color: '#9BBFCA' }}>文档树洞</span>
          </h1>
          <p style={{ margin: '0 0 28px', color: '#9BBFCA', fontSize: '14px' }}>
            Upload a PDF or image to extract vocabulary and get answer suggestions.
            <br />
            <span style={{ color: 'rgba(155,191,202,0.6)', fontSize: '13px' }}>
              上传 PDF 或图片，提取生词，获取答案建议。
            </span>
          </p>

          {/* Upload zone */}
          {!result && !isAnalyzing && (
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => { e.preventDefault(); setIsDragging(false); simulateUpload() }}
              onClick={simulateUpload}
              style={{
                border: `2px dashed ${isDragging ? 'rgba(255,215,106,0.7)' : 'rgba(255,215,106,0.3)'}`,
                borderRadius: '16px',
                padding: '64px 32px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: isDragging ? 'rgba(255,215,106,0.05)' : 'transparent',
                marginBottom: '24px',
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>📄</div>
              <div style={{ color: 'rgba(255,215,106,0.8)', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                Drop PDF or image here, or click to simulate
              </div>
              <div style={{ color: 'rgba(255,215,106,0.5)', fontSize: '13px', marginBottom: '8px' }}>
                拖放 PDF 或图片至此，或点击模拟上传
              </div>
              <div style={{ color: 'rgba(155,191,202,0.4)', fontSize: '11px', fontFamily: 'ui-monospace, monospace' }}>
                [ MOCK — Real OCR integration in Phase 3 ]
              </div>
            </div>
          )}

          {/* Analyzing */}
          {isAnalyzing && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#9BBFCA' }}>
              <div style={{ fontSize: '32px', marginBottom: '16px', animation: 'spin 1s linear infinite' }}>⚙️</div>
              <div style={{ fontSize: '16px', marginBottom: '4px' }}>Analyzing document...</div>
              <div style={{ fontSize: '13px', color: 'rgba(155,191,202,0.6)' }}>正在分析文档...</div>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Results */}
          {result && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', color: '#34D399' }}>✓ Analysis complete / 分析完成</div>
                <button onClick={() => { setResult(null); setSavedVocab(new Set()) }}
                  style={{ background: 'none', border: '1px solid rgba(155,191,202,0.2)', borderRadius: '6px', padding: '6px 12px', color: '#9BBFCA', fontSize: '12px', cursor: 'pointer' }}>
                  ↑ Upload New / 重新上传
                </button>
              </div>

              {/* Extracted text */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(155,191,202,0.12)', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(56,189,248,0.5)', fontFamily: 'ui-monospace, monospace', marginBottom: '10px' }}>
                  EXTRACTED TEXT / 提取文本
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#9BBFCA', lineHeight: 1.8, fontStyle: 'italic' }}>
                  &ldquo;{result.extractedText}&rdquo;
                </p>
              </div>

              {/* Vocabulary */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(155,191,202,0.12)', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(255,215,106,0.6)', fontFamily: 'ui-monospace, monospace', marginBottom: '14px' }}>
                  EXTRACTED VOCABULARY / 提取生词 ({result.vocabulary.length} words)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {result.vocabulary.map(v => (
                    <div key={v.word} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(155,191,202,0.08)' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#ECFBFF', marginBottom: '2px' }}>
                          <Link href={`/word/${v.word.toLowerCase()}`} style={{ color: '#ECFBFF', textDecoration: 'none' }}>
                            {v.word}
                          </Link>
                        </div>
                        <div style={{ fontSize: '12px', color: '#9BBFCA' }}>{v.definitionZh}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(155,191,202,0.5)' }}>{v.definition}</div>
                      </div>
                      <button
                        onClick={() => handleSaveVocab(v.word)}
                        disabled={savedVocab.has(v.word)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          background: savedVocab.has(v.word) ? 'rgba(52,211,153,0.1)' : 'rgba(56,189,248,0.08)',
                          border: `1px solid ${savedVocab.has(v.word) ? 'rgba(52,211,153,0.3)' : 'rgba(56,189,248,0.25)'}`,
                          color: savedVocab.has(v.word) ? '#34D399' : '#38BDF8',
                          fontSize: '12px',
                          cursor: savedVocab.has(v.word) ? 'default' : 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {savedVocab.has(v.word) ? '✓ Saved' : '+ Add to Review'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Questions */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(155,191,202,0.12)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(139,92,246,0.6)', fontFamily: 'ui-monospace, monospace', marginBottom: '14px' }}>
                  QUESTION ANALYSIS / 题目分析 ({result.questions.length} questions)
                </div>
                {result.questions.map((q, i) => (
                  <div key={i} style={{ marginBottom: i < result.questions.length - 1 ? '16px' : 0, paddingBottom: i < result.questions.length - 1 ? '16px' : 0, borderBottom: i < result.questions.length - 1 ? '1px solid rgba(155,191,202,0.08)' : 'none' }}>
                    <div style={{ fontSize: '13px', color: '#ECFBFF', marginBottom: '8px', fontWeight: 600 }}>Q{i + 1}: {q.text}</div>
                    <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', padding: '10px 14px' }}>
                      <div style={{ fontSize: '11px', color: 'rgba(139,92,246,0.7)', marginBottom: '6px', fontFamily: 'ui-monospace, monospace' }}>AI SUGGESTED ANSWER / AI 建议答案</div>
                      <div style={{ fontSize: '13px', color: '#ECFBFF', lineHeight: 1.6, marginBottom: '4px' }}>{q.suggestedAnswer}</div>
                      <div style={{ fontSize: '12px', color: '#9BBFCA', lineHeight: 1.6 }}>{q.suggestedAnswerZh}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '32px' }}>
            <Link href="/" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>
              ← Back to Home / 返回首页
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
