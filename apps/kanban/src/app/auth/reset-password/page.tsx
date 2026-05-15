'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
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
    const checkSession = async () => {
      const result = await supabase.auth.getSession()
      if (!mounted) return
      if (!result?.data?.session) {
        setError('Recovery session not found. Please request a new password reset link.')
        return
      }
      setSessionReady(true)
    }
    checkSession()

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
      setTimeout(() => router.push('/login'), 3000)
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      padding: '1.5rem',
      overflow: 'hidden',
      background: '#000'
    }}>
      {/* Background Image */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Image
          src="/auth_bg.png"
          alt="Auth Background"
          fill
          priority
          quality={80}
          style={{ objectFit: 'cover', opacity: 0.4 }}
        />
        {/* Dark overlay for text legibility */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%)' }} />
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'rgba(10, 10, 10, 0.4)',
          backdropFilter: 'blur(40px)',
          borderRadius: '40px',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '3.5rem',
          position: 'relative',
          zIndex: 1,
          boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
          animation: 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: '60px', height: '60px', background: 'var(--brand, #10b981)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 12px 24px rgba(16,185,129,0.25)' }}>
            <Lock color="white" size={30} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', margin: 0 }}>Secure Account Recovery</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '0.6rem', fontWeight: 600 }}>Update your password to regain access.</p>
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
                style={{ borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}
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
                style={{ borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}
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
