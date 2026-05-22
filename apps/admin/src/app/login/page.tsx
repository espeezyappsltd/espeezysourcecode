'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldCheck, Smartphone } from 'lucide-react'
import { ESPEEZY_APP_ORIGINS } from '@shared/app-url'
import { ADMIN_TOTP_ISSUER, MS_AUTHENTICATOR_APP_NAME } from '@/lib/admin-totp'
import '@/app/admin-console.css'

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
    <div className="admin-login-root">
      <form
        className="admin-login-form"
        onSubmit={step === 'username' ? onUsernameSubmit : onCodeSubmit}
      >
        <div className="admin-login-brand">
          <ShieldCheck size={24} aria-hidden />
          <span>Espeezy Panel</span>
        </div>

        <p className="admin-login-lead">
          Staff sign in at{' '}
          <strong style={{ color: '#ccc', fontWeight: 700 }}>
            {ESPEEZY_APP_ORIGINS.panel.replace(/^https:\/\//, '')}
          </strong>
        </p>
        <p className="admin-login-hint">
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
          <p role="alert" className="admin-login-alert-warn">
            This account is not on the staff roster. Contact your platform lead for access.
          </p>
        )}

        {error && (
          <p role="alert" className="admin-login-alert-error">
            {error}
          </p>
        )}

        {step === 'username' && (
          <label className="admin-login-label">
            <span>Username</span>
            <input
              className="admin-login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              placeholder="pete"
            />
          </label>
        )}

        {step === 'code' && devMode && (
          <div className="admin-login-dev-banner">
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>DEV MODE</p>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', color: '#888', lineHeight: 1.4 }}>
              No authenticator enrolled — use code <strong style={{ color: '#ccc' }}>000000</strong> locally only.
            </p>
          </div>
        )}

        {step === 'code' && (
          <>
            <div className="admin-login-code-label">
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
                className="admin-login-link-btn"
                onClick={() => {
                  setStep('username')
                  setCode('')
                  setError(null)
                  setDevMode(false)
                }}
              >
                Change username
              </button>
            </p>
            <label className="admin-login-label" style={{ marginBottom: '1.25rem' }}>
              <span>6-digit code</span>
              <input
                className="admin-login-input admin-login-input--code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={6}
                placeholder="000000"
                autoFocus
              />
            </label>
          </>
        )}

        <button type="submit" className="admin-login-submit" disabled={loading}>
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
