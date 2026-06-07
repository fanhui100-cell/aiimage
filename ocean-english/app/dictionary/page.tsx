'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { PageShell } from '@/components/ui/PageShell'
import { PillFilter } from '@/components/ui/PillFilter'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { GlassCard } from '@/components/ui/GlassCard'
import { WordSearchBox } from '@/components/learning/WordSearchBox'
import { WordCard } from '@/components/learning/WordCard'
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
      <PageShell maxWidth={960}>
        <div style={{ marginBottom: '8px', fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(56,189,248,0.45)', fontFamily: 'var(--font-mono)' }}>
          LEXIOCEAN / VOCABULARY ROOTS
        </div>
        <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 700, color: '#ECFBFF' }}>
          Vocabulary Roots{' '}
          <span style={{ fontSize: '18px', color: '#9BBFCA' }}>词汇根系</span>
        </h1>

        {/* LexiGraph entry card */}
        <Link
          href="/lexigraph"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            marginBottom: '20px',
            borderRadius: '10px',
            textDecoration: 'none',
            background: 'rgba(126,249,255,0.04)',
            border: '1px solid rgba(126,249,255,0.18)',
            transition: 'border-color 0.2s',
          }}
        >
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#7EF9FF', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
              ✦ Explore in LexiGraph / 进入词汇星图
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(155,191,202,0.6)', marginTop: '3px' }}>
              Explore word relationships, collocations, synonyms &amp; review status on an interactive map.
            </div>
          </div>
          <span style={{ fontSize: '18px', color: 'rgba(126,249,255,0.5)', marginLeft: '12px', flexShrink: 0 }}>→</span>
        </Link>

        {/* Search */}
        <div style={{ marginBottom: '16px' }}>
          <WordSearchBox onSearch={setQuery} />
        </div>

        {/* Filter rows */}
        <GlassCard style={{ marginBottom: '20px', padding: '14px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'rgba(155,191,202,0.4)', fontFamily: 'var(--font-mono)', flexShrink: 0, minWidth: '48px' }}>LEVEL</span>
              <PillFilter options={levelOptions} value={levelFilter} onChange={setLevelFilter} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10px', letterSpacing: '0.12em', color: 'rgba(155,191,202,0.4)', fontFamily: 'var(--font-mono)', flexShrink: 0, minWidth: '48px' }}>DIFF</span>
              <PillFilter options={difficultyOptions} value={diffFilter} onChange={setDiffFilter} accentColor="#8B5CF6" />
            </div>
          </div>
        </GlassCard>

        {/* Result count */}
        <div style={{ fontSize: '12px', color: 'rgba(155,191,202,0.45)', marginBottom: '16px', fontFamily: 'var(--font-mono)' }}>
          {loading ? '…' : `${results.length} result${results.length !== 1 ? 's' : ''}`}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} style={{ borderRadius: '10px', padding: '16px 20px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                <Skeleton height={20} width="60%" style={{ marginBottom: '8px' }} />
                <Skeleton height={12} width="40%" style={{ marginBottom: '8px' }} />
                <Skeleton height={12} count={2} />
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {results.map(w => (
              <WordCard key={w.id} word={toWordCardProp(w)} />
            ))}
          </div>
        )}
      </PageShell>
    </AppShell>
  )
}
