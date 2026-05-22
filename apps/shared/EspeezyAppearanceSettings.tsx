'use client'

import { Lock, Palette as PaletteIcon } from 'lucide-react'
import Link from 'next/link'
import { PALETTES } from './theme-palettes'
import { useEspeezyTheme } from './EspeezyThemeProvider'
import { canAccessPaletteTier } from './theme-palette-access'

type EspeezyAppearanceSettingsProps = {
  subscriptionPlan?: string | null
  /** Kanban: link to billing; Games: optional */
  upgradeHref?: string
  onPaletteApplied?: (name: string) => void
  onLocked?: (tier: 'pro' | 'premium') => void
  showKanbanNote?: boolean
}

export function EspeezyAppearanceSettings({
  subscriptionPlan,
  upgradeHref = '/settings?tab=appearance',
  onPaletteApplied,
  onLocked,
  showKanbanNote = false,
}: EspeezyAppearanceSettingsProps) {
  const { currentPalette, setPalette } = useEspeezyTheme()

  const tiers = ['free', 'pro', 'premium'] as const

  return (
    <div className="espeezy-appearance-settings">
      <header className="espeezy-appearance-settings__head">
        <PaletteIcon size={22} aria-hidden />
        <div>
          <h2 className="espeezy-appearance-settings__title">Look &amp; feel</h2>
          <p className="espeezy-appearance-settings__desc">
            Themes sync across Espeezy Kanban and Games when you are signed in. Use the sidebar Theme
            button for quick switching.
          </p>
        </div>
      </header>

      {showKanbanNote && (
        <p className="espeezy-appearance-settings__note">
          Full background uploads and low-power mode are in Kanban workspace settings.
        </p>
      )}

      {tiers.map((tier) => {
        const tierThemes = PALETTES.filter((p) => (p.tier || 'free') === tier)
        if (!tierThemes.length) return null
        const canAccess = canAccessPaletteTier(subscriptionPlan, tier)
        const isLocked = !canAccess

        return (
          <section key={tier} className="espeezy-appearance-settings__tier" aria-labelledby={`theme-tier-${tier}`}>
            <div className="espeezy-appearance-settings__tier-head">
              <h3 id={`theme-tier-${tier}`}>{tier === 'free' ? 'Free' : tier === 'pro' ? 'Pro' : 'Premium'} themes</h3>
              {isLocked && upgradeHref && (
                <Link href={upgradeHref} className="espeezy-appearance-settings__upgrade">
                  Upgrade
                </Link>
              )}
            </div>
            <div className="espeezy-appearance-settings__grid" role="list">
              {tierThemes.map((p) => {
                const active = currentPalette.name === p.name
                return (
                  <button
                    key={p.name}
                    type="button"
                    role="listitem"
                    className={`espeezy-appearance-settings__card${active ? ' is-active' : ''}${isLocked ? ' is-locked' : ''}`}
                    aria-pressed={active}
                    aria-label={`${p.name} theme${isLocked ? ' (locked)' : ''}`}
                    disabled={isLocked}
                    onClick={() => {
                      void (async () => {
                        try {
                          await setPalette(p.name)
                          onPaletteApplied?.(p.name)
                        } catch (e) {
                          const msg = e instanceof Error ? e.message : ''
                          if (msg === 'PREMIUM_LOCKED' || msg === 'PRO_LOCKED') {
                            onLocked?.(msg === 'PREMIUM_LOCKED' ? 'premium' : 'pro')
                          }
                        }
                      })()
                    }}
                  >
                    <div
                      className="espeezy-appearance-settings__swatch"
                      style={{
                        background: `linear-gradient(135deg, ${p.colors['--bg-main']}, ${p.colors['--brand']})`,
                      }}
                      aria-hidden
                    />
                    <span className="espeezy-appearance-settings__name">{p.name}</span>
                    {isLocked && <Lock size={14} aria-hidden className="espeezy-appearance-settings__lock" />}
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
