'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { ESPEEZY_APP_ORIGINS } from '@shared/app-url'

type Step = 'username' | 'code'

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams?.get('redirect') ?? '/admin'
  const staffError = searchParams?.get('error') === 'not_staff'

  const [step, setStep] = useState<Step>('username')
  const [username, setUsername] = useState('')
  const [emailHint, setEmailHint] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState<string | null>(null)
  const [emailDeliveryNote, setEmailDeliveryNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function applyOtpResponse(data: {
    devCode?: string
    emailError?: string
    emailSent?: boolean
    channel?: string
    emailHint?: string
  }) {
    if (data.emailHint) setEmailHint(data.emailHint)
    if (data.devCode) setDevCode(data.devCode)
    if (data.emailError) {
      setEmailDeliveryNote(`Email failed: ${data.emailError}. Use the dev code below.`)
    } else if (data.emailSent && data.channel) {
      setEmailDeliveryNote(`Code sent via ${data.channel}.`)
    } else if (data.emailSent) {
      setEmailDeliveryNote('Code sent to your roster email.')
    } else {
      setEmailDeliveryNote(null)
    }
  }

  async function sendCode() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/admin-otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Could not send code')
        return
      }
      applyOtpResponse(data)
      setStep('code')
    } catch {
      setError('Could not send code')
    } finally {
      setLoading(false)
    }
  }

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
      setEmailHint(data.emailHint ?? null)
      await sendCode()
    } catch {
      setError('Something went wrong')
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
              Enter your staff username (e.g. <strong style={{ color: '#999' }}>pete</strong>). We send a one-time code to
              your linked roster email.
            </>
          )}
          {step === 'code' && (
            <>
              Enter the 6-digit code we sent
              {emailHint ? (
                <>
                  {' '}
                  to <strong style={{ color: '#999' }}>{emailHint}</strong>
                </>
              ) : (
                ' to your roster email'
              )}
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

        {step === 'code' && devCode && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.25)',
            }}
          >
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>DEV LOGIN</p>
            <p style={{ margin: '0.35rem 0 0', fontSize: '1.35rem', fontWeight: 800, letterSpacing: '0.25em' }}>
              {devCode}
            </p>
            {emailDeliveryNote && (
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#888', lineHeight: 1.4 }}>
                {emailDeliveryNote}
              </p>
            )}
          </div>
        )}

        {step === 'code' && (
          <>
            <p style={{ color: '#555', fontSize: '0.75rem', marginBottom: '1rem' }}>
              Code for <strong style={{ color: '#888' }}>@{username}</strong>
              <button
                type="button"
                onClick={() => {
                  setStep('username')
                  setCode('')
                  setDevCode(null)
                  setEmailDeliveryNote(null)
                  setError(null)
                }}
                style={linkButtonStyle}
              >
                Change username
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
              <button
                type="button"
                onClick={() => {
                  void sendCode()
                }}
                disabled={loading}
                style={linkButtonStyle}
              >
                Resend code
              </button>
            </p>
          </>
        )}

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Please wait…' : step === 'username' ? 'Send login code' : 'Sign in'}
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

