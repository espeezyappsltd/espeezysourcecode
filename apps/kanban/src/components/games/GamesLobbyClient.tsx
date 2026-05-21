'use client'

import Link from 'next/link'
import AccountTiersBanner from '@/components/AccountTiersBanner'
import { PageHeader } from '@/components/layout/PageHeader'
import { Gamepad2 } from 'lucide-react'

export default function GamesLobbyClient() {
  return (
    <section className="page-fade page-shell page-stack" style={{ paddingTop: '1.25rem' }}>
      <PageHeader
        variant="compact"
        title="Games Lobby"
        icon={Gamepad2}
        description="Games are currently in lightweight local mode for refactor stability."
      />
      <AccountTiersBanner style={{ marginBottom: '1rem' }} />
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link href="/games/puzzles" className="btn btn-primary">Open Puzzles</Link>
        <Link href="/" className="btn btn-secondary">Back to Dashboard</Link>
      </div>
    </section>
  )
}
