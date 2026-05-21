'use client'

import { useEffect } from 'react'
import { useGamesProfileLink } from '@/hooks/useGamesProfileLink'

/** Legacy /games route → games.espeezy.com profile (SSO). */
export default function GamesRedirectPage() {
  const gamesProfileUrl = useGamesProfileLink()

  useEffect(() => {
    window.location.replace(gamesProfileUrl)
  }, [gamesProfileUrl])

  return (
    <div className="page-shell" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
      <p style={{ color: 'var(--text-sub)', fontWeight: 700 }}>Opening Espeezy Games…</p>
    </div>
  )
}
