'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'

  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [legalAccepted, setLegalAccepted] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'signup') {
      if (!legalAccepted) {
        setError('Please accept the terms and privacy policy to create your account.')
        setLoading(false)
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
        setLoading(false)
        return
      }

      if (data.session) {
        router.replace(next)
        return
      }

      setSuccess('Account created. Check your email to confirm your account, then sign in.')
      setMode('signin')
      setPassword('')
      setLoading(false)
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.replace(next)
  }

  async function handleReset(e: React.MouseEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError('Enter your email first, then click Reset Password.')
      return
    }

    setResetting(true)
    setError('')
    setSuccess('')

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })

    setResetting(false)
    if (resetError) {
      setError(resetError.message)
      return
    }

    setSuccess('Recovery link sent. Check your inbox.')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        color: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'white',
          border: '1px solid rgba(15,23,42,0.09)',
          borderRadius: '20px',
          padding: '2.5rem',
          boxShadow: '0 8px 40px rgba(15,23,42,0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 950, letterSpacing: '-0.03em' }}>
            {mode === 'signup' ? 'Create Espeezy Account' : 'Sign In to Espeezy'}
          </h1>
          <p style={{ margin: '0.6rem 0 0', color: '#64748b', fontSize: '0.92rem' }}>
            Create and manage your account from Prereg, Kanban, or Games.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            marginBottom: '1rem',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid rgba(15,23,42,0.08)',
            background: '#f8fafc',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode('signin')
              setError('')
              setSuccess('')
            }}
            style={{
              flex: 1,
              padding: '0.6rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              background: mode === 'signin' ? 'rgba(99,102,241,0.12)' : 'transparent',
              color: '#0f172a',
            }}
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
            style={{
              flex: 1,
              padding: '0.6rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              background: mode === 'signup' ? 'rgba(99,102,241,0.12)' : 'transparent',
              color: '#0f172a',
            }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#dc2626',
              fontSize: '0.875rem',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.25)',
              color: '#047857',
              fontSize: '0.875rem',
              marginBottom: '1rem',
            }}
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.edu"
            style={{
              width: '100%',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              border: '1px solid rgba(15,23,42,0.15)',
              background: '#f8fafc',
              color: '#0f172a',
              fontSize: '0.95rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{
              width: '100%',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              border: '1px solid rgba(15,23,42,0.15)',
              background: '#f8fafc',
              color: '#0f172a',
              fontSize: '0.95rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          {mode === 'signup' && (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', color: '#475569', fontSize: '0.78rem', lineHeight: 1.5 }}>
              <input
                type="checkbox"
                checked={legalAccepted}
                onChange={(e) => setLegalAccepted(e.target.checked)}
                style={{ marginTop: '0.1rem' }}
              />
              <span>
                I agree to the <a href="/terms" style={{ color: '#4f46e5' }}>Terms</a> and <a href="/privacy" style={{ color: '#4f46e5' }}>Privacy Policy</a>.
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.3rem',
              padding: '0.9rem',
              borderRadius: '10px',
              border: 'none',
              background: loading ? 'rgba(99,102,241,0.45)' : 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading
              ? mode === 'signup'
                ? 'Creating account…'
                : 'Signing in…'
              : mode === 'signup'
                ? 'Create Account'
                : 'Sign In'}
          </button>

          {mode === 'signin' && (
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              style={{
                background: 'none',
                border: 'none',
                color: '#4f46e5',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {resetting ? 'Sending recovery link…' : 'Forgot password?'}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

export default function PreregLoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', color: '#64748b' }}>
          Loading...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
