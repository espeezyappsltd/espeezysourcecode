'use client'

import { useEffect } from 'react'
import { useAdminOnboarding } from '@/context/AdminOnboardingContext'
import { AdminPageHeader } from '@/components/console/AdminPageHeader'

export default function AdminAnalyticsPage() {
  const { setPageHint } = useAdminOnboarding()
  useEffect(() => {
    setPageHint('Analytics — platform metrics and growth charts.')
  }, [setPageHint])
  return (
    <>
      <AdminPageHeader title="Analytics" description="Business intelligence and usage metrics." />
      <div className="admin-console-card">
        <p style={{ margin: 0, color: '#5f6368' }}>Charts load from /api/admin/analytics. Open Home for a metrics snapshot.</p>
      </div>
    </>
  )
}
