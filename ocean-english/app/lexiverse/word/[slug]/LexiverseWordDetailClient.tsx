'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import type { DictionaryWord } from '@/lib/dictionary/dictionary-client'
import { getConstellationById, getGalaxyById } from '@/config/lexiverse-galaxies'
import { resolveLearningState } from '@/lib/lexiverse/lexiverse-learning-state'
import { resolveGalaxyWords } from '@/lib/lexiverse/lexiverse-word-filter'
import { useLexiverseDictionary } from '@/lib/lexiverse/useLexiverseDictionary'
import { useLearningStore } from '@/store/learningStore'
import { useLexiStore } from '@/store/lexiStore'
import { LiquidActionButton, LiquidBadge, LiquidGlassCard, LiquidGlassPanel } from '@/components/lexiverse/liquid-ui'
import { useLexiverseSlices } from '@/components/lexiverse/useLexiverseSlices'

const STATE_COLOR = {
  mastered: '#7EF9FF',
  recommended: '#FFD66B',
  learning: '#38BDF8',
  review: '#FFA85A',
  weak: '#FF8FA8',
  unknown: '#9FB6C6',
  locked: '#52617A',
} as const

export function LexiverseWordDetailClient({ word }: { word: DictionaryWord }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const galaxyId = searchParams.get('galaxy')
  const returnTo = searchParams.get('returnTo') ?? (galaxyId ? `/lexiverse?galaxy=${galaxyId}` : '/lexiverse')
  const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`

  const slices = useLexiverseSlices()
  // 写双发（learningStore 仍是云同步镜像），读以 lexiStore 为准
  const addToReview = useLearningStore((state) => state.addToReview)
  const { words } = useLexiverseDictionary()

  const learningState = resolveLearningState({ wordId: word.id, normalizedWord: word.id, slices })
  const stateColor = STATE_COLOR[learningState]
  const isInReview = useLexiStore(s => s.words.some(w => w.id === word.id && w.nextReviewAt != null))

  function handleAddToReview() {
    // 词典词经唯一入口进入统一状态机，再进 SRS 队列；镜像写 learningStore（A7 移除）
    const lexi = useLexiStore.getState()
    lexi.ensureWord(word, 'lookup')
    lexi.addToReview(word.id)
    addToReview(word.id, word.word)
  }

  const galaxy = galaxyId ? getGalaxyById(galaxyId) : null
  const constellation = galaxy?.constellationId ? getConstellationById(galaxy.constellationId) : null
  const galaxyWords = useMemo(() => {
    if (!galaxy) return []
    return resolveGalaxyWords(words, galaxy.filter, 300).map((match) => match.word)
  }, [galaxy, words])

  const primaryDefinition = word.definitions[0]
  const primaryExample = word.examples[0]
  const tags = [...(word.themeTags ?? []), ...(word.domainTags ?? [])]

  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(word.word)
    utterance.lang = 'en-US'
    window.speechSynthesis?.speak(utterance)
  }

  return (
    <main style={{ minHeight: '100vh', background: '#040407', color: '#ECFBFF', fontFamily: "'Space Grotesk', system-ui, sans-serif", padding: '18px 22px 56px' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 35% 18%, rgba(126,249,255,0.10), transparent 34%), radial-gradient(circle at 76% 28%, rgba(139,92,246,0.10), transparent 30%), #040407' }} />

      <header style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 34 }}>
        <Link href="/lexiverse" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#ECFBFF' }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#BFF6FF,#7EF9FF 45%,#38BDF8)', color: '#051421', fontWeight: 800 }}>L</span>
          <span>
            <b style={{ display: 'block', fontSize: 14 }}>LexiOcean</b>
            <i style={{ display: 'block', fontStyle: 'normal', fontSize: 10, color: '#9DB6CB', fontFamily: "'Space Mono', monospace" }}>Lexiverse · 词汇宇宙</i>
          </span>
        </Link>
        <Link href={returnTo} style={{ textDecoration: 'none' }}>
          <LiquidActionButton variant="secondary" iconStart={<span aria-hidden>←</span>}>
            Back · 返回
          </LiquidActionButton>
        </Link>
      </header>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto' }}>
        <nav style={{ fontSize: 12, color: '#9FB6C6', marginBottom: 18, fontFamily: "'Space Mono', monospace" }}>
          <Link href="/lexiverse" style={{ color: '#7EF9FF', textDecoration: 'none' }}>Lexiverse</Link>
          {constellation && <> / <span>{constellation.title}</span></>}
          {galaxy && <> / <Link href={`/lexiverse?galaxy=${galaxy.id}`} style={{ color: '#ECFBFF', textDecoration: 'none' }}>{galaxy.title}</Link></>}
          <> / <span style={{ color: '#ECFBFF' }}>{word.word}</span></>
        </nav>

        <LiquidGlassPanel padding={28} style={{ background: 'rgba(186,220,252,0.12)', borderColor: 'rgba(190,228,255,0.28)' }}>
          <section style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(52px, 9vw, 92px)', lineHeight: 0.92, letterSpacing: 0, margin: 0 }}>{word.word}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
                <button type="button" onClick={speak} aria-label="Play pronunciation" style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(126,249,255,0.35)', background: 'rgba(126,249,255,0.10)', color: '#7EF9FF', cursor: 'pointer' }}>▶</button>
                {word.phoneticIpa && <span style={{ color: '#7EF9FF', fontFamily: "'Space Mono', monospace" }}>{word.phoneticIpa}</span>}
                {word.partOfSpeech && <span style={{ color: '#9FB6C6' }}>{word.partOfSpeech}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {word.cefrLevel && <LiquidBadge color="#7EF9FF">{word.cefrLevel}</LiquidBadge>}
              <LiquidBadge color={stateColor}>{learningState}</LiquidBadge>
              {word.examTags.map((tag) => <LiquidBadge key={tag} color="#FFD66B" size="sm">{tag}</LiquidBadge>)}
            </div>
          </section>

          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 26 }}>
            <LiquidActionButton onClick={handleAddToReview} disabled={isInReview} accent="#FFA85A">
              {isInReview ? 'In Review · 已加入复习' : 'Add to Review · 加入复习'}
            </LiquidActionButton>
            <Link href={`/lexiverse/quiz?mode=vocabulary-drill&word=${word.id}&returnTo=${encodeURIComponent(currentUrl)}`} style={{ textDecoration: 'none' }}>
              <LiquidActionButton accent="#7EF9FF">Quiz this word · 练习</LiquidActionButton>
            </Link>
            <Link href={`/chat?context=word&word=${word.id}&returnTo=${encodeURIComponent(currentUrl)}`} style={{ textDecoration: 'none' }}>
              <LiquidActionButton accent="#B79BFF">Ask AI · 问 AI</LiquidActionButton>
            </Link>
            <Link href={`/lexigraph?word=${word.id}`} style={{ textDecoration: 'none' }}>
              <LiquidActionButton variant="secondary">Open in LexiGraph</LiquidActionButton>
            </Link>
            <Link href={`/lexiverse/vocab?word=${word.id}`} style={{ textDecoration: 'none' }}>
              <LiquidActionButton variant="secondary">Open Vocab Browser</LiquidActionButton>
            </Link>
          </div>

          <Divider />

          {primaryDefinition && (
            <section>
              <div style={{ fontSize: 21, lineHeight: 1.55, color: '#DCEAF2' }}>{primaryDefinition.definitionEn}</div>
              {primaryDefinition.definitionZh && <div style={{ fontSize: 15, color: '#9BBFCA', marginTop: 8 }}>{primaryDefinition.definitionZh}</div>}
            </section>
          )}

          {primaryExample && (
            <LiquidGlassCard style={{ marginTop: 24, borderLeft: '2px solid rgba(126,249,255,0.72)', background: 'rgba(126,249,255,0.045)' }}>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: '#DCEAF2' }}>
                {highlightWord(primaryExample.sentenceEn, word.word)}
              </p>
              {primaryExample.sentenceZh && <p style={{ margin: '8px 0 0', fontSize: 13.5, color: '#8AA2B2' }}>{primaryExample.sentenceZh}</p>}
            </LiquidGlassCard>
          )}

          <InfoGrid word={word} tags={tags} />

          {galaxy && galaxyWords.length > 0 && (
            <section style={{ marginTop: 28 }}>
              <SectionTitle>{galaxy.title} · 同星系词语</SectionTitle>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', maxHeight: 150, overflow: 'auto' }}>
                {galaxyWords.slice(0, 80).map((item) => (
                  <Link key={item.id} href={`/lexiverse/word/${item.id}?galaxy=${galaxy.id}`} style={{ textDecoration: 'none' }}>
                    <span style={{ display: 'inline-flex', padding: '5px 10px', borderRadius: 8, border: item.id === word.id ? '1px solid rgba(126,249,255,0.65)' : '1px solid rgba(159,182,198,0.18)', color: item.id === word.id ? '#7EF9FF' : '#CFE6F2', background: item.id === word.id ? 'rgba(126,249,255,0.10)' : 'rgba(255,255,255,0.03)', fontSize: 12 }}>
                      {item.word}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </LiquidGlassPanel>
      </div>
    </main>
  )
}

function InfoGrid({ word, tags }: { word: DictionaryWord; tags: string[] }) {
  const cells = [
    { title: 'Synonyms · 近义词', items: word.synonyms, color: '#7EF9FF' },
    { title: 'Antonyms · 反义词', items: word.antonyms, color: '#FF8FA8' },
    { title: 'Collocations · 搭配', items: word.collocations.map((item) => item.phrase), color: '#6BE0A0' },
    { title: 'Mnemonic · 助记', items: word.mnemonics.slice(0, 1).map((item) => item.mnemonicEn), color: '#B79BFF' },
    { title: 'Exam & CEFR · 考试等级', items: [word.cefrLevel ?? '', ...word.examTags].filter(Boolean), color: '#FFD66B' },
    { title: 'Themes · 主题领域', items: tags, color: '#9AD8FF' },
  ]

  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12, marginTop: 26 }}>
      {cells.map((cell) => (
        <LiquidGlassCard key={cell.title} style={{ minHeight: 118, background: 'rgba(255,255,255,0.035)' }}>
          <SectionTitle>{cell.title}</SectionTitle>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {cell.items.length > 0 ? cell.items.slice(0, 8).map((item) => (
              <Link key={item} href={`/lexiverse/word/${encodeURIComponent(item.toLowerCase().replace(/\s+/g, '-'))}`} style={{ textDecoration: 'none' }}>
                <span style={{ display: 'inline-flex', padding: '5px 9px', borderRadius: 8, border: `1px solid ${cell.color}44`, color: cell.color, background: `${cell.color}12`, fontSize: 12 }}>
                  {item}
                </span>
              </Link>
            )) : <span style={{ color: '#6F8AA0', fontSize: 13 }}>No data yet</span>}
          </div>
        </LiquidGlassCard>
      ))}
    </section>
  )
}

function highlightWord(sentence: string, word: string) {
  const index = sentence.toLowerCase().indexOf(word.toLowerCase())
  if (index < 0) return sentence
  return (
    <>
      {sentence.slice(0, index)}
      <b style={{ color: '#7EF9FF' }}>{sentence.slice(index, index + word.length)}</b>
      {sentence.slice(index + word.length)}
    </>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, letterSpacing: '0.14em', color: 'rgba(126,249,255,0.55)', fontFamily: "'Space Mono', monospace", marginBottom: 10 }}>
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(126,249,255,0.42), transparent)', margin: '28px 0' }} />
}
