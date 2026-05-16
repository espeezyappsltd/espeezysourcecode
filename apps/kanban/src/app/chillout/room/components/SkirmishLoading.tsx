'use client'

import { Loader2 } from 'lucide-react'

export function SkirmishLoading() {
  return (
    <div
      style={{
        height: 'calc(var(--vh-dynamic) - 6rem)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        color: 'var(--text-sub)',
      }}
    >
      <Loader2 className="animate-spin" size={32} />
      <div style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.8rem' }}>
        Calibrating Storage...
      </div>
    </div>
  )
}
