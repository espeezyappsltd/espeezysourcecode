'use client'

import { LandingPageView } from '@/features/landing/LandingPageView'
import { useLandingPage } from '@/features/landing/useLandingPage'

export default function KanbanPage() {
  const landingPage = useLandingPage()

  return <LandingPageView {...landingPage} onLogin={landingPage.handleLogin} onLogout={landingPage.handleLogout} onNotify={landingPage.handleNotify} />
}
