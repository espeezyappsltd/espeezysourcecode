'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/dev/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }
      router.replace(next)
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container" style={{ position: 'relative', zIndex: 1 }}>
      <div className="auth-card page-fade" style={{ maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="dev-hub-brand-mark" style={{ margin: '0 auto 1rem' }}>
            <Image src="/brand_logo2.svg" width={28} height={28} alt="" />
          </div>
          <h1 className="auth-title">Command Center</h1>
          <p className="auth-subtitle">
            Espeezy monorepo dev hub — production fleet status and local app control. Password:{' '}
            <code>espeezy</code> (or <code>DEV_HUB_PASSWORD</code>).
          </p>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Access key
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter dev hub password"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Signing in…' : 'Enter dashboard'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem' }}>
          <Link href="/" style={{ color: 'var(--text-sub)' }}>
            ← Back to monorepo home
          </Link>
        </p>
      </div>
    </div>
  )
}
