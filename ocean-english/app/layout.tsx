import type { Metadata } from 'next'
import { Space_Grotesk, Space_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import { siteConfig } from '@/config/site'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: `${siteConfig.projectName} — ${siteConfig.slogan}`,
  description: siteConfig.description,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body>
        {children}
        <Toaster theme="dark" position="bottom-right" toastOptions={{ style: { background: 'rgba(2,6,23,0.95)', border: '1px solid rgba(56,189,248,0.2)', color: '#ECFBFF', fontFamily: 'var(--font-sans)' } }} />
      </body>
    </html>
  )
}
