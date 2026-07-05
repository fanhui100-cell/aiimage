import { permanentRedirect } from 'next/navigation'

// 界面优化2·导航合并：排行已并入「社区」。旧路由 308 永久重定向到对应 tab。
export default function LeaderboardRedirect() {
  permanentRedirect('/community?tab=rank')
}
