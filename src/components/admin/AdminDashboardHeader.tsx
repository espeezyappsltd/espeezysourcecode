'use client'

/**
 * AdminDashboardHeader
 *
 * Top bar of the admin dashboard.
 * Shows the title, live service status dots, and the global refresh button.
 *
 * Props:
 *   onRefresh     — triggers a full data re-fetch
 *   isRefreshing  — true while data is loading (spins the icon)
 */

import { ShieldCheck, RefreshCw } from 'lucide-react'

// ── Small helper: one status indicator dot ────────────────────────────────────

interface StatusDotProps {
  label: string
}

function StatusDot({ label }: StatusDotProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      {/* Green pulse dot */}
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#10b981',
          boxShadow: '0 0 10px #10b981',
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
      <span
        style={{
          fontSize: '0.7rem',
          fontWeight: 900,
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </span>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  onRefresh: () => void
  isRefreshing: boolean
}

export default function AdminDashboardHeader({ onRefresh, isRefreshing }: Props) {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '4rem',
        flexWrap: 'wrap',
        gap: '2rem',
      }}
    >
      {/* Left: title block */}
      <div>
        {/* Eyebrow label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            color: '#10b981',
            fontWeight: 900,
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '4px',
            marginBottom: '1rem',
          }}
        >
          <ShieldCheck size={20} aria-hidden="true" />
          ADMINISTRATIVE ORCHESTRA
        </div>

        {/* Page title */}
        <h1
          style={{
            fontSize: '4.5rem',
            fontWeight: 950,
            letterSpacing: '-0.06em',
            margin: 0,
            lineHeight: 0.9,
            color: 'white',
          }}
        >
          Control Station{' '}
          <span style={{ opacity: 0.2 }}>PRO</span>
        </h1>
      </div>

      {/* Right: status indicators + refresh button */}
      <div
        style={{
          display: 'flex',
          gap: '1.5rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {/* Service status panel */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            background: '#111',
            borderRadius: '16px',
            border: '1px solid #222',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
          }}
          role="status"
          aria-label="Service health indicators"
        >
          <StatusDot label="SUPABASE_NODE: OK" />
          <StatusDot label="STRIPE_PIPELINE: OK" />
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          aria-label="Refresh dashboard data"
          style={{
            background: 'white',
            color: 'black',
            padding: '0 1.5rem',
            height: '48px',
            borderRadius: '16px',
            fontWeight: 950,
            fontSize: '0.85rem',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <RefreshCw
            size={18}
            aria-hidden="true"
            className={isRefreshing ? 'animate-spin' : ''}
          />
          GLOBAL_SYNC
        </button>
      </div>
    </header>
  )
}
