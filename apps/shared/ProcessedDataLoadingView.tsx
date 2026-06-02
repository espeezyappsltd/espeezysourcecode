'use client'

import { useEffect, useState } from 'react'
import './processed-data-loading.css'

const MESSAGES = [
  'Aggregating metrics…',
  'Processing contributions…',
  'Building charts…',
  'Syncing your data…',
  'Almost ready…',
] as const

type Props = {
  /** Cover the main panel (default) or the full viewport. */
  scope?: 'inline' | 'fixed'
  className?: string
}

export default function ProcessedDataLoadingView({ scope = 'inline', className }: Props) {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length)
    }, 1400)
    return () => window.clearInterval(id)
  }, [])

  const rootClass = ['pdl-root', scope === 'fixed' ? 'pdl-root--fixed' : 'pdl-root--inline', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass} role="status" aria-live="polite" aria-busy="true">
      <div className="pdl-card">
        <div className="pdl-chart" aria-hidden>
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} className="pdl-bar" />
          ))}
        </div>
        <div className="pdl-ring" aria-hidden />
        <p className="pdl-message">{MESSAGES[messageIndex]}</p>
        <div className="pdl-track" aria-hidden>
          <div className="pdl-track-fill" />
        </div>
        <span className="pdl-sr">Loading processed data</span>
      </div>
    </div>
  )
}
