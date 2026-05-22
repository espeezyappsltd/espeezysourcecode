'use client'

import { useEffect, useState } from 'react'
import { useAdminOnboarding } from '@/context/AdminOnboardingContext'
import { AdminPageHeader } from '@/components/console/AdminPageHeader'
import Link from 'next/link'
import { ADMIN_NAV_ITEMS } from '@/lib/admin-rbac'

export default function AdminHomePage() {
  const { setPageHint } = useAdminOnboarding()
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    setPageHint('Dashboard overview — pick a section from the left menu or the cards below.')
  }, [setPageHint])

  useEffect(() => {
    fetch('/api/admin/metrics', { cache: 'no-store' })
      .then((r) => r.json())
      .then(setMetrics)
      .catch(() => setMetrics(null))
  }, [])

  return (
    <>
      <AdminPageHeader
        title="Home"
        description="Google Cloud–style admin console. Each section includes onboarding tips on first visit."
      />

      <div className="admin-console-card">
        <h2>Platform snapshot</h2>
        <pre>{metrics ? JSON.stringify(metrics, null, 2) : 'Loading metrics…'}</pre>
      </div>

      <div className="admin-console-learn-grid">
        {ADMIN_NAV_ITEMS.filter((n) => n.href !== '/admin').map((item) => (
          <Link key={item.href} href={item.href} className="admin-console-learn-card">
            <h3>{item.label}</h3>
            <p>{item.description ?? `Open ${item.label}`}</p>
            <span className="admin-console-btn">Open →</span>
          </Link>
        ))}
      </div>
    </>
  )
}
