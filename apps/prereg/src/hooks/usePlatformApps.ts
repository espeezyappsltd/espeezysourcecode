'use client'

import { useEffect, useState } from 'react'
import { PLATFORM_APPS_FALLBACK, type PlatformApp } from '@shared/platform-apps'

const HIDDEN_LANDING_SLUGS = new Set(['admin', 'core'])

function filterLandingApps(apps: PlatformApp[]): PlatformApp[] {
  return apps.filter((app) => !HIDDEN_LANDING_SLUGS.has(app.slug))
}

export function usePlatformApps() {
  const [apps, setApps] = useState<PlatformApp[]>(filterLandingApps(PLATFORM_APPS_FALLBACK))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    void fetch('/api/platform-apps', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { apps?: PlatformApp[] } | null) => {
        if (!mounted || !data?.apps?.length) return
        setApps(filterLandingApps(data.apps))
      })
      .catch(() => {
        /* keep fallback */
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  return { apps, loading }
}
