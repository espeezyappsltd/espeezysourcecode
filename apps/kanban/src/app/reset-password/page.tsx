'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

const styles = {
  container: {
    minHeight: '100vh',
    background: 'var(--bg-main)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  } as React.CSSProperties,
  card: {
    width: '100%',
    maxWidth: '420px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: 'var(--shadow-md)',
  } as React.CSSProperties,
  heading: {
    color: 'var(--text-primary)',
    fontSize: '1.5rem',
    fontWeight: 700,
    margin: '0 0 0.5rem',
  } as React.CSSProperties,
  subheading: {
    color: 'var(--text-secondary)',
    fontSize: '0.875rem',
    margin: '0 0 2rem',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '0.75rem',
    background: 'var(--input-bg)',
    border: '1px solid var(--input-border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  button: {
    width: '100%',
    padding: '0.85rem',
    borderRadius: '8px',
    border: 'none',
    background: 'var(--brand)',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '1rem',
    marginBottom: '1rem',
  } as React.CSSProperties,
  error: {
    padding: '1rem',
    borderRadius: '8px',
    background: 'rgba(220,38,38,0.1)',
    border: '1px solid rgba(220,38,38,0.3)',
    color: '#fca5a5',
    fontSize: '0.9rem',
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  success: {
    padding: '1rem',
    borderRadius: '8px',
    background: 'rgba(34,197,94,0.1)',
    border: '1px solid rgba(34,197,94,0.3)',
    color: '#86efac',
    fontSize: '0.9rem',
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  link: {
    color: 'var(--brand)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!password) {
      setError('Please enter a new password.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        throw updateError
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.heading}>Password Updated ✓</h1>
          <p style={styles.subheading}>Your password has been successfully reset. Redirecting you to the login page...</p>
          <div style={styles.success}>
            You can now sign in with your new password.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Reset Password</h1>
        <p style={styles.subheading}>Enter your new password below.</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleReset}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            style={styles.input}
            required
            disabled={loading}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            style={styles.input}
            required
            disabled={loading}
          />
          <button
            type="submit"
            style={{ ...styles.button, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            disabled={loading}
          >
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <a href="/login" style={styles.link}>
            Back to login
          </a>
        </div>
      </div>
    </div>
  )
}
