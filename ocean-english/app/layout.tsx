import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import './globals.css'
import { siteConfig } from '@/config/site'

const CatPet = dynamic(
  () => import('@/components/cat-pet/CatPet').then(m => ({ default: m.CatPet })),
  { ssr: false },
)

export const metadata: Metadata = {
  title: `${siteConfig.projectName} — ${siteConfig.slogan}`,
  description: siteConfig.description,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <CatPet />
      </body>
    </html>
  )
}
