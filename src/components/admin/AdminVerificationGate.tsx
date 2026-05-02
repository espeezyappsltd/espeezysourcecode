'use client'

/**
 * AdminVerificationGate
 *
 * The 2-factor-style clearance form that guards the dashboard after the
 * server-side role check in layout.tsx.
 *
 * Props:
 *   verificationCode  — controlled input value
 *   onCodeChange      — setter from parent hook
 *   onSubmit          — form submit handler from parent hook
 *   verifying         — true while the async check is running
 */

import { Key } from 'lucide-react'

interface Props {
  verificationCode: string
  onCodeChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  verifying: boolean
}

export default function AdminVerificationGate({
  verificationCode,
  onCodeChange,
  onSubmit,
  verifying,
}: Props) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#050505',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      {/* Card */}
      <div
        style={{
          maxWidth: '400px',
          width: '100%',
          background: '#111',
          padding: '3rem',
          borderRadius: '32px',
          border: '1px solid #222',
          boxSizing: 'border-box',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981',
            marginBottom: '2rem',
          }}
        >
          <Key size={32} aria-hidden="true" />
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 950,
            color: 'white',
            marginBottom: '1rem',
            letterSpacing: '-0.04em',
          }}
        >
          Verification Required
        </h1>

        {/* Description */}
        <p
          style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.9rem',
            marginBottom: '2.5rem',
            lineHeight: 1.5,
          }}
        >
          You are accessing the Institutional Orchestra. Enter your administrative safety key to
          proceed.
        </p>

        {/* Form */}
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label
              htmlFor="clearance-code"
              style={{
                display: 'block',
                textTransform: 'uppercase',
                fontSize: '0.65rem',
                fontWeight: 900,
                color: '#10b981',
                marginBottom: '0.5rem',
                letterSpacing: '2px',
              }}
            >
              Clearance Code
            </label>
            <input
              id="clearance-code"
              type="password"
              value={verificationCode}
              onChange={(e) => onCodeChange(e.target.value)}
              placeholder="XXXX-XXXX"
              autoFocus
              autoComplete="off"
              style={{
                width: '100%',
                padding: '1rem',
                background: '#000',
                border: '1px solid #333',
                borderRadius: '12px',
                color: 'white',
                fontWeight: 700,
                outline: 'none',
                transition: '0.2s',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={verifying}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '12px',
              fontWeight: 950,
              fontSize: '1rem',
              background: '#10b981',
              color: 'black',
              border: 'none',
              cursor: verifying ? 'not-allowed' : 'pointer',
              opacity: verifying ? 0.7 : 1,
            }}
          >
            {verifying ? 'VERIFYING...' : 'ESTABLISH SESSION'}
          </button>

          <p
            style={{
              textAlign: 'center',
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.3)',
              margin: 0,
            }}
          >
            Institutional Safety Protocol v4.2.0
          </p>
        </form>
      </div>
    </div>
  )
}
