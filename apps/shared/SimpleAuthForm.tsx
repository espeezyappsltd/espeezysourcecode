'use client'

import { useState, type CSSProperties, type FormEvent } from 'react'
import EspeezyAppLogo, { type EspeezyAppLogoSlug } from './EspeezyAppLogo'

export type SimpleAuthFormProps = {
  appName: string
  /** When set, renders the SVG wordmark instead of a text heading */
  logoApp?: EspeezyAppLogoSlug
  tagline?: string
  busy: boolean
  ready: boolean
  error: string | null
  info: string | null
  defaultMode?: 'signin' | 'signup'
  onSignIn: (email: string, password: string) => Promise<{ ok: boolean; needsEmailConfirm?: boolean }>
  onSignUp: (email: string, password: string) => Promise<{ ok: boolean; needsEmailConfirm?: boolean }>
  onResetPassword?: (email: string) => Promise<{ ok: boolean }>
  onOAuthSignIn?: (provider: 'google' | 'github') => Promise<{ ok: boolean }>
}

const shell: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1.5rem',
  background: '#f4f6f8',
  fontFamily: 'system-ui, -apple-system, sans-serif',
}

const card: CSSProperties = {
  width: '100%',
  maxWidth: '400px',
  background: '#fff',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
  padding: '2rem',
}

const label: CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#475569',
  marginBottom: '0.35rem',
}

const input: CSSProperties = {
  width: '100%',
  padding: '0.7rem 0.85rem',
  fontSize: '1rem',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  boxSizing: 'border-box',
  marginBottom: '1rem',
}

const btn: CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  fontSize: '1rem',
  fontWeight: 600,
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  background: '#0f172a',
  color: '#fff',
}

export function SimpleAuthForm({
  appName,
  logoApp,
  tagline,
  busy,
  ready,
  error,
  info,
  defaultMode = 'signin',
  onSignIn,
  onSignUp,
  onResetPassword,
  onOAuthSignIn,
}: SimpleAuthFormProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [legal, setLegal] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (mode === 'signup') {
      if (!legal) return
      const result = await onSignUp(email, password)
      if (result.needsEmailConfirm) setMode('signin')
      return
    }
    await onSignIn(email, password)
  }

  if (!ready) {
    return (
      <div style={shell}>
        <div style={{ ...card, textAlign: 'center', color: '#64748b' }}>Loading…</div>
      </div>
    )
  }

  return (
    <div style={shell}>
      <div style={card}>
        {logoApp ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: tagline ? '0.75rem' : '1.5rem' }}>
            <EspeezyAppLogo app={logoApp} variant="login" />
          </div>
        ) : (
          <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{appName}</h1>
        )}
        {tagline && <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>{tagline}</p>}

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => setMode('signin')}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              background: mode === 'signin' ? '#0f172a' : '#fff',
              color: mode === 'signin' ? '#fff' : '#334155',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              background: mode === 'signup' ? '#0f172a' : '#fff',
              color: mode === 'signup' ? '#fff' : '#334155',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign up
          </button>
        </div>

        {error && (
          <p role="alert" style={{ padding: '0.75rem', marginBottom: '1rem', background: '#fef2f2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.875rem' }}>
            {error}
          </p>
        )}
        {info && (
          <p role="status" style={{ padding: '0.75rem', marginBottom: '1rem', background: '#ecfdf5', color: '#047857', borderRadius: '8px', fontSize: '0.875rem' }}>
            {info}
          </p>
        )}

        <form onSubmit={onSubmit}>
          <label style={label} htmlFor="auth-email">
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={input}
          />

          <label style={label} htmlFor="auth-password">
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...input, marginBottom: mode === 'signin' && onResetPassword ? '0.35rem' : '1rem' }}
          />

          {mode === 'signin' && onResetPassword && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onResetPassword(email)}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
                marginBottom: '1rem',
              }}
            >
              Forgot password?
            </button>
          )}

          {mode === 'signup' && (
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '1rem', fontSize: '0.8rem', color: '#475569' }}>
              <input type="checkbox" checked={legal} onChange={(e) => setLegal(e.target.checked)} required style={{ marginTop: '0.15rem' }} />
              <span>I agree to the terms and privacy policy.</span>
            </label>
          )}

          <button type="submit" disabled={busy || (mode === 'signup' && !legal)} style={{ ...btn, opacity: busy ? 0.7 : 1 }}>
            {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        {onOAuthSignIn && (
          <div style={{ marginTop: '1rem', display: 'grid', gap: '0.5rem' }}>
            <button
              type="button"
              disabled={busy}
              onClick={() => void onOAuthSignIn('google')}
              style={{
                ...btn,
                background: '#fff',
                color: '#0f172a',
                border: '1px solid #e2e8f0',
              }}
            >
              Continue with Google
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void onOAuthSignIn('github')}
              style={{
                ...btn,
                background: '#fff',
                color: '#0f172a',
                border: '1px solid #e2e8f0',
              }}
            >
              Continue with GitHub
            </button>
          </div>
        )}

        <p style={{ marginTop: '1.25rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
          Secured with encrypted sign-in. Never share your password.
        </p>
      </div>
    </div>
  )
}
