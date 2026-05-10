'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [legalAccepted, setLegalAccepted] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetting, setResetting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (mode === 'signup') {
        if (!legalAccepted) {
          setError('Please accept the terms and privacy policy to create your account.')
          return
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
          },
        })

        if (signUpError) {
          setError(signUpError.message)
          return
        }

        if (data.session) {
          router.replace(next)
          return
        }

        setSuccess('Account created. Check your email to confirm your account, then sign in.')
        setMode('signin')
        setPassword('')
        return
      }

      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (authError) {
        setError(authError.message)
        return
      }

      router.replace(next)
    } catch {
      setError('Unable to complete sign in right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e: React.MouseEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError('Enter your email first, then click Reset Password.')
      return
    }
    setResetting(true)
    setError('')
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })
    setResetting(false)
    if (resetError) {
      setError(resetError.message)
    } else {
      setResetSent(true)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        padding: '2.5rem',
        boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em' }}>espeezy</span>
            <span style={{
              fontSize: '0.6rem',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              background: '#10b981',
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>kanban</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>
            {mode === 'signup' ? 'Create your account' : 'Sign in to continue'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', margin: '0.5rem 0 0' }}>
            Kanban is free - any Espeezy account works.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
          <button
            type="button"
            onClick={() => {
              setMode('signin')
              setError('')
              setSuccess('')
            }}
            style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, background: mode === 'signin' ? 'rgba(16,185,129,0.18)' : 'transparent', color: '#fff' }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setError('')
              setSuccess('')
            }}
            style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, background: mode === 'signup' ? 'rgba(16,185,129,0.18)' : 'transparent', color: '#fff' }}
          >
            Create Account
          </button>
        </div>

        {/* Error/success banner */}
        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#fca5a5',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
          }}>{error}</div>
        )}
        {success && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.2)',
            color: '#6ee7b7',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
          }}>{success}</div>
        )}
        {resetSent && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.2)',
            color: '#6ee7b7',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
          }}>Recovery link sent - check your inbox.</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@university.edu"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Password
              </label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={resetting}
                  style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  {resetting ? 'Sending…' : 'Forgot password?'}
                </button>
              )}
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {mode === 'signup' && (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', lineHeight: 1.5 }}>
              <input
                type="checkbox"
                checked={legalAccepted}
                onChange={(e) => setLegalAccepted(e.target.checked)}
                style={{ marginTop: '0.1rem' }}
              />
              <span>
                I agree to the <Link href="/terms" style={{ color: '#10b981' }}>Terms</Link> and <Link href="/privacy" style={{ color: '#10b981' }}>Privacy Policy</Link>.
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              padding: '0.85rem',
              borderRadius: '12px',
              border: 'none',
              background: loading ? 'rgba(16,185,129,0.4)' : '#10b981',
              color: '#fff',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: loading ? 'wait' : 'pointer',
              letterSpacing: '-0.01em',
            }}
          >
            {loading ? (mode === 'signup' ? 'Creating account…' : 'Signing in…') : (mode === 'signup' ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>
          {mode === 'signup' ? 'Already have an account? ' : 'Need a new account? '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signup' ? 'signin' : 'signup')
              setError('')
              setSuccess('')
            }}
            style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
          >
            {mode === 'signup' ? 'Sign in' : 'Create one now'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default function KanbanLoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>Loading…</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
