import { getDictionaryClient } from '@/lib/dictionary/dictionary-client'
import { buildLexiGraphData } from '@/lib/lexigraph/lexigraph-data-adapter'

function pct(count: number, total: number): string {
  return `${count}/${total} (${total ? Math.round((count / total) * 100) : 0}%)`
}

async function main() {
  const client = getDictionaryClient()
  const words = await client.getCoreWords(600)
  const total = words.length
  const graphs = words.map((word) => {
    const graph = buildLexiGraphData(word)
    return {
      id: word.id,
      word: word.word,
      edges: graph.edges.length,
      warnings: graph.warnings.length,
      synonyms: word.synonyms.length,
      antonyms: word.antonyms.length,
      collocations: word.collocations.length,
      relatedTags: word.tags.length,
      examTags: word.examTags.length,
      sceneUsages: word.sceneUsages.length,
    }
  })

  const count = (fn: (item: typeof words[number]) => boolean) => words.filter(fn).length
  const avgEdges = graphs.reduce((sum, graph) => sum + graph.edges, 0) / Math.max(total, 1)
  const warningCount = graphs.reduce((sum, graph) => sum + graph.warnings, 0)
  const top = [...graphs].sort((a, b) => b.edges - a.edges).slice(0, 20)
  const low = graphs.filter((graph) => graph.edges < 5).slice(0, 30)
  const tagCounts = new Map<string, number>()
  for (const word of words) {
    for (const tag of word.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
  }

  console.log('\n==== LexiGraph Readiness Analyzer ====')
  console.log(`Total words:       ${total}`)
  console.log(`Average edges:     ${avgEdges.toFixed(2)}`)
  console.log(`Adapter warnings:  ${warningCount}`)
  console.log(`Zero-edge words:   ${graphs.filter((graph) => graph.edges === 0).length}`)
  console.log(`Low-edge words:    ${low.length}`)
  console.log('\nField coverage:')
  console.log(`  synonyms:        ${pct(count((word) => word.synonyms.length > 0), total)}`)
  console.log(`  antonyms:        ${pct(count((word) => word.antonyms.length > 0), total)}`)
  console.log(`  collocations:    ${pct(count((word) => word.collocations.length > 0), total)}`)
  console.log(`  tags/related:    ${pct(count((word) => word.tags.length > 0), total)}`)
  console.log(`  examTags:        ${pct(count((word) => word.examTags.length > 0), total)}`)
  console.log(`  sceneUsages:     ${pct(count((word) => word.sceneUsages.length > 0), total)}`)
  console.log('\nTop graph-ready words:')
  for (const item of top) {
    console.log(`  ${item.id}: ${item.edges} edges, ${item.warnings} warnings`)
  }
  console.log('\nLow-edge words (<5):')
  if (low.length === 0) console.log('  None')
  for (const item of low) {
    console.log(`  ${item.id}: ${item.edges} edges, ${item.warnings} warnings`)
  }
  console.log('\nTop tags:')
  for (const [tag, countValue] of [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
    console.log(`  ${tag}: ${countValue}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
