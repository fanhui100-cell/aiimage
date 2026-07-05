/**
 * 全站 日光 / 夜间 双主题（界面优化14 · 提示词0）
 * 约定：浅色 = 无 data-theme；夜间 = documentElement[data-theme="night"]
 * （沿用 globals.css 既有的 [data-theme="night"] 令牌覆盖，组件只引用变量自动跟随）。
 * 持久化键 lexiverse-mode；migrate 旧键 lexiocean-night-mode。
 */
export type ThemeMode = 'light' | 'dark'
const KEY = 'lexiverse-mode'
const OLD_KEY = 'lexiocean-night-mode'

export function getThemeMode(): ThemeMode {
  if (typeof localStorage === 'undefined') return 'light'
  const v = localStorage.getItem(KEY)
  if (v === 'light' || v === 'dark') return v
  const old = localStorage.getItem(OLD_KEY)
  return old === 'true' || old === '1' || old === 'on' ? 'dark' : 'light'
}

export function applyThemeMode(m: ThemeMode): void {
  if (typeof document === 'undefined') return
  const el = document.documentElement
  if (m === 'dark') el.setAttribute('data-theme', 'night')
  else el.removeAttribute('data-theme')
}

export function setThemeMode(m: ThemeMode): void {
  try { localStorage.setItem(KEY, m) } catch { /* private mode */ }
  applyThemeMode(m)
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('lexiverse-theme', { detail: m }))
}

export function toggleThemeMode(): ThemeMode {
  const next: ThemeMode = getThemeMode() === 'dark' ? 'light' : 'dark'
  setThemeMode(next)
  return next
}

/** 无闪烁 boot 脚本（在 <head> 同步执行，hydration 前应用主题）。 */
export const THEME_BOOT_SCRIPT = `(function(){try{var k=localStorage.getItem('${KEY}');var o=localStorage.getItem('${OLD_KEY}');var dark=k==='dark'||(!k&&(o==='true'||o==='1'||o==='on'));if(dark)document.documentElement.setAttribute('data-theme','night');}catch(e){}})();`
