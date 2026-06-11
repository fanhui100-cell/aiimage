'use client'
import { useRouter } from 'next/navigation'

export const NAVIGATE_MAP: Record<string, string> = {
  home:          '/',
  today:         '/today',
  learn:         '/learn',
  words:         '/dictionary',
  reading:       '/reading',
  review:        '/memory',
  quiz:          '/quiz',
  exam:          '/exam',
  pronunciation: '/pronunciation',
  scan:          '/scan',
  chat:          '/chat',
  universe:      '/lexiverse',
  lexigraph:     '/lexigraph',
  knowledge:     '/knowledge',
  me:            '/profile',
  onboarding:    '/onboarding',
}

export function useNavigate() {
  const router = useRouter()
  return function navigate(key: string, params?: Record<string, string | number | boolean>) {
    const route = NAVIGATE_MAP[key] ?? `/${key}`
    if (!params || Object.keys(params).length === 0) {
      router.push(route)
      return
    }
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    ).toString()
    router.push(`${route}?${qs}`)
  }
}
