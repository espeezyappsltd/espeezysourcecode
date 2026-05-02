'use client'

import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase'
import { updatePassword } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Lock, Activity, ArrowRight } from 'lucide-react'
import TransientError from '@/components/TransientError'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const user = auth.currentUser
      if (!user) {
        setError('No active session found. Please request a new reset link.')
        return
      }

      await updatePassword(user, password)
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setError('Security Protocol: Please sign out and sign back in to reset your password.')
      } else {
        setError(err.message || 'An unexpected error occurred.')
      }
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
          <p style={{ color: 'var(--text-sub)', marginTop: '0.6rem', fontWeight: 600 }}>Update your terminal credentials to regain access.</p>
        </div>

        {error && <TransientError message={error} />}
        
        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ color: 'var(--success)', marginBottom: '1.5rem' }}>
              <ShieldCheck size={48} style={{ margin: '0 auto' }} />
            </div>
            <h3 style={{ fontWeight: 900, marginBottom: '0.5rem' }}>Protocol Updated</h3>
            <p style={{ color: 'var(--text-sub)', fontWeight: 600 }}>Identity credentials have been successfully reset. Redirecting to terminal...</p>
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
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ height: '3.5rem', borderRadius: '18px', fontWeight: 900, fontSize: '1.1rem' }}>
              {loading ? 'Updating Credentials...' : 'Update Password'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-sub)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Activity size={14} color="var(--brand)" /> 
            System Recovery Mode Active
          </div>
        </div>
      </div>
    </div>
  )
}
