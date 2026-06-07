// lib/lexiverse/lexiverse-mock-data.ts
// ─────────────────────────────────────────────────────────────────────────
// Phase 8 STAGE-A — placeholder dictionary words.
//
// THIS FILE IS A SCAFFOLD, NOT CONTENT.
// Stage A demonstrates the pipeline (catalog → filter → planets) with a
// tiny mock dictionary. Every word here uses the same field shape as
// the real DictionaryWord (themeTags / domainTags / examTags / cefrLevel /
// difficultyLevel) so swapping the import to the real client is a
// one-line change — see Handoff doc §6.
//
// DO NOT add hand-written definitions/IPA here — the real dictionary has
// canonical, reviewed content. This file's only job is to prove the
// catalog filters resolve sensibly during Stage A.
// ─────────────────────────────────────────────────────────────────────────

import type { FilterableWord } from './lexiverse-word-filter'

export interface MockDictionaryWord extends FilterableWord {
  ipa?: string
  definition?: string
  definitionZh?: string
  example?: string
}

/**
 * A small mock pool covering the catalog's filter shapes so each Stage-A
 * galaxy resolves to at least a handful of "planets" for visual testing.
 * Replace with: import { getAllDictionaryWords } from '@/lib/dictionary/dictionary-client'
 */
export const MOCK_DICTIONARY: MockDictionaryWord[] = [
  // ── Daily Life ─────────────────────────────────────────────────────────
  mock('hello',     { themeTags: ['daily-life', 'communication'], cefrLevel: 'A1', difficultyLevel: 1 }),
  mock('goodbye',   { themeTags: ['daily-life', 'communication'], cefrLevel: 'A1', difficultyLevel: 1 }),
  mock('family',    { themeTags: ['daily-life'], cefrLevel: 'A1', difficultyLevel: 1 }),
  mock('home',      { themeTags: ['daily-life'], cefrLevel: 'A1', difficultyLevel: 1 }),
  mock('travel',    { themeTags: ['daily-life'], cefrLevel: 'A2', difficultyLevel: 2 }),
  mock('breakfast', { themeTags: ['daily-life'], cefrLevel: 'A1', difficultyLevel: 1 }),
  mock('healthy',   { themeTags: ['daily-life'], cefrLevel: 'A2', difficultyLevel: 2 }),
  // ── Emotion ────────────────────────────────────────────────────────────
  mock('happy',     { themeTags: ['emotion'], cefrLevel: 'A1', difficultyLevel: 1 }),
  mock('sad',       { themeTags: ['emotion'], cefrLevel: 'A1', difficultyLevel: 1 }),
  mock('curious',   { themeTags: ['emotion'], cefrLevel: 'B1', difficultyLevel: 3 }),
  mock('serene',    { themeTags: ['emotion'], cefrLevel: 'C1', difficultyLevel: 5 }),
  // ── Academic ───────────────────────────────────────────────────────────
  mock('hypothesis',{ themeTags: ['academic', 'science'], examTags: ['IELTS', 'TOEFL'], cefrLevel: 'B2', difficultyLevel: 4 }),
  mock('evidence',  { themeTags: ['academic'], examTags: ['IELTS', 'TOEFL', 'CET-6'], cefrLevel: 'B2', difficultyLevel: 4 }),
  mock('analyse',   { themeTags: ['academic', 'learning'], examTags: ['IELTS', 'TOEFL'], cefrLevel: 'B2', difficultyLevel: 4 }),
  mock('rigorous',  { themeTags: ['academic'], examTags: ['IELTS', 'TOEFL', 'postgraduate'], cefrLevel: 'C1', difficultyLevel: 5 }),
  mock('abstract',  { themeTags: ['academic'], examTags: ['IELTS', 'TOEFL'], cefrLevel: 'C1', difficultyLevel: 5 }),
  mock('cite',      { themeTags: ['academic', 'communication'], examTags: ['IELTS', 'TOEFL'], cefrLevel: 'B2', difficultyLevel: 4 }),
  mock('refute',    { themeTags: ['academic'], examTags: ['IELTS', 'TOEFL', 'postgraduate'], cefrLevel: 'C1', difficultyLevel: 5 }),
  // ── Tech / Engineering ────────────────────────────────────────────────
  mock('algorithm', { domainTags: ['ai-tech'], cefrLevel: 'C1', difficultyLevel: 4 }),
  mock('neural',    { domainTags: ['ai-tech'], cefrLevel: 'C1', difficultyLevel: 5 }),
  mock('inference', { domainTags: ['ai-tech'], cefrLevel: 'C1', difficultyLevel: 5 }),
  mock('mechanism', { domainTags: ['engineering'], cefrLevel: 'B2', difficultyLevel: 4 }),
  mock('module',    { domainTags: ['engineering', 'ai-tech'], cefrLevel: 'B2', difficultyLevel: 3 }),
  mock('throughput',{ domainTags: ['engineering'], cefrLevel: 'C1', difficultyLevel: 5 }),
  // ── Business / Project ────────────────────────────────────────────────
  mock('strategy',  { domainTags: ['business'], cefrLevel: 'B2', difficultyLevel: 4 }),
  mock('milestone', { themeTags: ['project-management'], cefrLevel: 'B2', difficultyLevel: 3 }),
  mock('deliverable',{ themeTags: ['project-management'], cefrLevel: 'C1', difficultyLevel: 4 }),
  mock('stakeholder',{ themeTags: ['project-management'], cefrLevel: 'C1', difficultyLevel: 4 }),
  mock('roadmap',   { themeTags: ['project-management'], cefrLevel: 'B2', difficultyLevel: 3 }),
  mock('quarterly', { domainTags: ['business'], cefrLevel: 'B2', difficultyLevel: 3 }),
  // ── Exam-specific ──────────────────────────────────────────────────────
  mock('comprehensive',{ examTags: ['IELTS', 'TOEFL'], cefrLevel: 'C1', difficultyLevel: 4 }),
  mock('substantial',  { examTags: ['IELTS', 'TOEFL', 'postgraduate'], cefrLevel: 'C1', difficultyLevel: 4 }),
  mock('viable',       { examTags: ['IELTS', 'postgraduate'], cefrLevel: 'C1', difficultyLevel: 4 }),
  mock('hinder',       { examTags: ['CET-6', 'postgraduate'], cefrLevel: 'B2', difficultyLevel: 4 }),
  mock('emphasise',    { examTags: ['CET-4', 'CET-6'], cefrLevel: 'B1', difficultyLevel: 3 }),
  mock('observe',      { examTags: ['CET-4', 'gaokao'], cefrLevel: 'B1', difficultyLevel: 3 }),
]

function mock(word: string, fields: Partial<MockDictionaryWord>): MockDictionaryWord {
  return {
    id: word,
    word,
    ipa: '',
    definition: 'Placeholder — replace with real dictionary content.',
    definitionZh: '占位 · 替换为真实词典内容。',
    example: '',
    ...fields,
  }
}
