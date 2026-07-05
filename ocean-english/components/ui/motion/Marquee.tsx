'use client'

/**
 * §B11 Marquee · 横向无缝跑马灯
 * ----------------------------------------------------------------------------
 * 落点：RecentlyMasteredRibbon（宇宙面=暗）/ 词库展示（米白面）——跨面组件，传 dark。
 * 内容自动复制一份实现无缝；悬停暂停；可反向。颜色由子项自带，容器不染色。
 */
import { Children } from 'react'

interface MarqueeProps {
  children: React.ReactNode
  /** 一圈秒数，默认 18s（越大越慢）*/
  speed?: number
  reverse?: boolean
  /** 悬停暂停，默认 true */
  pauseOnHover?: boolean
  className?: string
}

export function Marquee({ children, speed = 18, reverse = false, pauseOnHover = true, className }: MarqueeProps) {
  const items = Children.toArray(children)
  return (
    <div className={`marquee${className ? ` ${className}` : ''}`}>
      <div
        className={`marquee-track${reverse ? ' is-reverse' : ''}${pauseOnHover ? ' is-pausable' : ''}`}
        style={{ ['--mq-speed' as string]: `${speed}s` }}
      >
        {items}
        {/* 复制一份，保证 translateX(-50%) 后无缝 */}
        {items.map((c, i) => <div key={`dup-${i}`} aria-hidden style={{ display: 'contents' }}>{c}</div>)}
      </div>
    </div>
  )
}
