'use client'

import Link from 'next/link'
import { siteConfig } from '@/config/site'

export function Navbar() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
      style={{ background: 'linear-gradient(to bottom, rgba(2,6,23,0.9), transparent)' }}
    >
      <Link href="/" className="flex flex-col leading-none">
        <span
          className="text-lg font-bold tracking-widest"
          style={{ color: 'var(--particle-cyan)' }}
        >
          {siteConfig.projectName}
        </span>
        <span className="text-xs tracking-wider" style={{ color: 'var(--text-secondary)' }}>
          {siteConfig.projectNameZh}
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-6">
        {siteConfig.navigation.map(item => (
          <Link key={item.href} href={item.href} className="flex flex-col items-center leading-none group">
            <span
              className="text-sm tracking-wide transition-colors group-hover:text-[#38bdf8]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {item.label}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>
              {item.labelZh}
            </span>
          </Link>
        ))}
      </div>

      <Link
        href="/onboarding"
        className="text-xs tracking-widest px-4 py-2 rounded border transition-colors"
        style={{ borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}
      >
        Choose Level / 选择等级
      </Link>
    </nav>
  )
}
