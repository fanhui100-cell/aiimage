'use client'
/* ============================================================================
   WordImageSlot.tsx — D7 单词配图槽（词详情卡 / 闪卡 / 题卡通用）
   imageUrl 有值 → 显示配图（圆角 + 轻阴影 + 懒加载 + AI 配图角标）；
   无值 / 加载失败 → 返回 null，优雅降级，不留空位、不破坏版式。纯展示，无交互。
   ============================================================================ */

import { useState } from 'react'

interface WordImageSlotProps {
  src?: string | null
  word: string
  /** 宽高比，默认 16/10；闪卡可传更方的比例 */
  ratio?: string
  /** 圆角，默认 14 */
  radius?: number
  className?: string
}

export function WordImageSlot({ src, word, ratio = '16 / 10', radius = 14, className }: WordImageSlotProps) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return null   // 无图优雅降级

  return (
    <div
      className={className}
      style={{
        width: '100%', aspectRatio: ratio, borderRadius: radius, overflow: 'hidden',
        boxShadow: '0 10px 28px -16px rgba(20,30,40,.4)', position: 'relative',
        marginBottom: 14, background: 'var(--card-2)',
      }}
    >
      <img
        src={src}
        alt={word}
        loading="lazy"
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      <span style={{
        position: 'absolute', left: 9, bottom: 9, fontFamily: 'var(--font-mono)', fontSize: 9.5,
        color: '#fff', background: 'rgba(0,0,0,.32)', borderRadius: 999, padding: '3px 9px',
        backdropFilter: 'blur(4px)',
      }}>AI 配图</span>
    </div>
  )
}
