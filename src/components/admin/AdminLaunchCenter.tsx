'use client'

/**
 * AdminLaunchCenter
 *
 * The "Launch Command Center" panel.
 * Manages the /preregister page content live:
 *   - launch date, brand name, goal, version, hero message
 *   - toggle registration open/closed
 *   - deploy button that calls the launch-config API
 *
 * Props:
 *   launchConfig    — the current launch config values
 *   onConfigChange  — updates a single key in the config
 *   preregCount     — current number of pre-registrations
 *   onSave          — triggers the PUT to /api/admin/launch-config
 *   saving          — true while the save is in flight
 */

import { Globe } from 'lucide-react'
import type { LaunchConfig } from './types'

interface Props {
  launchConfig: LaunchConfig
  onConfigChange: (updates: Partial<LaunchConfig>) => void
  preregCount: number
  onSave: () => void
  saving: boolean
}

export default function AdminLaunchCenter({
  launchConfig,
  onConfigChange,
  preregCount,
  onSave,
  saving,
}: Props) {
  const isOpen = launchConfig.preregister_open === 'true'
  const goalNumber = launchConfig.preregister_goal
    ? parseInt(launchConfig.preregister_goal)
    : 5_000_000

  // ── Field change helpers ───────────────────────────────────────────────────
  function handleDateChange(rawValue: string) {
    // Convert local datetime-input value to an ISO string for storage
    onConfigChange({ launch_date: new Date(rawValue).toISOString() })
  }

  function handleToggleRegistration() {
    onConfigChange({ preregister_open: isOpen ? 'false' : 'true' })
  }

  return (
    <div
      style={{
        marginBottom: '3rem',
        padding: '2.5rem',
        background: '#0a0a0a',
        border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: '32px',
      }}
    >
      {/* ── Section heading + stat badges ─────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          {/* Eyebrow */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.5rem',
            }}
          >
            <Globe size={18} style={{ color: '#10b981' }} aria-hidden="true" />
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 900,
                color: '#10b981',
                textTransform: 'uppercase',
                letterSpacing: '3px',
              }}
            >
              Launch Command Center
            </span>
          </div>

          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 950,
              margin: 0,
              letterSpacing: '-0.03em',
              color: 'white',
            }}
          >
            Pre-Registration &amp; Launch Control
          </h2>

          <p
            style={{
              color: 'rgba(255,255,255,0.3)',
              fontSize: '0.8rem',
              marginTop: '0.4rem',
            }}
          >
            Changes reflect live on{' '}
            <a
              href="/preregister"
              rel="noreferrer"
              style={{ color: '#10b981', textDecoration: 'none' }}
            >
              /preregister
            </a>{' '}
            immediately after saving.
          </p>
        </div>

        {/* Three stat counters */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <StatCard
            value={preregCount.toLocaleString()}
            label="Pre-Registrations"
            valueColor="#10b981"
          />
          <StatCard
            value={goalNumber.toLocaleString()}
            label="Goal"
            valueColor="white"
          />
          <StatCard
            value={isOpen ? 'OPEN' : 'CLOSED'}
            label="Registration"
            valueColor={isOpen ? '#10b981' : '#ef4444'}
          />
        </div>
      </div>

      {/* ── Text fields grid ──────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <LabeledField label="Launch Date (ISO 8601)">
          <input
            type="datetime-local"
            value={launchConfig.launch_date ? launchConfig.launch_date.slice(0, 16) : ''}
            onChange={(e) => handleDateChange(e.target.value)}
            style={inputStyle}
          />
        </LabeledField>

        <LabeledField label="Brand Name">
          <input
            type="text"
            value={launchConfig.brand_name}
            placeholder="Espeezy"
            onChange={(e) => onConfigChange({ brand_name: e.target.value })}
            style={inputStyle}
          />
        </LabeledField>

        <LabeledField label="Pre-Registration Goal">
          <input
            type="number"
            value={launchConfig.preregister_goal}
            placeholder="5000000"
            onChange={(e) => onConfigChange({ preregister_goal: e.target.value })}
            style={inputStyle}
          />
        </LabeledField>

        <LabeledField label="Platform Version">
          <input
            type="text"
            value={launchConfig.platform_version}
            placeholder="2.0.0"
            onChange={(e) => onConfigChange({ platform_version: e.target.value })}
            style={inputStyle}
          />
        </LabeledField>
      </div>

      {/* ── Hero message textarea ─────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <LabeledField label="Hero Launch Message (shown on /preregister)">
          <textarea
            value={launchConfig.launch_message}
            rows={3}
            onChange={(e) => onConfigChange({ launch_message: e.target.value })}
            placeholder="Something big is coming. Join 5 million students shaping the future of collaborative education."
            style={{
              ...inputStyle,
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </LabeledField>
      </div>

      {/* ── Action buttons ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Deploy */}
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            padding: '0.875rem 2rem',
            background: '#10b981',
            color: 'black',
            borderRadius: '14px',
            fontWeight: 950,
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'SAVING...' : '⚡ DEPLOY LAUNCH CONFIG'}
        </button>

        {/* Toggle registration */}
        <button
          onClick={handleToggleRegistration}
          style={{
            padding: '0.875rem 1.5rem',
            background: '#111',
            border: `1px solid ${isOpen ? '#ef4444' : '#10b981'}`,
            color: isOpen ? '#ef4444' : '#10b981',
            borderRadius: '14px',
            fontWeight: 950,
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          {isOpen ? 'CLOSE REGISTRATION' : 'OPEN REGISTRATION'}
        </button>

        {/* External link: preregister page */}
        <a
          href="/preregister"
          rel="noreferrer"
          style={externalLinkStyle}
        >
          VIEW PAGE ↗
        </a>

        {/* External link: fund page */}
        <a
          href="/fund"
          rel="noreferrer"
          style={externalLinkStyle}
        >
          FUND PAGE ↗
        </a>
      </div>
    </div>
  )
}

// ── Internal sub-components ────────────────────────────────────────────────────

/** A small stat badge used in the header area. */
function StatCard({
  value,
  label,
  valueColor,
}: {
  value: string
  label: string
  valueColor: string
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '1rem 1.5rem',
        background: '#000',
        border: '1px solid #222',
        borderRadius: '16px',
      }}
    >
      <div
        style={{
          fontSize: '2rem',
          fontWeight: 950,
          color: valueColor,
          letterSpacing: '-0.05em',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: '0.65rem',
          color: 'rgba(255,255,255,0.3)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}
      >
        {label}
      </div>
    </div>
  )
}

/** Label + input wrapper for a single form field. */
function LabeledField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: '0.65rem',
          fontWeight: 900,
          color: 'rgba(255,255,255,0.3)',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          marginBottom: '0.5rem',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

// ── Shared style objects ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.875rem',
  background: '#000',
  border: '1px solid #333',
  borderRadius: '12px',
  color: 'white',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
  colorScheme: 'dark',
}

const externalLinkStyle: React.CSSProperties = {
  padding: '0.875rem 1.5rem',
  background: '#111',
  border: '1px solid #222',
  color: 'rgba(255,255,255,0.5)',
  borderRadius: '14px',
  fontWeight: 700,
  textDecoration: 'none',
  fontSize: '0.85rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
}
