'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldCheck, Smartphone } from 'lucide-react'
import { ESPEEZY_APP_ORIGINS } from '@shared/app-url'
import { ADMIN_TOTP_ISSUER, MS_AUTHENTICATOR_APP_NAME } from '@/lib/admin-totp'

type Step = 'username' | 'code'

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams?.get('redirect') ?? '/admin'
  const staffError = searchParams?.get('error') === 'not_staff'

  const [step, setStep] = useState<Step>('username')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [devMode, setDevMode] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onUsernameSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/admin-otp/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Could not find staff account')
        return
      }
      setDisplayName(data.displayName ?? null)
      setDevMode(Boolean(data.devMode))
      setStep('code')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function onCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/admin-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, code }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Sign in failed')
        return
      }
      router.push(redirectTo)
      router.refresh()
    } catch {
      setError('Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050505',
        padding: '2rem',
      }}
    >
      <form
        onSubmit={step === 'username' ? onUsernameSubmit : onCodeSubmit}
        style={{
          width: '100%',
          maxWidth: '400px',
          background: '#0a0a0a',
          border: '1px solid #1a1a1a',
          borderRadius: '16px',
          padding: '2rem',
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#10b981', marginBottom: '1.5rem' }}
        >
          <ShieldCheck size={24} />
          <span style={{ fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.85rem' }}>
            Espeezy Panel
          </span>
        </div>

        <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.5rem', lineHeight: 1.5 }}>
          Staff sign in at{' '}
          <strong style={{ color: '#ccc', fontWeight: 700 }}>{ESPEEZY_APP_ORIGINS.panel.replace(/^https:\/\//, '')}</strong>
        </p>
        <p style={{ color: '#666', fontSize: '0.82rem', marginBottom: '1.5rem', lineHeight: 1.45 }}>
          {step === 'username' && (
            <>
              Enter your staff username (e.g. <strong style={{ color: '#999' }}>pete</strong>). Next step uses{' '}
              <strong style={{ color: '#999' }}>{MS_AUTHENTICATOR_APP_NAME}</strong> — not SMS, email, or personal
              Microsoft account password.
            </>
          )}
          {step === 'code' && (
            <>
              Open <strong style={{ color: '#999' }}>{MS_AUTHENTICATOR_APP_NAME}</strong> on your phone. Use the 6-digit
              code for <strong style={{ color: '#999' }}>{ADMIN_TOTP_ISSUER}</strong>
              {displayName ? ` (${displayName})` : ''}.
            </>
          )}
        </p>

        {staffError && (
          <p role="alert" style={{ color: '#fbbf24', fontSize: '0.85rem', marginBottom: '1rem' }}>
            This account is not on the staff roster. Contact your platform lead for access.
          </p>
        )}

        {error && (
          <p role="alert" style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </p>
        )}

        {step === 'username' && (
          <label style={{ display: 'block', marginBottom: '1.5rem' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '0.35rem' }}>Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              style={inputStyle}
              placeholder="pete"
            />
          </label>
        )}

        {step === 'code' && devMode && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.25)',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>DEV MODE</p>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: '#888', lineHeight: 1.4 }}>
              No authenticator enrolled — use code <strong style={{ color: '#ccc' }}>000000</strong> locally only.
            </p>
          </div>
        )}

        {step === 'code' && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
                color: '#10b981',
                fontSize: '0.78rem',
                fontWeight: 700,
              }}
            >
              <Smartphone size={16} aria-hidden />
              {MS_AUTHENTICATOR_APP_NAME} code
            </div>
            {!devMode && (
              <p style={{ margin: '0 0 1rem', fontSize: '0.72rem', color: '#555', lineHeight: 1.45 }}>
                First time? Your platform lead runs <code style={{ color: '#888' }}>npm run seed:admin-totp</code> and
                sends you a QR to add under <strong style={{ color: '#777' }}>Other account</strong> in the app.
              </p>
            )}
            <p style={{ color: '#555', fontSize: '0.75rem', marginBottom: '1rem' }}>
              Signing in as <strong style={{ color: '#888' }}>@{username}</strong>
              <button
                type="button"
                onClick={() => {
                  setStep('username')
                  setCode('')
                  setError(null)
                  setDevMode(false)
                }}
                style={linkButtonStyle}
              >
                Change username
              </button>
            </p>
            <label style={{ display: 'block', marginBottom: '1.25rem' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '0.35rem' }}>
                6-digit code
              </span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                style={{ ...inputStyle, letterSpacing: '0.35em', textAlign: 'center', fontSize: '1.25rem' }}
                placeholder="000000"
                autoFocus
              />
            </label>
          </>
        )}

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Please wait…' : step === 'username' ? 'Continue' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<p style={{ color: '#888', textAlign: 'center', padding: '4rem' }}>Loading…</p>}>
      <AdminLoginForm />
    </Suspense>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '10px',
  border: '1px solid #222',
  background: '#111',
  color: '#fff',
  fontSize: '1rem',
}

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.85rem',
  borderRadius: '10px',
  border: 'none',
  background: '#10b981',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
}

const linkButtonStyle: React.CSSProperties = {
  marginLeft: '0.5rem',
  padding: 0,
  border: 'none',
  background: 'none',
  color: '#10b981',
  fontSize: 'inherit',
  cursor: 'pointer',
  textDecoration: 'underline',
}
