import type { Metadata } from 'next'
import './globals.css'
import { siteConfig } from '@/config/site'

export const metadata: Metadata = {
  title: `${siteConfig.projectName} — ${siteConfig.slogan}`,
  description: siteConfig.description,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
