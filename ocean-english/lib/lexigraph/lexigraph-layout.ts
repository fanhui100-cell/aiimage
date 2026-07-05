import type { LexiGraphNode, LexiGraphNodeInput, LexiGraphNodeType } from '@/types/lexigraph'

const CX = 380
const CY = 300
const LAYER1_RADIUS = 148
const LAYER2_RADIUS = 256

const LAYER1_TYPES: LexiGraphNodeType[] = ['synonym', 'antonym', 'collocation']
const LAYER2_TYPES: LexiGraphNodeType[] = ['etymology', 'scene', 'exam', 'example']

export function assignLayout(nodes: LexiGraphNodeInput[]): LexiGraphNode[] {
  const core = nodes.find(n => n.type === 'core')
  const layer1 = nodes.filter(n => (LAYER1_TYPES as string[]).includes(n.type))
  const layer2 = nodes.filter(n => (LAYER2_TYPES as string[]).includes(n.type))

  const result: LexiGraphNode[] = []

  if (core) {
    result.push({ ...core, x: CX, y: CY })
  }

  layer1.forEach((n, i) => {
    const angle = (i / Math.max(layer1.length, 1)) * 2 * Math.PI - Math.PI / 2
    result.push({
      ...n,
      x: Math.round(CX + LAYER1_RADIUS * Math.cos(angle)),
      y: Math.round(CY + LAYER1_RADIUS * Math.sin(angle)),
    })
  })

  layer2.forEach((n, i) => {
    // Offset by π/8 so layer2 nodes don't overlap layer1 at straight angles
    const angle = (i / Math.max(layer2.length, 1)) * 2 * Math.PI - Math.PI / 2 + Math.PI / 8
    result.push({
      ...n,
      x: Math.round(CX + LAYER2_RADIUS * Math.cos(angle)),
      y: Math.round(CY + LAYER2_RADIUS * Math.sin(angle)),
    })
  })

  return result
}
