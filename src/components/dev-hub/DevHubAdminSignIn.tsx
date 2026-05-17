'use client'

import { useState } from 'react'
import { Shield } from 'lucide-react'
import { useDevHubAdminSession } from './DevHubAdminSessionContext'

export function DevHubAdminSignIn() {
  const { member, refresh } = useDevHubAdminSession()
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (member) {
    return (
      <span className="dev-hub-admin-badge" title={member.email}>
        <Shield size={14} aria-hidden />
        {member.username}
      </span>
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/hub/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Sign in failed')
        return
      }
      setOpen(false)
      setPassword('')
      await refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button type="button" className="btn btn-ghost btn-sm btn-inline dev-hub-tap" onClick={() => setOpen(true)}>
        <Shield size={15} aria-hidden />
        <span className="dev-hub-topbar-action-label">Admin</span>
      </button>
      {open && (
        <div className="dev-hub-admin-login-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <form className="dev-hub-admin-login-modal" onSubmit={submit} onClick={(e) => e.stopPropagation()}>
            <h2>Staff sign in</h2>
            <p>Use username (e.g. pete), not email.</p>
            {error && <p className="dev-hub-admin-login-error">{error}</p>}
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required autoComplete="username" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required autoComplete="current-password" />
            <div className="dev-hub-admin-login-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? '…' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
