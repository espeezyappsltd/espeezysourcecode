'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

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
