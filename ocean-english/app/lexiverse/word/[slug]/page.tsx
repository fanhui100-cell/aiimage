import { redirect } from 'next/navigation'
import { lookupWord } from '@/lib/dictionary/dictionary-client'
import { LexiverseWordDetailClient } from './LexiverseWordDetailClient'

export default async function LexiverseWordDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const word = await lookupWord(slug)
  // P2 fix (cc-full-project-review-2026-07-05): 缺词不再硬 404；回落到主词详情体验（/dictionary?word= 有友好空态），
  // 与 /word/[slug] 的重定向一致，避免两套词详情页对「缺词」行为不一致（一个硬 404、一个友好空态）。
  if (!word) redirect(`/dictionary?word=${encodeURIComponent(slug)}`)

  return <LexiverseWordDetailClient word={word} />
}
