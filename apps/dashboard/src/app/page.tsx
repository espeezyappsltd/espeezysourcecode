'use client'

import { LandingPageView } from '@/features/landing/LandingPageView'
import { useLandingPage } from '@/features/landing/useLandingPage'
import LiveChatWidget from '@/components/LiveChatWidget'

export default function KanbanPage() {
  const landingPage = useLandingPage()

  return (
    <>
      <LandingPageView {...landingPage} onLogout={landingPage.handleLogout} onNotify={landingPage.handleNotify} />
      {landingPage.user && <LiveChatWidget appScope='kanban' user={landingPage.user} />}
    </>
  )
}
