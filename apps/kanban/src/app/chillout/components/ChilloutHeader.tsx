'use client'

import { Sparkles } from 'lucide-react'

export function ChilloutHeader() {
  return (
    <header>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
        <div
          style={{
            padding: '0.75rem',
            borderRadius: '14px',
            background: 'rgba(var(--brand-rgb), 0.1)',
            color: 'var(--brand)',
          }}
        >
          <Sparkles size={32} />
        </div>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 950, letterSpacing: '-0.04em', margin: 0 }}>
            Chill Out <span style={{ color: 'var(--brand)' }}>Zone</span>
          </h1>
          <p style={{ color: 'var(--text-sub)', fontWeight: 600, fontSize: '0.9rem' }}>
            Decompress and dominate with real-time academic skirmishes.
          </p>
        </div>
      </div>
    </header>
  )
}
