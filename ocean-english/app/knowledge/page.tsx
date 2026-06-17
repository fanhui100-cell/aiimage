/* 界面优化5/6 阶段2：知识库已并入 /dictionary，旧路由重定向 */
import { redirect } from 'next/navigation'

export default function KnowledgePage() {
  redirect('/dictionary')
}
