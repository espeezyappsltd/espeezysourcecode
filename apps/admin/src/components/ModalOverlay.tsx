'use client'

import React from 'react'

interface ModalOverlayProps {
  children: React.ReactNode
  maxWidth?: string
  onClickOutside?: () => void
}

export default function ModalOverlay({ children, maxWidth = '720px', onClickOutside }: ModalOverlayProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={() => onClickOutside?.()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth,
          maxHeight: 'calc(100vh - 2rem)',
          overflowY: 'auto',
          borderRadius: '28px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.35)',
          position: 'relative'
        }}
      >
        {children}
      </div>
    </div>
  )
}
