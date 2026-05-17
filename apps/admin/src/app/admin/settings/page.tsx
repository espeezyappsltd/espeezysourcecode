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
        <p style={{ margin: 0, color: '#5f6368' }}>API: /api/admin/settings</p>
      </div>
    </>
  )
}
