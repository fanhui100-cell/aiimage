import type { DictionaryWord } from '@/lib/dictionary/dictionary-types'
import type {
  LexiGraphEdge,
  LexiGraphEdgeRelation,
  LexiGraphModel,
  LexiGraphNodeInput,
} from '@/types/lexigraph'
import { assignLayout } from './lexigraph-layout'
import { resolveNodeState, type StoreSlices } from './lexigraph-state-mapper'

const MAX_SYNONYMS = 4
const MAX_ANTONYMS = 3
const MAX_COLLOCATIONS = 4
const MAX_NODES = 28

function trunc(text: string, max = 14): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export function buildLexiGraphModel(word: DictionaryWord, slices: StoreSlices): LexiGraphModel {
  const warnings: string[] = []
  const nodes: LexiGraphNodeInput[] = []
  const edges: LexiGraphEdge[] = []
  const coreId = word.id

  // ── Core node ─────────────────────────────────────────────────────────────
  nodes.push({
    id: coreId,
    word: coreId,
    label: word.word,
    type: 'core',
    state: resolveNodeState(coreId, slices),
    size: 26,
    sourceWord: coreId,
  })

  function addNode(
    id: string,
    wordSlug: string,
    label: string,
    type: LexiGraphNodeInput['type'],
    relation: LexiGraphEdgeRelation,
    strength: number,
    size = 16,
  ) {
    nodes.push({
      id,
      word: wordSlug,
      label,
      type,
      state: type === 'synonym' || type === 'antonym'
        ? resolveNodeState(wordSlug, slices)
        : 'unknown',
      size,
      sourceWord: coreId,
    })
    edges.push({
      id: `e-${coreId}-${id}`,
      source: coreId,
      target: id,
      relation,
      strength,
    })
  }

  // ── Synonyms ───────────────────────────────────────────────────────────────
  if (word.synonyms.length === 0) warnings.push('No synonyms.')
  word.synonyms.slice(0, MAX_SYNONYMS).forEach((syn, i) => {
    addNode(`syn-${i}`, slugify(syn), trunc(syn), 'synonym', 'synonym', 1.0, 18)
  })

  // ── Antonyms ───────────────────────────────────────────────────────────────
  word.antonyms.slice(0, MAX_ANTONYMS).forEach((ant, i) => {
    addNode(`ant-${i}`, slugify(ant), trunc(ant), 'antonym', 'antonym', 1.0, 18)
  })

  // ── Collocations ──────────────────────────────────────────────────────────
  word.collocations.slice(0, MAX_COLLOCATIONS).forEach((col, i) => {
    addNode(`col-${i}`, col.phrase, trunc(col.phrase, 16), 'collocation', 'collocation', 0.7, 15)
  })

  // ── Etymology ─────────────────────────────────────────────────────────────
  if (word.etymology?.roots) {
    addNode('etym-0', word.etymology.roots, trunc(word.etymology.roots, 14), 'etymology', 'etymology', 0.5, 14)
  }

  // ── Scene usage ──────────────────────────────────────────────────────────
  if (word.sceneUsages.length > 0) {
    const scene = word.sceneUsages[0].sceneEn ?? word.sceneUsages[0].sceneZh ?? 'Scene'
    addNode('scene-0', scene, trunc(scene, 14), 'scene', 'scene', 0.5, 14)
  }

  // ── Exam tag ─────────────────────────────────────────────────────────────
  if (word.isExamWord && word.examTags.length > 0) {
    const tag = word.examTags[0]
    addNode(`exam-${tag}`, tag, tag, 'exam', 'exam', 0.5, 14)
  }

  // Enforce global node cap (core always kept)
  const capped = nodes.length > MAX_NODES
    ? [nodes[0], ...nodes.slice(1, MAX_NODES)]
    : nodes

  const keptIds = new Set(capped.map(n => n.id))
  const keptEdges = edges.filter(e => keptIds.has(e.target))

  // Distinguish seed (Phase 6B sourceNote) from mock adapter (different sourceNote)
  // Both set sourceType='original', so sourceNote is the reliable discriminator.
  const sourceType: LexiGraphModel['sourceType'] =
    word.sourceNote?.includes('Phase 6B') ? 'seed' : 'mock'

  return {
    centerWord: coreId,
    centerDetail: word,
    nodes: assignLayout(capped),
    edges: keptEdges,
    sourceType,
    warnings,
  }
}
