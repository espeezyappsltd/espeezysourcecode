'use client'

import AppsCatalog from '@/components/landing/AppsCatalog'
import { usePlatformApps } from '@/hooks/usePlatformApps'
import './landing.css'

export default function LandingAppsSection() {
  const { apps } = usePlatformApps()
  return <AppsCatalog apps={apps} />
}
