'use client'

import { useState } from 'react'

type TooltipProps = {
  children: React.ReactNode
  tip: string
}

export function Tooltip({ children, tip }: TooltipProps) {
  const [show, setShow] = useState(false)

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => {
        setShow(true)
      }}
      onMouseLeave={() => {
        setShow(false)
      }}
    >
      {children}
      {show && (
        <span
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#0f172a',
            color: '#e2e8f0',
            fontSize: '0.7rem',
            fontWeight: 600,
            padding: '0.3rem 0.55rem',
            borderRadius: '6px',
            whiteSpace: 'nowrap',
            border: '1px solid rgba(148,163,184,0.2)',
            zIndex: 999,
            pointerEvents: 'none',
          }}
        >
          {tip}
          <span
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              borderWidth: '4px',
              borderStyle: 'solid',
              borderColor: '#0f172a transparent transparent transparent',
            }}
          />
        </span>
      )}
    </span>
  )
}
