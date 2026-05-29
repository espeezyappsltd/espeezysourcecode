'use client'

import { useEffect } from 'react'
import { useAdminOnboarding } from '@/context/AdminOnboardingContext'
import { AdminPageHeader } from '@/components/console/AdminPageHeader'
import AdminPlatformAppsPanel from '@/components/admin/AdminPlatformAppsPanel'

export default function AdminAppsCatalogPage() {
  const { setPageHint } = useAdminOnboarding()
  useEffect(() => {
    setPageHint('Apps catalog — CRUD landing listings, pricing, Stripe links, and setup guides.')
  }, [setPageHint])

  return (
    <>
      <AdminPageHeader
        title="Apps catalog"
        description="Manage espeezy.com landing app listings: per-app pricing, pay links, downloads, and self-host setup docs."
      />
      <AdminPlatformAppsPanel />
    </>
  )
}
