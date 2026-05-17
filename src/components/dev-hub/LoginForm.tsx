'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Shield } from 'lucide-react'
import { adminConsoleHref } from './nav-config'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'

  const [password, setPassword] = useState('')
  const [hubError, setHubError] = useState<string | null>(null)
  const [hubLoading, setHubLoading] = useState(false)

  const [adminUsername, setAdminUsername] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminError, setAdminError] = useState<string | null>(null)
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminSignedIn, setAdminSignedIn] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/hub/admin/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (data.member?.username) setAdminSignedIn(data.member.username)
      })
      .catch(() => undefined)
  }, [])

  async function onHubSubmit(e: React.FormEvent) {
    e.preventDefault()
    setHubError(null)
    setHubLoading(true)
    try {
      const res = await fetch('/api/dev/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setHubError(data.error || 'Login failed')
        return
      }
      router.replace(next)
      router.refresh()
    } catch {
      setHubError('Network error')
    } finally {
      setHubLoading(false)
    }
  }

  async function onAdminSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAdminError(null)
    setAdminLoading(true)
    try {
      const res = await fetch('/api/hub/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setAdminError(data.error ?? 'Sign in failed')
        return
      }
      setAdminSignedIn(data.username ?? adminUsername)
      setAdminPassword('')
    } catch {
      setAdminError('Network error')
    } finally {
      setAdminLoading(false)
    }
  }

  return (
    <div className="auth-container" style={{ position: 'relative', zIndex: 1 }}>
      <div className="auth-card page-fade dev-hub-login-card" style={{ maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="dev-hub-brand-mark" style={{ margin: '0 auto 1rem' }}>
            <Image src="/brand_logo2.svg" width={28} height={28} alt="" />
          </div>
          <h1 className="auth-title">Command Center</h1>
          <p className="auth-subtitle">Espeezy monorepo dev hub — fleet status and local app control.</p>
        </div>

        <form onSubmit={onHubSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Dev hub access key
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
          {hubError && <p className="error-message">{hubError}</p>}
          <button type="submit" className="btn btn-primary" disabled={hubLoading} style={{ marginTop: '1rem', width: '100%' }}>
            {hubLoading ? 'Signing in…' : 'Enter dashboard'}
          </button>
        </form>

        <div className="dev-hub-login-divider" aria-hidden />

        <section className="dev-hub-login-admin" aria-labelledby="admin-login-heading">
          <div className="dev-hub-login-admin-head">
            <Shield size={18} aria-hidden style={{ color: '#f59e0b' }} />
            <h2 id="admin-login-heading" className="dev-hub-login-admin-title">
              Admin staff
            </h2>
          </div>
          <p className="dev-hub-login-admin-hint">
            Sign in with your staff username (e.g. <strong>pete</strong>), not your email. Unlocks admin console links
            and staff chat in the hub.
          </p>

          {adminSignedIn ? (
            <div className="dev-hub-login-admin-success">
              <p>
                Signed in as <strong>{adminSignedIn}</strong>. Use the dev hub key above to open the dashboard, or go to
                the admin console.
              </p>
              <a href={adminConsoleHref('/admin')} className="btn btn-ghost btn-sm" style={{ marginTop: '0.75rem' }}>
                Open admin console →
              </a>
            </div>
          ) : (
            <form onSubmit={onAdminSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="admin-username">
                  Username
                </label>
                <input
                  id="admin-username"
                  type="text"
                  className="form-input"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="pete"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="admin-password">
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  className="form-input"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Staff password"
                  autoComplete="current-password"
                  required
                />
              </div>
              {adminError && <p className="error-message">{adminError}</p>}
              <button
                type="submit"
                className="btn btn-ghost"
                disabled={adminLoading}
                style={{ marginTop: '0.75rem', width: '100%', borderColor: 'rgba(245, 158, 11, 0.35)', color: '#f59e0b' }}
              >
                {adminLoading ? 'Signing in…' : 'Sign in as admin'}
              </button>
            </form>
          )}
        </section>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem' }}>
          <Link href="/" style={{ color: 'var(--text-sub)' }}>
            ← Back to monorepo home
          </Link>
        </p>
      </div>
    </div>
  )
}
