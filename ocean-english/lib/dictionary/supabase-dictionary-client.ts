/**
 * SupabaseDictionaryClient — DictionaryClient backed by Supabase dictionary tables.
 *
 * Requires tables from phase-6a-dictionary-pronunciation-schema.sql.
 * Gracefully returns null / [] on any error (table not found, network failure,
 * Supabase not configured). Never throws or exposes raw errors to callers.
 *
 * Uses anon key (public read RLS) — no auth session required.
 */

import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from '@/lib/supabase/client'
import type {
  DictionaryWord,
  DictionaryClient,
  DictionaryDefinition,
  DictionaryExample,
  DictionaryEtymology,
  DictionaryMnemonic,
  DictionaryCollocation,
  DictionarySceneUsage,
  DictionaryPronunciation,
  DictionarySourceType,
  WordLevel,
  CefrLevel,
  ExamTag,
  WordSearchOptions,
} from './dictionary-types'

// ── Supabase row shapes ────────────────────────────────────────────────────

interface DbDictionaryWord {
  id: string
  word: string
  normalized_word: string
  phonetic_ipa: string | null
  part_of_speech: string | null
  cefr_level: string | null
  level: string
  difficulty: number
  frequency_rank: number | null
  is_core_word: boolean
  is_exam_word: boolean
  tags: string[]
  // P2：词库注入新列（final-p2-vocab-schema.sql；执行前为 undefined）
  levels?: number[] | null
  primary_level?: number | null
  phrases?: { phrase: string; translation?: string }[] | null
  inflections?: Record<string, string> | null
  source_type: string
  source_note: string | null
  created_at: string
  updated_at: string
  dictionary_definitions?: DbDefinition[]
  dictionary_examples?: DbExample[]
  dictionary_etymology?: DbEtymology[]
  word_mnemonics?: DbMnemonic[]
  dictionary_collocations?: DbCollocation[]
  dictionary_synonyms?: DbSynonym[]
  dictionary_antonyms?: DbAntonym[]
  dictionary_scene_usages?: DbSceneUsage[]
  word_pronunciations?: DbPronunciation[]
  exam_word_tags?: DbExamTag[]
  dictionary_word_nuance?: DbNuance[]
}

interface DbDefinition {
  id: string
  part_of_speech: string
  definition_en: string
  definition_zh: string | null
  order_index: number
  source_type: string
}
interface DbExample {
  id: string
  sentence_en: string
  sentence_zh: string | null
  order_index: number
  source_type: string
}
interface DbEtymology {
  id: string
  roots: string | null
  explanation_en: string | null
  explanation_zh: string | null
}
interface DbMnemonic {
  id: string
  mnemonic_en: string
  mnemonic_zh: string | null
  mnemonic_style: string
  is_ai_generated: boolean
  is_reviewed: boolean
  order_index: number
}
interface DbCollocation {
  id: string
  phrase: string
  example_en: string | null
  example_zh: string | null
  order_index: number
}
interface DbSynonym { id: string; synonym: string; order_index: number }
interface DbAntonym { id: string; antonym: string; order_index: number }
interface DbSceneUsage {
  id: string
  scene_en: string
  scene_zh: string | null
  example_en: string | null
  example_zh: string | null
  order_index: number
}
interface DbPronunciation {
  id: string
  accent: string
  phonetic_ipa: string | null
  audio_url: string | null
  provider: string
  is_default: boolean
}
interface DbExamTag { id: string; exam_type: string }
interface DbNuance { id: string; member: string; nuance_zh: string; order_index: number }

// ── DB row → DictionaryWord mapper ─────────────────────────────────────────

