'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const STORAGE_KEY = 'espeezy_account_tiers_banner_dismissed'

type AccountTiersBannerProps = {
  className?: string
  style?: React.CSSProperties
}

export default function AccountTiersBanner({ className, style }: AccountTiersBannerProps) {
  const [dismissed, setDismissed] = useState<boolean | null>(null)

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === '1')
    } catch {
      setDismissed(false)
    }
  }, [])

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  if (dismissed === null || dismissed) return null

  return (
    <button
      type="button"
      className={className}
      onClick={dismiss}
      aria-label="Dismiss account tiers and access information"
      title="Click to close"
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: 'rgba(16,185,129,0.08)',
        border: '1px solid rgba(16,185,129,0.18)',
        borderRadius: 12,
        padding: '1.25rem 1.5rem',
        color: '#6ee7b7',
        fontWeight: 600,
        fontSize: '1.05rem',
        marginBottom: '1.5rem',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s, border-color 0.2s',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(16,185,129,0.12)'
        e.currentTarget.style.borderColor = 'rgba(16,185,129,0.28)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(16,185,129,0.08)'
        e.currentTarget.style.borderColor = 'rgba(16,185,129,0.18)'
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '0.75rem',
          right: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.7rem',
          fontWeight: 800,
          color: '#10b981',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        <X size={14} aria-hidden />
        Close
      </span>
      <span style={{ color: '#10b981', fontWeight: 800 }}>Account Tiers &amp; Access</span>
      <ul style={{ margin: '0.5em 0 0 1.2em', padding: 0, color: '#6ee7b7', fontSize: '0.98em' }}>
        <li>
          Log in with a personal email for <strong>Free Tier</strong> access.
        </li>
        <li>
          Upgrade to <strong>Premium</strong> by verifying your school or institutional email.
        </li>
        <li>
          Roles: <strong>Personal</strong> (free), <strong>Student</strong> (premium), <strong>Educator</strong>,{' '}
          <strong>Admin</strong>.
        </li>
        <li>Premium features unlock automatically when your email is verified as belonging to a recognized institution.</li>
      </ul>
      <span style={{ color: '#10b981', fontWeight: 700 }}>You control your workspace, your data, and your team.</span>
    </button>
  )
}
