import { redirect } from 'next/navigation'

// 试炼已并入专练 /drill（界面优化7）。保留此路由做永久重定向。
export default function ExamPage() {
  redirect('/drill')
}
