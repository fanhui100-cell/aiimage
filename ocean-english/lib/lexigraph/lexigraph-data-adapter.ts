import type { DictionaryWord } from '@/lib/dictionary/dictionary-types'
import type {
  LexiGraphData,
  LexiGraphDataAdapterOptions,
  LexiGraphDataEdge,
  LexiGraphDataEdgeType,
  LexiGraphDataNode,
  LexiGraphDataNodeType,
  LexiGraphRelationSummary,
} from '@/types/lexigraph-data'

const DEFAULT_LIMITS = {
  maxSynonyms: 6,
  maxAntonyms: 4,
  maxCollocations: 6,
  maxRelatedTags: 8,
  maxExamTags: 4,
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function compactUnique(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of values) {
    const value = raw.trim()
    const key = slugify(value)
    if (!value || !key || seen.has(key)) continue
    seen.add(key)
    result.push(value)
  }
  return result
}

function relationNodeId(centerWord: string, type: LexiGraphDataNodeType, value: string): string {
  return `${centerWord}::${type}::${slugify(value)}`
}

function relationEdgeId(centerWord: string, type: LexiGraphDataEdgeType, targetId: string): string {
  return `${centerWord}->${type}->${targetId}`
}

function addRelation(
  params: {
    centerId: string
    sourceWord: string
    nodes: LexiGraphDataNode[]
    edges: LexiGraphDataEdge[]
    value: string
    nodeType: LexiGraphDataNodeType
    edgeType: LexiGraphDataEdgeType
    label?: string
    weight: number
    metadata?: Record<string, unknown>
  },
) {
  const id = relationNodeId(params.centerId, params.nodeType, params.value)
  params.nodes.push({
    id,
    label: params.label ?? params.value,
    normalizedWord: slugify(params.value) || undefined,
    type: params.nodeType,
    sourceWord: params.sourceWord,
    metadata: params.metadata,
  })
  params.edges.push({
    id: relationEdgeId(params.centerId, params.edgeType, id),
    source: params.centerId,
    target: id,
    type: params.edgeType,
    label: params.label,
    weight: params.weight,
    metadata: params.metadata,
  })
}

function dedupeNodes(nodes: LexiGraphDataNode[]): LexiGraphDataNode[] {
  const seen = new Set<string>()
  return nodes.filter((node) => {
    if (seen.has(node.id)) return false
    seen.add(node.id)
    return true
  })
}

function dedupeEdges(edges: LexiGraphDataEdge[]): LexiGraphDataEdge[] {
  const seen = new Set<string>()
  return edges.filter((edge) => {
    if (seen.has(edge.id)) return false
    seen.add(edge.id)
    return true
  })
}

function summarize(edges: LexiGraphDataEdge[]): LexiGraphRelationSummary {
  return {
    synonyms: edges.filter((edge) => edge.type === 'synonym').length,
    antonyms: edges.filter((edge) => edge.type === 'antonym').length,
    collocations: edges.filter((edge) => edge.type === 'collocation').length,
    related: edges.filter((edge) => edge.type === 'related').length,
    themes: edges.filter((edge) => edge.type === 'theme').length,
    domains: edges.filter((edge) => edge.type === 'domain').length,
    exams: edges.filter((edge) => edge.type === 'exam').length,
    wordFamily: edges.filter((edge) => edge.type === 'word_family').length,
  }
}

