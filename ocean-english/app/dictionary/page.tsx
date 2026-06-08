'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { PageShell } from '@/components/ui/PageShell'
import { PillFilter } from '@/components/ui/PillFilter'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { GlassCard } from '@/components/ui/GlassCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { WordSearchBox } from '@/components/learning/WordSearchBox'
import { WordCard } from '@/components/learning/WordCard'
import { AnimatedList } from '@/components/ui/motion/AnimatedList'
import { useLearningStore } from '@/store/learningStore'
import type { DictionaryWord } from '@/lib/dictionary/dictionary-types'
import type { Word, ExamFrequency } from '@/types/word'

const levelOptions = [
  { value: '', label: 'All Levels', labelShort: 'All' },
  { value: 'beginner', label: 'Beginner', labelShort: 'Beginner' },
  { value: 'elementary', label: 'Elementary', labelShort: 'Elementary' },
  { value: 'intermediate', label: 'Intermediate', labelShort: 'Intermediate' },
  { value: 'advanced', label: 'Advanced', labelShort: 'Advanced' },
  { value: 'exam-prep', label: 'Exam Prep', labelShort: 'Exam' },
]

const difficultyOptions = [
  { value: '', label: 'All', labelShort: 'All' },
  { value: '1', label: 'L1', labelShort: 'L1' },
  { value: '2', label: 'L2', labelShort: 'L2' },
  { value: '3', label: 'L3', labelShort: 'L3' },
  { value: '4', label: 'L4', labelShort: 'L4' },
  { value: '5', label: 'L5', labelShort: 'L5' },
]

const VALID_EXAM_FREQ: ExamFrequency[] = ['TOEFL', 'IELTS', 'CET-4', 'CET-6', 'KAOYAN', 'GAOKAO']

function toWordCardProp(w: DictionaryWord): Word {
  return {
    id: w.id,
    word: w.word,
    phonetic: w.phoneticIpa ?? '',
    definitions: w.definitions.length > 0
      ? w.definitions.map(d => ({
          partOfSpeech: d.partOfSpeech,
          meaning: d.definitionEn,
          meaningZh: d.definitionZh ?? '',
          example: w.examples[0]?.sentenceEn ?? '',
          exampleZh: w.examples[0]?.sentenceZh ?? '',
        }))
      : [{ partOfSpeech: '', meaning: '', meaningZh: '', example: '', exampleZh: '' }],
    etymology: { roots: '', explanation: '', explanationZh: '' },
    mnemonic: w.mnemonics[0]?.mnemonicEn ?? '',
    mnemonicZh: w.mnemonics[0]?.mnemonicZh ?? '',
    synonyms: w.synonyms,
    antonyms: w.antonyms,
    collocations: w.collocations.map(c => ({
      phrase: c.phrase,
      example: c.exampleEn ?? '',
      exampleZh: c.exampleZh ?? '',
    })),
    sceneUsage: [],
    examFrequency: w.examTags.filter((t): t is ExamFrequency =>
      VALID_EXAM_FREQ.includes(t as ExamFrequency)
    ),
    tags: w.tags,
    difficulty: w.difficulty,
    level: w.level,
  }
}

export default function DictionaryPage() {
  const { userLevel } = useLearningStore()
  const [query, setQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState(userLevel ?? '')
  const [diffFilter, setDiffFilter] = useState('')
  const [results, setResults] = useState<DictionaryWord[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  const fetchWords = useCallback(async (q: string, level: string, diff: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (level) params.set('level', level)
      if (diff) params.set('difficulty', diff)
      params.set('limit', '80')

      const res = await fetch(`/api/dictionary/search?${params.toString()}`)
      if (!res.ok) throw new Error('search failed')
      const json = await res.json() as { ok: boolean; data: DictionaryWord[] }
      setResults(json.data ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }, [])

  useEffect(() => {
    fetchWords(query, levelFilter, diffFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelFilter, diffFilter, fetchWords])

  useEffect(() => {
    const timer = setTimeout(() => fetchWords(query, levelFilter, diffFilter), 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  return (
    <AppShell>
      <PageShell maxWidth={960} theme="light">
        {/* 页面标题 */}
        <SectionHeader label="VOCABULARY · 词汇根系" theme="light" divider style={{ marginTop: 0 }} />
        <h1 style={{ margin: '10px 0 4px', fontFamily: 'var(--font-serif-zh)', fontWeight: 600, fontSize: 'clamp(24px, 3.5vw, 38px)', color: 'var(--ink)', letterSpacing: '0.01em' }}>
          词汇根系
        </h1>
        <p style={{ margin: '0 0 24px', fontFamily: 'var(--font-news)', fontStyle: 'italic', fontSize: '15px', color: 'var(--teal-ink)' }}>
          Vocabulary Roots
        </p>

        {/* 进入星图卡 */}
        <Link
          href="/lexigraph"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            marginBottom: '22px',
            borderRadius: 'var(--r-sm)',
            textDecoration: 'none',
            background: 'var(--teal-bg)',
            border: '1px solid rgba(14,140,122,0.2)',
            transition: 'border-color 0.2s',
          }}
        >
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--teal-ink)', fontFamily: 'var(--font-sans)', marginBottom: '3px' }}>
              在词汇星图中探索
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ink-sub)' }}>
              单词关系、搭配与近反义词的交互图谱
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--teal-ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: '12px' }}>
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>

        {/* Search */}
        <div style={{ marginBottom: '16px' }}>
          <WordSearchBox onSearch={setQuery} />
        </div>

        {/* Filter rows */}
        <GlassCard theme="light" style={{ marginBottom: '20px', padding: '14px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0, minWidth: '48px' }}>LEVEL</span>
              <PillFilter options={levelOptions} value={levelFilter} onChange={setLevelFilter} theme="light" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0, minWidth: '48px' }}>DIFF</span>
              <PillFilter options={difficultyOptions} value={diffFilter} onChange={setDiffFilter} accentColor="#8B5CF6" theme="light" />
            </div>
          </div>
        </GlassCard>

        {/* Result count */}
        <div style={{ fontSize: '12px', color: 'var(--ink-muted)', marginBottom: '16px', fontFamily: 'var(--font-mono)' }}>
          {loading ? '…' : `${results.length} 个单词`}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} style={{ borderRadius: '10px', padding: '16px 20px', background: 'var(--card)', border: '1px solid var(--line)' }}>
                <Skeleton height={20} width="60%" theme="light" style={{ marginBottom: '8px' }} />
                <Skeleton height={12} width="40%" theme="light" style={{ marginBottom: '8px' }} />
                <Skeleton height={12} count={2} theme="light" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && results.length === 0 && !initialLoad && (
          <EmptyState
            icon="◌"
            title={query ? `No results for "${query}"` : 'No words found'}
            titleZh={query ? `未找到 "${query}" 相关单词` : '暂无词汇'}
            description={query ? 'Try a different search term or adjust the filters.' : 'Adjust the level or difficulty filters above.'}
            descriptionZh="调整搜索词或筛选条件。"
          />
        )}

        {/* Word list */}
        {!loading && results.length > 0 && (
          <AnimatedList style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {results.map(w => (
              <WordCard key={w.id} word={toWordCardProp(w)} />
            ))}
          </AnimatedList>
        )}
      </PageShell>
    </AppShell>
  )
}
