// F1：主页改深色画框卡嵌米白页，'/' 不再是深色沉浸路由
export const DARK_ROUTES = ['/lexigraph', '/lexiverse', '/explore'] as const

export function isDarkRoute(pathname: string): boolean {
  return DARK_ROUTES.some(r => pathname.startsWith(r))
}
