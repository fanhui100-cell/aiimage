import { permanentRedirect } from 'next/navigation'

// 界面优化2·导航合并：成就已并入「社区」。旧路由 308 永久重定向到对应 tab。
export default function AchievementsRedirect() {
  permanentRedirect('/community?tab=badge')
}