export function buildLexiGraphData(
  word: DictionaryWord,
  options: LexiGraphDataAdapterOptions = {},
): LexiGraphData {
  const limits = { ...DEFAULT_LIMITS, ...options }
  const centerId = word.id
  const warnings: string[] = []
  const nodes: LexiGraphDataNode[] = [
    {
      id: centerId,
      label: word.word,
      normalizedWord: word.id,
      type: 'word',
      sourceWord: word.id,
      metadata: {
        difficultyLevel: word.difficulty,
        cefrLevel: word.cefrLevel,
        isCoreWord: word.isCore,
        isExamWord: word.isExamWord,
        examTags: word.examTags,
        tags: word.tags,
        sourceType: word.sourceType,
        sourceNote: word.sourceNote,
        partOfSpeech: word.partOfSpeech,
      },
    },
  ]
  const edges: LexiGraphDataEdge[] = []

  const synonyms = compactUnique(word.synonyms).slice(0, limits.maxSynonyms)
  if (synonyms.length === 0) warnings.push(`No synonym relations for "${word.id}".`)
  for (const synonym of synonyms) {
    addRelation({
      centerId,
      sourceWord: word.id,
      nodes,
      edges,
      value: synonym,
      nodeType: 'synonym',
      edgeType: 'synonym',
      weight: 1,
      metadata: { sourceField: 'synonyms' },
    })
  }

  const antonyms = compactUnique(word.antonyms).slice(0, limits.maxAntonyms)
  if (antonyms.length === 0) warnings.push(`No antonym relations for "${word.id}".`)
  for (const antonym of antonyms) {
    addRelation({
      centerId,
      sourceWord: word.id,
      nodes,
      edges,
      value: antonym,
      nodeType: 'antonym',
      edgeType: 'antonym',
      weight: 1,
      metadata: { sourceField: 'antonyms' },
    })
  }

  const collocations = word.collocations.slice(0, limits.maxCollocations)
  if (collocations.length === 0) warnings.push(`No collocation relations for "${word.id}".`)
  for (const collocation of collocations) {
    addRelation({
      centerId,
      sourceWord: word.id,
      nodes,
      edges,
      value: collocation.phrase,
      nodeType: 'collocation',
      edgeType: 'collocation',
      label: collocation.phrase,
      weight: 0.75,
      metadata: {
        sourceField: 'collocations',
        exampleEn: collocation.exampleEn,
        exampleZh: collocation.exampleZh,
      },
    })
  }

  const relatedTags = compactUnique(word.tags).slice(0, limits.maxRelatedTags)
  if (relatedTags.length === 0) warnings.push(`No tag-derived related relations for "${word.id}".`)
  for (const tag of relatedTags) {
    addRelation({
      centerId,
      sourceWord: word.id,
      nodes,
      edges,
      value: tag,
      nodeType: 'related',
      edgeType: 'related',
      weight: 0.55,
      metadata: {
        sourceField: 'tags',
        inferredRelation: true,
      },
    })
  }

  const examTags = compactUnique(word.examTags).slice(0, limits.maxExamTags)
  if (word.isExamWord && examTags.length === 0) warnings.push(`Exam word "${word.id}" has no exam tag relations.`)
  for (const tag of examTags) {
    addRelation({
      centerId,
      sourceWord: word.id,
      nodes,
      edges,
      value: tag,
      nodeType: 'exam',
      edgeType: 'exam',
      weight: 0.5,
      metadata: { sourceField: 'examTags' },
    })
  }

  if (options.includeMetadataNodes) {
    if (word.cefrLevel) {
      addRelation({
        centerId,
        sourceWord: word.id,
        nodes,
        edges,
        value: word.cefrLevel,
        nodeType: 'cefr',
        edgeType: 'cefr',
        weight: 0.35,
        metadata: { sourceField: 'cefrLevel', metadataNode: true },
      })
    }
    addRelation({
      centerId,
      sourceWord: word.id,
      nodes,
      edges,
      value: `difficulty-${word.difficulty}`,
      nodeType: 'difficulty',
      edgeType: 'difficulty',
      label: `Difficulty ${word.difficulty}`,
      weight: 0.35,
      metadata: { sourceField: 'difficultyLevel', metadataNode: true },
    })
  }

  if (!word.cefrLevel) warnings.push(`No CEFR metadata for "${word.id}".`)

  const finalNodes = dedupeNodes(nodes)
  const finalEdges = dedupeEdges(edges).filter((edge) => finalNodes.some((node) => node.id === edge.target))

  return {
    centerWord: word.id,
    nodes: finalNodes,
    edges: finalEdges,
    relationSummary: summarize(finalEdges),
    warnings,
  }
}
