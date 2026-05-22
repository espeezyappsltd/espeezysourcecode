'use client'

import { useEffect } from 'react'
import { useAdminOnboarding } from '@/context/AdminOnboardingContext'
import { AdminPageHeader } from '@/components/console/AdminPageHeader'

export default function AdminAnnouncementsPage() {
  const { setPageHint } = useAdminOnboarding()
  useEffect(() => {
    setPageHint('Broadcast announcements to all platform users.')
  }, [setPageHint])
  return (
    <>
      <AdminPageHeader title="Announcements" description="Create and manage global announcements." />
      <div className="admin-console-card">
        <p className="admin-console-muted">API: /api/admin/announcements</p>
      </div>
    </>
  )
}
