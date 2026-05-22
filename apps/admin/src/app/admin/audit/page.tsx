'use client'

import { useEffect } from 'react'
import { useAdminOnboarding } from '@/context/AdminOnboardingContext'
import { AdminPageHeader } from '@/components/console/AdminPageHeader'

export default function AdminAuditPage() {
  const { setPageHint } = useAdminOnboarding()
  useEffect(() => {
    setPageHint('Audit log — review sensitive admin actions.')
  }, [setPageHint])
  return (
    <>
      <AdminPageHeader title="Audit log" description="Security and compliance event history." />
      <div className="admin-console-card">
        <p className="admin-console-muted">API: /api/admin/audit</p>
      </div>
    </>
  )
}
