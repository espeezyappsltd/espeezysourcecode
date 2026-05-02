'use client'

/**
 * AdminMarketingPanel
 *
 * The three-column "live marketing controls" grid:
 *   1. Landing Banner  — edit and deploy the site marquee message
 *   2. Announcement    — push / terminate a global notification
 *   3. Active Promos   — toggle the current promotional offer
 *
 * Props:
 *   config          — the full platform_config map (keyed by config key name)
 *   onConfigChange  — replaces the whole config map in parent state
 *   onUpdateConfig  — persists a single key to the database
 *   saving          — disables buttons while a write is in flight
 */

import { Globe, AlertCircle, CreditCard } from 'lucide-react'
import type { PlatformConfig } from './types'

interface Props {
  config: PlatformConfig
  onConfigChange: (config: PlatformConfig) => void
  onUpdateConfig: (
    key: string,
    updates: Record<string, string | number | boolean | Record<string, string>>,
  ) => void
  saving: boolean
}

export default function AdminMarketingPanel({
  config,
  onConfigChange,
  onUpdateConfig,
  saving,
}: Props) {
  // Pull the three entries we care about out of the config map
  const mainBanner = config?.main_banner
  const announcement = config?.global_announcement
  const promo = config?.promo_logic

  // The banner text lives nested inside `value` as `{ text: string }`
  const bannerText = (mainBanner?.value as Record<string, string>)?.text ?? ''
  // The announcement message lives nested inside `value` as `{ message: string }`
  const announcementMessage = (announcement?.value as Record<string, string>)?.message ?? ''

  // ── Banner text change ─────────────────────────────────────────────────────
  // We spread the existing config and only update the one nested key.
  function handleBannerTextChange(text: string) {
    onConfigChange({
      ...config,
      main_banner: {
        ...mainBanner,
        value: {
          ...(mainBanner?.value as Record<string, string>),
          text,
        },
      },
    })
  }

  // ── Announcement message change ────────────────────────────────────────────
  function handleAnnouncementMessageChange(message: string) {
    onConfigChange({
      ...config,
      global_announcement: {
        ...announcement,
        value: {
          ...(announcement?.value as Record<string, string>),
          message,
        },
      },
    })
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem',
      }}
    >
      {/* ── 1. Landing Banner ─────────────────────────────────────────────── */}
      <MarketingCard>
        <CardTitle icon={<Globe size={18} style={{ color: '#10b981' }} />}>
          Landing Banner
        </CardTitle>

        <ConfigInput
          value={bannerText}
          onChange={handleBannerTextChange}
          placeholder="Marquee Message..."
        />

        <div style={{ display: 'flex', gap: '1rem' }}>
          {/* Deploy — saves the current text and activates the banner */}
          <ActionButton
            onClick={() => onUpdateConfig('main_banner', { value: mainBanner?.value ?? '', is_active: true })}
            disabled={saving}
            style={{ flex: 1, background: '#10b981', color: 'black', border: 'none' }}
          >
            DEPLOY
          </ActionButton>

          {/* Toggle — flips is_active without touching the text */}
          <ActionButton
            onClick={() => onUpdateConfig('main_banner', { is_active: !mainBanner?.is_active })}
            disabled={saving}
            style={{
              flex: 1,
              background: '#111',
              color: mainBanner?.is_active ? '#ef4444' : '#10b981',
              border: '1px solid #222',
            }}
          >
            {mainBanner?.is_active ? 'DISABLE' : 'ENABLE'}
          </ActionButton>
        </div>
      </MarketingCard>

      {/* ── 2. Announcement ───────────────────────────────────────────────── */}
      <MarketingCard>
        <CardTitle icon={<AlertCircle size={18} style={{ color: '#ec4899' }} />}>
          Announcement
        </CardTitle>

        <ConfigInput
          value={announcementMessage}
          onChange={handleAnnouncementMessageChange}
          placeholder="Breaking Announcement..."
        />

        <div style={{ display: 'flex', gap: '1rem' }}>
          <ActionButton
            onClick={() => onUpdateConfig('global_announcement', { value: announcement?.value ?? '', is_active: true })}
            disabled={saving}
            style={{ flex: 1, background: '#ec4899', color: 'white', border: 'none' }}
          >
            PUSH LIVE
          </ActionButton>

          <ActionButton
            onClick={() => onUpdateConfig('global_announcement', { is_active: false })}
            disabled={saving}
            style={{ flex: 1, background: '#111', color: 'white', border: '1px solid #222' }}
          >
            TERMINATE
          </ActionButton>
        </div>
      </MarketingCard>

      {/* ── 3. Active Promos ──────────────────────────────────────────────── */}
      <MarketingCard>
        <CardTitle icon={<CreditCard size={18} style={{ color: '#6366f1' }} />}>
          Active Promos
        </CardTitle>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Current promo label */}
          <div
            style={{
              padding: '1rem',
              background: '#000',
              borderRadius: '16px',
              border: '1px solid #222',
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: '0.65rem',
                color: 'rgba(255,255,255,0.3)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
              }}
            >
              Current Target
            </div>
            <div style={{ fontWeight: 950, fontSize: '1.25rem', color: 'white' }}>ELITE30</div>
          </div>

          {/* Toggle active state */}
          <ActionButton
            onClick={() => onUpdateConfig('promo_logic', { is_active: !promo?.is_active })}
            disabled={saving}
            style={{
              flex: 1,
              height: '64px',
              border: 'none',
              background: promo?.is_active ? '#6366f1' : '#111',
              color: 'white',
            }}
          >
            {promo?.is_active ? 'ACTIVE' : 'INACTIVE'}
          </ActionButton>
        </div>
      </MarketingCard>
    </div>
  )
}

// ── Shared inner components ────────────────────────────────────────────────────
// These are small enough to live in the same file; they are not used anywhere
// else so there's no reason to extract them to separate files.

/** Consistent card wrapper for each marketing control. */
function MarketingCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '2rem',
        background: '#0a0a0a',
        border: '1px solid #111',
        borderRadius: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      {children}
    </div>
  )
}

/** Card heading with a leading icon. */
function CardTitle({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <h3
      style={{
        fontSize: '1.1rem',
        fontWeight: 950,
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        color: 'white',
      }}
    >
      {icon}
      {children}
    </h3>
  )
}

/** Single-line text input used inside each card. */
function ConfigInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '0.75rem',
        background: '#000',
        border: '1px solid #333',
        borderRadius: '12px',
        color: 'white',
        fontSize: '0.85rem',
        boxSizing: 'border-box',
      }}
    />
  )
}

/** Reusable button used for all card actions. Accepts arbitrary style overrides. */
function ActionButton({
  onClick,
  disabled,
  style,
  children,
}: {
  onClick: () => void
  disabled?: boolean
  style: React.CSSProperties
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '0.75rem',
        borderRadius: '12px',
        fontWeight: 950,
        fontSize: '0.8rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  )
}
