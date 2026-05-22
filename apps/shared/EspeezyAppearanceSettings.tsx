'use client'

import Image from 'next/image'
import {
  Activity as PulseIcon,
  Award,
  CheckCircle2,
  Image as ImageIcon,
  Lock,
  Palette as PaletteIcon,
  Shield,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { PALETTES } from './theme-palettes'
import { useEspeezyTheme } from './EspeezyThemeProvider'
import { canAccessPaletteTier } from './theme-palette-access'

export type EspeezyAppearanceSettingsProps = {
  subscriptionPlan?: string | null
  /** Override plan-based gating (Kanban feature-gate). */
  canAccessPalette?: (tier: 'free' | 'pro' | 'premium') => boolean
  upgradeHref?: string
  onUpgrade?: () => void
  onPaletteApplied?: (name: string) => void
  onPaletteError?: (message: string) => void
  showLowPowerMode?: boolean
  isToasterMode?: boolean
  onToasterModeChange?: (enabled: boolean) => void
  showCustomCanvas?: boolean
  customBg?: string | null
  onCustomBgClear?: () => void
  uploadingBg?: boolean
  onBgFileSelect?: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
}

export function EspeezyAppearanceSettings({
  subscriptionPlan,
  canAccessPalette,
  upgradeHref,
  onUpgrade,
  onPaletteApplied,
  onPaletteError,
  showLowPowerMode = false,
  isToasterMode = false,
  onToasterModeChange,
  showCustomCanvas = false,
  customBg,
  onCustomBgClear,
  uploadingBg = false,
  onBgFileSelect,
  className = '',
}: EspeezyAppearanceSettingsProps) {
  const { currentPalette, setPalette } = useEspeezyTheme()

  const tiers = ['free', 'pro', 'premium', 'lifetime'] as const

  const resolveAccess = (paletteTier: 'free' | 'pro' | 'premium') => {
    if (canAccessPalette) return canAccessPalette(paletteTier)
    return canAccessPaletteTier(subscriptionPlan, paletteTier)
  }

  const handleUpgrade = () => {
    if (onUpgrade) onUpgrade()
    else if (upgradeHref && typeof window !== 'undefined') window.location.href = upgradeHref
  }

  return (
    <div className={`espeezy-appearance-settings auth-card ${className}`.trim()}>
      <h2 className="espeezy-appearance-settings__page-title">Look &amp; Feel</h2>
      <p className="espeezy-appearance-settings__page-desc">
        Customize your workspace with high-end, professionally curated themes.
      </p>

      {showLowPowerMode && onToasterModeChange && (
        <div className={`espeezy-appearance-settings__low-power${isToasterMode ? ' is-on' : ''}`}>
          <div className="espeezy-appearance-settings__low-power-copy">
            <div
              className={`espeezy-appearance-settings__low-power-icon${isToasterMode ? ' is-on' : ''}`}
            >
              <PulseIcon size={24} aria-hidden />
            </div>
            <div>
              <h3>Low Power Mode</h3>
              <p>
                Optimizes performance for low-end devices and slow connections by disabling heavy
                visual effects.
              </p>
            </div>
          </div>
          <button
            type="button"
            className={`espeezy-btn${isToasterMode ? ' espeezy-btn--primary' : ' espeezy-btn--secondary'}`}
            onClick={() => {
              const next = !isToasterMode
              onToasterModeChange(next)
              if (typeof window !== 'undefined') {
                localStorage.setItem('gf_toaster_mode', String(next))
                if (next) document.body.classList.add('toaster-mode')
                else document.body.classList.remove('toaster-mode')
              }
            }}
          >
            {isToasterMode ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>
      )}

      {tiers.map((tier) => {
        if (tier === 'lifetime' && subscriptionPlan !== 'lifetime') return null

        const tierThemes = PALETTES.filter((p) => (p.tier || 'free') === tier)
        if (!tierThemes.length) return null

        const paletteTier = tier === 'lifetime' ? 'premium' : tier
        const canAccess = resolveAccess(paletteTier)
        const isLocked = !canAccess

        const tierColorClass =
          tier === 'premium' || tier === 'lifetime'
            ? 'espeezy-appearance-settings__tier-title--premium'
            : tier === 'pro'
              ? 'espeezy-appearance-settings__tier-title--pro'
              : ''

        return (
          <section key={tier} className="espeezy-appearance-settings__collection">
            <div className="espeezy-appearance-settings__collection-head">
              <h3 className={`espeezy-appearance-settings__tier-title ${tierColorClass}`}>
                {tier === 'premium' || tier === 'lifetime' ? (
                  <Award size={20} aria-hidden />
                ) : tier === 'pro' ? (
                  <Shield size={20} aria-hidden />
                ) : (
                  <PaletteIcon size={20} aria-hidden />
                )}
                {tier} Collection
              </h3>
              {isLocked &&
                (onUpgrade || upgradeHref ? (
                  upgradeHref && !onUpgrade ? (
                    <Link
                      href={upgradeHref}
                      className={`espeezy-btn espeezy-btn--sm espeezy-btn--primary shimmer-gold${tier === 'premium' || tier === 'lifetime' ? ' espeezy-btn--gold' : ''}`}
                    >
                      Unlock {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={handleUpgrade}
                      className={`espeezy-btn espeezy-btn--sm espeezy-btn--primary shimmer-gold${tier === 'premium' || tier === 'lifetime' ? ' espeezy-btn--gold' : ''}`}
                    >
                      Unlock {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </button>
                  )
                ) : null)}
            </div>

            <div className="espeezy-appearance-settings__theme-grid">
              {tierThemes.map((p) => (
                <div
                  key={p.name}
                  className={`espeezy-appearance-settings__theme-wrap${p.name === 'Gold Luxury' ? ' premium-glow shimmer-gold' : ''}`}
                >
                  <button
                    type="button"
                    disabled={!canAccess}
                    className="espeezy-appearance-settings__theme-card"
                    aria-pressed={currentPalette.name === p.name}
                    onClick={() => {
                      void (async () => {
                        try {
                          await setPalette(p.name)
                          onPaletteApplied?.(p.name)
                        } catch (err: unknown) {
                          const msg = err instanceof Error ? err.message : ''
                          if (msg === 'PREMIUM_LOCKED' || msg === 'PRO_LOCKED') {
                            onPaletteError?.(msg)
                            handleUpgrade()
                          } else {
                            onPaletteError?.(msg || 'Failed to apply theme.')
                          }
                        }
                      })()
                    }}
                    style={{
                      background: p.colors['--bg-sub'],
                      border:
                        currentPalette.name === p.name
                          ? `3px solid ${p.colors['--brand']}`
                          : '1px solid var(--border)',
                    }}
                  >
                    <div className="espeezy-appearance-settings__theme-card-head">
                      <span style={{ fontWeight: 850, color: p.colors['--text-main'], fontSize: '0.95rem' }}>
                        {p.name}
                      </span>
                      {currentPalette.name === p.name && (
                        <div
                          className="espeezy-appearance-settings__theme-check"
                          style={{ background: p.colors['--brand'] }}
                        >
                          <CheckCircle2 size={14} aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="espeezy-appearance-settings__swatches">
                      {[p.colors['--brand'], p.colors['--accent'], p.colors['--bg-main'], p.colors['--text-main']].map(
                        (c, i) => (
                          <div
                            key={i}
                            className="espeezy-appearance-settings__swatch-dot"
                            style={{ background: c }}
                            aria-hidden
                          />
                        ),
                      )}
                    </div>
                  </button>

                  {isLocked && (
                    <button
                      type="button"
                      className="glass-lock"
                      onClick={handleUpgrade}
                      aria-label={`${tier} themes require upgrade`}
                    >
                      <div className="espeezy-appearance-settings__lock-icon">
                        <Lock size={20} color="white" aria-hidden />
                      </div>
                      <span>{tier} Only</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )
      })}

      {showCustomCanvas && (
        <section className="espeezy-appearance-settings__canvas">
          <h3>
            <ImageIcon size={20} aria-hidden /> Custom Canvas
          </h3>
          <div className="espeezy-appearance-settings__canvas-panel">
            {customBg ? (
              <div className="espeezy-appearance-settings__canvas-preview">
                <Image src={customBg} alt="Custom workspace background" fill sizes="240px" unoptimized />
                {onCustomBgClear && (
                  <button
                    type="button"
                    className="espeezy-appearance-settings__canvas-remove"
                    onClick={() => void onCustomBgClear()}
                    aria-label="Remove custom background"
                  >
                    <X size={16} aria-hidden />
                  </button>
                )}
              </div>
            ) : (
              <div className="espeezy-appearance-settings__canvas-placeholder">
                <ImageIcon size={40} aria-hidden />
              </div>
            )}
            {onBgFileSelect && (
              <label className="espeezy-btn espeezy-btn--primary shimmer-gold espeezy-appearance-settings__upload-label">
                {uploadingBg ? 'Syncing...' : customBg ? 'Swap Artwork' : 'Upload Custom Backdrop'}
                <input type="file" accept="image/*" onChange={onBgFileSelect} hidden />
              </label>
            )}
            <p className="espeezy-appearance-settings__canvas-hint">
              Immersive glassmorphism will adapt to your custom imagery.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}
