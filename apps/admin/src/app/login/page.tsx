'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams?.get('redirect') ?? '/admin'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
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
        onSubmit={onSubmit}
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
            Admin sign in
          </span>
        </div>

        <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          Use your staff username (e.g. <strong style={{ color: '#ccc' }}>pete</strong>) — not your full email.
        </p>

        {error && (
          <p role="alert" style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </p>
        )}

        <label style={{ display: 'block', marginBottom: '1rem' }}>
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

        <label style={{ display: 'block', marginBottom: '1.5rem' }}>
          <span style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '0.35rem' }}>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            style={inputStyle}
          />
        </label>

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Signing in…' : 'Sign in'}
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
