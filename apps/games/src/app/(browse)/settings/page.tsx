'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { EspeezyAppearanceSettings } from '@shared/EspeezyAppearanceSettings'
import { useTheme } from '@/components/theme/GamesThemeProvider'
import { useSupabaseUser } from '@/hooks/useSupabaseUser'
import { getSupabaseClient } from '@/lib/supabase-client'
import { useKanbanAppLink } from '@/hooks/useKanbanAppLink'
export default function GamesSettingsPage() {
  const { currentPalette } = useTheme()
  const user = useSupabaseUser()
  const [plan, setPlan] = useState<string | null>(null)
  const kanbanAppearanceUrl = useKanbanAppLink('/settings?tab=appearance')

  useEffect(() => {
    if (!user) return
    const supabase = getSupabaseClient()
    if (!supabase) return
    void supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setPlan(data?.subscription_plan ?? null))
  }, [user])

  return (
    <div className="games-settings-page">
      <header className="games-page-hero">
        <p
          style={{
            margin: '0 0 0.5rem',
            fontSize: '0.7rem',
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--games-brand, var(--brand))',
          }}
        >
          Settings
        </p>
        <h1>Appearance</h1>
        <p>
          Current theme: <strong>{currentPalette.name}</strong>. Changes apply here and sync to Kanban when you are
          signed in.
        </p>
      </header>

      <nav className="games-settings-nav" aria-label="Games settings">
        <Link href="/" className="games-settings-nav__link">
          ← Back to browse
        </Link>
      </nav>

      <div className="games-settings-panel">
        <EspeezyAppearanceSettings
          subscriptionPlan={plan}
          upgradeHref={kanbanAppearanceUrl}
          showKanbanNote
          onLocked={() => {
            window.location.href = kanbanAppearanceUrl
          }}
        />
      </div>
    </div>
  )
}
