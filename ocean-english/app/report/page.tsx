import { permanentRedirect } from 'next/navigation'

// 界面优化2·导航合并：报告已并入「我的 → 数据」。旧路由 308 永久重定向到对应 tab。
export default function ReportRedirect() {
  permanentRedirect('/profile?tab=data')
}