function mapDbWord(row: DbDictionaryWord): DictionaryWord {
  const definitions: DictionaryDefinition[] = (row.dictionary_definitions ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map(d => ({
      id: d.id,
      partOfSpeech: d.part_of_speech,
      definitionEn: d.definition_en,
      definitionZh: d.definition_zh ?? undefined,
      orderIndex: d.order_index,
      sourceType: d.source_type as DictionarySourceType,
    }))

  const examples: DictionaryExample[] = (row.dictionary_examples ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map(e => ({
      id: e.id,
      sentenceEn: e.sentence_en,
      sentenceZh: e.sentence_zh ?? undefined,
      orderIndex: e.order_index,
      sourceType: e.source_type as DictionarySourceType,
    }))

  const etymologyRow = (row.dictionary_etymology ?? [])[0]
  const etymology: DictionaryEtymology | null = etymologyRow
    ? {
        roots: etymologyRow.roots ?? '',
        explanationEn: etymologyRow.explanation_en ?? '',
        explanationZh: etymologyRow.explanation_zh ?? undefined,
      }
    : null

  const mnemonics: DictionaryMnemonic[] = (row.word_mnemonics ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map(m => ({
      id: m.id,
      mnemonicEn: m.mnemonic_en,
      mnemonicZh: m.mnemonic_zh ?? undefined,
      style: m.mnemonic_style as DictionaryMnemonic['style'],
      isAiGenerated: m.is_ai_generated,
      isReviewed: m.is_reviewed,
      orderIndex: m.order_index,
    }))

  const collocations: DictionaryCollocation[] = (row.dictionary_collocations ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map(c => ({
      id: c.id,
      phrase: c.phrase,
      exampleEn: c.example_en ?? undefined,
      exampleZh: c.example_zh ?? undefined,
      orderIndex: c.order_index,
    }))

  const sceneUsages: DictionarySceneUsage[] = (row.dictionary_scene_usages ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map(s => ({
      id: s.id,
      sceneEn: s.scene_en,
      sceneZh: s.scene_zh ?? undefined,
      exampleEn: s.example_en ?? undefined,
      exampleZh: s.example_zh ?? undefined,
      orderIndex: s.order_index,
    }))

  const pronunciations: DictionaryPronunciation[] = (row.word_pronunciations ?? []).map(p => ({
    id: p.id,
    accent: p.accent as DictionaryPronunciation['accent'],
    phoneticIpa: p.phonetic_ipa ?? undefined,
    audioUrl: p.audio_url ?? undefined,
    provider: p.provider as DictionaryPronunciation['provider'],
    isDefault: p.is_default,
  }))

  // P2：导入词的考试标签写在 words.tags（无 exam_word_tags 关联行），取并集
  const VALID_EXAM = new Set(['TOEFL', 'IELTS', 'CET-4', 'CET-6', 'KAOYAN', 'GAOKAO', 'SAT', 'GRE'])
  const relationExamTags = (row.exam_word_tags ?? []).map(t => t.exam_type as ExamTag)
  const tagExamTags = (row.tags ?? []).filter(t => VALID_EXAM.has(t)) as ExamTag[]
  const examTags = [...new Set([...relationExamTags, ...tagExamTags])]

  return {
    id: row.id,
    word: row.word,
    phoneticIpa: row.phonetic_ipa,
    partOfSpeech: row.part_of_speech,
    cefrLevel: (row.cefr_level as CefrLevel) ?? null,
    level: row.level as WordLevel,
    difficulty: row.difficulty as 1 | 2 | 3 | 4 | 5,
    isCore: row.is_core_word,
    isExamWord: row.is_exam_word,
    examTags,
    tags: row.tags ?? [],
    levels: row.levels ?? undefined,
    primaryLevel: row.primary_level ?? undefined,
    phrases: row.phrases ?? undefined,
    inflections: row.inflections ?? undefined,
    nuance: (row.dictionary_word_nuance ?? [])
      .sort((a, b) => a.order_index - b.order_index)
      .map(n => ({ member: n.member, nuanceZh: n.nuance_zh })),
    frequencyRank: row.frequency_rank,
    sourceType: row.source_type as DictionarySourceType,
    sourceNote: row.source_note,
    definitions,
    examples,
    etymology,
    mnemonics,
    synonyms: (row.dictionary_synonyms ?? [])
      .sort((a, b) => a.order_index - b.order_index)
      .map(s => s.synonym),
    antonyms: (row.dictionary_antonyms ?? [])
      .sort((a, b) => a.order_index - b.order_index)
      .map(a => a.antonym),
    collocations,
    sceneUsages,
    pronunciations,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ── Select strings ─────────────────────────────────────────────────────────

const FULL_SELECT = [
  '*',
  'dictionary_definitions(*)',
  'dictionary_examples(*)',
  'dictionary_etymology(*)',
  'word_mnemonics(*)',
  'dictionary_collocations(*)',
  'dictionary_synonyms(*)',
  'dictionary_antonyms(*)',
  'dictionary_scene_usages(*)',
  'word_pronunciations(*)',
  'exam_word_tags(*)',
  'dictionary_word_nuance(*)',
].join(', ')

const SEARCH_SELECT = ['*', 'dictionary_definitions(*)', 'exam_word_tags(*)'].join(', ')

// ── SupabaseDictionaryClient ───────────────────────────────────────────────

class SupabaseDictionaryClient implements DictionaryClient {
  readonly isLive = true

  private getDb() {
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }

  async lookupWord(slug: string): Promise<DictionaryWord | null> {
    if (!isSupabaseConfigured) return null
    try {
      const { data, error } = await this.getDb()
        .from('dictionary_words')
        .select(FULL_SELECT)
        .eq('id', slug)
        .maybeSingle()
      if (error || !data) return null
      return mapDbWord(data as unknown as DbDictionaryWord)
    } catch {
      return null
    }
  }

  async searchWords(query: string, options?: WordSearchOptions): Promise<DictionaryWord[]> {
    if (!isSupabaseConfigured) return []
    try {
      const q = query.toLowerCase().trim()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase query builder doesn't have a generic chained type
      let req: any = this.getDb()
        .from('dictionary_words')
        .select(SEARCH_SELECT)
      // 真词修复：按 7 档浏览时该档词优先（primary_level 降序 → 纯高档词在前，
      // 多档高频基础词靠后），频率次序兜底；默认浏览维持原核心词优先
      if (options?.orderBy === 'frequency') {
        // P0：选词推荐 — 真词频高频优先（frequency_rank 升序，1 = 最高频）
        req = req.order('frequency_rank', { ascending: true, nullsFirst: false })
      } else if (options?.numericLevel != null) {
        req = req
          .order('primary_level', { ascending: false, nullsFirst: false })
          .order('frequency_rank', { ascending: true, nullsFirst: false })
      } else {
        req = req
          .order('is_core_word', { ascending: false })
          .order('difficulty', { ascending: true })
      }

      if (q) req = req.ilike('normalized_word', `%${q}%`)
      if (options?.level) req = req.eq('level', options.level)
      if (options?.difficulty) req = req.eq('difficulty', options.difficulty)
      if (options?.examTag) req = req.contains('tags', [options.examTag])
      // P2：7 档 ±1 过滤（GIN overlaps；列未建时该查询报错 → catch 返回 []）
      // P0：primaryLevel = 只取本档原生词（与题库 gen-questions 同口径，避免低档停用词污染）
      if (options?.primaryLevel != null) {
        req = req.eq('primary_level', options.primaryLevel)
      } else if (options?.numericLevel != null) {
        const l = options.numericLevel
        req = req.overlaps('levels', [l - 1, l, l + 1].filter(x => x >= 1 && x <= 7))
      }

      const offset = options?.offset ?? 0
      const limit = options?.limit ?? 20
      req = req.range(offset, offset + limit - 1)

      const { data, error } = await req
      if (error || !data) return []

      return (data as unknown as DbDictionaryWord[]).map(row => ({
        ...mapDbWord(row),
        examples: [],
        etymology: null,
        mnemonics: [],
        collocations: [],
        synonyms: [],
        antonyms: [],
        sceneUsages: [],
        pronunciations: [],
      }))
    } catch {
      return []
    }
  }

  async getWordsByLevel(level: WordLevel, options?: WordSearchOptions): Promise<DictionaryWord[]> {
    return this.searchWords('', { ...options, level })
  }

  async getCoreWords(limit = 80): Promise<DictionaryWord[]> {
    if (!isSupabaseConfigured) return []
    try {
      const { data, error } = await this.getDb()
        .from('dictionary_words')
        .select(SEARCH_SELECT)
        .eq('is_core_word', true)
        .order('difficulty', { ascending: true })
        .limit(limit)
      if (error || !data) return []
      return (data as unknown as DbDictionaryWord[]).map(row => ({
        ...mapDbWord(row),
        examples: [],
        etymology: null,
        mnemonics: [],
        collocations: [],
        synonyms: [],
        antonyms: [],
        sceneUsages: [],
        pronunciations: [],
      }))
    } catch {
      return []
    }
  }
}

let _instance: SupabaseDictionaryClient | null = null

export function getSupabaseDictionaryClient(): DictionaryClient {
  _instance ??= new SupabaseDictionaryClient()
  return _instance
}
