'use client'

import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'

type Props = {
  onDownload: () => void
  onReset: () => void
  onExit: () => void
}

export function SkirmishResultsPanel({ onDownload, onReset, onExit }: Props) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '3rem',
      }}
    >
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5 }}>
        <Trophy size={140} className="text-brand" fill="var(--brand)" style={{ filter: 'drop-shadow(0 0 40px rgba(var(--brand-rgb), 0.4))' }} />
      </motion.div>
      <h2 style={{ fontSize: '3.5rem', fontWeight: 950, marginBottom: '0.5rem', letterSpacing: '-0.04em' }}>SKIRMISH CONCLUDED</h2>
      <p style={{ color: 'var(--text-sub)', fontSize: '1.1rem', fontWeight: 600, maxWidth: '500px', marginBottom: '3rem' }}>
        The hierarchy has been established. XP rewards have been injected into your profile.
      </p>

      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <button
          onClick={onDownload}
          className="btn btn-primary"
          style={{
            padding: '1.25rem 3rem',
            borderRadius: '20px',
            fontWeight: 950,
            fontSize: '1.1rem',
            boxShadow: '0 10px 20px rgba(var(--brand-rgb), 0.2)',
          }}
        >
          Record Victory Shard (PDF)
        </button>
        <button
          onClick={onReset}
          className="btn btn-secondary"
          style={{ padding: '1.25rem 3rem', borderRadius: '20px', fontWeight: 950, fontSize: '1.1rem' }}
        >
          Enter New Loop
        </button>
        <button
          onClick={onExit}
          className="btn btn-ghost"
          style={{ padding: '1.25rem 2rem', borderRadius: '20px', fontWeight: 950, fontSize: '1rem' }}
        >
          Exit Zone
        </button>
      </div>
    </div>
  )
}
