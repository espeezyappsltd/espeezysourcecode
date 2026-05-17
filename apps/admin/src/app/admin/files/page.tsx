'use client'

import { useEffect } from 'react'
import { useAdminOnboarding } from '@/context/AdminOnboardingContext'
import { AdminPageHeader } from '@/components/console/AdminPageHeader'
import { AdminFilesManager } from '@/components/console/AdminFilesManager'

export default function AdminFilesPage() {
  const { setPageHint } = useAdminOnboarding()

  useEffect(() => {
    setPageHint('Private vault: 5GB per staff member. Upload, organize in folders, share with teammates.')
  }, [setPageHint])

  return (
    <>
      <AdminPageHeader
        title="Files"
        description="Your private admin vault. Share documents with other staff using read permissions."
      />
      <AdminFilesManager />
    </>
  )
}
