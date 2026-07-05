'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { getModuleById } from '@/config/learning-modules'
import type { ModuleId } from '@/types/learning'

interface BanyanModulePanelProps {
  activeModuleId: ModuleId | null
  isOpen: boolean
  onClose: () => void
}

export function BanyanModulePanel({ activeModuleId, isOpen, onClose }: BanyanModulePanelProps) {
  const activeModule = activeModuleId ? getModuleById(activeModuleId) : null

  return (
    <AnimatePresence>
      {isOpen && activeModule && (
        <motion.div
          key={activeModule.id}
          initial={{ opacity: 0, x: 40, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: '50%',
            right: '24px',
            transform: 'translateY(-50%)',
            width: '320px',
            maxHeight: '80vh',
            overflowY: 'auto',
            background: 'rgba(2, 6, 23, 0.88)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: `1px solid ${activeModule.color}50`,
            boxShadow: `0 0 40px ${activeModule.color}20, 0 20px 60px rgba(0,0,0,0.6)`,
            padding: '24px',
            zIndex: 100,
          }}
        >
          {/* Top scan line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: `linear-gradient(to right, transparent, ${activeModule.color}, transparent)`,
              opacity: 0.8,
              borderRadius: '16px 16px 0 0',
            }}
          />

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '14px',
              right: '16px',
              background: 'none',
              border: 'none',
              color: '#9BBFCA',
              fontSize: '20px',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px',
            }}
            aria-label="Close panel"
          >
            ×
          </button>

          {/* Module name */}
          <div style={{ marginBottom: '12px', paddingRight: '20px' }}>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: activeModule.color,
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              {activeModule.name}
            </div>
            <div style={{ fontSize: '13px', color: '#9BBFCA', marginTop: '2px' }}>
              {activeModule.nameZh}
            </div>
          </div>

          {/* Type badge */}
          <div
            style={{
              display: 'inline-block',
              fontSize: '11px',
              letterSpacing: '0.08em',
              color: activeModule.color,
              border: `1px solid ${activeModule.color}60`,
              borderRadius: '4px',
              padding: '2px 8px',
              marginBottom: '16px',
            }}
          >
            {activeModule.type} / {activeModule.typeZh}
          </div>

          {/* Description */}
          <p style={{ fontSize: '13px', lineHeight: 1.7, color: '#ECFBFF', margin: '0 0 6px' }}>
            {activeModule.description}
          </p>
          <p style={{ fontSize: '12px', lineHeight: 1.7, color: '#9BBFCA', margin: '0 0 20px' }}>
            {activeModule.descriptionZh}
          </p>

          {/* Abilities */}
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '0.1em',
              color: activeModule.color,
              marginBottom: '10px',
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            CORE ABILITIES / 核心能力
          </div>
          <ul style={{ margin: '0 0 24px', padding: 0, listStyle: 'none' }}>
            {activeModule.abilities.map((ability, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1px',
                  marginBottom: '10px',
                  paddingLeft: '12px',
                  borderLeft: `2px solid ${activeModule.color}50`,
                }}
              >
                <span style={{ fontSize: '12px', color: '#ECFBFF' }}>{ability}</span>
                <span style={{ fontSize: '11px', color: '#9BBFCA' }}>{activeModule.abilitiesZh[i]}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <Link
            href={activeModule.route}
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '10px 20px',
              borderRadius: '8px',
              background: `${activeModule.color}18`,
              border: `1px solid ${activeModule.color}70`,
              color: activeModule.color,
              fontSize: '13px',
              letterSpacing: '0.06em',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Enter Module / 进入模块
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
