'use client'

import { useEffect } from 'react'
import { useAdminOnboarding } from '@/context/AdminOnboardingContext'
import { AdminPageHeader } from '@/components/console/AdminPageHeader'

export default function AdminLaunchPage() {
  const { setPageHint } = useAdminOnboarding()
  useEffect(() => {
    setPageHint('Launch studio — configure go-live dates and prereg goals.')
  }, [setPageHint])
  return (
    <>
      <AdminPageHeader title="Launch" description="Launch configuration and prereg settings." />
      <div className="admin-console-card">
        <p className="admin-console-muted">API: /api/admin/settings and /api/launch-config</p>
      </div>
    </>
  )
}
