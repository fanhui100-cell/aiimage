import { notFound } from 'next/navigation'
import { lookupWord } from '@/lib/dictionary/dictionary-client'
import { LexiverseWordDetailClient } from './LexiverseWordDetailClient'

export default async function LexiverseWordDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const word = await lookupWord(slug)
  if (!word) notFound()

  return <LexiverseWordDetailClient word={word} />
}
