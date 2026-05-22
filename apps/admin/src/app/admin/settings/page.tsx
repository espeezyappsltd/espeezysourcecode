'use client'

import { useEffect } from 'react'
import { useAdminOnboarding } from '@/context/AdminOnboardingContext'
import { AdminPageHeader } from '@/components/console/AdminPageHeader'

export default function AdminSettingsPage() {
  const { setPageHint } = useAdminOnboarding()
  useEffect(() => {
    setPageHint('Platform settings — feature flags and configuration.')
  }, [setPageHint])
  return (
    <>
      <AdminPageHeader title="Settings" description="Global platform configuration." />
      <div className="admin-console-card">
        <p className="admin-console-muted">API: /api/admin/settings</p>
      </div>
    </>
  )
}
