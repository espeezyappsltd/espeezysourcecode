'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserSupabaseClient } from '@/lib/db-client'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Lock, Activity } from 'lucide-react'
import TransientError from '@/components/TransientError'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: import('@supabase/supabase-js').Session | null } }) => {
      if (!mounted) return
      if (!session) {
        setError('Recovery session not found. Please request a new password reset link.')
        return
      }
      setSessionReady(true)
    })

    return () => {
      mounted = false
    }
  }, [supabase])

  const getErrorMessage = (err: unknown) => {
    if (err instanceof Error) return err.message
    return 'An unexpected error occurred.'
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        throw updateError
      }
      setSuccess(true)
      setTimeout(() => router.push('/'), 1500)
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-main)',
      padding: '1.5rem'
    }}>
      <div className="auth-card" style={{ maxWidth: '450px', width: '100%', animation: 'fadeIn 0.5s ease-out' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: '60px', height: '60px', background: 'var(--brand)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 8px 16px rgba(var(--brand-rgb), 0.3)' }}>
            <Lock color="white" size={30} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>Secure Account Recovery</h1>
          <p style={{ color: 'var(--text-sub)', marginTop: '0.6rem', fontWeight: 600 }}>Update your password to regain access.</p>
        </div>

        {error && <TransientError message={error} />}
        
        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ color: 'var(--success)', marginBottom: '1.5rem' }}>
              <ShieldCheck size={48} style={{ margin: '0 auto' }} />
            </div>
            <h3 style={{ fontWeight: 900, marginBottom: '0.5rem' }}>Password Updated</h3>
            <p style={{ color: 'var(--text-sub)', fontWeight: 600 }}>Your password has been successfully reset. Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input 
                type="password" 
                className="form-input" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ borderRadius: '14px' }}
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input 
                type="password" 
                className="form-input" 
                required 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                style={{ borderRadius: '14px' }}
                disabled={loading}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading || !sessionReady} style={{ height: '3.5rem', borderRadius: '18px', fontWeight: 900, fontSize: '1.1rem' }}>
              {loading ? 'Updating Credentials...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
