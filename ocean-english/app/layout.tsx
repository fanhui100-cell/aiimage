import type { Metadata } from 'next'
import {
  Space_Grotesk,
  Space_Mono,
  Instrument_Serif,
  Newsreader,
  Noto_Serif_SC,
  Noto_Sans_SC,
} from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import './landing.css'
import './lexi-glass.css'
import { siteConfig } from '@/config/site'
import { THEME_BOOT_SCRIPT } from '@/lib/theme-mode'

/* ── UI sans (保留) ── */
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

/* ── mono 标签 / IPA / 遥测(保留) ── */
const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
})

/* ── 英文编辑式大标题 ── */
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

/* ── 例句 / 英文斜体副标 ── */
const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-news',
  display: 'swap',
})

/* ── 中文主标(领衔)。CJK 字体较大;若首屏性能敏感可改用 <link> 或自托管子集。 ── */
const notoSerifSC = Noto_Serif_SC({
  weight: ['500', '600', '700'],
  variable: '--font-serif-zh',
  display: 'swap',
})

/* ── 中文正文 fallback ── */
const notoSansSC = Noto_Sans_SC({
  weight: ['400', '500', '700'],
  variable: '--font-sans-zh',
  display: 'swap',
})

export const metadata: Metadata = {
  title: `${siteConfig.projectName} — ${siteConfig.slogan}`,
  description: siteConfig.description,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVars = [
    spaceGrotesk.variable,
    spaceMono.variable,
    instrumentSerif.variable,
    newsreader.variable,
    notoSerifSC.variable,
    notoSansSC.variable,
  ].join(' ')

  return (
    <html lang="zh-CN" className={fontVars}>
      <head>
        {/* 无闪烁：hydration 前按持久化偏好应用 日光/夜间 */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(8,15,24,0.96)',
              border: '1px solid rgba(79,230,206,0.25)',
              color: '#EEF5F9',
              fontFamily: 'var(--font-sans)',
            },
          }}
        />
      </body>
    </html>
  )
}
