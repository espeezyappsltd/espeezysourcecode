'use client'

import Link from 'next/link'
import AccountTiersBanner from '@/components/AccountTiersBanner'

export default function GamesLobbyClient() {
  return (
    <section style={{ display: 'grid', gap: '1rem', padding: '1.25rem' }}>
      <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>Games Lobby</h1>
      <p style={{ margin: 0, color: 'var(--text-sub)' }}>
        Games are currently in lightweight local mode for refactor stability.
      </p>
      <AccountTiersBanner style={{ marginBottom: '1rem' }} />
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link href="/games/puzzles" className="btn btn-primary">Open Puzzles</Link>
        <Link href="/dashboard" className="btn btn-secondary">Back to Dashboard</Link>
      </div>
    </section>
  )
}
