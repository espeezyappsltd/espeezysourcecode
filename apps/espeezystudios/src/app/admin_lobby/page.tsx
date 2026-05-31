'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase-client'
import type { User } from '@supabase/supabase-js'
import StudioPageShell from '../../components/StudioPageShell'
import Link from 'next/link'
import { STUDIO_PAGE_COPY, STUDIO_STATUS } from '@/lib/studio/ui-copy'

export default function AdminLobbyPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [notification, setNotification] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      const admin =
        Boolean(data.user) &&
        (data.user?.app_metadata?.role === 'admin' ||
          Boolean(data.user?.email?.endsWith('@espeezy.com')))
      setIsAdmin(admin)
      setLoading(false)
    })
  }, [])

  function sendGlobalNotification() {
    setNotification('Global notification sent to all admins!')
    window.setTimeout(() => setNotification(''), 3000)
  }

  return (
    <StudioPageShell title="Admin" description={STUDIO_PAGE_COPY.admin}>
      {loading && <p className="studio-muted">Loading…</p>}
      {!loading && !user && (
        <div className="studio-card">
          <p>Sign in to access the admin lobby.</p>
          <Link href="/login" className="studio-link">
            Login
          </Link>
        </div>
      )}
      {!loading && user && !isAdmin && (
        <div className="studio-card" role="alert">
          <p>Access denied. Admins only.</p>
        </div>
      )}
      {!loading && user && isAdmin && (
        <div className="studio-card">
          <p>
            Welcome, <strong>{user.email}</strong>
          </p>
          <button type="button" className="studio-btn" onClick={sendGlobalNotification}>
            Send global notification
          </button>
          {notification ? (
            <p role="status" className="studio-success">
              {notification}
            </p>
          ) : null}
          <p className="studio-muted">{STUDIO_STATUS.adminTools}</p>
        </div>
      )}
    </StudioPageShell>
  )
}
