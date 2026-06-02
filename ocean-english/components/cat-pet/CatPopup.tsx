'use client'

import type { CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useCatStore } from '@/store/catStore'
import { catMenuItems, type CatMenuItem } from './config'

function MenuItem({ item }: { item: CatMenuItem }) {
  const router           = useRouter()
  const mood             = useCatStore(s => s.mood)
  const addMood          = useCatStore(s => s.addMood)
  const setAnimState     = useCatStore(s => s.setAnimState)
  const closePopup       = useCatStore(s => s.closePopup)
  const touchInteraction = useCatStore(s => s.touchInteraction)

  const label = item.action === 'display-mood'
    ? `❤️ 心情 ${mood} / 100`
    : `${item.icon} ${item.label}`

  const handleClick = () => {
    if (item.readonly) return
    touchInteraction()

    if (item.action === 'navigate' && item.target) {
      closePopup()
      router.push(item.target)
    } else if (item.action === 'pet') {
      addMood(10)
      setAnimState('petting')
      closePopup()
    } else if (item.action === 'custom' && item.handler) {
      item.handler()
      closePopup()
    }
  }

  const baseStyle: CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '8px',
    width: '100%', padding: '7px 12px',
    background: 'rgba(255,255,255,0.04)',
    border: 'none', borderRadius: '6px',
    color: item.readonly ? 'rgba(155,191,202,0.6)' : '#ECFBFF',
    fontSize: '13px',
    cursor: item.readonly ? 'default' : 'pointer',
    textAlign: 'left', transition: 'background 0.15s',
  }

  return (
    <button
      onClick={handleClick}
      disabled={item.readonly}
      style={baseStyle}
      onMouseEnter={e => {
        if (!item.readonly)
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(56,189,248,0.1)'
      }}
      onMouseLeave={e => {
        if (!item.readonly)
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'
      }}
    >
      {label}
    </button>
  )
}

export function CatPopup() {
  const popupOpen = useCatStore(s => s.popupOpen)
  const corner    = useCatStore(s => s.corner)

  const isBottom = corner.includes('bottom')
  const isRight  = corner.includes('right')

  const popupStyle: CSSProperties = {
    position: 'absolute',
    [isBottom ? 'bottom' : 'top']: '210px',
    [isRight  ? 'right'  : 'left']: 0,
    width: '180px',
    background: 'rgba(2,6,23,0.94)',
    border: '1px solid rgba(56,189,248,0.25)',
    borderRadius: '10px',
    padding: '6px',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 0 20px rgba(56,189,248,0.1), 0 8px 24px rgba(0,0,0,0.5)',
    zIndex: 60,
  }

  return (
    <AnimatePresence>
      {popupOpen && (
        <motion.div
          style={popupStyle}
          initial={{ opacity: 0, scale: 0.85, y: isBottom ? 8 : -8 }}
          animate={{ opacity: 1, scale: 1,    y: 0 }}
          exit={{    opacity: 0, scale: 0.85, y: isBottom ? 8 : -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {catMenuItems.map(item => <MenuItem key={item.id} item={item} />)}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
