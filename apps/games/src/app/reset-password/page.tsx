'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { useRecoverySession } from '@shared/useRecoverySession'

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    fontFamily: 'system-ui, sans-serif',
  } as React.CSSProperties,
  card: {
    width: '100%',
    maxWidth: '420px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '24px',
    padding: '2.5rem',
    boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
  } as React.CSSProperties,
  heading: {
    color: '#fff',
    fontSize: '1.5rem',
    fontWeight: 800,
    margin: '0 0 0.5rem',
    letterSpacing: '-0.03em',
  } as React.CSSProperties,
  subheading: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: '0.875rem',
    margin: '0 0 2rem',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  button: {
    width: '100%',
    padding: '0.85rem',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg,#059669,#10b981)',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '1rem',
    marginBottom: '1rem',
  } as React.CSSProperties,
  error: {
    padding: '1rem',
    borderRadius: '10px',
    background: 'rgba(220,38,38,0.1)',
    border: '1px solid rgba(220,38,38,0.3)',
    color: '#fca5a5',
    fontSize: '0.9rem',
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  success: {
    padding: '1rem',
    borderRadius: '10px',
    background: 'rgba(34,197,94,0.1)',
    border: '1px solid rgba(34,197,94,0.3)',
    color: '#86efac',
    fontSize: '0.9rem',
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  link: {
    color: '#10b981',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 700,
  } as React.CSSProperties,
}

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { sessionReady, error: sessionError } = useRecoverySession(supabase, searchParams)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const displayError = formError ?? sessionError

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!sessionReady) {
      setFormError('Recovery session not ready. Request a new reset link.')
      return
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.heading}>Password Updated</h1>
          <p style={styles.subheading}>Redirecting to login…</p>
          <div style={styles.success}>You can sign in with your new password.</div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Reset Password</h1>
        <p style={styles.subheading}>Enter your new password below.</p>
        {displayError && <div style={styles.error}>{displayError}</div>}
        <form onSubmit={handleReset}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            style={styles.input}
            required
            disabled={loading || !sessionReady}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            style={styles.input}
            required
            disabled={loading || !sessionReady}
          />
          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: loading || !sessionReady ? 0.7 : 1,
              cursor: loading || !sessionReady ? 'not-allowed' : 'pointer',
            }}
            disabled={loading || !sessionReady}
          >
            {loading ? 'Updating…' : sessionReady ? 'Update Password' : 'Verifying reset link…'}
          </button>
        </form>
        <div style={{ textAlign: 'center' }}>
          <a href="/login" style={styles.link}>Back to login</a>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'rgba(255,255,255,0.5)' }}>
          Loading…
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
