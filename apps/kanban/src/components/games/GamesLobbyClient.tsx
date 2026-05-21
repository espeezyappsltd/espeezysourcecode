'use client'

import { useGamesProfileLink } from '@/hooks/useGamesProfileLink'
import AccountTiersBanner from '@/components/AccountTiersBanner'
import { PageHeader } from '@/components/layout/PageHeader'
import { Gamepad2 } from 'lucide-react'

export default function GamesLobbyClient() {
  const gamesProfileUrl = useGamesProfileLink()

  return (
    <section className="page-fade page-shell page-stack" style={{ paddingTop: '1.25rem' }}>
      <PageHeader
        variant="compact"
        title="Skirmish"
        icon={Gamepad2}
        description="Play on games.espeezy.com — your profile and stats stay in sync with Kanban."
      />
      <AccountTiersBanner style={{ marginBottom: '1rem' }} />
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <a href={gamesProfileUrl} className="btn btn-primary">
          Open my Games profile
        </a>
        <a href="/" className="btn btn-secondary">
          Back to workspace
        </a>
      </div>
    </section>
  )
}
