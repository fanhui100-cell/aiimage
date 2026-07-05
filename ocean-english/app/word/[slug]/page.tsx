/* 界面优化5/6 阶段2：词汇根系已并入 /dictionary，旧路由改为重定向（带词定位） */
import { redirect } from 'next/navigation'

export default async function WordPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  redirect(`/dictionary?word=${encodeURIComponent(slug)}`)
}
