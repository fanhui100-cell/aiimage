/* ============================================================================
   lib/dictionary/entry-adapter.ts — 词典 → 学习状态机的唯一入库适配器
   所有「把词带进学习系统」的路径（查词 / 扫描 / 阅读点词 / 今日包 / 收藏）
   一律经过 toWordEntry，不允许再手搓 WordEntry。
   ============================================================================ */

import type { DictionaryWord } from '@/lib/dictionary/dictionary-types'
import type { WordEntry } from '@/store/lexiStore'

const CEFR_BAND: Record<string, number> = {
  A1: 1, A2: 2, B1: 4, B2: 6, C1: 7, C2: 8,
}

export function toWordEntry(dw: DictionaryWord, source: NonNullable<WordEntry['source']>): WordEntry {
  const def = dw.definitions[0]
  const ex = dw.examples[0]
  return {
    id: dw.id,
    state: 'learning',
    streak: 0,
    ease: 2.5,
    interval: 0,
    addedAt: Date.now(),
    source,
    saved: false,
    word: dw.word,
    zh: def?.definitionZh ?? def?.definitionEn ?? '',
    phon: dw.phoneticIpa ?? '',
    pos: dw.partOfSpeech ?? '',
    cefr: dw.cefrLevel ?? undefined,
    band: dw.cefrLevel ? CEFR_BAND[dw.cefrLevel] : undefined,
    examTags: dw.examTags,
    levels: dw.levels,
    ex: ex?.sentenceEn,
    exZh: ex?.sentenceZh,
    syn: dw.synonyms,
    ant: dw.antonyms,
    galaxy: dw.themeTags?.[0] ?? dw.domainTags?.[0] ?? 'cognition',
  }
}
