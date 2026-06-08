export const DARK_ROUTES = ['/', '/lexigraph', '/lexiverse', '/explore'] as const

export function isDarkRoute(pathname: string): boolean {
  return DARK_ROUTES.some(r => (r === '/' ? pathname === '/' : pathname.startsWith(r)))
}
