'use client'

import { motion } from 'framer-motion'
import { Users, CheckCircle2, Play } from 'lucide-react'
import type { Profile } from '@/types/database'

type Props = {
  onlineProfiles: Profile[]
  selectedPlayers: string[]
  onTogglePlayer: (id: string) => void
  onBack: () => void
  onStartGame: () => void
}

export function ChilloutInviteStep({
  onlineProfiles,
  selectedPlayers,
  onTogglePlayer,
  onBack,
  onStartGame,
}: Props) {
  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: '24px',
          border: '1px solid var(--border)',
          padding: '2.5rem',
        }}
      >
        <h2 style={{ fontSize: '1.5rem', fontWeight: 950, marginBottom: '0.5rem' }}>Deploy Challenge Signals</h2>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Only online scholars can receive real-time game signals.
        </p>

        <motion.div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {onlineProfiles.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--text-sub)' }}>
              <Users size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
              <p style={{ fontWeight: 700 }}>No other scholars are currently online.</p>
            </div>
          ) : (
            onlineProfiles.map((p) => {
              const selected = selectedPlayers.includes(p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => onTogglePlayer(p.id)}
                  className="glass"
                  style={{
                    padding: '1.25rem',
                    borderRadius: '18px',
                    border: '2px solid',
                    background: selected ? 'rgba(var(--brand-rgb), 0.05)' : 'var(--surface)',
                    borderColor: selected ? 'var(--brand)' : 'var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {p.avatar_url ? (
                      <img
                        src={p.avatar_url}
                        alt={p.full_name || 'Peer'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        aria-label={p.full_name || 'Peer'}
                      >
                        <Users size={16} />
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 900, flex: 1, color: 'var(--text-main)' }}>
                    {p.full_name}
                  </span>
                  {selected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <CheckCircle2 size={18} color="var(--brand)" aria-label="Selected" />
                    </motion.div>
                  )}
                </button>
              )
            })
          )}
        </motion.div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ padding: '1rem 2.5rem' }}>
          Back
        </button>
        <button
          onClick={onStartGame}
          className="btn btn-primary"
          style={{
            padding: '1rem 4rem',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            fontWeight: 950,
            fontSize: '1.1rem',
          }}
          disabled={selectedPlayers.length === 0}
        >
          <Play size={22} fill="currentColor" />
          INITIATE SKIRMISH
        </button>
      </div>
    </motion.div>
  )
}
