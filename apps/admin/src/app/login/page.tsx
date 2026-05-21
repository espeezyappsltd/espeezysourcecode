'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { ESPEEZY_APP_ORIGINS } from '@shared/app-url'

type Step = 'username' | 'phone' | 'code'

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams?.get('redirect') ?? '/admin'
  const staffError = searchParams?.get('error') === 'not_staff'

  const [step, setStep] = useState<Step>('username')
  const [username, setUsername] = useState('')
  const [phoneHint, setPhoneHint] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [smsSent, setSmsSent] = useState(false)
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
      setPhoneHint(data.phoneHint ?? null)
      setDisplayName(data.displayName ?? null)
      setStep('phone')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function onPhoneSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/admin-otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, phone }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Could not send code')
        return
      }
      setSmsSent(Boolean(data.smsSent))
      setStep('code')
    } catch {
      setError('Could not send code')
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
        body: JSON.stringify({ username, phone, code }),
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

  async function resendCode() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/admin-otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, phone }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Could not resend code')
        return
      }
      setSmsSent(Boolean(data.smsSent))
    } catch {
      setError('Could not resend code')
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
        onSubmit={
          step === 'username'
            ? onUsernameSubmit
            : step === 'phone'
              ? onPhoneSubmit
              : onCodeSubmit
        }
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
              Enter your staff username (e.g. <strong style={{ color: '#999' }}>pete</strong>). We link it to your
              roster email and send a one-time code to your registered phone.
            </>
          )}
          {step === 'phone' && (
            <>
              Hi{displayName ? ` ${displayName}` : ''} — enter the mobile number on file
              {phoneHint ? (
                <>
                  {' '}
                  (ends in <strong style={{ color: '#999' }}>{phoneHint.replace(/^••••/, '')}</strong>)
                </>
              ) : null}
              .
            </>
          )}
          {step === 'code' && (
            <>
              Enter the 6-digit code sent to your phone
              {smsSent ? '' : ' and your linked email'}.
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

        {step === 'phone' && (
          <>
            <p style={{ color: '#555', fontSize: '0.75rem', marginBottom: '1rem' }}>
              Signed in as <strong style={{ color: '#888' }}>@{username}</strong>
              <button
                type="button"
                onClick={() => {
                  setStep('username')
                  setError(null)
                }}
                style={linkButtonStyle}
              >
                Change
              </button>
            </p>
            <label style={{ display: 'block', marginBottom: '1.5rem' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '0.35rem' }}>
                Mobile number
              </span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                type="tel"
                required
                style={inputStyle}
                placeholder="+1 555 000 0000"
              />
            </label>
          </>
        )}

        {step === 'code' && (
          <>
            <p style={{ color: '#555', fontSize: '0.75rem', marginBottom: '1rem' }}>
              Code sent for <strong style={{ color: '#888' }}>@{username}</strong>
              <button
                type="button"
                onClick={() => {
                  setStep('phone')
                  setCode('')
                  setError(null)
                }}
                style={linkButtonStyle}
              >
                Change number
              </button>
            </p>
            <label style={{ display: 'block', marginBottom: '1rem' }}>
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
              />
            </label>
            <p style={{ marginBottom: '1.25rem', fontSize: '0.78rem', color: '#555' }}>
              Didn&apos;t get it?{' '}
              <button type="button" onClick={resendCode} disabled={loading} style={linkButtonStyle}>
                Resend code
              </button>
            </p>
          </>
        )}

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading
            ? 'Please wait…'
            : step === 'username'
              ? 'Continue'
              : step === 'phone'
                ? 'Send login code'
                : 'Sign in'}
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
