'use client'

import React, { useEffect, useId, useRef } from 'react'

interface ModalOverlayProps {
  children: React.ReactNode
  maxWidth?: string
  onClickOutside?: () => void
  ariaLabel?: string
}

export default function ModalOverlay({
  children,
  maxWidth = '720px',
  onClickOutside,
  ariaLabel = 'Dialog',
}: ModalOverlayProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.classList.add('body-lock')
    return () => {
      document.body.classList.remove('body-lock')
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClickOutside?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClickOutside])

  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  return (
    <div
      className="app-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className="app-modal-backdrop"
        aria-label="Close dialog"
        onClick={() => onClickOutside?.()}
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="app-modal-panel"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth }}
      >
        <span id={titleId} className="sr-only">
          {ariaLabel}
        </span>
        {children}
      </div>
    </div>
  )
}
