'use client'

import { Crown, Loader2 } from 'lucide-react'

type Props = {
  hasSetupData: boolean
  peerCount: number
  onStart: () => void
}

export function SkirmishSetupPanel({ hasSetupData, peerCount, onStart }: Props) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <Crown size={80} className="text-brand" style={{ marginBottom: '2rem', opacity: 0.2 }} />
      <h2 style={{ fontSize: '2rem', fontWeight: 950, marginBottom: '1rem' }}>Initiating Protocol</h2>
      <p style={{ color: 'var(--text-sub)', marginBottom: '2.5rem', maxWidth: '450px', fontWeight: 600 }}>
        {hasSetupData
          ? 'The Master Librarian awaits your signal. Deploy the academic shards whenever you feel adequately prepared.'
          : 'Synchronizing with the Central Archive. Waiting for the Host to initiate the knowledge extraction.'}
      </p>

      {hasSetupData ? (
        <button
          onClick={onStart}
          className="btn btn-primary"
          style={{
            padding: '1.25rem 3.5rem',
            borderRadius: '20px',
            fontWeight: 950,
            fontSize: '1.1rem',
            boxShadow: '0 10px 30px rgba(var(--brand-rgb), 0.3)',
          }}
        >
          COMMENCE THE EXTRACTION
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--brand)', fontWeight: 900 }}>
            <Loader2 className="animate-spin" size={24} />
            <span className="animate-pulse">AWAITING HOST COMMAND...</span>
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-sub)' }}>
            {peerCount} Scholars Connected
          </div>
        </div>
      )}
    </div>
  )
}
