'use client'

import { useEffect, useState } from 'react'
import { useAdminOnboarding } from '@/context/AdminOnboardingContext'
import { AdminPageHeader } from '@/components/console/AdminPageHeader'

export default function AdminUsersPage() {
  const { setPageHint } = useAdminOnboarding()
  const [users, setUsers] = useState<unknown[]>([])

  useEffect(() => {
    setPageHint('Manage platform users — search, ban, and upgrade from this section.')
  }, [setPageHint])

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => setUsers([]))
  }, [])

  return (
    <>
      <AdminPageHeader title="Users" description="Platform user directory and moderation tools." />
      <div className="admin-console-card">
        <h2>User list</h2>
        <p className="admin-console-muted">
          {Array.isArray(users) ? `${users.length} users loaded` : 'Loading…'}
        </p>
      </div>
    </>
  )
}
